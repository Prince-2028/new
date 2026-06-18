from http import client
import logging
import time
import serial
import datetime
from datetime import datetime
import re
import traceback # For detailed error logging
import copy  # For deep copying objects
from django.utils.dateparse import parse_datetime 
from typing import Union, List

from gurux_dlms import GXDLMSClient, GXDLMSException, ValueEventArgs
from gurux_dlms.enums import InterfaceType, Authentication, Security, ObjectType, DataType, ClockStatus, AccessMode
from gurux_dlms.secure import GXDLMSSecureClient
from gurux_serial import GXSerial
from gurux_net import GXNet
from gurux_common.io import Parity, StopBits # Corrected case
from gurux_dlms.GXDateTime import GXDateTime
from gurux_dlms.GXTimeZone import GXTimeZone
from gurux_dlms.objects import (
    GXDLMSObject, GXDLMSClock, GXDLMSRegister, GXDLMSProfileGeneric, GXDLMSData,
    GXDLMSExtendedRegister, GXDLMSDemandRegister, GXDLMSScript, GXDLMSScriptAction,
    GXDLMSImageActivateInfo, GXDLMSQualityOfService, GXDLMSActionItem, GXDLMSScript,
)
from gurux_dlms.GXByteBuffer import GXByteBuffer
from gurux_dlms.GXFloat32 import GXFloat32
from gurux_dlms.internal._GXCommon import _GXCommon
from enum import IntFlag
from .GXDLMSReader import GXDLMSReader
import logging


logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s"
)


# Configure logging for this module
logger = logging.getLogger(__name__)

# Module-level storage for Association View objects (persists until server restart)
_association_view_store = {}

def clear_association_cache(connection_key=None):
    """
    Clear the Association View cache.
    
    Args:
        connection_key (str, optional): Specific connection key to clear.
                                       If None, clears entire cache.
    
    Returns:
        dict: Status information about the cache clearing operation
    """
    global _association_view_store
    
    if connection_key:
        # Clear specific connection
        if connection_key in _association_view_store:
            del _association_view_store[connection_key]
            logger.info(f"Cleared Association View cache for connection: {connection_key}")
            return {
                "status": "success",
                "message": f"Cleared cache for connection: {connection_key}",
                "cleared_connections": 1
            }
        else:
            logger.warning(f"Connection key not found in cache: {connection_key}")
            return {
                "status": "success",
                "message": f"Connection key not found in cache: {connection_key}",
                "cleared_connections": 0
            }
    else:
        # Clear entire cache
        cache_size = len(_association_view_store)
        _association_view_store.clear()
        logger.info(f"Cleared entire Association View cache. Removed {cache_size} connection(s).")
        return {
            "status": "success",
            "message": f"Cleared entire Association View cache",
            "cleared_connections": cache_size
        }


def datetime_to_dlms_octet_string(iso_string: str) -> bytes:
    # Parse the ISO 8601 timestamp including timezone
    dt = datetime.fromisoformat(iso_string)

    # Extract timezone offset in minutes
    if dt.tzinfo is None:
        deviation = 0x8000  # 0x8000 (-32768) indicating  "not specified"
    else:
        offset_sec = dt.utcoffset().total_seconds()
        deviation_min = int(offset_sec // 60)
        # Convert deviation to 2-byte signed (two's complement)
        if deviation_min < 0:
            deviation = (0x10000 + deviation_min) & 0xFFFF
        else:
            deviation = deviation_min

    # octet string
    octets = [
        (dt.year >> 8) & 0xFF, dt.year & 0xFF,      # Year (2 bytes)
        dt.month,                                   # Month
        dt.day,                                     # Day
        dt.isoweekday(),                            # Day of week (1=Mon)
        dt.hour,                                    # Hour
        dt.minute,                                  # Minute
        dt.second,                                  # Second
        0xFF,                                       # Hundredths of second (not specified)
        (deviation >> 8) & 0xFF, deviation & 0xFF,  # Time zone deviation
        0x00                                        # Clock status (not specified)
    ]
    hex_str = ''.join(f'{byte:02x}' for byte in octets)
    return bytes.fromhex(hex_str)

def is_iso8601_format(s: str) -> bool:
    try:
        datetime.fromisoformat(s)
        return True
    except ValueError:
        return False

class Tamper(IntFlag):
    FactoryMode = 1                       #0
    NonBusinessMode = 2                   #1
    MainRelayOpen = 4                     #2
    HighTemperature = 8                   #3
    NeutralMeasure = 16                   #4
    PunishMeasure = 32                    #5
    PrepayMode = 64                       #6
    LowCredit = 128                       #7
    FriendlyInUse = 256                   #8
    NoCredit = 512                        #9
    ExternalBatteryLow = 1024                   #10   ExternalBatteryLow
    TerminalCoverOpen = 2048              #11   SIMCardRemovedORException
    ModuleCoverOpen = 4096                #12
    StrongMagneticDisturbance = 8192          #13
    TopCoverOpen = 16384            #14    TopCoverOpen
    SIMCardRemovedORException = 32768     #15    TerminalCoverOpen

class Tamper1(IntFlag):
    Uncalibration = 1                       #0
    MeasureError = 2                        #1
    PRG_str_Error = 4                       #2
    NVM_Error = 8                           #3
    RAM_error = 16                          #4
    AbnormalRST = 32                        #5
    ModuleFault = 64                        #6
    RTC_OSC_Fault = 128                     #7
    MCU_USC_fault = 256                     #8
    MainRelayFault = 512                    #9
    ClockInvalid = 1024                     #10
    PPM_fault = 2048                        #11

class Tamper2(IntFlag):                     
    A_phase_miss_voltage = 1                #0                    
    A_phase_low_voltage = 2                 #1
    A_phase_high_voltage = 4                #2
    A_phase_abnormal = 8                    #3
    LowFrequency = 16                       #4
    HighFrequency = 32                      #5

class Current_History_Relay(IntFlag):
    TopCoverOpen = 1                     #0
    TerminalCoverOpen = 2                #1
    MOduleCoverOpen = 4                  #2
    DC_FieldDetected = 8                 #3
    OverVolatge = 16                     #4
    CurrentReverse = 32                  #5
    NoCredit = 64                        #6
    UnderVoltage = 128                   #7
    CT_Bypass = 256                      #8
    LowCredit2 = 512                     #9
    _0_Price = 1024                      #10

class BeepControlFilter(IntFlag):
    Step1_CloseDeductions = 1          #0
    Step2_CloseDeductions = 2          #1
    Step3_CloseDeductions = 4          #2
    Step4_CloseDeductions = 8          #3
    Step5_CloseDeductions = 16         #4
    Step6_CloseDeductions = 32         #5
    Step7_CloseDeductions = 64         #6
    Step8_CloseDeductions = 128        #7
    Step9_CloseDeductions = 256        #8
    Step10_CloseDeductions = 512       #9
    Disenable_Buzzer_Alarm = 1024      #10

class Alarms1(IntFlag):
    Clock_Invalid = 1                     #0
    Battery_Replace = 2                   #1
    Program_Memory_Error = 4               #2
    RAMError = 8                         #3
    NV_Memory_Error = 16                  #4
    Measurement_System_Error = 32          #5
    WatchDog_Error = 64                   #6
    Fraud_Attempt = 128                   #7

class Alarms2(IntFlag):
    TotalPowerFailure = 1                    #0
    PowerResume = 2                          #1
    VoltageMissing_L1 = 4                    #2
    VoltageMissing_L2 = 8                    #3
    MissingNeutral = 16                      #4
    PhaseAssymmetry = 32                     #5
    CurrentReversal = 64                     #6
    UnexpectedConsumption = 128              #7
    KeyExchanged = 256                       #8
    BadVolatageQuality_L1 = 512              #9
    ExternalAlert = 1024                     #10
    LocalCommunicationAttempt = 2048         #11
    DisconnectorRelayConnect_Failure = 4096  #12

OBIS_MAP = {
    "0.0.96.5.0.255": Tamper,
    "0.0.96.5.1.255": Tamper1,
    "0.0.96.5.2.255": Tamper2,
    "0.0.96.5.3.255": Tamper,
    "0.0.96.4.0.255": Current_History_Relay,
    "0.0.96.4.1.255": Current_History_Relay,
    "0.0.96.4.2.255": BeepControlFilter,
    "0.0.97.97.0.255": Alarms1,
    "0.0.97.98.0.255": Alarms1,
    "0.0.97.98.10.255": Alarms1,
    "0.0.97.98.20.255": Alarms1,
    "0.0.97.97.1.255": Alarms2,
    "0.0.97.98.1.255": Alarms2,
    "0.0.97.98.11.255": Alarms2,
    "0.0.97.98.21.255": Alarms2
}

def get_tamper_flags(value_input: str | int | bytes | bytearray, obis: str) -> list[str] | str:
    
    if isinstance(value_input, (bytes, bytearray)):
        value = int.from_bytes(value_input, byteorder='big')
    elif isinstance(value_input, str):
        value = int(value_input.strip(), 16 if 'x' in value_input.lower() else 10)
    elif isinstance(value_input, int):
        value = value_input
    else:
        raise ValueError("Unsupported input type. Expected bytes, str, or int.")

    print(f"Tamper Value: {value}")

    # Select corresponding Enum
    flag_class = OBIS_MAP.get(obis)
    if not flag_class:
        raise ValueError(f"Unsupported OBIS code for tamper flags: {obis}")

    # Extract flags
    flags = [f"{flag.name}" for flag in flag_class if flag.value & value]

    return flags if flags else ["NONE"]

# --- Helper Function for Cleanup ---
def _cleanup_dlms1(reader, media):
    """Safely disconnects reader and closes media with improved error handling for Windows."""
    if reader:
        try:
            logger.debug("Disconnecting DLMS reader...")
            reader.disconnect()
            logger.info("DLMS Reader disconnected.")
        except Exception as e:
            logger.error(f"Error during reader disconnect: {e}", exc_info=True)
    
    if media:
        try:
            if media.isOpen():
                logger.debug("Closing media connection...")
                # Add small delay before closing on Windows
                time.sleep(0.5)
                media.close()
                logger.info("Media connection closed.")
                # Add delay after closing to allow OS to release port
                time.sleep(0.5)
            else:
                logger.debug("Media connection was already closed.")
        except OSError as e:
            if e.winerror == 995:  # ERROR_OPERATION_ABORTED
                logger.warning(f"Serial port operation aborted (Windows error 995). Port may be in use by another process.")
                # Force close attempt
                try:
                    if hasattr(media, '_serial') and media._serial:
                        media._serial.close()
                except:
                    pass
            else:
                logger.warning(f"OSError closing media: {e}", exc_info=True)
        except Exception as e:
            logger.warning(f"Error closing media: {e}", exc_info=True)

# --- Helper Function to Convert Read Value to JSON Serializable Format ---
def _cleanup_dlms(reader, media):
    """Proper DLMS disconnect (Production safe)"""

    if reader and media and media.isOpen():
        try:
            logger.info("Sending DLMS Release Request (RLRQ)...")

            # Step 1: Release Request
            try:
                data = reader.client.releaseRequest()
                if data:
                    reader.readDLMSPacket(data)
                    logger.info("RLRQ completed")
                else:
                    logger.warning("No RLRQ data generated")
            except Exception as e:
                logger.warning(f"ReleaseRequest failed: {e}")

            time.sleep(0.2)

            # Step 2: Disconnect Request
            try:
                disc = reader.client.disconnectRequest()
                if disc:
                    reader.readDLMSPacket(disc)
                    logger.info("DisconnectRequest completed")
                else:
                    logger.warning("No DISC data generated")
            except Exception as e:
                logger.warning(f"DisconnectRequest failed: {e}")

        except Exception as e:
            logger.error(f"DLMS cleanup error: {e}")

    # Step 3: Close media
    if media:
        try:
            if media.isOpen():
                time.sleep(0.3)
                media.close()
                logger.info("Media closed")
                time.sleep(0.3)
        except Exception as e:
            logger.warning(f"Media close error: {e}")
# --- Helper Function to Convert Read Value to JSON Serializable Format ---


def _convert_read_value(value, obis=None):
    """Converts DLMS read values to JSON serializable types."""
    logger.warning(f"Real value : {value} and type of value is {type(value)}")
    if isinstance(value, (bytes, bytearray)):
        try:
            if obis in  ["0.0.96.5.0.255", "0.0.96.5.1.255", "0.0.96.5.2.255", "0.0.96.5.3.255", "0.0.96.4.0.255", "0.0.96.4.1.255", "0.0.96.4.2.255","0.0.97.97.0.255", "0.0.97.97.1.255", "0.0.97.98.0.255", "0.0.97.98.1.255",  "0.0.97.98.10.255",  "0.0.97.98.11.255",  "0.0.97.98.20.255",  "0.0.97.98.21.255"]:  #Special OBIS codes for tamper flags
                return get_tamper_flags(value,obis)
            # decoded_value = value.decode('utf-8', errors='replace')
            # result = value.split(b'\x00', 1)[0].decode()
            result = bytearray()
            for b in value:
                if 32 <= b <= 126: 
                    result.append(b)
                else:
                    break 

            return result.decode()
            # return f"{value[0]:02X}"

        except Exception: return "0x" + value.hex()
    
    elif isinstance(value, (list, tuple)):
        print("We are going list or tuple")
        processed_list = []
        for item_index, item in enumerate(value):
            # Check if the item is a Script object
            if isinstance(item, GXDLMSScript):
                script_dict = {}
                script_id = getattr(item, 'id', f"UnknownID_{item_index+1}")
                script_dict["script_id"] = script_id # Use the script's ID

                actions_list_json = []
                script_actions = getattr(item, 'actions', None)
                if isinstance(script_actions, list):
                    for action_index, action_obj in enumerate(script_actions):
                        if isinstance(action_obj, GXDLMSScriptAction):
                            # Extract details exactly like the GUI structure shows
                            print(action_obj.logicalName)
                            action_details = {
                                "service_id": _convert_read_value(action_obj.type_),
                                "class_id": _convert_read_value(action_obj.target.objectType),
                                "logical_name": _convert_read_value(action_obj.target.logicalName),
                                "target_index": _convert_read_value(action_obj.index),
                                "parameter": _convert_read_value(action_obj.parameter)
                            }
                            actions_list_json.append(action_details)
                        else:
                            # If item in actions list isn't expected type, convert to string
                            actions_list_json.append(_convert_read_value(action_obj))
                script_dict["actions"] = actions_list_json
                processed_list.append(script_dict) # Add the processed script dict
            else:
                # If item is not a GXDLMSScript, convert it recursively
                processed_list.append(_convert_read_value(item))
        return processed_list # Return the list of processed items

    elif isinstance(value, GXDateTime):
        print("We are going GXDateTime")
        # Default values
        date_part_str = "N/A"
        time_part_str = "N/A"
        status_str = "N/A"
        deviation_str = "N/A" # Default deviation string

        dt_obj = value.value # Access the internal datetime object

        if dt_obj: # Check if the datetime object exists
            try:
                    print(f"GXDateTime.value: {dt_obj}")
                    print(f"GXDateTime.value.tzinfo: {dt_obj.tzinfo}")
                    if dt_obj.tzinfo:
                        print(f"GXDateTime.value.utcoffset: {dt_obj.utcoffset()}")
                        print(f"GXDateTime.value.utcoffset in minutes: {dt_obj.utcoffset().total_seconds() / 60}")
                # Format Date: DayName, DD/MM/YYYY

                    date_part_str = dt_obj.strftime('%A, %d/%m/%Y')
                    # Format Time: HH:MM:SS
                    time_part_str = dt_obj.strftime('%H:%M:%S')
                    if dt_obj.tzinfo is None:
                        deviation_str = "N/A"
                    else:
                        print(f"Here .tzinfo is uding.")
                        deviation_str= dt_obj.tzname()
            except ValueError:
                 logger.warning(f"Could not format datetime object {dt_obj} using strftime.")
                 # Fallback for date/time part if formatting fails
                 try:
                     raw_time_str = value.toString()
                     parts = raw_time_str.split(' ')
                     print(f"Here raw time is using")
                     if len(parts) >= 1: date_part_str = f"Date : {parts[0]}" # Basic fallback
                     if len(parts) >= 2: time_part_str = f"Time : {parts[1]}"
                     if len(parts) >= 3: deviation_str = f"Deviation : {parts[2]}"
                 except:
                     date_part_str = "Date : Formatting Error"
                     time_part_str = "Time : Formatting Error"
                     deviation_str = "Deviation: Formatting Error"

        # Get Status string
        if hasattr(value, 'status'):
            if isinstance(value.status, ClockStatus): status_str = value.status.name # Prefer Enum name
            else: status_str = str(value.status) # Fallback to string/number

        # Get and format Deviation
        # if hasattr(dt_obj.value, 'deviation') and value.deviation is not None:
        #     if value.deviation != -32768:
        #          dev = value.deviation
        #          dev_sign = '+' if dev >= 0 else '-'
        #          dev_hours = abs(dev) // 60
        #          dev_mins = abs(dev) % 60
        #          deviation_str = f"{dev_sign}{dev_hours:02d}:{dev_mins:02d}" # Format +/-HH:MM
        #     else:
        #          deviation_str = "Not Specified"
        # else:
        #     deviation_str = "N/A" # If deviation attribute doesn't exist or is None

        # Combine time and deviation for the 'Time' field value
        formatted_time_with_deviation = f"{time_part_str} (Deviation: {deviation_str})"                           #(Deviation: {deviation_str})

        return {
            "Date": date_part_str, # Key "Date"
            "Time": formatted_time_with_deviation, # Key "Time" (includes deviation)
            "Clock Status": status_str # Key "Clock Status"
        }


    elif isinstance(value, GXByteBuffer):
        print("We are going GXByteBuffer")
        return _convert_read_value(value.__str__())
    elif isinstance(value, (list, tuple)):
        print("We are going list or tuple")
        return [_convert_read_value(item) for item in value]
    elif type(value).__name__ == 'BitString':
         print("We are going BitString")
         return str(value)
    elif isinstance(value, (int, str, bool, type(None))):
        print("We are going int, float, str, bool, type(None)")
        return value
    elif isinstance(value, GXFloat32):
        print("We are going GXFloat32")
        return round(value, 2)
    else:
        logger.debug(f"Converting complex type {type(value).__name__} to string.")
        return str(value)


# --- Helper Function to Build Image Transfer Data Structures ---
def _build_image_transfer_data(method_data, method_index):
    """Build properly formatted data for image transfer methods.
    
    Args:
        method_data: Dict containing image transfer parameters
        method_index: Method number (1=initiate, 2=block_transfer)
    
    Returns:
        Tuple of (data_list, DataType.ARRAY) for use with reader.method()
    """
    
    if method_index == 1:
        # Method 1: image_transfer_initiate
        # Return list: [image_identifier (bytes), image_size (int)]
        identifier = method_data.get('image_identifier', '')
        size = method_data.get('image_size', 0)
        
        # Convert identifier to bytes
        identifier_bytes = identifier.encode('utf-8') if isinstance(identifier, str) else identifier
        
        logger.debug(f"Built image_transfer_initiate data: identifier={identifier_bytes}, size={size}")
        return [identifier_bytes, size], DataType.ARRAY
        
    elif method_index == 2:
        # Method 2: image_block_transfer
        # Return list: [image_block_number (int), image_block_value (bytes)]
        block_num = method_data.get('image_block_number', 0)
        block_value = method_data.get('image_block_value', b'')
        
        # Convert hex string to bytes if needed
        if isinstance(block_value, str):
            hex_str = block_value
            if hex_str.startswith('0x'):
                hex_str = hex_str[2:]
            
            # Ensure even length for hex conversion
            if len(hex_str) % 2 != 0:
                logger.warning(f"Hex string has odd length ({len(hex_str)}), padding with 0")
                hex_str = '0' + hex_str
            
            try:
                block_value = bytes.fromhex(hex_str)
                logger.debug(f"Converted hex string to {len(block_value)} bytes")
            except ValueError as e:
                logger.error(f"Invalid hex string: {e}")
                raise ValueError(f"Invalid hex string for image_block_value: {e}")
        
        logger.debug(f"Built image_block_transfer data: block_num={block_num}, block_size={len(block_value)}")
        return [int(block_num), block_value], DataType.ARRAY
    
    return None, DataType.NONE


# --- Helper Function to Convert Value for Writing (Adapted from DLMSClient) ---
def _convert_write_value(value_str, data_type: DataType):
    """Convert input value from API to the appropriate data type for DLMS write.
    
    Args:
        value_str: Input value (can be str, dict, list, int, float, etc.)
        data_type: Target DLMS DataType
    
    Returns:
        Converted value suitable for DLMS operations
    """
    logger.debug(f"Converting '{value_str}' (type: {type(value_str)}) to {DataType(data_type).name} for writing...")
    try:
        if data_type == DataType.OCTET_STRING: # Type 9
            s = str(value_str).strip()
            if is_iso8601_format(s):
                logger.debug("Input is an ISO 8601 datetime string, converting to OCTET_STRING.")
                return datetime_to_dlms_octet_string(s)
            # if isinstance(s,datetime.fromisoformat(s)):
            #     logger.debug("Input is a datetime object, converting to OCTET_STRING.")
            #     return datetime_to_dlms_octet_string(s)
            logger.debug(f"Processing OCTET_STRING input: '{s}'")
            if s.startswith("0x"):
                logger.debug("Input starts with 0x, interpreting as hex.")
                return bytes.fromhex(s[2:])
    
            elif all(c in "0123456789ABCDEFabcdef" for c in s) and len(s) % 2 == 0:
                     try:
                         return bytes.fromhex(s)
                     except ValueError: # Not valid hex, treat as string
                         return s.encode('utf-8')
            else:
                return s.encode('utf-8') # Assume it's a string to encode
          
        
        elif data_type in (DataType.STRING, DataType.STRING_UTF8):
            return str(value_str)
        elif data_type in (DataType.INT8, DataType.INT16, DataType.INT32, DataType.INT64,
                           DataType.UINT8, DataType.UINT16, DataType.UINT32, DataType.UINT64):
            return int(value_str)
        elif data_type == DataType.BOOLEAN:
            val = str(value_str).lower().strip()
            if val in ('true', '1', 'yes', 'y', 'on'): return True
            if val in ('false', '0', 'no', 'n', 'off'): return False
            raise ValueError(f"Invalid boolean value: {value_str}")
        elif data_type in (DataType.FLOAT32, DataType.FLOAT64):
            return float(value_str)
        elif data_type == DataType.ENUM:
            return int(value_str)
        elif data_type == DataType.DATETIME:
        
            try:
                print(DataType.DATETIME.name)
                dt_obj = parse_datetime(value_str)

                if not dt_obj:
                    raise ValueError(f"Invalid datetime format: '{value_str}'")
                logger.debug(f"Parsed datetime string '{value_str}' to: {dt_obj} with tzinfo: {dt_obj.tzinfo} and offset: {dt_obj.utcoffset()}")
                
                parsed_offset_minutes_from_utc = 0 
                if dt_obj.tzinfo and dt_obj.utcoffset() is not None:
                    parsed_offset_minutes_from_utc = int(dt_obj.utcoffset().total_seconds() / 60)
                
                datetime_for_gxdt_value = datetime.datetime(
                year=dt_obj.year,
                month=dt_obj.month,
                day=dt_obj.day,
                hour=dt_obj.hour,
                minute=dt_obj.minute,
                second=dt_obj.second,
                tzinfo=GXTimeZone(parsed_offset_minutes_from_utc) 
            )
        
                gxdt = GXDateTime(datetime_for_gxdt_value)

                logger.debug(f"Meter String value: {gxdt.toMeterString()}")
                logger.debug(f"Meter Hex value: {gxdt.toHex(addSpace=True, useMeterTimeZone=True)}")
                return gxdt
        
            except ValueError as e:
                logger.error(f"Failed to parse datetime: {e}", exc_info=True)
                raise ValueError(f"Cannot convert '{value_str}' to DataType.DATE_TIME: {e}")
            
        elif data_type == DataType.DATE:
             dt_obj = datetime.strptime(value_str, "%Y-%m-%d").date()
             return GXDateTime(dt_obj)
        elif data_type == DataType.TIME:
             tm_obj = datetime.strptime(value_str, "%H:%M:%S").time()
             return GXDateTime(tm_obj)
        elif data_type == DataType.STRUCTURE:
            # Handle STRUCTURE - convert dict/JSON to list of values
            logger.debug(f"Converting STRUCTURE from: {value_str} (type: {type(value_str)})")
            if isinstance(value_str, dict):
                # Special handling for image transfer methods
                if 'image_identifier' in value_str and 'image_size' in value_str:
                    # Image transfer method 1: convert identifier to bytes
                    identifier = value_str['image_identifier']
                    if isinstance(identifier, str):
                        identifier = identifier.encode('utf-8')
                    logger.debug(f"Image transfer initiate: identifier={identifier}, size={value_str['image_size']}")
                    return [identifier, value_str['image_size']]
                elif 'image_block_number' in value_str and 'image_block_value' in value_str:
                    # Image transfer method 2: convert block data to bytes
                    block_data = value_str['image_block_value']
                    if isinstance(block_data, str):
                        # Assume hex string
                        if block_data.startswith('0x'):
                            block_data = bytes.fromhex(block_data[2:])
                        else:
                            block_data = bytes.fromhex(block_data)
                    logger.debug(f"Image block transfer: block={value_str['image_block_number']}, data_len={len(block_data)}")
                    return [value_str['image_block_number'], block_data]
                
                # Generic dict to list conversion
                return list(value_str.values())
            elif isinstance(value_str, str):
                # Try to parse JSON string
                import json
                try:
                    parsed = json.loads(value_str)
                    if isinstance(parsed, dict):
                        return list(parsed.values())
                    elif isinstance(parsed, list):
                        return parsed
                    else:
                        raise ValueError(f"Invalid STRUCTURE format: {value_str}")
                except json.JSONDecodeError:
                    raise ValueError(f"Cannot parse STRUCTURE JSON: {value_str}")
            elif isinstance(value_str, list):
                return value_str
            else:
                raise ValueError(f"Invalid STRUCTURE type: {type(value_str)}")
        elif data_type == DataType.ARRAY:
            # Handle ARRAY - similar to STRUCTURE
            logger.debug(f"Converting ARRAY from: {value_str} (type: {type(value_str)})")
            if isinstance(value_str, dict):
                # Special handling for image transfer methods
                if 'image_identifier' in value_str and 'image_size' in value_str:
                    # Image transfer method 1: convert identifier to bytes
                    identifier = value_str['image_identifier']
                    if isinstance(identifier, str):
                        identifier = identifier.encode('utf-8')
                    logger.debug(f"Image transfer initiate: identifier={identifier}, size={value_str['image_size']}")
                    return [identifier, value_str['image_size']]
                elif 'image_block_number' in value_str and 'image_block_value' in value_str:
                    # Image transfer method 2: convert block data to bytes
                    block_data = value_str['image_block_value']
                    if isinstance(block_data, str):
                        # Assume hex string
                        if block_data.startswith('0x'):
                            block_data = bytes.fromhex(block_data[2:])
                        else:
                            block_data = bytes.fromhex(block_data)
                    logger.debug(f"Image block transfer: block={value_str['image_block_number']}, data_len={len(block_data)}")
                    return [value_str['image_block_number'], block_data]
                
                # Generic dict to list conversion
                return list(value_str.values())
            elif isinstance(value_str, list):
                return value_str
            elif isinstance(value_str, str):
                import json
                try:
                    parsed = json.loads(value_str)
                    if isinstance(parsed, list):
                        return parsed
                    else:
                        raise ValueError(f"Invalid ARRAY format: {value_str}")
                except json.JSONDecodeError:
                    raise ValueError(f"Cannot parse ARRAY JSON: {value_str}")
            else:
                raise ValueError(f"Invalid ARRAY type: {type(value_str)}")
        else:
            logger.warning(f"Write conversion not explicitly handled for {data_type.name}. Using raw string.")
            return str(value_str)
    except (ValueError, TypeError) as e:
        logger.error(f"Error converting value '{value_str}' to {data_type.name} for writing: {e}", exc_info=True)
        raise ValueError(f"Cannot convert '{value_str}' to {data_type.name}: {e}")

def get_access_rights(obj, attribute_index):
        """Get the access rights for a specific attribute"""
        try:
            access_mode = obj.getAccess(attribute_index)
            rights_map = {
                AccessMode.NO_ACCESS: "No Access",
                AccessMode.READ: "Read Only",
                AccessMode.WRITE: "Write Only",
                AccessMode.READ_WRITE: "Read & Write",
                AccessMode.AUTHENTICATED_READ: "Read (Auth)",
                AccessMode.AUTHENTICATED_WRITE: "Write (Auth)",
                AccessMode.AUTHENTICATED_READ_WRITE: "Read/Write (Auth)"
            }
            return rights_map.get(access_mode, f"Unknown ({access_mode})")
        except NotImplementedError:
             return "Access Unknown (Not Implemented)"
        except Exception as e:
            print(f"  Warning: Error getting access mode for attr {attribute_index}: {e}")
            return f"Error ({e})"




from django.db import transaction
from .models import MeterIC,Device
def get_next_ic(device):
    with transaction.atomic():
        obj, created = MeterIC.objects.select_for_update().get_or_create(
            device=device
        )

        
        #obj.last_ic =4148
        #obj.save()
        return obj.last_ic
    





from gurux_dlms import GXDLMSClient
from gurux_dlms.objects import GXDLMSData
from gurux_dlms.enums import *

from gurux_dlms.enums import Authentication, Security, InterfaceType

from gurux_dlms import GXDLMSClient, GXReplyData
from gurux_dlms.objects import GXDLMSData
from gurux_dlms.enums import Authentication, Security, InterfaceType

import traceback
from gurux_dlms import GXDLMSClient, GXReplyData, GXDLMSException
from gurux_dlms.objects import GXDLMSData
from gurux_dlms.enums import Authentication, Security, InterfaceType



def get_meter_ic(media, client_addr=16, server_addr=1, interface=InterfaceType.HDLC):
    # Standard OBIS for Invocation Counter
    ic_obis = "0.0.43.1.0.255" 
    
    # Initialize Client
    temp_client = GXDLMSClient(useLogicalNameReferencing=True)
    temp_client.interfaceType = interface
    temp_client.clientAddress = client_addr
    temp_client.serverAddress = server_addr
    temp_client.authentication = Authentication.NONE

    # Helper function to send and receive properly without 'eop' errors
    def read_packet(data):
        reply = GXReplyData()
        # media.receive(reply) is the standard way to fill the reply object
        media.send(data)
        media.receive(reply)
        return reply

    try:
        if not media.isOpen():
            media.open()

        # 1. SNRM
        snrm_data = temp_client.snrmRequest()
        if snrm_data:
            reply = read_packet(snrm_data)
            temp_client.parseUAResponse(reply.data)

        # 2. AARQ
        aarq_data = temp_client.aarqRequest()
        reply = read_packet(aarq_data)
        temp_client.parseAareResponse(reply.data)

        # 3. Read IC
        ic_data = GXDLMSData(ic_obis)
        # Attribute 2 is the value (the counter)
        read_req = temp_client.read(ic_data, 2)
        reply = read_packet(read_req)
        
        # This parses the bytes from the meter into a Python integer
        val = temp_client.updateValue(ic_data, 2, reply.data)
        
        print(f"Successfully retrieved IC: {val}")

        # 4. Disconnect cleanly so the meter is ready for the real session
        media.send(temp_client.disconnectRequest())
        reply = GXReplyData()
        media.receive(reply)
        
        return int(val)

    except Exception as e:
        print(f"Failed to read IC: {str(e)}")
        # If the specific OBIS failed, it might be a different address
        return None


def execute_dlms_action( config, action_details): 
    """
    Connects to a meter using provided config, performs an action, and returns results.
    Aligned with the user's original working DLMSClient initialization.
    """
    client = None
    media = None
    reader = None
    import time
    start_time = time.monotonic()
    result = {"status": "error", "message": "Operation did not start."}

    try:
        action = action_details.get('action')
        parameters = action_details.get('parameters', {})
        serial_number = action_details.get('serial_number') #sumit

        logger.info(f"Starting DLMS Action: '{action}' | Config Port: '{config.get('port')}'")
        logger.debug(f"Full Config: {config}")
        logger.debug(f"Action Parameters: {parameters}")

        # --- 1. Prepare Config & Create Media ---
        port_info = config.get('port')
        client_addr = config.get('client_address')
        server_addr = config.get('server_address')
        if not port_info or client_addr is None or server_addr is None:
            raise ValueError("Missing essential config: port, client_address, or server_address.")

        interface = InterfaceType.HDLC
        trace_level = config.get('trace_level', 0xFF) # Default to Verbose like original script

        if ':' in port_info and '.' in port_info.split(':')[0]: # Basic check for IP:Port
             try:
                 host, port_num_str = port_info.split(':')
                 port_num = int(port_num_str)
                 time.sleep(1.5)
                 media = GXNet(name=host, portNo=port_num)
                 interface = InterfaceType.WRAPPER
                 logger.info(f"Configured TCP media: {host}:{port_num}, Timeout=30s")
             except (ValueError, IndexError):
                 raise ValueError(f"Invalid TCP/IP port format: '{port_info}'.")
        else: # Assume Serial
            media = GXSerial(port=port_info)
            # Match original script settings
            media.baudRate = 9600
            media.timeout = 10 
            # Standard serial settings (usually don't need changing unless specified)
            media.dataBits = 8
            media.parity = Parity.NONE
            media.stopBits = StopBits.ONE
            # Windows-specific fix for OSError 995
            media.writeTimeout = 5000  # 5 second write timeout
            media.readTimeout = 10000  # 10 second read timeout
            logger.info(f"Configured Serial media: {port_info}, Baud=9600, Timeout=10s")

        # --- 2. Map Security & Prepare Client Args ---
        sec_level_str = config.get('security_level_str', 'NOSEC').upper()
        password_str = config.get('password')
        gak_hex = config.get('gak_hex')
        guek_hex = config.get('guek_hex')
        client_sys_title_hex = config.get('client_system_title_hex', "4755525558434C49") # Default "GURUXCLI"

        auth = Authentication.NONE
        sec = Security.NONE
        pwd_bytes = None
        auth_key_bytes = None
        block_key_bytes = None
        sys_title_bytes = None

        if sec_level_str == 'HLS':
        
            auth = Authentication.HIGH
            sec = Security.AUTHENTICATION_ENCRYPTION
            if not gak_hex or not guek_hex or not client_sys_title_hex:
                raise ValueError("Missing GAK, GUEK, or Client System Title for HLS.")
            try:
                auth_key_bytes = bytes.fromhex(gak_hex)
                block_key_bytes = bytes.fromhex(guek_hex)
                sys_title_bytes = bytes.fromhex(client_sys_title_hex)
                if not password_str: raise ValueError("Missing Password for HLS.")
                pwd_bytes = password_str.encode('utf-8')
            except (TypeError, ValueError) as e:
                raise ValueError(f"Invalid hex format for HLS keys/title: {e}")
            logger.info(f"Mapping HLS -> Auth={auth.name}, Sec={sec.name}")
        elif sec_level_str == 'LLS':
            auth = Authentication.LOW
            sec = Security.AUTHENTICATION_ENCRYPTION
            if gak_hex and guek_hex:
                auth_key_bytes = bytes.fromhex(gak_hex)
                block_key_bytes = bytes.fromhex(guek_hex)
            if client_sys_title_hex:
                sys_title_bytes = bytes.fromhex(client_sys_title_hex)
            if not password_str: raise ValueError("Missing Password for LLS.")
            pwd_bytes = password_str.encode('utf-8')
            logger.info("Mapping LLS -> Auth=LOW, Sec=NONE")
        elif sec_level_str == 'NOSEC':
             auth = Authentication.NONE 
             sec = Security.NONE
             logger.info("Mapping NOSEC -> Auth=NONE, Sec=NONE")
        else:
            raise ValueError(f"Unsupported security level: {sec_level_str}")
        


   




        # --- 3. Instantiate Client 
        logger.debug(f"Instantiating GXDLMSSecureClient: Auth={auth.name}, Pwd={'YES' if pwd_bytes else 'NO'}, Iface={interface.name}")
        client = GXDLMSSecureClient(
            useLogicalNameReferencing=True,
            interfaceType=interface,
            forAuthentication=auth, 
            password=pwd_bytes      
        )
        client.settings.useUtc2NormalTime = True
        # Set addresses after instantiation
        client.clientAddress = client_addr
        client.serverAddress = server_addr
        logger.debug(f"Client/Server Address set: C={client_addr}, S={server_addr}")

        # Apply HLS security settings using settings.cipher path 
        if sec != Security.NONE:
            logger.debug("Applying HLS settings using 'settings.cipher' path...")
            if not sys_title_bytes or not auth_key_bytes or not block_key_bytes:
                 raise ValueError("Internal error: HLS keys/title bytes not prepared.")
            try:
                 
                #  Use the settings.cipher path from the original script
                 client.settings.cipher.security = sec
                 client.settings.cipher.systemTitle = sys_title_bytes
                 client.settings.cipher.authenticationKey = auth_key_bytes
                 client.settings.cipher.blockCipherKey = block_key_bytes
                #  Add challenge if it was used in the original script/config
                #  challenge_bytes = config.get('challenge')
                #  if challenge_bytes: client.settings.ctoSChallenge = challenge_bytes
                #  logger.info(f"Applied HLS Settings: Sec={sec.name}")
            except AttributeError as e:
                 logger.error(f"Failed to set HLS security via 'settings.cipher': {e}. Check library version/structure.", exc_info=True)
                
                 raise RuntimeError("Could not apply HLS settings using expected 'settings.cipher' path.") from e

        # --- 4. Create Reader ---
        
        # device = Device.objects.get(serial_number='Avc')
        device=Device.objects.get(serial_number=serial_number) #sumit

       

  
        ic_obis = get_next_ic(device) 
        
        print("ic_obis **********",ic_obis)
       

        print(ic_obis,"ic_obis") 

        ic_obis_code="0.0.43.1.3.255"
        #logger.debug(f"Instantiating GXDLMSReader. Invocation Counter: {ic_obis}") 
        #print(f" ic: {ic_obis}")

       
        print("%%%%%%%%%%%%%%testing  %%%%%%%%%%%%%")

        

        #next_ic = get_meter_ic(media, client_addr=16, server_addr=1) 
        #print("next_ic",next_ic)

       
       
        

        print("%%%%%%%%%%%%%%testing obis code %%%%%%%%%%%%%")

         
        
        
        
        reader = GXDLMSReader(
            client=client,
            media=media,
            trace=trace_level, # Use 0xFF for verbose trace like original
            invocationCounter=ic_obis,
            device=device
        )


        ################# testing ########### 

        




        ############## testing ############

        if interface == InterfaceType.HDLC:
            reader.waitTime = 5000

        # --- 5. Connect & Get Association View (or restore from memory) ---
        connection_key = f"{port_info}_{client_addr}_{server_addr}"
        
        if connection_key not in _association_view_store:
            # First action for this connection - do full initialization
            logger.info("Opening media connection...")
            
            # Retry logic for Windows serial port issues
            max_retries = 3
            retry_delay = 1.0
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    if attempt > 0:
                        logger.info(f"Retry attempt {attempt + 1}/{max_retries} after {retry_delay}s delay...")
                        time.sleep(retry_delay)
                    
                    media.open()
                    logger.info("Media connection opened successfully.")
                    break
                    
                except OSError as e:
                    last_error = e
                    if e.winerror == 995:  # ERROR_OPERATION_ABORTED
                        logger.warning(f"Serial port error 995 on attempt {attempt + 1}. Port may be in use.")
                        # Try to force close any existing connection
                        try:
                            media.close()
                            time.sleep(1.0)
                        except:
                            pass
                    else:
                        logger.error(f"OSError opening media: {e}")
                        
                    if attempt == max_retries - 1:
                        raise RuntimeError(
                            f"Failed to open serial port after {max_retries} attempts. "
                            f"Error: {last_error}. "
                            f"Please ensure:\n"
                            f"1. No other application is using {port_info}\n"
                            f"2. The device is properly connected\n"
                            f"3. You have permission to access the port"
                        ) from last_error
                        
                except Exception as e:
                    logger.error(f"Unexpected error opening media: {e}")
                    if attempt == max_retries - 1:
                        raise
            
            logger.info("Initializing DLMS connection (AARQ)...")
            reader.initializeConnection() # Sends AARQ, parses AARE
            logger.info("Connection established. Reading Association View...")
            reader.getAssociationView()   # Get object list
            logger.info(f"Association View retrieved. Found {len(client.objects)} objects.")
            print(f"Association View retrieved. Found {len(client.objects)} objects.------------------------------------------------------------------")
            # Store a DEEP COPY of the objects to avoid reference issues
            try:
                _association_view_store[connection_key] = copy.deepcopy(client.objects)
                logger.info(f"Stored deep copy of Association View in memory for connection: {connection_key}")
            except Exception as copy_error:
                logger.warning(f"Could not deep copy objects, storing reference instead: {copy_error}")
                _association_view_store[connection_key] = client.objects
            
            reader.close()      #1111111111111111111111111  
            print("Connection closed after storing association view. Ready for action execution-------------------------------------------------------------------------.")
            if interface == InterfaceType.WRAPPER:
                time.sleep(2.5)
        else:
            # Subsequent actions - restore from memory
            logger.info(f"Restoring Association View from memory for connection: {connection_key}")
            try:
                # Restore a DEEP COPY to avoid modifying the stored version
                client.settings.objects = copy.deepcopy(_association_view_store[connection_key])
                logger.info(f"Restored deep copy of {len(client.objects)} objects from memory. Skipping initialization.")
            except Exception as copy_error:
                logger.warning(f"Could not deep copy stored objects, using reference: {copy_error}")
                client.settings.objects = _association_view_store[connection_key]

        # --- 6. Perform Action ---
        logger.info(f"Executing action: '{action}'")
        if action == "read_obis":
            media.open()              #22222222222222222222222
            reader.initializeConnection() 

            # Handle multiple OBIS codes - collect all results
            results = []
            
            for index, obis_item in enumerate(parameters):
                if isinstance(obis_item, dict):
                    obis_code = obis_item.get('obis_code')
                    attr_str = obis_item.get('attribute_index')
                else:
                    # If item is a plain string, treat it as obis code and require attribute separately
                    obis_code = obis_item
                    attr_str = None

                if not obis_code or attr_str is None:
                    error_result = {
                        "status": "error",
                        "obis_code": obis_code,
                        "attribute_index": attr_str,
                        "message": "Missing 'obis_code' or 'attribute_index' for read_obis."
                    }
                    results.append(error_result)
                    continue

                try:
                    attr = int(attr_str)
                except (ValueError, TypeError):
                    error_result = {
                        "status": "error",
                        "obis_code": obis_code,
                        "attribute_index": attr_str,
                        "message": "Invalid 'attribute_index'."
                    }
                    results.append(error_result)
                    continue

                target_obj = client.objects.findByLN(ObjectType.NONE, obis_code)

                if not target_obj:
                    error_result = {
                        "status": "error",
                        "obis_code": obis_code,
                        "attribute_index": attr,
                        "message": f"Object '{obis_code}' not found."
                    }
                    results.append(error_result)
                    continue

                access_rights = get_access_rights(target_obj, attr)
                print(f"  Access Mode: {access_rights}")
                
                if "Read" in access_rights:
                    try:
                        logger.info(f"Reading OBIS: {obis_code}, Attribute: {attr}")
                        value = reader.read(target_obj, attr)


                        from gurux_dlms.objects.GXUnitCharge import GXUnitCharge

                        


                        


                        if obis_code in ["0.0.96.5.0.255", "0.0.96.5.1.255", "0.0.96.5.2.255", "0.0.96.5.3.255", "0.0.96.4.0.255", "0.0.96.4.1.255", "0.0.96.4.2.255","0.0.97.97.0.255", "0.0.97.97.1.255", "0.0.97.98.0.255", "0.0.97。98.1.255",  "0.0.97。98。10。255",  "0。0。97。98。11。255",  "0。0。97。98。20。255",  "0。0。97。98。21。255"]: # Special case for OBIS
                            value_serializable = _convert_read_value(value, obis_code)
                        elif isinstance(value, GXUnitCharge):
                            result = {
                                "chargePerUnitScaling": {},
                                "commodity": {},
                                "chargeTables": []
                            }

                            if value.chargePerUnitScaling:
                                result["chargePerUnitScaling"] = {
                                    "commodityScale": getattr(value.chargePerUnitScaling, "commodityScale", None),
                                    "priceScale": getattr(value.chargePerUnitScaling, "priceScale", None)
                                }

                            if value.commodity:
                                result["commodity"] = {
                                    "classId": getattr(value.commodity.target, "objectType", None),
                                    "logicalName": getattr(value.commodity.target, "logicalName", None),
                                    "attributeIndex": getattr(value.commodity, "index", None)
                                }

                            for row in value.chargeTables:
                                raw_index = getattr(row, "index", None)

                                if isinstance(raw_index, (bytearray, bytes)):
                                    index = int.from_bytes(raw_index, byteorder="big")
                                else:
                                    index = raw_index

                                result["chargeTables"].append({
                                    "index": index,
                                    "chargePerUnit": getattr(row, "chargePerUnit", None)
                                })

                            value_serializable=result
                        else:
                            print("%%%%%%%%%%%%%%%%%%%%%%%%%",value)
                            value_serializable = _convert_read_value(value)

                        logger.info(f"Read successful: {obis_code} Attr {attr} = {value_serializable}")
                        success_result = {
                            "status": "success", 
                            "action": "read", 
                            "obis_code": obis_code,
                            "attribute_index": attr, 
                            "value": value_serializable,
                            "message": "Read successful."
                        }
                        results.append(success_result)
                        
                    except Exception as read_error:
                        logger.error(f"Error reading {obis_code} attr {attr}: {read_error}")
                        error_result = {
                            "status": "error",
                            "obis_code": obis_code,
                            "attribute_index": attr,
                            "message": f"Read failed: {str(read_error)}"
                        }
                        results.append(error_result)
                else:
                    print(f"Not readable, Access = {access_rights}")
                    error_result = {
                        "status": "error",
                        "obis_code": obis_code,
                        "attribute_index": attr,
                        "message": f"Access denied for reading {obis_code} attr {attr}. Access: {access_rights}"
                    }
                    results.append(error_result)
            
            # Return consolidated results
            successful_reads = [r for r in results if r["status"] == "success"]
            failed_reads = [r for r in results if r["status"] == "error"]
            
            result = {
                "status": "success" if successful_reads else "error",
                "action": "read_obis",
                "total_requested": len(parameters),
                "successful_reads": len(successful_reads),
                "failed_reads": len(failed_reads),
                "results": results,
                "message": f"Batch read completed. {len(successful_reads)} successful, {len(failed_reads)} failed."
            }

        elif action == "write_obis":
            print("  ...................write testing by............. vvs")
            media.open()  # Ensure media is open
            reader.initializeConnection()
            # Handle both single write and batch writes
            if isinstance(parameters, list):
                # Batch write processing
                results = []
                for index, write_item in enumerate(parameters):
                    if not isinstance(write_item, dict):
                        error_result = {
                            "status": "error",
                            "obis_code": "Unknown",
                            "attribute_index": "Unknown",
                            "message": f"Write item {index+1} must be a dictionary with obis_code, attribute_index, and value."
                        }
                        results.append(error_result)
                        continue
                    
                    obis = write_item.get('obis_code')
                    attr_str = write_item.get('attribute_index')
                    value_to_write_str = write_item.get('value')
                    data_type_str = write_item.get('data_type')  # Optional
                    print(f"Values writing: {obis} {attr_str} {value_to_write_str} with data type {data_type_str}--------------------------------------------------")
                    if not obis or attr_str is None or value_to_write_str is None:
                        error_result = {
                            "status": "error",
                            "obis_code": obis,
                            "attribute_index": attr_str,
                            "message": "Missing obis_code, attribute_index, or value for write operation."
                        }
                        results.append(error_result)
                        continue
                    
                    try:
                        attr = int(attr_str)
                    except (ValueError, TypeError):
                        error_result = {
                            "status": "error",
                            "obis_code": obis,
                            "attribute_index": attr_str,
                            "message": "Invalid attribute_index - must be a number."
                        }
                        results.append(error_result)
                        continue
                    
                    try:
                        # Process individual write operation
                        logger.info(f"Writing OBIS: {obis}, Attribute: {attr}, Value: {value_to_write_str}")
                        
                        # Find target object
                        target_obj = client.objects.findByLN(ObjectType.NONE, obis)
                        if not target_obj:
                            error_result = {
                                "status": "error",
                                "obis_code": obis,
                                "attribute_index": attr,
                                "message": f"Object '{obis}' not found."
                            }
                            results.append(error_result)
                            continue
                        
                        # Read current value first (required for write operations)
                        reader.read(target_obj, attr)
                        
                        
                        # Check access rights
                        access_rights = get_access_rights(target_obj, attr)
                        can_write = access_rights in ["Write Only", "Read & Write", "Write (Auth)", "Read/Write (Auth)"]
                        print(f"  Access Mode: {access_rights}","can_write",can_write,"------------------------------------------------------------------")
                        if not can_write:
                            error_result = {
                                "status": "error",
                                "obis_code": obis,
                                "attribute_index": attr,
                                "message": f"Access denied for writing {obis} attr {attr}. Access: {access_rights}"
                            }
                            results.append(error_result)
                            continue
                        
                        # Determine data type
                        data_type = None
                        if data_type_str:
                            try:
                                data_type = DataType(int(data_type_str))
                                logger.debug(f"Using provided DataType: {data_type.name}")
                            except:
                                logger.warning(f"Invalid data_type: {data_type_str}. Will auto-detect.")
                                data_type = target_obj.getDataType(attr)
                        else:
                            data_type = target_obj.getDataType(attr)
                            if data_type == DataType.NONE:
                                error_result = {
                                    "status": "error",
                                    "obis_code": obis,
                                    "attribute_index": attr,
                                    "message": f"Auto-detect failed for {obis} attr {attr}. Provide 'data_type'."
                                }
                                results.append(error_result)
                                continue
                        
                        # Convert value
                        converted_value = _convert_write_value(value_to_write_str, data_type)
                        logger.info(f"Converted write value: {converted_value} (Type: {type(converted_value)})")
                        
                        # Update local object value using setValue
                        e_args = ValueEventArgs(client.settings, target_obj, attr, 0, None)
                        e_args.value = converted_value
                        target_obj.setValue(client.settings, e_args)
                        
                        # Send write request
                        reader.write(target_obj, attr)
                        logger.info(f"Write request sent successfully for {obis} attr {attr}.")
                        
                        success_result = {
                            "status": "success",
                            "action": "write",
                            "obis_code": obis,
                            "attribute_index": attr,
                            "written_value": value_to_write_str,
                            "message": "Write successful (command sent)."
                        }
                        results.append(success_result)
                        
                    except Exception as write_error:
                        logger.error(f"Error writing {obis} attr {attr}: {write_error}")
                        error_result = {
                            "status": "error",
                            "obis_code": obis,
                            "attribute_index": attr,
                            "message": f"Write failed: {str(write_error)}"
                        }
                        results.append(error_result)
                
                # Return consolidated batch results
                successful_writes = [r for r in results if r["status"] == "success"]
                failed_writes = [r for r in results if r["status"] == "error"]
                print("Batch write results----------------------------------------------------------------------------------:", results)
                result = {
                    "status": "success" if successful_writes else "error",
                    "action": "write_obis",
                    "total_requested": len(parameters),
                    "successful_writes": len(successful_writes),
                    "failed_writes": len(failed_writes),
                    "results": results,
                    "message": f"Batch write completed. {len(successful_writes)} successful, {len(failed_writes)} failed."
                }
                
            else:
                print("$$ 1376 else write parameters----------------------------------------------------------------------------------:", parameters)
                # Single write (existing logic)
                obis = parameters.get('obis_code')
                attr_str = parameters.get('attribute_index')
                value_to_write_str = parameters.get('value')
                data_type_str = None
                print(f" $$ 1382 Values writing----------------------------------------------------------------------------: {obis} {attr_str} {value_to_write_str}")
                if not obis or attr_str is None:  #or value_to_write_str is None
                    print(f"Values writing: {obis} {attr_str} {value_to_write_str}")
                    raise ValueError("Missing params for write.")
                try:
                    attr = int(attr_str)
                except:
                    raise ValueError("Invalid 'attribute_index'.")

                # target_obj = client.objects.findByLN(ObjectType.NONE, obis)
                
                # #sumit added------------------------------------------------------------------
                # if not reader.media.isOpen():
                #     print("Opening serial port...")
                #     reader.media.open()

                # print("Media open:", reader.media.isOpen())     
                # #sumit added till here ------------------------------------------------------------------                               
                # reader.read(target_obj, attr)
                # if not target_obj:
                #     raise ValueError(f"Object '{obis}' not found. Cannot proceed.")

                # access_rights = get_access_rights(target_obj, attr)
                # can_write = access_rights in ["Write Only", "Read & Write",
                #                             "Write (Auth)", "Read/Write (Auth)"]
        
                # print(f"  Access Mode: {access_rights}")
                # if not can_write:
                #     logger.warning(f"  ERROR: Attribute {attr} is not writable.")
                #     return {"status": "error", "message": f"Access denied for writing {obis} attr {attr}. Access: {access_rights}"}
                
#------------------------------------------------------------sumit addes-------------------------
                print("Media open:", reader.media.isOpen())
                # Find object
                target_obj = client.objects.findByLN(ObjectType.NONE, obis)
                if not target_obj:
                    raise ValueError(f"Object '{obis}' not found. Cannot proceed.")
                
                # Open serial port if needed
                if not reader.media.isOpen():
                    print("Opening serial port...")
                    reader.media.open()

                print("Media open:", reader.media.isOpen())

                access_rights = get_access_rights(target_obj, attr)

                can_write = access_rights in [
                    "Write Only",
                    "Read & Write",
                    "Write (Auth)",
                    "Read/Write (Auth)"
                ]

                print(f"Access Mode: {access_rights}")
                print(f"Can Write: {can_write}")

                # Stop if not writable
                if not can_write:
                    logger.warning(f"ERROR: Attribute {attr} is not writable.")

                    return {
                        "status": "error",
                        "message": f"Access denied for writing {obis} attr {attr}. Access: {access_rights}"
                    }


                # Keep read, but don't fail whole flow if read is denied
                try:
                    print(f"Attempting read for {obis} attr {attr}")
                    reader.read(target_obj, attr)
                    print("Read successful.")

                except Exception as read_error:
                    print(f"Read failed but continuing write flow: {read_error}")
                    logger.warning(f"Read failed for {obis} attr {attr}: {read_error}")

                print("Proceeding to write operation...")

#------------------------------------sumit added until here-------------------------


                # 2. Determine Data Type
                data_type = None
                if data_type_str:
                     try: data_type = DataType(int(data_type_str)); logger.debug(f"Using provided DataType: {data_type.name}")
                     except: raise ValueError(f"Invalid 'data_type': {data_type_str}")
                else:
                     data_type = target_obj.getDataType(attr)
                     if data_type == DataType.NONE: raise ValueError(f"Auto-detect failed for {obis} attr {attr}. Provide 'data_type'.")
                     print(f"Auto-determined DataType: {DataType(data_type).name}")

                # 3. Convert Value
                converted_value = _convert_write_value(value_to_write_str, data_type)
                logger.info(f"Converted write value: {converted_value} (Type: {type(converted_value)})")

                # 4. Update Local Object Value using setValue
                try:
                    print("$$ 1480------------------------------------------------------Attempting setValue--------------------------------------------------")
                    logger.info(f"Attempting target_obj.setValue for {obis} attr {attr}")
                    logger.debug(f"Value to set: {converted_value}, Type: {type(converted_value)}")
                    logger.debug(f"Target DataType enum: {DataType(data_type).name} ({DataType(data_type).value})")

                    e_args = ValueEventArgs(client.settings, target_obj, attr, 0, None)
                    e_args.value = converted_value
                    
                    # === THE ACTUAL CALL ===
                    target_obj.setValue(client.settings, e_args)
                    # =======================
                    logger.info(f"Local object value potentially updated via setValue for {obis} attr {attr}.")
                    print("$$ 1492------------------------------------------------------setValue called. Note: This updates the local object value in the client, but the actual write to the meter happens with reader.write(). Check meter logs/state for actual write result.")

                except Exception as e_setval:
                     print("------------------------------------------------------Error during setValue--------------------------------------------------")
                     logger.error(f"CRITICAL: Failed during target_obj.setValue for {obis}: {e_setval}", exc_info=True)
                     raise RuntimeError(f"Failed setting local value before write: {e_setval}") from e_setval

        
                logger.info(f"Sending WRITE request using reader.write(target_obj, attr)")
                reader.write(target_obj, attr) # <<< Using the object and index
                logger.info(f"Write request sent successfully for {obis} attr {attr}.") # Note: Success here just means sent, check meter logs/state
                result = {"status": "success", "action": "write", "obis_code": obis,
                          "attribute_index": attr, "written_value": value_to_write_str,
                          "message": "Write successful (command sent)."}
                print("$$1506 result after write operation----------------------------------------------------------------------------------:", result)

        elif action == "read_profile":
  
            obis = parameters.get('obis_code')
            if not obis: raise ValueError("Missing 'obis_code' for read_profile.")
            logger.debug(f"Finding Profile OBIS: {obis}")
            profile_obj = client.objects.findByLN(ObjectType.PROFILE_GENERIC, obis)
            if not profile_obj: raise ValueError(f"Profile Generic object {obis} not found.")
            logger.info(f"Reading Profile Buffer (Attr 2) for OBIS: {obis}")
            buffer_data_raw = reader.read(profile_obj, 2)
            decoded_buffer = _convert_read_value(buffer_data_raw)
            logger.info(f"Profile read successful for {obis}.")
            result = {"status": "success", "action": "read_profile", "obis_code": obis,
                      "profile_buffer": decoded_buffer, "message": "Profile read successful."}

        elif action == "execute_method":
         #   media.open()
         #   reader.initializeConnection()
            
            obis = parameters.get('obis_code')
            method_index_str = parameters.get('method_index')
            method_data = parameters.get('data', 0)  # Default to 0 if no data
            data_type_str = parameters.get('data_type')
            
            if not obis or method_index_str is None:
                raise ValueError("Missing 'obis_code' or 'method_index' for execute_method.")
            
            try:
                method_index = int(method_index_str)
            except (ValueError, TypeError):
                raise ValueError("Invalid 'method_index'.")
            
            # Find the target object
            target_obj = client.objects.findByLN(ObjectType.NONE, obis)
            if not target_obj:
                raise ValueError(f"Object '{obis}' not found.")
            
            logger.info(f"Executing method {method_index} on OBIS: {obis}")
            
            # Determine data type - CRITICAL: GXDLMSClient requires dataType != NONE
            if data_type_str:
                # User provided explicit data type
                try:
                    data_type = DataType(int(data_type_str))
                    logger.debug(f"Using provided DataType: {data_type.name}")
                except (ValueError, TypeError):
                    logger.warning(f"Invalid data_type: {data_type_str}. Will auto-detect.")
                    data_type = None
            else:
                data_type = None
            
            # Auto-detect data type if not provided (similar to write_obis)
            if data_type is None:
                logger.debug(f"Auto-detecting data type for value: {method_data} (type: {type(method_data)})")
                
                # Check if it's already a Python type
                if isinstance(method_data, bool):
                    data_type = DataType.BOOLEAN
                elif isinstance(method_data, int):
                    # Determine size based on value
                    if -128 <= method_data <= 127:
                        data_type = DataType.INT8
                    elif 0 <= method_data <= 255:
                        data_type = DataType.UINT8
                    elif -32768 <= method_data <= 32767:
                        data_type = DataType.INT16
                    elif 0 <= method_data <= 65535:
                        data_type = DataType.UINT16
                    elif -2147483648 <= method_data <= 2147483647:
                        data_type = DataType.INT32
                    else:
                        data_type = DataType.INT64
                elif isinstance(method_data, float):
                    data_type = DataType.FLOAT32
                elif isinstance(method_data, str):
                    # Check if it's hex string
                    if method_data.startswith('0x') or all(c in '0123456789ABCDEFabcdef' for c in method_data):
                        data_type = DataType.OCTET_STRING
                    else:
                        data_type = DataType.STRING
                elif isinstance(method_data, (bytes, bytearray)):
                    data_type = DataType.OCTET_STRING
                elif isinstance(method_data, list):
                    data_type = DataType.ARRAY
                elif isinstance(method_data, dict):
                    # Check if this is an image transfer method
                    if 'image_identifier' in method_data or 'image_block_number' in method_data:
                        # Image transfer methods use ARRAY, not STRUCTURE
                        data_type = DataType.ARRAY
                        logger.debug("Detected image transfer method, using ARRAY instead of STRUCTURE")
                    else:
                        data_type = DataType.STRUCTURE
                elif method_data is None or method_data == 0:
                    # For parameterless methods (like image_verify, image_activate)
                    data_type = DataType.INT8
                else:
                    # Fallback
                    data_type = DataType.INT8
                
                logger.info(f"Auto-determined DataType: {data_type.name} for value: {method_data}")
            
            # Execute the method
            try:
                # Special handling for image transfer methods (Class 18, OBIS 0.0.44.0.0.255)
                is_image_transfer = (obis == '0.0.44.0.0.255' and 
                                   isinstance(method_data, dict) and 
                                   ('image_identifier' in method_data or 'image_block_number' in method_data))
                
                if is_image_transfer and method_index in [1, 2]:
                    # Use GXDLMSImageTransfer object's built-in methods
                    logger.debug(f"Using GXDLMSImageTransfer built-in method for method {method_index}")
                    
                    # CRITICAL: Read imageBlockSize (attribute 2) first if not already set
                    if target_obj.imageBlockSize == 0 or target_obj.imageBlockSize is None:
                        logger.info("Reading imageBlockSize (attribute 2) before method execution...")
                        block_size_value = reader.read(target_obj, 2)
                        logger.info(f"Image block size from meter: {block_size_value}")
                    
                    if method_index == 1:
                        # imageTransferInitiate(client, imageIdentifier, imageSize)
                        identifier = method_data.get('image_identifier', '')
                        size = method_data.get('image_size', 0)
                        logger.debug(f"Calling imageTransferInitiate: identifier={identifier}, size={size}")
                        
                        # Call the built-in method which handles encoding correctly
                        request_data = target_obj.imageTransferInitiate(client, identifier, size)
                        
                    elif method_index == 2:
                        # imageBlockTransfer(client, imageBlockValue, imageBlockCount)
                        block_value = method_data.get('image_block_value', b'')
                        
                        # Convert hex string to bytes if needed
                        if isinstance(block_value, str):
                            hex_str = block_value
                            if hex_str.startswith('0x'):
                                hex_str = hex_str[2:]
                            if len(hex_str) % 2 != 0:
                                hex_str = '0' + hex_str
                            block_value = bytes.fromhex(hex_str)
                        
                        logger.debug(f"Calling imageBlockTransfer: block_size={len(block_value)}, imageBlockSize={target_obj.imageBlockSize}")
                        
                        # imageBlockTransfer returns a list of requests (one per block)
                        # Since we're sending one block at a time, we get the first request
                        block_count = [0]
                        request_list = target_obj.imageBlockTransfer(client, block_value, block_count)
                        request_data = request_list[0] if request_list else None
                    
                    # Send the request and read reply
                    if request_data:
                        from gurux_dlms import GXReplyData
                        reply = GXReplyData()
                        reader.readDataBlock(request_data, reply)
                        response_value = _convert_read_value(reply.value) if reply.value else None
                    else:
                        response_value = None
                        
                else:
                    # Normal method execution path
                    converted_data, data_type = _build_image_transfer_data(method_data, method_index) if is_image_transfer else (method_data, data_type)
                    
                    if not is_image_transfer:
                        # Convert data if needed (normal path)
                        converted_data = method_data
                        if data_type_str or (data_type and data_type != DataType.INT8):
                            try:
                                # Pass the original method_data (not str()) to preserve dict/list types
                                converted_data = _convert_write_value(method_data, data_type)
                                logger.debug(f"Converted method data: {converted_data} (Type: {type(converted_data)})")
                            except Exception as e:
                                logger.warning(f"Failed to convert method data: {e}. Using raw value.")
                                converted_data = method_data
                    
                    logger.debug(f"Calling reader.method({obis}, {method_index}, {converted_data}, {data_type.name})")
                    response_value = reader.method(target_obj, method_index, converted_data, data_type)
                    response_value = _convert_read_value(response_value) if response_value else None
                
                # Build success result
                logger.info(f"Method execution successful for {obis} method {method_index}")
                result = {
                    "status": "success",
                    "action": "execute_method",
                    "obis_code": obis,
                    "method_index": method_index,
                    "response": response_value,
                    "data_type_used": data_type.name if not is_image_transfer else "IMAGE_TRANSFER",
                    "message": "Method executed successfully."
                }
            except Exception as method_error:
                logger.error(f"Error executing method {method_index} on {obis}: {method_error}")
                result = {
                    "status": "error",
                    "obis_code": obis,
                    "method_index": method_index,
                    "message": f"Method execution failed: {str(method_error)}"
                }

        elif action == "combined_image_transfer":
            # Combined image transfer: Keep connection open for entire process
            # Flow: GET block_size → GET transfer_enabled → M1 → M2 loop → GET blocks status → M3 → M4
            
            obis = parameters.get('obis_code', '0.0.44.0.0.255')
            image_identifier = parameters.get('image_identifier')
            image_data = parameters.get('image_data')  # Full image as hex string or bytes
            
            if not image_identifier or not image_data:
                raise ValueError("Missing 'image_identifier' or 'image_data' for combined_image_transfer.")
            
            # Convert image_data to bytes if it's a hex string
            if isinstance(image_data, str):
                hex_str = image_data
                if hex_str.startswith('0x'):
                    hex_str = hex_str[2:]
                if len(hex_str) % 2 != 0:
                    hex_str = '0' + hex_str
                logger.debug(f"Converting hex string to bytes: length={len(hex_str)} chars")
                image_data = bytes.fromhex(hex_str)
                logger.debug(f"Converted to bytes: length={len(image_data)}, type={type(image_data)}")
                logger.debug(f"First 20 bytes after conversion: {image_data[:20]}")
            
            # CRITICAL: Convert bytes to bytearray for Gurux library compatibility
            # The Gurux library expects bytearray, not bytes
            if isinstance(image_data, bytes):
                image_data = bytearray(image_data)
                logger.debug(f"Converted bytes to bytearray: type={type(image_data)}")
            
            image_size = len(image_data)
            
            logger.info(f"Starting combined image transfer: {image_identifier}, size={image_size} bytes")
            
            # Open connection and keep it open
            media.open()
            reader.initializeConnection()
            
            # Log HDLC settings after connection negotiation
            logger.info(f"HDLC Settings after connection:")
            logger.info(f"  maxInfoTX: {client.hdlcSettings.maxInfoTX}")
            logger.info(f"  maxInfoRX: {client.hdlcSettings.maxInfoRX}")
            logger.info(f"  windowSizeTX: {client.hdlcSettings.windowSizeTX}")
            logger.info(f"  windowSizeRX: {client.hdlcSettings.windowSizeRX}")
            logger.info(f"  maxReceivePDUSize: {client.maxReceivePDUSize}")
            
            # Find the image transfer object
            target_obj = client.objects.findByLN(ObjectType.NONE, obis)
            if not target_obj:
                raise ValueError(f"Image Transfer object '{obis}' not found.")
            
            transfer_log = []
            transfer_log.append(f"HDLC maxInfoTX: {client.hdlcSettings.maxInfoTX}, maxInfoRX: {client.hdlcSettings.maxInfoRX}")
            
            try:
                # Step 1: GET block_size (attribute 2)
                logger.info("Step 1: Reading imageBlockSize (attribute 2)...")
                block_size_value = reader.read(target_obj, 2)
                logger.info(f"Image block size from meter: {block_size_value}")
                transfer_log.append(f"Block size from meter: {block_size_value}")
                
                # Use the meter's block size directly
                # The HDLC library bug has been fixed to support extended format (up to 2047 bytes)
                target_obj.imageBlockSize = block_size_value
                logger.info(f"Using meter's block size: {block_size_value}")
                transfer_log.append(f"Using block size: {block_size_value}")
                
                # Step 2: GET transfer_enabled (attribute 5)
                logger.info("Step 2: Reading imageTransferEnabled (attribute 5)...")
                transfer_enabled = reader.read(target_obj, 5)
                logger.info(f"Image transfer enabled: {transfer_enabled}")
                transfer_log.append(f"Transfer enabled: {transfer_enabled}")
                
                if not transfer_enabled:
                    raise ValueError("Image transfer is not enabled on the meter")
                
                # Step 3: ACTION Method 1 (image_transfer_initiate)
                logger.info(f"Step 3: Executing Method 1 (initiate) - identifier={image_identifier}, size={image_size}...")
                request_m1 = target_obj.imageTransferInitiate(client, image_identifier, image_size)
                from gurux_dlms import GXReplyData
                reply_m1 = GXReplyData()
                reader.readDataBlock(request_m1, reply_m1)
                logger.info("Method 1 (initiate) executed successfully")
                transfer_log.append("Method 1: Initiate - SUCCESS")
                
                # Step 4: GET status (attribute 6) to confirm initiation
                logger.info("Step 4: Reading imageTransferStatus (attribute 6)...")
                status_after_init = reader.read(target_obj, 6)
                logger.info(f"Status after initiate: {status_after_init}")
                transfer_log.append(f"Status after initiate: {status_after_init}")
                
                # Step 5: ACTION Method 2 loop (image_block_transfer)
                # Calculate number of blocks
                block_count = int(image_size / target_obj.imageBlockSize)
                if image_size % target_obj.imageBlockSize != 0:
                    block_count += 1
                
                logger.info(f"Step 5: Transferring {block_count} blocks...")
                transfer_log.append(f"Total blocks to transfer: {block_count}")
                
                # Debug: Check image_data type and sample bytes
                logger.debug(f"image_data type: {type(image_data)}, length: {len(image_data)}")
                logger.debug(f"First 20 bytes: {image_data[:20]}")
                logger.debug(f"Sample byte values: {[b for b in image_data[:20]]}")
                
                # Verify all bytes are in valid range
                invalid_bytes = [i for i, b in enumerate(image_data[:100]) if not isinstance(b, int) or b < 0 or b > 255]
                if invalid_bytes:
                    logger.error(f"Found invalid bytes at positions: {invalid_bytes}")
                    logger.error(f"Invalid byte values: {[image_data[i] for i in invalid_bytes[:10]]}")
                
                # CRITICAL: imageBlockTransfer expects the FULL image data and creates all packets internally
                # It returns a list of requests, one per block
                block_count_arr = [0]
                logger.debug(f"Calling imageBlockTransfer with image_data length={len(image_data)}, imageBlockSize={target_obj.imageBlockSize}")
                
                # Test with just first block to isolate issue
                test_block = image_data[:target_obj.imageBlockSize]
                logger.debug(f"Test block type: {type(test_block)}, length: {len(test_block)}")
                logger.debug(f"Test block first 10 bytes: {list(test_block[:10])}")
                
                try:
                    request_list = target_obj.imageBlockTransfer(client, image_data, block_count_arr)
                except Exception as e:
                    logger.error(f"Error in imageBlockTransfer: {e}")
                    logger.error(f"Error type: {type(e).__name__}")
                    import traceback
                    tb_lines = traceback.format_exc().split('\n')
                    for line in tb_lines:
                        logger.error(line)
                    raise
                total_requests = len(request_list)
                
                logger.info(f"Generated {total_requests} block transfer requests")
                
                successful_blocks = 0
                failed_blocks = 0
                
                # Send each request
                for block_num, request_m2 in enumerate(request_list):
                    try:
                        reply_m2 = GXReplyData()
                        reader.readDataBlock(request_m2, reply_m2)
                        successful_blocks += 1
                        
                        # Log progress every 50 blocks
                        if (block_num + 1) % 50 == 0 or (block_num + 1) == total_requests:
                            progress_pct = ((block_num + 1) / total_requests) * 100
                            logger.info(f"Progress: {block_num + 1}/{total_requests} blocks ({progress_pct:.1f}%)")
                            transfer_log.append(f"Block {block_num + 1}/{total_requests} transferred ({progress_pct:.1f}%)")
                    except Exception as block_error:
                        logger.error(f"Error transferring block {block_num}: {block_error}")
                        failed_blocks += 1
                        transfer_log.append(f"Block {block_num} FAILED: {str(block_error)}")
                
                logger.info(f"Block transfer complete: {successful_blocks} successful, {failed_blocks} failed")
                transfer_log.append(f"Block transfer complete: {successful_blocks}/{total_requests} successful")
                
                # Step 6: GET blocks status (attribute 3)
                logger.info("Step 6: Reading imageTransferredBlocksStatus (attribute 3)...")
                blocks_status = reader.read(target_obj, 3)
                logger.info(f"Blocks status: {blocks_status}")
                transfer_log.append(f"Blocks status retrieved")
                
                # Step 7: ACTION Method 3 (image_verify)
                logger.info("Step 7: Executing Method 3 (verify)...")
                request_m3 = target_obj.imageVerify(client)
                reply_m3 = GXReplyData()
                reader.readDataBlock(request_m3, reply_m3)
                logger.info("Method 3 (verify) executed successfully")
                transfer_log.append("Method 3: Verify - SUCCESS")
                
                # Step 8: GET status after verify
                logger.info("Step 8: Reading status after verify...")
                status_after_verify = reader.read(target_obj, 6)
                logger.info(f"Status after verify: {status_after_verify}")
                transfer_log.append(f"Status after verify: {status_after_verify}")
                
                # # Step 9: ACTION Method 4 (image_activate)
                # logger.info("Step 9: Executing Method 4 (activate)...")
                # request_m4 = target_obj.imageActivate(client)
                # reply_m4 = GXReplyData()
                # reader.readDataBlock(request_m4, reply_m4)
                # logger.info("Method 4 (activate) executed successfully")
                # transfer_log.append("Method 4: Activate - SUCCESS")
                
                # # Final status check
                # logger.info("Step 10: Reading final status...")
                # final_status = reader.read(target_obj, 6)
                # logger.info(f"Final status: {final_status}")
                # transfer_log.append(f"Final status: {final_status}")
                
                result = {
                    "status": "success",
                    "action": "combined_image_transfer",
                    "image_identifier": image_identifier,
                    "image_size": image_size,
                    "blocks_transferred": successful_blocks,
                    "blocks_failed": failed_blocks,
                    "total_blocks": block_count,
                    "transfer_log": transfer_log,
                    "message": f"Combined image transfer completed successfully. {successful_blocks}/{block_count} blocks transferred."
                }
                
            except Exception as transfer_error:
                logger.error(f"Error during combined image transfer: {transfer_error}")
                result = {
                    "status": "error",
                    "action": "combined_image_transfer",
                    "message": f"Combined image transfer failed: {str(transfer_error)}",
                    "transfer_log": transfer_log
                }

        elif action == "refresh_relay":
            # Simple refresh action - just open media and initialize connection
            logger.info("Executing refresh_relay action...")
        #    media.open()
        #    reader.initializeConnection()
            logger.info("Refresh relay action completed successfully")
            result = {
                "status": "success",
                "action": "refresh_relay",
                "message": "Relay refresh completed successfully."
            }

        else:
            logger.warning(f"Unknown DLMS action requested: {action}")
            result = {"status": "error", "message": f"Unknown action '{action}' requested."}

 
    except ValueError as ve:
        logger.error(f"Configuration/Value Error: {ve}", exc_info=True)
        result = {"status": "error", "message": str(ve)}
    except GXDLMSException as de:
        logger.error(f"DLMS Exception: Code={de.errorCode}, Message={de}", exc_info=True)
        result = {"status": "error", "message": f"DLMS Error: {de.errorCode} - {de}"}
    except serial.SerialException as se:
        logger.error(f"Serial Error: {se}", exc_info=True)
        result = {"status": "error", "message": f"Serial communication error: {se}"}
    except IOError as ioe:
        logger.error(f"I/O Error (Serial/Socket): {ioe}", exc_info=True)
        result = {"status": "error", "message": f"Communication I/O error: {ioe}"}
    except TimeoutError:
        logger.error("DLMS operation timed out.", exc_info=True)
        result = {"status": "error", "message": "Operation timed out waiting for meter response."}
    except AttributeError as ae:
         logger.error(f"Attribute Error: {ae}", exc_info=True)
         result = {"status": "error", "message": f"Programming error: {ae}"}
    except IndexError as ie: 
         logger.error(f"Index Error (likely during AARE parsing): {ie}", exc_info=True)
         result = {"status": "error", "message": f"Failed to parse meter response (IndexError). Check addressing/security/interface."}
    except Exception as e:
        logger.exception("Unexpected error during DLMS operation:")
        result = {"status": "error", "message": f"An unexpected error occurred: {type(e).__name__}"}
    except Exception as e:
        print("\n🔥 FULL ERROR START 🔥")
        print("Error:", str(e))
        traceback.print_exc()
        print("🔥 FULL ERROR END 🔥\n")

        logger.error("DLMS Exception occurred", exc_info=True)

        result = {
            "status": "error",
            "message": str(e)
        }

    # --- Cleanup ---
    finally:
        print("finally block calling")
    

        _cleanup_dlms(reader, media)
        time.sleep(2)
        end_time = time.monotonic()
        duration = end_time - start_time
        logger.info(f"DLMS action '{action_details.get('action')}' finished in {duration:.2f} seconds. Result status: '{result.get('status')}'")

    return result

