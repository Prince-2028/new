"""
Reusable mixins for Django REST Framework views.
Provides common functionality for OBIS operations.
"""

from django.http import StreamingHttpResponse
from django.utils import timezone
import json
import time
import logging

from .models import Device, Meter, Media
from .meter_utils import (
    get_dlms_config_from_device,
    get_db_record_for_obis,
    update_or_clear_db_value,
)
from .dlms_helper import execute_dlms_action

logger = logging.getLogger(__name__)


class OBISStreamingMixin:
    """
    Mixin to provide OBIS value streaming functionality to APIView classes.
    
    Handles Server-Sent Events (SSE) streaming for DLMS OBIS code reading and writing
    with real-time progress updates.
    
    Usage:
        class MyAPIView(OBISStreamingMixin, APIView):
            def post(self, request):
                serial_number = request.data.get('serial_number')
                parameters = request.data.get('parameters')
                # For reading:
                return self.stream_obis_values(serial_number, parameters)
                # For writing:
                return self.stream_obis_writes(serial_number, parameters)
    """
    
    def stream_obis_values(self, serial_number, parameters):
        """
        Streams OBIS values with real-time database storage.
        
        Args:
            serial_number (str): Device serial number
            parameters (list): List of dicts with 'obis_code' and 'attribute_index'
        
        Returns:
            StreamingHttpResponse: SSE stream with OBIS read results
        
        Stream Format:
            Each event is a JSON object with:
            - status: "success" or "error"
            - obis_code: OBIS code being read
            - value: Read value (on success)
            - message: Error message (on failure)
            - progress: Current progress info
            - db_updated: Whether database was updated
            - timestamp: ISO timestamp
        """
        
        def generate_obis_stream():
            try:
                # Setup device (updated for current DB structure)
                try:
                    device = Device.objects.select_related('addressing', 'security', 'user').get(serial_number=serial_number)
                except Device.DoesNotExist:
                    # Fallback to Meter if Device not found directly
                    try:
                        meter = Meter.objects.select_related('device__addressing', 'device__security', 'device__user').get(serial_number=serial_number)
                        device = meter.device
                    except Meter.DoesNotExist:
                        error_response = {
                            "type": "error",
                            "message": f"Device with serial number {serial_number} not found",
                            "timestamp": timezone.now().isoformat()
                        }
                        yield f"data: {json.dumps(error_response)}\n\n"
                        return
                
                # Get active media connection
                media = Media.objects.filter(device=device, is_active=True).first()
                if not media:
                    error_response = {
                        "type": "error",
                        "message": f"No active media connection found for device {serial_number}",
                        "timestamp": timezone.now().isoformat()
                    }
                    yield f"data: {json.dumps(error_response)}\n\n"
                    return
                
                dlms_config = get_dlms_config_from_device(device, media)
                
                # Validate parameters
                if not parameters or not isinstance(parameters, list):
                    error_response = {
                        "type": "error",
                        "message": "Parameters must be a list of OBIS codes with attributes",
                        "timestamp": timezone.now().isoformat()
                    }
                    yield f"data: {json.dumps(error_response)}\n\n"
                    return
                
                # Use batch processing via execute_dlms_action
                logger.debug(f"Stream: Processing batch OBIS read for {len(parameters)} codes")
                # result = execute_dlms_action(dlms_config, action_details={"action": "read_obis", "parameters": parameters})
                result = execute_dlms_action(dlms_config, action_details={"action": "read_obis", "parameters": parameters, "serial_number": serial_number}) #SUMIT

                

                if result.get("status") == "success" or result.get("successful_reads", 0) > 0:
                    # Stream each result from the batch response
                    for index, obis_result in enumerate(result.get("results", [])):
                        obis_code = obis_result.get('obis_code')
                        attribute_index = obis_result.get('attribute_index')
                        
                        if obis_result.get("status") == "success":
                            live_value = obis_result.get('value') 

                            print("live_value",live_value)

                           

                     

                           

                            

                            

                           
                            
                            # Store value permanently in database
                            db_record, value_field_name = get_db_record_for_obis(device, obis_code, attribute_index)
                            
                            db_updated = False
                            if db_record and live_value is not None:
                                # Save to database permanently (clear=False means persist)
                                db_updated = update_or_clear_db_value(db_record, value_field_name, live_value=live_value, clear=True)
                                logger.info(f"DB Update for OBIS {obis_code}: Record={type(db_record).__name__}, Field={value_field_name}, Value={live_value}, Updated={db_updated}")
                            else:
                                logger.warning(f"No DB record found for OBIS {obis_code} - value not stored in database")
                            
                            success_response = {
                                "message": "Read Successfully",
                                "status": "success",
                                "action": "read",
                                "obis_code": obis_code,
                                "attribute_index": attribute_index,
                                "value": live_value,
                                "db_record_found": db_record is not None,
                                "db_updated": db_updated,
                                "db_model": type(db_record).__name__ if db_record else None,
                                "progress": {
                                    "current": index + 1,
                                    "total": len(parameters),
                                    "percentage": round(((index + 1) / len(parameters)) * 100, 2),
                                    "successful": result.get("successful_reads", 0),
                                    "failed": result.get("failed_reads", 0)
                                },
                                "timestamp": timezone.now().isoformat()
                            }
                            yield f"data: {json.dumps(success_response)}\n\n"
                            
                        else:
                            # Failed read from batch result
                            error_response = {
                                "type": "obis_error",
                                "status": "error",
                                "message": obis_result.get("message", f"Failed to read OBIS {obis_code}"),
                                "obis_code": obis_code,
                                "attribute_index": attribute_index,
                                "progress": {
                                    "current": index + 1,
                                    "total": len(parameters),
                                    "percentage": round(((index + 1) / len(parameters)) * 100, 2),
                                    "successful": result.get("successful_reads", 0),
                                    "failed": result.get("failed_reads", 0)
                                },
                                "timestamp": timezone.now().isoformat()
                            }
                            yield f"data: {json.dumps(error_response)}\n\n"
                        
                        # Small delay between streaming results
                        time.sleep(0.1)
                else:
                    # Handle case where entire batch failed
                    for index, param in enumerate(parameters):
                        obis_code = param.get('obis_code', 'Unknown')
                        attribute_index = param.get('attribute_index', 'Unknown')
                        
                        error_response = {
                            "type": "obis_error",
                            "status": "error",
                            "message": result.get("message", "Batch read failed"),
                            "obis_code": obis_code,
                            "attribute_index": attribute_index,
                            "progress": {
                                "current": index + 1,
                                "total": len(parameters),
                                "percentage": round(((index + 1) / len(parameters)) * 100, 2),
                                "successful": 0,
                                "failed": len(parameters)
                            },
                            "timestamp": timezone.now().isoformat()
                        }
                        yield f"data: {json.dumps(error_response)}\n\n"
                        time.sleep(0.1)
                
            except Device.DoesNotExist:
                error_response = {
                    "type": "error",
                    "message": f"Device with serial number {serial_number} not found",
                    "timestamp": timezone.now().isoformat()
                }
                yield f"data: {json.dumps(error_response)}\n\n"
                
            except Exception as e:
                logger.exception(f"Unexpected error in OBIS streaming for {serial_number}")
                error_response = {
                    "type": "error",
                    "message": f"Unexpected error: {str(e)}",
                    "timestamp": timezone.now().isoformat()
                }
                yield f"data: {json.dumps(error_response)}\n\n"
        
        response = StreamingHttpResponse(
            generate_obis_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Access-Control-Allow-Origin'] = '*'  # Adjust for CORS as needed
        response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering if using nginx

        return response

    def stream_obis_writes(self, serial_number, parameters):
        """
        Streams OBIS write operations with real-time progress updates.
        
        Args:
            serial_number (str): Device serial number
            parameters (list): List of dicts with 'obis_code', 'attribute_index', and 'value'
        
        Returns:
            StreamingHttpResponse: SSE stream with OBIS write results
        
        Stream Format:
            Each event is a JSON object with:
            - status: "success" or "error"
            - obis_code: OBIS code being written
            - attribute_index: Attribute index being written
            - written_value: Value that was written (on success)
            - message: Success/error message
            - progress: Current progress info
            - timestamp: ISO timestamp
        """
        
        def generate_write_stream():
            try:
                # Setup device (same as read streaming)
                try:
                    device = Device.objects.select_related('addressing', 'security', 'user').get(serial_number=serial_number)
                except Device.DoesNotExist:
                    # Fallback to Meter if Device not found directly
                    try:
                        meter = Meter.objects.select_related('device__addressing', 'device__security', 'device__user').get(serial_number=serial_number)
                        device = meter.device
                    except Meter.DoesNotExist:
                        error_response = {
                            "type": "error",
                            "message": f"Device with serial number {serial_number} not found",
                            "timestamp": timezone.now().isoformat()
                        }
                        yield f"data: {json.dumps(error_response)}\n\n"
                        return
                
                # Get active media connection
                media = Media.objects.filter(device=device, is_active=True).first()
                if not media:
                    error_response = {
                        "type": "error",
                        "message": f"No active media connection found for device {serial_number}",
                        "timestamp": timezone.now().isoformat()
                    }
                    yield f"data: {json.dumps(error_response)}\n\n"
                    return
                
                dlms_config = get_dlms_config_from_device(device, media)
                
                # Validate parameters
                if not parameters or not isinstance(parameters, list):
                    error_response = {
                        "type": "error",
                        "message": "Parameters must be a list of OBIS write operations",
                        "timestamp": timezone.now().isoformat()
                    }
                    yield f"data: {json.dumps(error_response)}\n\n"
                    return
                
                # Validate each write operation has required fields
                for i, param in enumerate(parameters):
                    if not isinstance(param, dict) or not all(key in param for key in ['obis_code', 'attribute_index', 'value']):
                        error_response = {
                            "type": "error",
                            "message": f"Parameter {i+1} missing required fields: obis_code, attribute_index, value",
                            "timestamp": timezone.now().isoformat()
                        }
                        yield f"data: {json.dumps(error_response)}\n\n"
                        return
                
                # Use batch processing via execute_dlms_action
                logger.debug(f"Stream: Processing batch OBIS write for {len(parameters)} operations")
                result = execute_dlms_action(dlms_config, action_details={"action": "write_obis", "parameters": parameters})

                if result.get("status") == "success" or result.get("successful_writes", 0) > 0:
                    # Stream each result from the batch response
                    for index, write_result in enumerate(result.get("results", [])):
                        obis_code = write_result.get('obis_code')
                        attribute_index = write_result.get('attribute_index')
                        
                        if write_result.get("status") == "success":
                            written_value = write_result.get('written_value')
                            
                            success_response = {
                                "message": "Write Successfully",
                                "status": "success",
                                "action": "write",
                                "obis_code": obis_code,
                                "attribute_index": attribute_index,
                                "written_value": written_value,
                                "progress": {
                                    "current": index + 1,
                                    "total": len(parameters),
                                    "percentage": round(((index + 1) / len(parameters)) * 100, 2),
                                    "successful": result.get("successful_writes", 0),
                                    "failed": result.get("failed_writes", 0)
                                },
                                "timestamp": timezone.now().isoformat()
                            }
                            yield f"data: {json.dumps(success_response)}\n\n"
                            
                        else:
                            # Failed write from batch result
                            error_response = {
                                "type": "obis_error",
                                "status": "error",
                                "message": write_result.get("message", f"Failed to write OBIS {obis_code}"),
                                "obis_code": obis_code,
                                "attribute_index": attribute_index,
                                "progress": {
                                    "current": index + 1,
                                    "total": len(parameters),
                                    "percentage": round(((index + 1) / len(parameters)) * 100, 2),
                                    "successful": result.get("successful_writes", 0),
                                    "failed": result.get("failed_writes", 0)
                                },
                                "timestamp": timezone.now().isoformat()
                            }
                            yield f"data: {json.dumps(error_response)}\n\n"
                        
                        # Small delay between streaming results
                        time.sleep(0.1)
                else:
                    # Handle case where entire batch failed
                    for index, param in enumerate(parameters):
                        obis_code = param.get('obis_code', 'Unknown')
                        attribute_index = param.get('attribute_index', 'Unknown')
                        
                        error_response = {
                            "type": "obis_error",
                            "status": "error",
                            "message": result.get("message", "Batch write failed"),
                            "obis_code": obis_code,
                            "attribute_index": attribute_index,
                            "progress": {
                                "current": index + 1,
                                "total": len(parameters),
                                "percentage": round(((index + 1) / len(parameters)) * 100, 2),
                                "successful": 0,
                                "failed": len(parameters)
                            },
                            "timestamp": timezone.now().isoformat()
                        }
                        yield f"data: {json.dumps(error_response)}\n\n"
                        time.sleep(0.1)
                
            except Device.DoesNotExist:
                error_response = {
                    "type": "error",
                    "message": f"Device with serial number {serial_number} not found",
                    "timestamp": timezone.now().isoformat()
                }
                yield f"data: {json.dumps(error_response)}\n\n"
                
            except Exception as e:
                logger.exception(f"Unexpected error in OBIS write streaming for {serial_number}")
                error_response = {
                    "type": "error",
                    "message": f"Unexpected error: {str(e)}",
                    "timestamp": timezone.now().isoformat()
                }
                yield f"data: {json.dumps(error_response)}\n\n"
        
        response = StreamingHttpResponse(
            generate_write_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['Access-Control-Allow-Origin'] = '*'  # Adjust for CORS as needed
        response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering if using nginx

        return response