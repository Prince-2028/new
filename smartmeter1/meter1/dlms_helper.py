import logging
import time
import serial
import datetime
from datetime import datetime
import re
import traceback # For detailed error logging
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
from enum import IntFlag
from .GXDLMSReader import GXDLMSReader
# Configure logging for this module
logger = logging.getLogger(__name__)

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
def _cleanup_dlms(reader, media):
    """Safely disconnects reader and closes media."""
    if reader:
        try:
            logger.debug("Disconnecting DLMS reader...")
            reader.disconnect()
            logger.info("DLMS Reader disconnected.")
        except Exception as e:
            logger.error(f"Error during reader disconnect: {e}", exc_info=False)
    if media:
        try:
            if media.isOpen():
                logger.debug("Closing media connection...")
                media.close()
                logger.info("Media connection closed.")
            else:
                logger.debug("Media connection was already closed.")
        except Exception as e:
            logger.warning(f"Error closing media: {e}", exc_info=False)

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
        

# --- Helper Function to Convert Value for Writing (Adapted from DLMSClient) ---
def _convert_write_value(value_str, data_type: DataType):
    """Convert string input from API to the appropriate data type for DLMS write."""
    logger.debug(f"Converting '{value_str}' to {DataType(data_type).name} for writing...")
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
                logger.error(f"Failed to parse datetime: {e}")
                raise ValueError(f"Cannot convert '{value_str}' to DataType.DATE_TIME: {e}")
            
        elif data_type == DataType.DATE:
             dt_obj = datetime.strptime(value_str, "%Y-%m-%d").date()
             return GXDateTime(dt_obj)
        elif data_type == DataType.TIME:
             tm_obj = datetime.strptime(value_str, "%H:%M:%S").time()
             return GXDateTime(tm_obj)
        else:
            logger.warning(f"Write conversion not explicitly handled for {data_type.name}. Using raw string.")
            return str(value_str)
    except (ValueError, TypeError) as e:
        logger.error(f"Error converting value '{value_str}' to {data_type.name} for writing: {e}")
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


# --- Main Execution Function ---
def execute_dlms_action(config, action_details):
    """
    Connects to a meter using provided config, performs an action, and returns results.
    Aligned with the user's original working DLMSClient initialization.
    """
    client = None
    media = None
    reader = None
    start_time = time.monotonic()
    result = {"status": "error", "message": "Operation did not start."}

    try:
        action = action_details.get('action')
        parameters = action_details.get('parameters', {})
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
            # media.dataBits = 8
            # media.parity = Parity.NONE
            # media.stopBits = StopBits.ONE
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
        ic_obis = 1 # Hardcoded based on user's working script
        logger.debug(f"Instantiating GXDLMSReader. Invocation Counter: {ic_obis}")
        reader = GXDLMSReader(
            client=client,
            media=media,
            trace=trace_level, # Use 0xFF for verbose trace like original
            invocationCounter=ic_obis
        )

        # --- 5. Connect & Get Association View ---
        logger.info("Opening media connection...")
        media.open()
        logger.info("Initializing DLMS connection (AARQ)...")
        reader.initializeConnection() # Sends AARQ, parses AARE
        logger.info("Connection established. Reading Association View...")
        reader.getAssociationView()   # Get object list
        logger.info(f"Association View retrieved. Found {len(client.objects)} objects.")
        reader.close()
        if interface == InterfaceType.WRAPPER:
            time.sleep(2.5)

        # --- 6. Perform Action ---
        logger.info(f"Executing action: '{action}'")
        if action == "read_obis":
            media.open()
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
                        if obis_code in ["0.0.96.5.0.255", "0.0.96.5.1.255", "0.0.96.5.2.255", "0.0.96.5.3.255", "0.0.96.4.0.255", "0.0.96.4.1.255", "0.0.96.4.2.255","0.0.97.97.0.255", "0.0.97.97.1.255", "0.0.97.98.0.255", "0.0.97.98.1.255",  "0.0.97.98.10.255",  "0.0.97.98.11.255",  "0.0.97.98.20.255",  "0.0.97.98.21.255"]: # Special case for OBIS
                            value_serializable = _convert_read_value(value, obis_code)
                        else:
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
            media.open()  # Ensure media is open
            reader.initializeConnection()
            obis = parameters.get('obis_code')
            attr_str = parameters.get('attribute_index')
            value_to_write_str = parameters.get('value')
            data_type_str = None
            print(f"Values writing: {obis} {attr_str} {value_to_write_str}")
            if not obis or attr_str is None:  #or value_to_write_str is None
                print(f"Values writing: {obis} {attr_str} {value_to_write_str}")
                raise ValueError("Missing params for write.")
            try:
                attr = int(attr_str)
            except:
                raise ValueError("Invalid 'attribute_index'.")

            # print(f"Finding object {obis} for writing.")
            # target_obj = None
            # for obj in client.objects:
            #     # Make comparison robust (handle potential whitespace)
            #     if hasattr(obj, 'logicalName') and obj.logicalName.strip() == obis.strip():
            #         target_obj = obj
            #         break

            # if target_obj:
            #     object_type_name = "Unknown Type"
            #     try:
            #         object_type_name = ObjectType(target_obj.objectType).name
            #     except ValueError:
            #         object_type_name = f"Unknown Type ({target_obj.objectType})"

            #     print(f"Found object: Type={object_type_name}, LN={target_obj.logicalName}, ClassID={target_obj.objectType}")

            target_obj = client.objects.findByLN(ObjectType.NONE, obis)
            # print(f"Target Object Found: {target_obj}")
            # print(f"Type: {type(target_obj)}")
            # print(f"Vars: {vars(target_obj)}") # Log internal attributes
            
            reader.read(target_obj, attr)

            if not target_obj:
                raise ValueError(f"Object '{obis}' not found. Cannot proceed.")

            access_rights = get_access_rights(target_obj, attr)
            can_write = access_rights in ["Write Only", "Read & Write",
                                        "Write (Auth)", "Read/Write (Auth)"]
    
            print(f"  Access Mode: {access_rights}")
            if not can_write:
                print(f"  ERROR: Attribute {attr} is not writable.")
                return {"status": "error", "message": f"Access denied for writing {obis} attr {attr}. Access: {access_rights}"}
            
            # 2. Determine Data Type
            data_type = None
            if data_type_str:
                 try: data_type = DataType(int(data_type_str)); logger.debug(f"Using provided DataType: {data_type.name}")
                 except: raise ValueError(f"Invalid 'data_type': {data_type_str}")
            else:
                #  print(type(target_obj))
                 data_type = target_obj.getDataType(attr)
                #  print(f"This is the data type : {data_type}")
                 if data_type == DataType.NONE: raise ValueError(f"Auto-detect failed for {obis} attr {attr}. Provide 'data_type'.")
                 print(f"Auto-determined DataType: {DataType(data_type).name}")

            # print(f"this is the data_type final : {data_type}")

            # 3. Convert Value
            converted_value = _convert_write_value(value_to_write_str, data_type)
            logger.info(f"Converted write value: {converted_value} (Type: {type(converted_value)})")

            # 4. Update Local Object Value using setValue
            try:
                logger.info(f"Attempting target_obj.setValue for {obis} attr {attr}")
                # Log details about the object and value being set
                # logger.debug(f"Target Object Type: {type(target_obj).__name__}, LN: {target_obj.logicalName}")
                logger.debug(f"Value to set: {converted_value}, Type: {type(converted_value)}")
                logger.debug(f"Target DataType enum: {DataType(data_type).name} ({DataType(data_type).value})")

                e_args = ValueEventArgs(client.settings, target_obj, attr, 0, None)
                e_args.value = converted_value
                
                # === THE ACTUAL CALL ===
                target_obj.setValue(client.settings, e_args)
                # =======================
                logger.info(f"Local object value potentially updated via setValue for {obis} attr {attr}.")
                # Add a check AFTER setValue if possible? Some objects might have a getter...
                # test_get_value = target_obj.getValue(client.settings, ValueEventArgs(client.settings, target_obj, attr, 0, None))
                # logger.debug(f"Value AFTER setValue (using getValue): {test_get_value}")

            except Exception as e_setval:
                 logger.error(f"CRITICAL: Failed during target_obj.setValue for {obis}: {e_setval}", exc_info=True)
                 raise RuntimeError(f"Failed setting local value before write: {e_setval}") from e_setval

    
            logger.info(f"Sending WRITE request using reader.write(target_obj, attr)")
            reader.write(target_obj, attr) # <<< Using the object and index
            logger.info(f"Write request sent successfully for {obis} attr {attr}.") # Note: Success here just means sent, check meter logs/state

            result = {"status": "success", "action": "write", "obis_code": obis,
                      "attribute_index": attr, "written_value": value_to_write_str,
                      "message": "Write successful (command sent)."}

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

    # --- Cleanup ---
    finally:
        _cleanup_dlms(reader, media)
        end_time = time.monotonic()
        duration = end_time - start_time
        logger.info(f"DLMS action '{action_details.get('action')}' finished in {duration:.2f} seconds. Result status: '{result.get('status')}'")

    return result

