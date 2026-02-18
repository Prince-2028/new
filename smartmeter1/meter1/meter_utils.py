import logging
import json
from decimal import Decimal
from .models import * # Import all relevant models
from django.utils.dateparse import parse_datetime


_dlms_import_error_message_util = None
try:
    from .dlms_helper import execute_dlms_action
    logger_util = logging.getLogger(__name__)
    logger_util.info("Successfully imported execute_dlms_action in meter_utils")
except ImportError:
    _dlms_import_error_message_util = "Utils: ImportError on dlms_helper."

    logger_util = logging.getLogger(__name__)
    logger_util.error(_dlms_import_error_message_util, exc_info=True)
except Exception as import_err_util:
    _dlms_import_error_message_util = f"Utils: Unexpected import error: {import_err_util}"
    logger_util = logging.getLogger(__name__)
    logger_util.error(_dlms_import_error_message_util, exc_info=True)

# Define mock if import failed
if 'execute_dlms_action' not in globals():
    def execute_dlms_action(config, action_details):
        error_msg = _dlms_import_error_message_util or "DLMS helper module failed to import."
        logger_util.warning(f"[MOCK IN UTILS] execute_dlms_action called. Reason: {error_msg}")
        return {"status": "error", "message": error_msg}


def get_dlms_config_from_device(device, media):
    """ 
    Extracts DLMS config dictionary from a Device object and Media connection.
    Updated to work with current DB structure where Media has portName.
    """
    if not device.addressing or not device.security:
        raise ValueError("Device config incomplete (addressing or security missing).")
    
    if not media or not media.portName:
        raise ValueError("Media connection not configured or missing port information.")
    
    try:
        client_addr = int(device.addressing.client_sap_hex, 16)
        server_addr = int(device.addressing.server_sap_hex, 16)
    except (ValueError, TypeError, AttributeError):
        logger_util.exception(f"Invalid SAP format for device {device.id}.")
        raise ValueError("Invalid addressing format stored.")

    config = {
        "port": media.portName,
        "client_address": client_addr,
        "server_address": server_addr,
        "security_level_str": device.security.security_level,
        "password": device.security.password if device.security.password else 'RENESAS_P6wRJ21F',
        "gak_hex": device.security.gak_hex,
        "guek_hex": device.security.guek_hex,
        # Use client_system_title from Security model (it's stored as string, not hex)
        "client_system_title_hex": getattr(device.security, 'client_system_title', None) or '52454E3030303030',
    }
    logger_util.debug(f"Generated DLMS config for device {device.id}")
    return config


def read_live_obis_value(dlms_config, obis_code_or_parameters, attribute_index=None):
    """ 
    Calls the DLMS action helper to read a value and returns it, or None on error.
    Can handle both single OBIS (obis_code, attribute_index) or batch parameters.
    """
    
    # Handle backward compatibility - single OBIS code
    if isinstance(obis_code_or_parameters, str) and attribute_index is not None:
        parameters = [{"obis_code": obis_code_or_parameters, "attribute_index": attribute_index}]
    # Handle batch parameters
    elif isinstance(obis_code_or_parameters, list):
        parameters = obis_code_or_parameters
    else:
        logger_util.error("Invalid parameters format for read_live_obis_value")
        return None, "Invalid parameters format"
    
    action_details = {
        "action": "read_obis",
        "parameters": parameters
    }
    
    try:
        result = execute_dlms_action(dlms_config, action_details)
        if result.get("status") == "success":
            # For single OBIS, return the first successful result
            if len(parameters) == 1:
                results = result.get("results", [])
                if results and results[0].get("status") == "success":
                    return results[0].get("value"), results[0].get("message")
                else:
                    return None, results[0].get("message", "Read failed") if results else "No results"
            # For batch, return the entire result
            else:
                return result, result.get("message")
        else:
            return None, result.get("message", "DLMS read failed")
    except Exception as e:
        logger_util.error(f"Exception during DLMS read: {e}", exc_info=True)
        return None, f"Exception: {str(e)}"


def get_db_record_for_obis(device_or_meter, obis_code, attribute_index):
    """ 
    Finds the relevant DB record (Identifier, Version, EnergyRegister, etc.) based on OBIS.
    Updated to work with current DB structure where most models are linked to Device.
    
    Args:
        device_or_meter: Can be either a Device or Meter instance
        obis_code: OBIS code string
        attribute_index: Attribute index for the OBIS code
    
    Returns:
        tuple: (db_record, value_field_name) or (None, None) if not found
    """
    # Determine if we have a Device or Meter
    if hasattr(device_or_meter, 'meter_type'):
        # It's a Device
        device = device_or_meter
        meter = None
    else:
        # It's a Meter
        meter = device_or_meter
        device = meter.device if hasattr(meter, 'device') else None
    
    target_model = None
    filter_kwargs = {}
    value_field_name = 'value' # Default field name
    
    if attribute_index: # Common case for 'value' attribute
        # Check Meter-related models first (if meter exists)
        if meter:
            filter_kwargs = {'meter': meter, 'code': obis_code}
            if MeterIdentifier.objects.filter(**filter_kwargs).exists(): 
                target_model = MeterIdentifier
            elif MeterVersion.objects.filter(**filter_kwargs).exists(): 
                target_model = MeterVersion
            elif MeterLogicalParameter.objects.filter(**filter_kwargs).exists(): 
                target_model = MeterLogicalParameter
        
        # Check Device-related models
        if not target_model and device:
            filter_kwargs = {'device': device, 'code': obis_code}
            
            if EnergyRegister.objects.filter(**filter_kwargs).exists():
                target_model = EnergyRegister
            elif Threshold.objects.filter(device=device, code=obis_code).exists():
                target_model = Threshold
            elif TimeSettings.objects.filter(device=device).exists() and obis_code == "0.0.1.0.0.255":
                target_model = TimeSettings
                filter_kwargs = {'device': device}
                value_field_name = 'system_time'
            # Add more model checks as needed for your current DB structure
            elif TariffParameter.objects.filter(**filter_kwargs).exists():
                target_model = TariffParameter
            elif ModuleInformation.objects.filter(**filter_kwargs).exists():
                target_model = ModuleInformation

    if target_model:
        record = target_model.objects.filter(**filter_kwargs).first()
        if record:
            return record, value_field_name
        else:
            logger_util.warning(f"Could not find DB record for {target_model.__name__} matching {filter_kwargs}")
            return None, None
    else:
        logger_util.warning(f"No DB model mapping found for OBIS {obis_code} Attr {attribute_index}")
        return None, None


def update_or_clear_db_value(db_record, value_field_name, live_value=None, clear=False):
    """ Updates the DB record's specified field with live_value OR clears it. """
    if not db_record or not value_field_name: return False
    updated_or_cleared = False
    try:
        field_obj = db_record._meta.get_field(value_field_name)
        field_allows_null = field_obj.null
        current_db_value = getattr(db_record, value_field_name)

        if clear:
            target_value = None if field_allows_null else ''
            # Special case for Decimal/Float/Int if needed 
            if isinstance(field_obj, (models.DecimalField, models.FloatField, models.IntegerField)) and not field_allows_null:
                 target_value = 0 # Or appropriate default if cannot be null

            if current_db_value != target_value:
                setattr(db_record, value_field_name, target_value)
                db_record.save(update_fields=[value_field_name])
                logger_util.debug(f"Cleared field '{value_field_name}' for {type(db_record).__name__} ID {db_record.pk}")
                updated_or_cleared = True
        elif live_value is not None:
            # Store the live value 
            value_to_store = live_value
            if isinstance(field_obj, (models.CharField, models.TextField)):
                 value_to_store = json.dumps(live_value) if isinstance(live_value, dict) else str(live_value)
            elif isinstance(field_obj, models.DecimalField):
                 try: value_to_store = Decimal(str(live_value)) # Convert string/float safely
                 except: logger_util.error(f"Could not convert {live_value} to Decimal"); value_to_store = None # Or raise error
            elif isinstance(field_obj, models.FloatField):
                 try: value_to_store = float(live_value)
                 except: logger_util.error(f"Could not convert {live_value} to Float"); value_to_store = None
            elif isinstance(field_obj, models.IntegerField):
                 try: value_to_store = int(live_value)
                 except: 
                    logger_util.error(f"Could not convert {live_value} to Int")
                    value_to_store = None
            elif isinstance(field_obj, models.DateTimeField):
                  try:
                      value_to_store = parse_datetime(str(live_value)) # Assumes ISO string
                  except:
                     logger_util.error(f"Could not convert {live_value} to DateTime") 
                     value_to_store = None

            # Only update if different and conversion succeeded
            if value_to_store is not None and getattr(db_record, value_field_name) != value_to_store:
                 setattr(db_record, value_field_name, value_to_store)
                 db_record.save(update_fields=[value_field_name])
                 logger_util.debug(f"Temp updated field '{value_field_name}' for {type(db_record).__name__} ID {db_record.pk}")
                 updated_or_cleared = True

    except Exception as e:
        logger_util.error(f"Error update/clear DB for {db_record}: {e}", exc_info=True)

    return updated_or_cleared