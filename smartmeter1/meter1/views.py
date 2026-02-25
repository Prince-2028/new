from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from .models import member, RegistrationVerification,Media
import uuid
from .models import * 


from .meter_utils import (
    get_dlms_config_from_device,
    read_live_obis_value,
    get_db_record_for_obis,
    update_or_clear_db_value,
)
from .dlms_helper import execute_dlms_action
import logging

# Define logger if not already done
logger = logging.getLogger(__name__)



# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

from .models import PCAuthentication


# views.py - Class-Based Views Implementation

from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

from .models import PCAuthentication

SECRET_KEY = "super-secret-manufacturer-key-2025"

class GenerateUserCodeView(APIView):
    """
    STEP 1: Generate unique user code
    
    POST /api/step1-generate-code/
    Body: {} (empty or any data)
    
    Response: {
        "success": true,
        "user_code": "fd342ad9-1c58-47cc-b928-e2061b292cfd"
    }
    """
    
    def post(self, request, *args, **kwargs):
        try:
            # Generate unique user code
            user_code = PCAuthentication.generate_user_code()
            
            # Save to database
            pc_auth = PCAuthentication.objects.create(
                user_code=user_code,
                is_authenticated=False
            )
            
            return JsonResponse({
                'success': True,
                'user_code': user_code,
                'message': 'User code generated. Send this to manufacturer for serial number.'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class GenerateSerialView(APIView):
    """
    STEP 2: Manufacturer generates serial number from user code
    
    POST /api/step2-generate-serial/
    Body: {
        "user_code": "fd342ad9-1c58-47cc-b928-e2061b292cfd"
    }
    
    Response: {
        "success": true,
        "user_code": "fd342ad9-1c58-47cc-b928-e2061b292cfd",
        "serial_number": "eyJpc3N1ZWRfYXQiOi..."
    }
    """
    
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            user_code = data.get('user_code')
            print("user_code",user_code)
            
            if not user_code:
                return JsonResponse({
                    'success': False,
                    'error': 'User code is required'
                }, status=400)
            
            # Get secret key
            secret_key = SECRET_KEY
            if not secret_key:
                return JsonResponse({
                    'success': False,
                    'error': 'System not configured. Add secret key in database.'
                }, status=500)
            
            # Generate serial number
            serial_number = PCAuthentication.generate_serial_number(
                user_code,
                secret_key
            )
            
            return JsonResponse({
                'success': True,
                'user_code': user_code,
                'serial_number': serial_number,
                'message': 'Serial number generated successfully'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)





def create_user_record(user_code: str, serial_number: str="00000", user_type: int = 1) -> dict:
    """
    Create a member and its RegistrationVerification.

    Args:
        user_code (str): desired username
        serial_number (str): serial (currently stored as password)
        user_type (int): numeric user type (default 1)

    Returns:
        dict: {
            "success": bool,
            "message": str (on success),
            "user_id": int (on success),
            "registration_id": int (on success),
            "error": str (on failure)
        }
    """
    # Basic validation
    print(user_code,serial_number)
    if not user_code or not serial_number:
        return {"success": False, "error": "user_code and serial_number are required"}

    try:
        # Prevent duplicate usernames
        if member.objects.filter(username=user_code).exists():
            return {"success": False, "error": f"User with username '{user_code}' already exists"}

        with transaction.atomic():
            # NOTE: currently storing serial_number as plain password (same as your original).
            # If these are real user logins, replace serial_number with a hashed password:
            # from django.contrib.auth.hashers import make_password
            # pw = make_password(serial_number)
            # user = member.objects.create(username=user_code, password=pw, user_type=user_type)
            user = member.objects.create(username=user_code, password=serial_number, user_type=user_type)
            print(user,"user")
            reg = RegistrationVerification.objects.create(
                user_code=user_code,
                serial_number=serial_number,
                is_verified=True,
                user=user
            )

        return {
            "success": True,
            "username":user.username,
            "password":user.password,
            "message": "Registration successful",
            "user_id": user.id,
            "registration_id": reg.id
        }

    except IntegrityError as e:
        return {"success": False, "error": "Database integrity error", "details": str(e)}
    except Exception as e:
        return {"success": False, "error": "Unexpected error", "details": str(e)}




@method_decorator(csrf_exempt, name='dispatch')
class VerifySerialView(APIView):
    """
    STEP 3: Verify and activate with serial number
    
    POST /api/step3-verify-serial/
    Body: {
        "user_code": "fd342ad9-1c58-47cc-b928-e2061b292cfd",
        "serial_number": "eyJpc3N1ZWRfYXQiOi..."
    }
    
    Response: {
        "success": true,
        "is_authenticated": true,
        "message": "PC activated successfully"
    }
    """
    
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            user_code = data.get('user_code')
            serial_number = data.get('serial_number')
            
            if not user_code or not serial_number:
                return JsonResponse({
                    'success': False,
                    'error': 'User code and serial number required'
                }, status=400)
            
            # Get PC authentication record
            try:
                pc_auth = PCAuthentication.objects.get(user_code=user_code)
            except PCAuthentication.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'User code not found. Generate user code first.'
                }, status=404)
            
            # Get secret key
            secret_key =SECRET_KEY
            if not secret_key:
                return JsonResponse({
                    'success': False,
                    'error': 'System not configured'
                }, status=500)
            
            # Verify and activate
            success, message = pc_auth.activate(serial_number, secret_key)
            
            if success:

                    # avoid numeric literal 00000 — use the real serial_number or string "00000" if intended
                provision_username = "administration"


                provision_result = create_user_record(provision_username)

                print(provision_result,"provision_result")

                response = {
                    'success': True,
                    'is_authenticated': True,
                    'user_code': user_code,
                    
                    'message': message,
                    'provisioned': provision_result.get('success', False),
                    'provision_username': provision_result.get('username'),
                    'provison_passward':provision_result.get('password'),
                    'provision_user_id': provision_result.get('user_id'),
                    'created': provision_result.get('created', False)
                }

                if not provision_result.get('success'):
                    response['provision_error'] = provision_result.get('error')
                    response['provision_details'] = provision_result.get('details')

                # If a new user was created, provision_result['temp_password'] contains the plaintext temp password.
                # Send it via email/SMS here (do NOT expose in JSON unless you have secure channel).
                # Example (pseudo): if provision_result.get('created'): send_email(to=admin_email, body=temp_password)

                return JsonResponse(response, status=200)
                

                




            else:
                return JsonResponse({
                    'success': False,
                    'is_authenticated': False,
                    'error': message
                }, status=400)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


class CheckStatusView(APIView):
    """
    Check authentication status
    
    GET /api/check-status/?user_code=fd342ad9-1c58-47cc-b928-e2061b292cfd
    """
    
    def get(self, request, *args, **kwargs):
        try:
            user_code = request.GET.get('user_code')
            
            if not user_code:
                return JsonResponse({
                    'success': False,
                    'error': 'User code required'
                }, status=400)
            
            try:
                pc_auth = PCAuthentication.objects.get(user_code=user_code)
                
                return JsonResponse({
                    'success': True,
                    'user_code': pc_auth.user_code,
                    'is_authenticated': pc_auth.is_authenticated,
                    'has_serial': bool(pc_auth.serial_number),
                    'activated_at': pc_auth.activated_at.isoformat() if pc_auth.activated_at else None
                })
                
            except PCAuthentication.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'User code not found'
                }, status=404)
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)












import os
import platform
import uuid
from getmac import get_mac_address
import subprocess

def get_mac_linux():
    """Retrieve MAC address in Linux using ifconfig/ip."""
    try:
        result = subprocess.run(["ip", "link"], capture_output=True, text=True)
        for line in result.stdout.split("\n"):
            if "link/ether" in line:
                return line.split()[1].replace(":", "").lower()
    except:
        return None
    return None

def get_mac_windows():
    """Retrieve MAC address in Windows using getmac."""
    try:
        result = subprocess.run(["getmac"], capture_output=True, text=True)
        mac = result.stdout.split("\n")[0].split()[0]
        return mac.replace("-", "").lower()
    except:
        return None

def get_mac_macos():
    """Retrieve MAC address in macOS using ifconfig."""
    try:
        result = subprocess.run(["ifconfig", "en0"], capture_output=True, text=True)
        for line in result.stdout.split("\n"):
            if "ether" in line:
                return line.split()[1].replace(":", "").lower()
    except:
        return None
    return None

def get_real_mac():
    """Retrieve the MAC address based on OS."""
    os_type = platform.system()

    # Try getmac (cross-platform first)
    mac = get_mac_address()

    # OS-Specific Handling
    if not mac:
        if os_type == "Linux":
            mac = get_mac_linux()
        elif os_type == "Windows":
            mac = get_mac_windows()
        elif os_type == "Darwin":  # macOS
            mac = get_mac_macos()
        else:
            mac = None  # Unsupported OS

    # Final fallback (uuid method, less reliable)
    if not mac:
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                        for elements in range(0, 2*6, 8)][::-1])

    return mac.replace(":", "").lower() if mac else "MAC Not Found"

# Detect OS and print MAC address
os_type = platform.system()
#print(f"Operating System: {os_type}")
#print(f"MAC Address: {get_real_mac()}")


import uuid

def generate_license_key():
    return str(uuid.uuid4()).replace('-', '').upper()[:20]

print(generate_license_key())





# your_app/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import member

class RoleListAPIView(APIView):
    """
    GET /api/roles/
    Returns the USER_TYPE_CHOICES from the member model as a JSON list:
      [
        { "id": 1, "name": "Administrator" },
        { "id": 2, "name": "Programmer" },
        { "id": 3, "name": "Reader" },
        { "id": 4, "name": "Upgrader" },
        ...
      ]
    """
    def get(self, request, format=None):
        print("hello mama")
        roles = [
            {"id": choice_id, "name": choice_name}
            for choice_id, choice_name in member.USER_TYPE_CHOICES
        ]
        return Response(roles)

@method_decorator(csrf_exempt, name='dispatch')
class CreateUser(APIView):
    """
    API endpoint to handle user creation.
    """

    def post(self, request, format=None):
        user_code = request.data.get('user_code')
        serial_number = request.data.get('serial_number')
        print("hello >>>>>>" , user_code, serial_number)
        user_type = request.data.get('user_type', 1)  # Default user_type to Consumer if not provided

        if not user_code or not serial_number:
            return Response({"error": "user_code and serial_number are required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if the user already exists
            if member.objects.filter(username=user_code).exists():
                return Response({"error": f"User with username '{user_code}' already exists"}, status=status.HTTP_400_BAD_REQUEST)

            # Create User instance
            user = member(username=user_code, password=serial_number, user_type=user_type)
            user.save()
            user_id = user.id 
            user.save()
            print("password", user.password, user.username)

            # Mark RegistrationVerification as verified
            registration_verification = RegistrationVerification.objects.create(
                user_code=user_code,
                serial_number=serial_number,
                is_verified=True,
                user=user
            )
            
            return Response({"message": "Registration successful", "id": user.id}, status=status.HTTP_201_CREATED)
        
        except IntegrityError as e:
            return Response({"error": "Database error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@method_decorator(csrf_exempt, name='dispatch')
class LoginUser(APIView):
    """
    API endpoint to handle user login.
    
    """

  




    def post(self, request, format=None):
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(username, password)
        if not username or not password:
            return Response({"error": "Both username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Retrieve user based on username
            user = member.objects.get(username=username, password=password)
            print("user>>>>>>>>>>>>>>", user)

            return Response({"message": "Login successful", "created_at": user.created_at, "user_id": user.id,"user_type": self.get_user_type_label(user.user_type) }, status=status.HTTP_200_OK)
        

        except member.DoesNotExist:
            return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)
    

    def get_user_type_label(self, user_type):
        if user_type == 1:
            return "Administrator"
        elif user_type == 2:
            return "Programmer"
        elif user_type == 3:
            return 'Reader'
        elif user_type == 4:
            return "Upgrader"
        else:
            return "Unknown"
    

@method_decorator(csrf_exempt, name='dispatch')
class AddUser(APIView):
    """
    API endpoint to handle user creation.
    """

    def post(self, request, format=None):
        username = request.data.get('username')
        password = request.data.get('password')
        user_type = request.data.get('role') 
        print("user",user_type)
        created_by_id = request.data.get('id')

        print("Received data:", username, password, user_type, created_by_id)

        if not all([username, password, user_type, created_by_id]):
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        if user_type not in ['1', '2', '3','4']:
            return Response({"error": "Invalid user role"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if the user already exists
            if member.objects.filter(username=username).exists():
                return Response({"error": f"User with username '{username}' already exists"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the user who is creating the new user exists
            if not member.objects.filter(id=created_by_id).exists():
                return Response({"error": "Creating user with the provided ID does not exist"}, status=status.HTTP_400_BAD_REQUEST)
            
            created_by = member.objects.get(id=created_by_id)
            
            # Create User instance
            user = member(username=username, password=password, user_type=user_type, created_by=created_by)
            user.save()
           
            return Response({"message": "Registration successful", "id": user.id, "created_at": user.created_at}, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            print(f"Error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class GetUsers(APIView):
    def get(self, request, format=None):
        try:
            user_id = request.query_params.get('id')
            if not user_id:
                return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Fetch the main user
            user = member.objects.get(id=user_id)

            # Fetch users created by the main user
            users = member.objects.filter(created_by=user)
            print(self.get_user_type_label(user.user_type))
            user_data = []
            for u in users:
                
                user_info = {
                    "id": u.id,
                    "username": u.username,
                    "password": u.password,
                    "user_type": self.get_user_type_label(u.user_type),
                    "created_at": u.created_at
                }
                
                user_data.append(user_info)

            response_data = {
                "created_by": {
                    "id": user.id,
                    "username": user.username,
                    "password": user.password,
                    "user_type":  self.get_user_type_label(user.user_type),  # 
                },
                
                "users": user_data
            }

            print(response_data)
            return Response(response_data, status=status.HTTP_200_OK)
        except member.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, format=None):
        try:
            user_id = request.data.get('id')
            new_username = request.data.get('username')
            new_user_type = request.data.get('role')
            new_password = request.data.get('password') 

            print(user_id,new_username,new_user_type,new_password) 

            if not user_id:
                return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            user = member.objects.get(id=user_id)
            
            # Update username if provided
            if new_username:
                user.username = new_username
            
            # Update user type if provided
            if new_user_type:
                user.user_type = new_user_type

            # Update password if provided
            if new_password:
                user.password = new_password
            
            user.save()

            updated_user_info = self.get_user_info(user)
            return Response(updated_user_info, status=status.HTTP_200_OK)
        
        except member.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_user_info(self, user):
        return {
            "id": user.id,
            "username": user.username,
            "password": user.password,
            "user_type": self.get_user_type_label(user.user_type),
            "created_at": user.created_at,
        }
        
    def get_user_type_label(self, user_type):
        if user_type == 1:
            return "Administrator"
        elif user_type == 2:
            return "Programmer"
        elif user_type == 3:
            return 'Reader'
        elif user_type == 4:
            return "Upgrader"
        else:
            return "Unknown"

@method_decorator(csrf_exempt, name='dispatch')
class DeleteUser(APIView):
    """
    API endpoint to handle user deletion.
    """
    def delete(self, request, format=None):
        user_id = request.data.get('id')

        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = member.objects.get(id=user_id)
            user.delete()
            return Response({"message": f"User with ID {user_id} deleted successfully"}, status=status.HTTP_200_OK)
        
        except member.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class CreateData1(APIView):
    """
    API endpoint to handle data creation.
    """

    def post(self, request, format=None):
        media = request.data.get('media')
        protocol = request.data.get('protocol')
        overTimes = request.data.get('overTimes')
        retries = request.data.get('retries')
        portName = request.data.get('portName')
        baudRate = request.data.get('baudRate')
        remoteIP = request.data.get('remoteIP')
        remotePort = request.data.get('remotePort')
        wakeUpMode = request.data.get('wakeUpMode')
        userId = request.data.get('userId')

       

        deviceId = request.data.get('deviceId') # New field to identify the device
        deviceId=14

        print(f"Received media data: {media}, {protocol}, {portName}")
        print(f"Received device serial number: {deviceId}")



        if not deviceId:
            return Response(
                {"error": "deviceSerialNumber is required to link the media configuration to a device."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find the existing device
            device = Device.objects.get(id=deviceId)
        except Device.DoesNotExist:
            return Response({"error": f"Device with serial number '{deviceId}' not found."}),

        

        # Validate required fields
        if not media or not protocol or overTimes is None or retries is None or not userId:
            return Response({"error": "media, protocol, overTimes, retries, and userId are required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = member.objects.get(id=userId)
        except user.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Create Media instance based on media type
            if media == 'Optical' or media == 'RS232/RS485':
                if not portName or baudRate is None:
                    return Response({"error": "portName and baudRate are required for Optical and RS232 media types"}, status=status.HTTP_400_BAD_REQUEST)
                 
                data = Media.objects.create(
                    user=user,
                    media=media,
                    protocol=protocol,
                    overTimes=overTimes,
                    retries=retries,
                    portName=portName,
                    baudRate=baudRate
                )
            elif media == 'TCP/IP Client':
                if not remoteIP or remotePort is None:
                    return Response({"error": "remoteIP and remotePort are required for TCP/IP Client media type"}, status=status.HTTP_400_BAD_REQUEST)
                data = Media.objects.create(
                    user=user,
                    media=media,
                    protocol=protocol,
                    overTimes=overTimes,
                    retries=retries,
                    remoteIP=remoteIP,
                    remotePort=remotePort
                )
            elif media == 'TCP/IP Server':
                if wakeUpMode is None:
                    return Response({"error": "wakeUpMode is required for TCP/IP Server media type"}, status=status.HTTP_400_BAD_REQUEST)
                data = Media.objects.create(
                    user=user,
                    media=media,
                    protocol=protocol,
                    overTimes=overTimes,
                    retries=retries,
                    wakeUpMode=wakeUpMode
                )
            else:
                return Response({"error": "Unsupported media type"}, status=status.HTTP_400_BAD_REQUEST)
            
            print("data",data)
            
            device.media_connections.add(data)

                   # now fetch them back
            all_media = device.media_connections.all()  

            # print out whichever fields you care about
            for m in all_media:
                print(
                    f"Media:{m.media}, "
                    f"Protocol:{m.protocol}, "
                    f"Port:{m.portName}, "
                    f"Baud:{m.baudRate}, "
                    f"Remote:{m.remoteIP}:{m.remotePort}, "
                    f"WakeUpMode:{m.wakeUpMode}"
                )

            
           

            

            return Response({"message": "Data creation successful", "id": data.id}, status=status.HTTP_201_CREATED)

        except IntegrityError:
            return Response({"error": "Database error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# meter1/views.py

from django.db import transaction, IntegrityError
from django.db.models import Q, UniqueConstraint
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.http import StreamingHttpResponse, JsonResponse,HttpResponseNotAllowed
from django.utils import timezone
import json
import time


@method_decorator(csrf_exempt, name='dispatch')
class StreamObisView(APIView):
    """
    Django view to stream OBIS values one by one using Server-Sent Events (SSE).
    Returns realistic dummy data for each attribute_index like your provided example.
    """

    def dispatch(self, request, *args, **kwargs):
        # Only allow POST
        if request.method.upper() != 'POST':
            return HttpResponseNotAllowed(['POST'])
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        # Parse JSON body robustly
        try:
            raw_body = request.body.decode('utf-8-sig')
            normalized = raw_body.replace('\u00A0', ' ').strip()
            payload = json.loads(normalized)
        except Exception:
            debug_body = normalized if 'normalized' in locals() else raw_body
            return JsonResponse({
                "type": "error",
                "message": "Invalid JSON payload",
                "debug_received": debug_body,
                "timestamp": timezone.now().isoformat()
            }, status=400)

        serial_number = payload.get('serial_number')
        parameters = payload.get('parameters')
        if not serial_number or not isinstance(parameters, list):
            return JsonResponse({
                "type": "error",
                "message": "Both 'serial_number' and 'parameters' list are required",
                "timestamp": timezone.now().isoformat()
            }, status=400)

        def generate_dummy_value(attr_index):
            """Return dummy data for each attribute index like your sample output."""
            now = timezone.now()
            if attr_index == "2":  # Current Clock Time
                return {
                    "Date": now.strftime("%A, %d/%m/%Y"),
                    "Time": now.strftime("%H:%M:%S (Deviation: +05:30)"),
                    "Clock Status": "0"
                }
            elif attr_index == "3":  # Time Zone Deviation
                return random.randint(300, 400)  # Example 330
            elif attr_index == "4":  # Clock Status
                return 0
            elif attr_index in ["5", "6"]:  # Last Sync or Set Date
                return {
                    "Date": "Saturday, 01/01/2000",
                    "Time": "00:00:00 (Deviation: N/A)",
                    "Clock Status": "255"
                }
            elif attr_index == "7":  # Clock Accuracy
                return 60
            elif attr_index == "8":  # Daylight Savings Enabled
                return False
            elif attr_index == "9":  # DST Active
                return 1
            else:
                return round(random.uniform(0, 100), 2)

        def generate_obis_stream():
            total = len(parameters)
            for idx, obis in enumerate(parameters, start=1):
                obis_code = obis.get('obis_code')
                attribute_index = obis.get('attribute_index')

                # Simulate read delay
                time.sleep(1)

                # Get realistic dummy value
                dummy_value = generate_dummy_value(attribute_index)

                # Build SSE data object
                data = {
                    "message": "Read Successfully",
                    "status": "success",
                    "action": "read",
                    "obis_code": obis_code,
                    "attribute_index": attribute_index,
                    "value": dummy_value,
                    "db_record_found": False,
                    "progress": {
                        "current": idx,
                        "total": total,
                        "percentage": round((idx / total) * 100, 2),
                        "successful": idx,
                        "failed": 0
                    },
                    "timestamp": timezone.now().isoformat()
                }
                yield f"data: {json.dumps(data)}\n\n"

        return StreamingHttpResponse(
            generate_obis_stream(),
            content_type='text/event-stream'
        )





@method_decorator(csrf_exempt, name='dispatch')
class CreateData(APIView):
    """
    POST /api/media_data/
    Creates a new Media record for a device, deactivating any prior active one.
    Returns the new active media as JSON.
    """
    def post(self, request, format=None):
        # 1. Extract payload
        media      = request.data.get('media')
        protocol   = request.data.get('protocol')
        overTimes  = request.data.get('overTimes')
        retries    = request.data.get('retries')
        portName   = request.data.get('portName')
        baudRate   = request.data.get('baudRate')
        remoteIP   = request.data.get('remoteIP')
        remotePort = request.data.get('remotePort')
        wakeUpMode = request.data.get('wakeUpMode')
        userId     = request.data.get('userId')
        deviceId   = request.data.get('deviceId')

        

        # 2. Validate presence
        if not all([media, protocol, deviceId, userId]) or overTimes is None or retries is None:
            return Response(
                {"error": "media, protocol, overTimes, retries, userId and deviceId are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Fetch Device and User
        try:
            device = Device.objects.get(pk=deviceId)
        except Device.DoesNotExist:
            return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            user = member.objects.get(pk=userId)
        except member.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # 4. Create under transaction, ensuring one active per device
        try:
            with transaction.atomic():
                # deactivate any old active
                Media.objects.filter(device=device, is_active=True).update(is_active=False)

                # build kwargs
                media_kwargs = {
                    "device":     device,
                    "user":       user,
                    "media":      media,
                    "protocol":   protocol,
                    "overTimes":  overTimes,
                    "retries":    retries,
                    "is_active":  True,
                }

                # conditional fields
                if media in ('Optical', 'RS232/RS485'):
                    if not portName or baudRate is None:
                        return Response(
                            {"error": "portName and baudRate are required for serial media."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    media_kwargs.update(portName=portName, baudRate=baudRate)

                if media == 'TCP/IP Client':
                    if not remoteIP or remotePort is None:
                        return Response(
                            {"error": "remoteIP and remotePort are required for TCP/IP Client."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    media_kwargs.update(remoteIP=remoteIP, remotePort=remotePort)

                if media == 'TCP/IP Server':
                    if wakeUpMode is None:
                        return Response(
                            {"error": "wakeUpMode is required for TCP/IP Server."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    media_kwargs.update(wakeUpMode=wakeUpMode)

                # create the new active media
                new_media = Media.objects.create(**media_kwargs)

        except IntegrityError:
            return Response(
                {"error": "Could not activate new media (constraint violation)."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 5. Return it as JSON
        return Response({
            "id":         new_media.id,
            "deviceId":   device.id,
            "media":      new_media.media,
            "protocol":   new_media.protocol,
            "overTimes":  new_media.overTimes,
            "retries":    new_media.retries,
            "portName":   new_media.portName,
            "baudRate":   new_media.baudRate,
            "remoteIP":   new_media.remoteIP,
            "remotePort": new_media.remotePort,
            "wakeUpMode": new_media.wakeUpMode,
            "is_active":  new_media.is_active,
        }, status=status.HTTP_201_CREATED)


# views.py
import serial.tools.list_ports


class SerialPortListView(APIView):
    def get(self, request):
        try:
            ports = serial.tools.list_ports.comports()
            port_list = []
            for port in ports:
                port_list.append({
                    'device': port.device,
                    'description': port.description,
                    'manufacturer': port.manufacturer,
                })
            return Response(port_list, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)












@method_decorator(csrf_exempt, name='dispatch')
class GetActiveMedia(APIView):
    """
    API endpoint to retrieve the single active Media configuration
    for a specific device, looked up by serial number.
    URL patterns:
      - /api/device/media_data/active/?serialNumber=<serial>
      - /api/device/media_data/active/serialNumber=<serial>/
    """
    def get(self, request, serial=None, format=None):
        # support both path‑param and query‑param
        serial_number = serial

        
        print("serial_number", serial_number)

        if not serial_number:
            return Response(
                {"error": "serialNumber is required either in the URL or as a query parameter."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            device = Device.objects.get(serial_number='sai1')
        except Device.DoesNotExist:
            return Response(
                {"error": f"Device with serial_number '{serial_number}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        active = Media.objects.filter(device=device, is_active=True).first()
        if not active:
            return Response(
                {"error": "No active media configuration for this device."},
                status=status.HTTP_404_NOT_FOUND
            )

        data = {
            "id":           active.id,
            "media":        active.media,
            "protocol":     active.protocol,
            "overTimes":    active.overTimes,
            "retries":      active.retries,
            "serial_number": device.serial_number,
            "user":         active.user.id,
            "is_active":    active.is_active,
        }
        # include only non-null optional fields
        for field in ['portName', 'baudRate', 'remoteIP', 'remotePort', 'wakeUpMode']:
            val = getattr(active, field)
            if val not in (None, ''):
                data[field] = val

        return Response({"active_media": data}, status=status.HTTP_200_OK)



class MeterTypeChoicesAPIView(APIView):
    def get(self, request):
        # Device.METER_TYPE_CHOICES is list of (value, label)
        data = [
            {"value": val, "label": lbl}
            for val, lbl in Device.METER_TYPE_CHOICES
        ]

        print("data",data)

        return Response(data)


from .models import User, Device, Addressing, Security

class AddDeviceAPIView(APIView):
    def post(self, request, format=None):
        try:
            # Extract data from request
            device_data = request.data.get('device')
            addressing_data = request.data.get('addressing')
            security_data = request.data.get('security')
            user_id = request.data.get('user_id')

            print(user_id)

            if not device_data or not addressing_data or not security_data or not user_id:
                return Response({"error": "Device, Addressing, Security data, and User ID are required."}, status=status.HTTP_400_BAD_REQUEST)

            # Get User
            try:
                user = member.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            # Create Addressing
            addressing = Addressing(
                server_sap_hex_46=addressing_data.get('server_sap_hex_46'),
                server_sap_hex=addressing_data.get('server_sap_hex'),
                client_sap_hex=addressing_data.get('client_sap_hex')
            )
            addressing.save()

            # Create Security
            security_level = security_data.get('security_level')
            security_kwargs = {
                'security_level': security_level,
                'user_info_security_policy': security_data.get('user_info_security_policy'),
                'security_policy': security_data.get('security_policy'),
                'guek_hex': security_data.get('guek_hex'),
                'gak_hex': security_data.get('gak_hex'),
                'password': security_data.get('password'),
                'get_frame_count': security_data.get('get_frame_count', False),
            }

            # Adjust fields based on security level
            if security_level == 'LLS':
                security_kwargs = {
                    'security_level': security_level,
                    'password': security_data.get('password'),
                }
            elif security_level == 'NOSEC':
                security_kwargs = {
                    'security_level': security_level,
                }

            security = Security(**security_kwargs)
            security.save()

            # Create Device
            device = Device(
                serial_number=device_data.get('serial_number'),
                meter_type=device_data.get('meter_type'),
                manufacturer_code=device_data.get('manufacturer_code'),
                addressing=addressing,
                security=security,
                user=user
            )
            device.save()

            response_data = {
                "message": "Data saved successfully",
                "device": {
                    "serial_number": device.serial_number,
                    "meter_type": device.meter_type,
                    "manufacturer_code": device.manufacturer_code,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                    }
                },
                "addressing": {
                    "server_sap_hex_46": addressing.server_sap_hex_46,
                    "server_sap_hex": addressing.server_sap_hex,
                    "client_sap_hex": addressing.client_sap_hex,
                },
                "security": {
                    "security_level": security.security_level,
                    "user_info_security_policy": security.user_info_security_policy,
                    "security_policy": security.security_policy,
                    "guek_hex": security.guek_hex,
                    "gak_hex": security.gak_hex,
                    "password": security.password,
                    "get_frame_count": security.get_frame_count,
                }
            }

            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        



class CopyDeviceAPIView(APIView):
    def post(self, request, format=None):
        try:
            # Extract data from request
            device_id = request.data.get('device_id')
            user_id = request.data.get('user_id')
            print(device_id,user_id)

            if not device_id or not user_id:
                return Response({"error": "Device ID and User ID are required."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the original device
            try:
                original_device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)

            # Get the user
            try:
                user = member.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            # Create a new Addressing instance
            addressing = Addressing(
                server_sap_hex_46=original_device.addressing.server_sap_hex_46,
                server_sap_hex=original_device.addressing.server_sap_hex,
                client_sap_hex=original_device.addressing.client_sap_hex
            )
            addressing.save()

            # Create a new Security instance
            security_kwargs = {
                'security_level': original_device.security.security_level,
                'user_info_security_policy': original_device.security.user_info_security_policy,
                'security_policy': original_device.security.security_policy,
                'guek_hex': original_device.security.guek_hex,
                'gak_hex': original_device.security.gak_hex,
                'password': original_device.security.password,
                'get_frame_count': original_device.security.get_frame_count,
            }

            # Adjust fields based on security level
            if original_device.security.security_level == 'LLS':
                security_kwargs = {
                    'security_level': original_device.security.security_level,
                    'password': original_device.security.password,
                }
            elif original_device.security.security_level == 'NOSEC':
                security_kwargs = {
                    'security_level': original_device.security.security_level,
                }

            security = Security(**security_kwargs)
            security.save()

            # Create a new Device instance
            copied_device = Device(
                serial_number='',  # Set serial_number to an empty string or None
                meter_type=original_device.meter_type,
                manufacturer_code=original_device.manufacturer_code,
                addressing=addressing,
                security=security,
                user=user
            )
            copied_device.save()

            response_data = {
                "message": "Device copied successfully",
                "device": {
                    "id": copied_device.id,
                    "serial_number": copied_device.serial_number,
                    "meter_type": copied_device.meter_type,
                    "manufacturer_code": copied_device.manufacturer_code,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                    }
                },
                "addressing": {
                    "server_sap_hex_46": addressing.server_sap_hex_46,
                    "server_sap_hex": addressing.server_sap_hex,
                    "client_sap_hex": addressing.client_sap_hex,
                },
                "security": {
                    "security_level": security.security_level,
                    "user_info_security_policy": security.user_info_security_policy,
                    "security_policy": security.security_policy,
                    "guek_hex": security.guek_hex,
                    "gak_hex": security.gak_hex,
                    "password": security.password,
                    "get_frame_count": security.get_frame_count,
                }
            }

            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class EditDeviceAPIView(APIView):
    def put(self, request, format=None):
        try:
            # Extract data from request
            device_data = request.data.get('device')
            addressing_data = request.data.get('addressing')
            security_data = request.data.get('security')
            device_id = request.data.get('device_id')

            

            if not device_data or not addressing_data or not security_data or not device_id:
                return Response({"error": "Device, Addressing, Security data, and Device ID are required."}, status=status.HTTP_400_BAD_REQUEST)

            # Get Device
            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)

            # Update Addressing
            addressing, created = Addressing.objects.get_or_create(id=device.addressing.id)
            addressing.server_sap_hex_46 = addressing_data.get('server_sap_hex_46', addressing.server_sap_hex_46)
            addressing.server_sap_hex = addressing_data.get('server_sap_hex', addressing.server_sap_hex)
            addressing.client_sap_hex = addressing_data.get('client_sap_hex', addressing.client_sap_hex)
            addressing.save()

            # Update Security
            security, created = Security.objects.get_or_create(id=device.security.id)
            security_level = security_data.get('security_level', security.security_level)
            security_kwargs = {
                'security_level': security_level,
                'user_info_security_policy': security_data.get('user_info_security_policy', security.user_info_security_policy),
                'security_policy': security_data.get('security_policy', security.security_policy),
                'guek_hex': security_data.get('guek_hex', security.guek_hex),
                'gak_hex': security_data.get('gak_hex', security.gak_hex),
                'password': security_data.get('password', security.password),
                'get_frame_count': security_data.get('get_frame_count', security.get_frame_count),
            }

            # Adjust fields based on security level
            if security_level == 'LLS':
                security_kwargs = {
                    'security_level': security_level,
                    'password': security_data.get('password', security.password),
                }
            elif security_level == 'NOSEC':
                security_kwargs = {
                    'security_level': security_level,
                }

            for key, value in security_kwargs.items():
                setattr(security, key, value)

            security.save()

            # Update Device
            device.serial_number = device_data.get('serial_number', device.serial_number)
            device.meter_type = device_data.get('meter_type', device.meter_type)
            device.manufacturer_code = device_data.get('manufacturer_code', device.manufacturer_code)
            device.addressing = addressing
            device.security = security
            device.save()

            response_data = {
                "message": "Data updated successfully",
                "device": {
                    "serial_number": device.serial_number,
                    "meter_type": device.meter_type,
                    "manufacturer_code": device.manufacturer_code,
                    "user": {
                        "id": device.user.id,
                        "username": device.user.username,
                    }
                },
                "addressing": {
                    "server_sap_hex_46": addressing.server_sap_hex_46,
                    "server_sap_hex": addressing.server_sap_hex,
                    "client_sap_hex": addressing.client_sap_hex,
                },
                "security": {
                    "security_level": security.security_level,
                    "user_info_security_policy": security.user_info_security_policy,
                    "security_policy": security.security_policy,
                    "guek_hex": security.guek_hex,
                    "gak_hex": security.gak_hex,
                    "password": security.password,
                    "get_frame_count": security.get_frame_count,
                }
            }

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GetUserDevicesAPIView(APIView):
    def get(self, request, format=None):
        try:
            # Get the logged-in user
            user_id = request.query_params.get('user_id')


            member_instance = member.objects.filter(id=user_id).first()

            if not member_instance:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            devices = Device.objects.filter(user=user_id).select_related('addressing', 'security')

            if not devices.exists() and member_instance.user_type in [2, 3, 4]:
                devices = Device.objects.filter(user=member_instance.created_by.id).select_related('addressing', 'security')




            

            
            

            
          

            # Prepare response data
            devices_data = []
            for device in devices:
                device_info = {
                    "id": device.id,  # Include device ID in the response
                    "serial_number": device.serial_number,
                    "meter_type": device.meter_type,
                    "manufacturer_code": device.manufacturer_code,
                    "addressing": {
                        "server_sap_hex_46": device.addressing.server_sap_hex_46,
                        "server_sap_hex": device.addressing.server_sap_hex,
                        "client_sap_hex": device.addressing.client_sap_hex
                    },
                    "security": {
                        "security_level": device.security.security_level,
                        "user_info_security_policy": device.security.user_info_security_policy,
                        "security_policy": device.security.security_policy,
                        "guek_hex": device.security.guek_hex,
                        "gak_hex": device.security.gak_hex,
                        "password": device.security.password,
                        "get_frame_count": device.security.get_frame_count
                    }
                }
                devices_data.append(device_info)

            return Response({"devices": devices_data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class DeleteDeviceAPIView(APIView):
    

    def delete(self, request,format=None):
        try:
            # Get the logged-in user
            device_id=request.data.get('device_id')

            print("device_id>>>>>>" , device_id)
            # Try to get the device with the given id belonging to the logged-in user
            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({"error": "Device not found or you do not have permission to delete this device."}, status=status.HTTP_404_NOT_FOUND)

            # Delete the device
            device.delete()

            return Response({"message": "Device deleted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import Threshold, User

@method_decorator(csrf_exempt, name='dispatch')
class CreateMeterAPIView(APIView):
    """
    API endpoint to handle Meter and its related data creation or updating.
    """

    def post(self, request, format=None):
        serial_number = request.data.get('serial_number')
        user_id = request.data.get('user_id')
        identifiers_data = request.data.get('identifiers', [])
        versions_data = request.data.get('versions', [])
        logical_parameters_data = request.data.get('logical_parameters', [])

        # Validate required fields
        if not serial_number or not user_id:
            return Response({"error": "Serial number and User ID are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = member.objects.get(id=user_id)
        except member.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Check if the Meter already exists
            meter, created = Meter.objects.get_or_create(
                serial_number=serial_number,
                defaults={'user': user}
            )

            

            if not created:
                # If the Meter exists, update related data
                meter.user = user  # Update user if needed
                meter.save()


                # Update or create MeterIdentifiers
                for identifier in identifiers_data:
                    
                    print(identifier)
                    MeterIdentifier.objects.update_or_create(
                        meter=meter,
                        name=identifier.get('name'),
                        defaults={
                            'name': identifier.get('name'),
                            'value': identifier.get('value'),
                            'code':identifier.get('code'),
                        }
                    )

            
                # Update or create MeterVersions
                for version in versions_data:
                    MeterVersion.objects.update_or_create(
                        meter=meter,
                        name=version.get('name'),
                        defaults={
                            'name': version.get('name'),
                            'value': version.get('value')
                        }
                    )

                # Update or create MeterLogicalParameters
                for param in logical_parameters_data:
                    MeterLogicalParameter.objects.update_or_create(
                        meter=meter,
                        name=param.get('name'),
                       
                        defaults={
                            'name': param.get('name'),
                            'value': param.get('value')
                        }
                    )

                return Response({"message": "Meter and related data updated successfully", "meter_id": meter.id}, status=status.HTTP_200_OK)

            else:
                # Create related data for the new Meter
                for identifier in identifiers_data:
                    MeterIdentifier.objects.create(
                        meter=meter,
                        name=identifier.get('name'),
                        code=identifier.get('code'),
                        value=identifier.get('value')
                    )

                for version in versions_data:
                    MeterVersion.objects.create(
                        meter=meter,
                        name=version.get('name'),
                        code=version.get('code'),
                        value=version.get('value')
                    )

                for param in logical_parameters_data:
                    MeterLogicalParameter.objects.create(
                        meter=meter,
                        name=param.get('name'),
                        code=param.get('code'),
                        value=param.get('value')
                    )

                return Response({"message": "Meter and related data created successfully", "meter_id": meter.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        




from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Meter, MeterIdentifier, MeterVersion, MeterLogicalParameter

class MeterDetailAPIView1(APIView):
    """
    Retrieve meter details including identifiers, versions, and logical parameters.
    Updated to work with current DB structure (Device-first approach).
    Supports lookup by serial_number.
    """
    def post(self, request, format=None):
        serial_number = request.data.get('serial_number')
        if not serial_number:
            return Response({"error": "Serial number is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Try to find Device by serial_number first
            device = None
            meter = None
            
            try:
                device = Device.objects.select_related('user').get(serial_number=serial_number)
            except Device.DoesNotExist:
                # Fallback: try to find via Meter model
                try:
                    meter = Meter.objects.select_related('device__user', 'user').get(serial_number=serial_number)
                    device = meter.device
                except Meter.DoesNotExist:
                    return Response(
                        {"error": "Device or Meter not found with the provided serial number."}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # If we found device but no meter, try to find meter by device
            if device and not meter:
                meter = Meter.objects.filter(device=device).first()

            # Collect related data from Meter (if exists)
            identifiers = []
            versions = []
            logical_parameters = []
            
            if meter:
                identifiers = MeterIdentifier.objects.filter(meter=meter)
                versions = MeterVersion.objects.filter(meter=meter)
                logical_parameters = MeterLogicalParameter.objects.filter(meter=meter)

            # Prepare the response data
            data = {
                "serial_number": serial_number,
                "device_id": device.id if device else None,
                "meter_id": meter.id if meter else None,
                "user_id": (meter.user.id if meter and meter.user else 
                           (device.user.id if device and device.user else None)),
                "identifiers": [
                    {
                        "name": identifier.name,
                        "code": identifier.code,
                        "value": identifier.value
                    } for identifier in identifiers
                ],
                "versions": [
                    {
                        "name": version.name,
                        "code": version.code,
                        "value": version.value
                    } for version in versions
                ],
                "logical_parameters": [
                    {
                        "name": param.name,
                        "code": param.code,
                        "value": param.value
                    } for param in logical_parameters
                ]
            }
            
            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# class MeterDetailAPIView(APIView):
#     def post(self, request, format=None):
        
#         data={"data":[{"status":"success","message":"Read successful.","action":"read","obis_code":"1.0.32.7.0.255","attribute_index":"2","value":234.1173553466797},{"status":"success","message":"Read successful.","action":"read","obis_code":"1.0.14.7.0.255","attribute_index":"2","value":50.0671272277832},{"status":"success","message":"Read successful.","action":"read","obis_code":"1.0.31.7.0.255","attribute_index":"2","value":0.0},{"status":"success","message":"Read successful.","action":"read","obis_code":"1.0.13.7.0.255","attribute_index":"2","value":1.0},{"status":"success","message":"Read successful.","action":"read","obis_code":"1.0.15.7.0.255","attribute_index":"2","value":0.08401799947023392}]}
#         return Response(data, status=status.HTTP_200_OK)

class MeterDetailAPIView(APIView):
    """
    Handles READ and WRITE DLMS operations via POST request.
    Reads update DB temporarily and clear after response.
    Writes do not update DB value fields.
    
    Updated to work with current DB structure:
    - Device is the primary model (has serial_number, addressing, security)
    - Media is linked to Device (with is_active flag)
    - Meter references Device
    """

    # --- Main POST Handler ---
    def post(self, request, format=None):
        # Extract common parameters
        action = request.data.get('action', 'read_obis') # Default to reading details if action missing
        serial_number = request.data.get('serial_number')
        parameters = request.data.get('parameters', {})
        print(f"MeterDetailAPIView received action '{action}' for SN '{serial_number}'")

        if not serial_number:
            return Response({"error": "serial_number is required."}, status=status.HTTP_400_BAD_REQUEST)

        records_to_clear_after_response = [] # Only used for read actions
        final_response_data = {}

        try:
            # --- 1. Get Device and DLMS Config (Updated for current DB structure) ---
            # Try to find Device by serial_number first
            try:
                device = Device.objects.select_related('addressing', 'security', 'user').get(serial_number=serial_number)
                logger.info(f"Found Device with serial_number: {serial_number}")
            except Device.DoesNotExist:
                # Fallback: try to find via Meter model if it exists
                try:
                    meter = Meter.objects.select_related('device__addressing', 'device__security', 'device__user').get(serial_number=serial_number)
                    device = meter.device
                    logger.info(f"Found Device via Meter with serial_number: {serial_number}")
                except Meter.DoesNotExist:
                    logger.warning(f"No Device or Meter found with serial_number: {serial_number}")
                    return Response({"error": "Device not found with the provided serial number."}, status=status.HTTP_404_NOT_FOUND)
            
            print(f"Device: {device}")
            
            # Get active media connection for this device
            media = Media.objects.filter(device=device, is_active=True).first()
            if not media:
                logger.warning(f"No active Media connection found for Device {device.serial_number}")
                return Response({"error": "No active media connection configured for this device."}, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"Active Media found: {media.media}/{media.protocol}")
            
            dlms_config = get_dlms_config_from_device(device, media) # Use utility function
        

            if action == 'read_obis':

                if not parameters or not isinstance(parameters, list):
                    return Response({"error": "Parameters must be a list of OBIS codes with attributes"}, status=status.HTTP_400_BAD_REQUEST)
               
                if len(parameters) > 0:  # Adjust this threshold as needed
                    return self.stream_obis_values(serial_number, parameters)
                
                else:
                    # Handle batch failure - return error in frontend-compatible format
                    error_results = []
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
                        error_results.append(error_response)
                    
                    return Response(error_results, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            elif action in ['write_obis', 'execute_method', 'image_transfer_combined', 'combined_image_transfer']:
                # --- Handle Write, Execute Method, or Image Transfer Combined ---
                # Directly call the main helper, DO NOT update/clear DB 'value'
                logger.info(f"Executing DLMS action '{action}' via helper.")
                result = execute_dlms_action(dlms_config, action_details={"action": action, "parameters": parameters})

                # Return the result from the helper
                if result.get("status") == "error":
                    return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                else:
                    return Response(result, status=status.HTTP_200_OK)

            else:
                logger.warning(f"Unknown action requested: {action}")
                return Response({"error": f"Unknown action: {action}"}, status=status.HTTP_400_BAD_REQUEST)

            # --- If action was read_detail or read_obis (and successful), return collected data ---
            # (This part is reached only if action was a successful read)
            return Response(final_response_data, status=status.HTTP_200_OK)

        # --- Exception Handling ---
        except Device.DoesNotExist: 
            logger.warning(f"Device with SN {serial_number} not found."); 
            return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e: 
            logger.error(f"Value error processing request for SN {serial_number}: {e}", exc_info=True); 
            return Response({"error": f"Invalid request data or configuration: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e: 
            logger.error(f"Unexpected error processing SN {serial_number}: {e}", exc_info=True); 
            return Response({"error": f"Internal error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # --- Clear DB Values AFTER response is determined (for read actions) ---
            if records_to_clear_after_response:
                logger.info(f"Clearing temporary DB values for {len(records_to_clear_after_response)} items...")
                for record, field_name in records_to_clear_after_response:
                    update_or_clear_db_value(record, field_name, clear=True) # Call utility to clear
                logger.info("Finished clearing temporary DB values.")

    def stream_obis_values(self, serial_number, parameters):
        from django.http import StreamingHttpResponse
        import json
        import time
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
                
                # # Send initial metadata
                # metadata = {
                #     "type": "metadata",
                #     "meter_id": meter.id,
                #     "serial_number": meter.serial_number,
                #     "device_id": device.id,
                #     "total_obis_codes": len(parameters),
                #     "timestamp": timezone.now().isoformat()
                # }
                # yield f"data: {json.dumps(metadata)}\n\n"
                
                # Stream each OBIS code result as it's read
                successful_reads = 0
                failed_reads = 0
                
                # NEW CODE - Use this instead:
                # Use batch processing via execute_dlms_action (same as regular read_obis)
                print("Stream: Processing batch OBIS read via execute_dlms_action")
                result = execute_dlms_action(dlms_config, action_details={"action": "read_obis", "parameters": parameters})

                if result.get("status") == "success" or result.get("successful_reads", 0) > 0:
                    # Stream each result from the batch response
                    for index, obis_result in enumerate(result.get("results", [])):
                        obis_code = obis_result.get('obis_code')
                        attribute_index = obis_result.get('attribute_index')
                        
                        if obis_result.get("status") == "success":
                            live_value = obis_result.get('value')
                            
                            # Try to update DB temporarily (pass device instead of meter)
                            db_record, value_field_name = get_db_record_for_obis(device, obis_code, attribute_index)
                            if db_record and live_value is not None:
                                update_or_clear_db_value(db_record, value_field_name, live_value=live_value, clear=False)
                            
                            success_response = {
                                "message": "Read Successfully",
                                "status": "success",
                                "action": "read",
                                "obis_code": obis_code,
                                "attribute_index": attribute_index,
                                "value": live_value,
                                "db_record_found": db_record is not None,
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

                
                # Send completion summary
                # completion = {
                #     "type": "complete",
                #     "message": f"OBIS reading completed. {successful_reads} successful, {failed_reads} failed",
                #     "summary": {
                #         "total_requested": len(parameters),
                #         "successful_reads": successful_reads,
                #         "failed_reads": failed_reads,
                #         "success_rate": round((successful_reads / len(parameters)) * 100, 2) if parameters else 0
                #     },
                #     "timestamp": timezone.now().isoformat()
                # }
                # yield f"data: {json.dumps(completion)}\n\n"
                
            except Device.DoesNotExist:
                error_response = {
                    "type": "error",
                    "message": f"Device with serial number {serial_number} not found",
                    "timestamp": timezone.now().isoformat()
                }
                yield f"data: {json.dumps(error_response)}\n\n"
                
            except Exception as e:
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
        response['Access-Control-Allow-Origin'] = '*'  # Adjust for CORS
        response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering if using nginx

        return response        

from .models import Threshold


@method_decorator(csrf_exempt, name='dispatch')
class CreateThresholdAPIView(APIView):
    """
    API endpoint to create or update Thresholds.
    """
    def post(self, request, format=None):
        # Extract serial number and user ID
        serial_number = request.data.get('serial_number')
        user_id = request.data.get('user')
        thresholds_data = request.data.get('thresholds', [])
        print(serial_number,user_id,thresholds_data)

        # Validate required fields
        if not serial_number or not user_id:
            return Response({"error": "Serial number and User ID are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = member.objects.get(id=user_id) 
            print("user>>>>>>>>>>",user)
        except member.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Create or update each Threshold instance
        for threshold_data in thresholds_data:
            try:
                threshold, created = Threshold.objects.update_or_create(
                    no=threshold_data.get('no'),  # Assuming 'no' is a unique field for thresholds
                    defaults={
                        'name': threshold_data.get('name'),
                        'code': threshold_data.get('code'),
                        'value': threshold_data.get('value'),
                        'unit': threshold_data.get('unit'),
                        'serial_number': serial_number,
                        'user': user
                    }
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Thresholds processed successfully",
        }, status=status.HTTP_201_CREATED)
    







class ListThresholdAPIView(APIView):
    """
    API endpoint to retrieve all Thresholds for a specific serial number.
    """
    def get(self, request, serial_number, format=None):
        print("serial_number",serial_number)
        
        try:
            thresholds = Threshold.objects.filter(serial_number=serial_number)
            data = []
            for threshold in thresholds:
                data.append({
                    "no": threshold.no,
                    "name": threshold.name,
                    "code": threshold.code,
                    "value": threshold.value,
                    "unit": threshold.unit,
                    "checked": threshold.checked,
                    "serial_number": threshold.serial_number,
                    "user": threshold.user.id,
                    "created_at": threshold.created_at.isoformat()
                })
            return Response({"thresholds": data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import TimeSettings  # and any other models you might need


class TimeSettingsAPIView(APIView):
    """
    Handles READ and WRITE DLMS operations for Time Settings (Clock OBIS: 0.0.1.0.0.255).
    Similar to MeterDetailAPIView - communicates with meter via DLMS.
    
    POST /api/time-settings/
    Body: {
        "serial_number": "device_serial",
        "action": "read_obis" | "write_obis",
        "parameters": {...}  // For read: list of {obis_code, attribute_index}, For write: {obis_code, attribute_index, value}
    }
    """
    def post(self, request, format=None):
        action = request.data.get('action', 'read_obis')
        serial_number = request.data.get('serial_number')
        parameters = request.data.get('parameters', {})
        
        print(f"TimeSettingsAPIView received action '{action}' for SN '{serial_number}'")

        if not serial_number:
            return Response({"error": "serial_number is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # --- 1. Get Device and DLMS Config (same as MeterDetailAPIView) ---
            try:
                device = Device.objects.select_related('addressing', 'security', 'user').get(serial_number=serial_number)
                logger.info(f"Found Device with serial_number: {serial_number}")
            except Device.DoesNotExist:
                # Fallback: try via Meter
                try:
                    meter = Meter.objects.select_related('device__addressing', 'device__security', 'device__user').get(serial_number=serial_number)
                    device = meter.device
                    logger.info(f"Found Device via Meter with serial_number: {serial_number}")
                except Meter.DoesNotExist:
                    return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Get active media connection
            media = Media.objects.filter(device=device, is_active=True).first()
            if not media:
                return Response({"error": "No active media connection configured."}, status=status.HTTP_400_BAD_REQUEST)
            
            dlms_config = get_dlms_config_from_device(device, media)
            
            # --- 2. Execute DLMS Action ---
            if action == 'read_obis':
                # Read time settings from meter
                result = execute_dlms_action(dlms_config, action_details={"action": action, "parameters": parameters})
                
                if result.get("status") == "success":
                    # Optionally update TimeSettings in DB with live values
                    # You can parse the results and update the database here if needed
                    return Response(result, status=status.HTTP_200_OK)
                else:
                    return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            elif action == 'write_obis':
                # Write time settings to meter
                result = execute_dlms_action(dlms_config, action_details={"action": action, "parameters": parameters})
                
                if result.get("status") == "success":
                    # Optionally update TimeSettings in DB after successful write
                    return Response(result, status=status.HTTP_200_OK)
                else:
                    return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({"error": f"Unknown action: {action}"}, status=status.HTTP_400_BAD_REQUEST)

        except Device.DoesNotExist:
            return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in TimeSettingsAPIView: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GetTimeSettingsAPIView(APIView):
    """
    Retrieve TimeSettings for a specific device.
    Supports lookup by device_id (URL parameter) or serial_number (query parameter).
    """
    def get(self, request, device_id=None, format=None):
        """
        Retrieve TimeSettings for a specific device.
        URL: /api/time-settings/<device_id>/ or /api/time-settings/?serial_number=<serial_number>
        """
        try:
            # Support both device_id from URL and serial_number from query params
            serial_number = request.query_params.get('serial_number')
            
            if not device_id and not serial_number:
                return Response(
                    {"error": "Either device_id or serial_number is required."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find device
            try:
                if device_id:
                    device = Device.objects.get(id=device_id)
                else:
                    device = Device.objects.get(serial_number=serial_number)
            except Device.DoesNotExist:
                return Response(
                    {"error": "Device not found with the provided identifier."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Fetch TimeSettings for the device
            time_settings = TimeSettings.objects.get(device=device)

            # Prepare response data
            data = {
                'device_id': device.id,
                'serial_number': device.serial_number,
                'system_time': time_settings.system_time,
                'auto_system_time': time_settings.auto_system_time,
                'daylight_saving_active': time_settings.daylight_saving_active,
                'time_zone_minutes': time_settings.time_zone_minutes,
                'status': time_settings.status,
                'dst_begin': time_settings.dst_begin,
                'dst_end': time_settings.dst_end,
                'dst_deviation_minutes': time_settings.dst_deviation_minutes,
                'dst_enabled': time_settings.get_dst_enabled_display(),  # Display label for choice
                'clock_base': time_settings.get_clock_base_display()     # Display label for choice
            }

            return Response(data, status=status.HTTP_200_OK)

        except TimeSettings.DoesNotExist:
            return Response({"error": "Time settings for this device not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TariffParameter, Device

class TariffParameterAPIView1(APIView):
    def post(self, request, format=None):   
        try:
            # Retrieve the relevant data from the request
            data = request.data

            # Validate if device_id is provided
            device_id = data.get('device_id')
            if not device_id:
                return Response({"error": "Device ID is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the device instance
            device = Device.objects.get(id=device_id)

            # Loop through each tariff parameter and update or create them
            for param in data.get('parameters', []):
                TariffParameter.objects.update_or_create(
                    device=device,
                    code=param.get('code'),
                    defaults={
                        'name': param.get('name', ''),
                        'value': param.get('value', ''),
                        'unit': param.get('unit', ''),
                    }
                )

            return Response({"message": "Tariff parameters updated successfully."}, status=status.HTTP_200_OK)

        except Device.DoesNotExist:
            return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TariffParameter, Device
import logging

logger = logging.getLogger(__name__)

class TariffParameterAPIView(APIView):
    def post(self, request, format=None):   
        try:
            # Retrieve the relevant data from the request
            data = request.data
            print("data",data)

            # Validate if device_id is provided
            device_id = data.get('device_id')
            if not device_id:
                return Response({"error": "Device ID is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the device instance
            device = Device.objects.get(id=device_id)

            # Loop through each tariff parameter and update or create them
            for param in data.get('parameters', []):
                logger.info(f"Processing parameter: {param}")  # Log each parameter
                print(param)

                TariffParameter.objects.update_or_create(
                    device=device,
                    name=param.get('name', ''),
                    defaults={
                        
                        'value': param.get('value', ''),
                        'unit': param.get('unit', ''),
                        'code':param.get('code'),
                        
                    }
                )

            return Response({"message": "Tariff parameters updated successfully."}, status=status.HTTP_200_OK)

        except Device.DoesNotExist:
            return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Error occurred: {str(e)}")  # Log the error
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        



class GetTariffParameterAPIView(APIView):
    def get(self, request, device_id, format=None):
        """
        Retrieve all TariffParameters for a specific device.
        """
        try:
            # Fetch all TariffParameters for the specific device
            tariff_parameters = TariffParameter.objects.filter(device_id=device_id)

            if not tariff_parameters.exists():
                return Response({"error": "No tariff parameters found for this device."}, status=status.HTTP_404_NOT_FOUND)

            # Prepare response data manually
            data = []
            for param in tariff_parameters:
                data.append({
                    'id': param.id,
                    'device_id': param.device.id,
                    'name': param.name,
                    'code': param.code,
                    'value': param.value,
                    'unit': param.unit,
                })

            return Response({"parameters": data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SpecialDay, Device

class SpecialDayAPIView(APIView):
    """
    POST view to insert special days for a device.
    """
    def post(self, request, format=None):
        try:
            # Extract data from the request
            data = request.data
            print("data////////",data)
            
            # Validate if device_id is provided
            device_id = data.get('device_id')
            if not device_id:
                return Response({"error": "Device ID is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the device instance
            device = Device.objects.get(id=device_id)

            # Loop through each special day and create them
            for day in data.get('special_days', []):
                SpecialDay.objects.create(
                    device=device,
                    day_id=day.get('day_id'),
                    formatted_date=day.get('formatted_date', '')
                )

            return Response({"message": "Special days added successfully."}, status=status.HTTP_201_CREATED)

        except Device.DoesNotExist:
            return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class SpecialDayListAPIView(APIView):
    """
    GET view to retrieve all special days for a specific device.
    """
    def get(self, request, device_id, format=None):
        try:
            special_days = SpecialDay.objects.filter(device_id=device_id).order_by('id')

            if not special_days.exists():
                return Response({"error": "No special days found for this device."}, status=status.HTTP_404_NOT_FOUND)

            data = []
            for day in special_days:
                data.append({
                    'id': day.id,
                    'device_id': day.device.id,
                    'day_id': day.day_id,
                    'formatted_date': day.formatted_date,
                })

            return Response({"special_days": data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        

class SpecialDayDetailAPIView1(APIView):
    """
    DELETE view to delete a special day for a specific device.
    """
    def delete(self, request, device_id, special_day_id, format=None):
        try:
            special_day = SpecialDay.objects.filter(id=special_day_id, device_id=device_id).first()

            if not special_day:
                return Response({"error": "Special day not found."}, status=status.HTTP_404_NOT_FOUND)

            special_day.delete()
            return Response({"message": "Special day deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SpecialDay

class SpecialDayDetailAPIView(APIView):
    """
    API to manage special days.
    """

    def delete(self, request, device_id, special_day_id=None, format=None):
        try:
            # Handle deleting a specific special day
            if special_day_id:
                special_day = SpecialDay.objects.filter(id=special_day_id, device_id=device_id).first()
                if not special_day:
                    return Response({"error": "Special day not found."}, status=status.HTTP_404_NOT_FOUND)
                special_day.delete()
                return Response({"message": "Special day deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
            
            # Handle clearing all special days for the device
            elif 'clear' in request.path:
                special_days = SpecialDay.objects.filter(device_id=device_id)
                if not special_days.exists():
                    return Response({"error": "No special days found for this device."}, status=status.HTTP_404_NOT_FOUND)
                special_days.delete()
                return Response({"message": "All special days cleared successfully."}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)










from django.core.exceptions import ValidationError
from .models import Device, TariffThreshold, TariffAction

class TariffThresholdActionAPIView(APIView):
    """
    POST view to insert thresholds and actions for a device.
    """
    def post(self, request, format=None):
        try:
            # Extract data from the request
            data = request.data
            print("Received data:", data)

            # Validate if device_id is provided
            device_id = data.get('device_id')

            if not device_id:
                return Response({"error": "Device ID is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the device instance
            device = Device.objects.get(id=device_id)

            # Create Thresholds
            thresholds = data.get('thresholds', [])
            if not isinstance(thresholds, list):
                return Response({"error": "Thresholds must be a list."}, status=status.HTTP_400_BAD_REQUEST)

            for threshold_data in thresholds:
                threshold_type = threshold_data.get('threshold_type')
                value = threshold_data.get('value')

                # Validate threshold fields
                if not threshold_type or value is None:
                    raise ValidationError("Both threshold type and value are required.")

                # Validate value type (ensure it's a number)
                try:
                    value = float(value)  # Convert to float
                except ValueError:
                    raise ValidationError("Value must be a valid number.")

                # Create a TariffThreshold instance
                TariffThreshold.objects.create(
                    device=device,
                    threshold_type=threshold_type,
                    value=value
                )

            # Create Actions if provided
            actions = data.get('actions', [])
            if not isinstance(actions, list):
                return Response({"error": "Actions must be a list."}, status=status.HTTP_400_BAD_REQUEST)

            for action_data in actions:
                action_type = action_data.get('action_type')
                action_up = action_data.get('action_up')
                action_down = action_data.get('action_down')

                # Validate action fields
                if not action_type or action_up is None or action_down is None:
                    raise ValidationError("Action type, action up, and action down are required.")

                # Create a TariffAction instance
                TariffAction.objects.create(
                    device=device,
                    action_type=action_type,
                    action_up=action_up,
                    action_down=action_down
                )

            return Response({"message": "Thresholds and Actions added successfully."}, status=status.HTTP_201_CREATED)

        except Device.DoesNotExist:
            return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def get(self, request, device_id=None, format=None):
        try:
            # Check if device_id is provided in the URL
            if not device_id:
                return Response({"error": "Device ID is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the device instance
            device = Device.objects.get(id=device_id)

            # Fetch thresholds and actions related to the device
            thresholds = TariffThreshold.objects.filter(device=device)
            actions = TariffAction.objects.filter(device=device)

             

            # Serialize the data (you might need to define serializers or use basic data structures)
            threshold_data = [{"threshold_type": t.threshold_type, "value": t.value,"id":t.id} for t in thresholds]
            action_data = [{"action_type": a.action_type, "action_up": a.action_up, "action_down": a.action_down,"id":a.id} for a in actions]

            return Response({
                "device_id": device_id,
                "thresholds": threshold_data,
                "actions": action_data,
            }, status=status.HTTP_200_OK)

        except Device.DoesNotExist:
            return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



    def delete(self, request, device_id, type, id, format=None):
        try:
            if not device_id:
                return Response({"error": "Device ID is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Check if it's a threshold or action being deleted
            if type == 'threshold':
                # Get and delete the threshold
                threshold = TariffThreshold.objects.get(id=id, device_id=device_id)
                threshold.delete()
                return Response({"message": "Threshold deleted successfully."}, status=status.HTTP_200_OK)
            elif type == 'action':
                # Get and delete the action
                action = TariffAction.objects.get(id=id, device_id=device_id)
                action.delete()
                return Response({"message": "Action deleted successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid type. Must be 'threshold' or 'action'."}, status=status.HTTP_400_BAD_REQUEST)

        except TariffThreshold.DoesNotExist:
            return Response({"error": "Threshold not found."}, status=status.HTTP_404_NOT_FOUND)
        except TariffAction.DoesNotExist:
            return Response({"error": "Action not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)  
        







from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import TOUCalendarManager
from django.core.exceptions import ValidationError
from django.core.exceptions import ObjectDoesNotExist

@method_decorator(csrf_exempt, name='dispatch')
class CreateTOUCalendarAPIView(APIView):
    """
    API endpoint to handle TOU Calendar creation or updating.
    """

    def post(self, request, format=None):
        # Extracting data from the request
        device_id = request.data.get('device_id')
        calendar_name = request.data.get('calendar_name')
        entity_type = request.data.get('entity_type')
        status_choice = request.data.get('status', 'Active')  # Default to 'Active'
        profiles = request.data.get('profiles', [])
        days = request.data.get('days', [])
        season_start = request.data.get('season_start')  # New field
        week_name = request.data.get('week_name')
        calendar_datetime = request.data.get('calendar_datetime')

        # Extract day_id only if the entity type is 'Day'
        day_id = request.data.get('day_id', None) if entity_type == 'Day' else None

        # Validate required fields
        if not device_id or not calendar_name or not entity_type:
            return Response({"error": "Device ID, Calendar name, and Entity type are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # If entity type is 'Day', check if the day_id already exists
            if entity_type == 'Day':
                if not day_id:
                    return Response({"error": "Day ID is required for entity type 'Day'."}, status=status.HTTP_400_BAD_REQUEST)
                
                if TOUCalendarManager.objects.filter(day_id=day_id).exists():
                    return Response({"error": f"Day ID {day_id} is already in the database."}, status=status.HTTP_400_BAD_REQUEST)

            # Create the TOUCalendarManager instance
            tou_calendar = TOUCalendarManager.objects.create(
                device_id=device_id,
                calendar_name=calendar_name,
                entity_type=entity_type,
                status=status_choice,
                profiles=profiles if entity_type == 'Day' else None,
                days=days if entity_type == 'Week' else None,
                season_start=season_start if entity_type == 'Season' else None,  # season_start instead of season_time
                week_name=week_name if entity_type in ['Season', 'Week'] else None,
                calendar_datetime=calendar_datetime,
                day_id=day_id  # Only set day_id if it's 'Day'
            )

            return Response({"message": "TOU Calendar created successfully", "calendar_id": tou_calendar.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Error occurred: {str(e)}")  # Log the error for debugging
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



    """
    PUT view to update a TOU Calendar for a specific device based on the calendar ID and entity type.
    """
    def put(self, request, calendar_id, format=None):
        try:
            # Get the calendar instance by its unique ID
            tou_calendar = TOUCalendarManager.objects.filter(id=calendar_id).first()
            print("tou_calendar",tou_calendar)

            if not tou_calendar:
                return Response({"error": "Calendar not found."}, status=status.HTTP_404_NOT_FOUND)

            # Extract data from the request
            data = request.data
            print('data',data)
            entity_type = data.get('entity_type')

            # Validate required fields
            if not entity_type:
                return Response({"error": "Entity type is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Validate entity_type
            valid_entity_types = ['Day', 'Week', 'Season']
            if entity_type not in valid_entity_types:
                raise ValidationError(f"Invalid 'entity_type'. It must be one of {valid_entity_types}.")

            # Extract common fields
            calendar_name = data.get('calendar_name', tou_calendar.calendar_name)
            status_choice = data.get('status', tou_calendar.status)  # Default to current status
            calendar_datetime = data.get('calendar_datetime', tou_calendar.calendar_datetime)

            # Update based on entity type
            if entity_type == 'Day':
                day_id = data.get('day_id')
                if not day_id:
                    return Response({"error": "Day ID is required for entity type 'Day'."}, status=status.HTTP_400_BAD_REQUEST)

                # Check for duplicate day_id
                if TOUCalendarManager.objects.filter(day_id=day_id).exclude(id=calendar_id).exists():
                    return Response({"error": f"Day ID {day_id} is already in the database."}, status=status.HTTP_400_BAD_REQUEST)

                # Update Day-specific fields
                profiles = data.get('profiles', tou_calendar.profiles)
                tou_calendar.day_id = day_id
                tou_calendar.profiles = profiles

            elif entity_type == 'Week':
                days = data.get('days', tou_calendar.days)
                print("days",days)
                week_name = data.get('week_name', tou_calendar.week_name)
                print(week_name)

                # Update Week-specific fields
                tou_calendar.days = days
                tou_calendar.week_name = week_name

            elif entity_type == 'Season':
                season_start = data.get('season_start', tou_calendar.season_start)
                week_name = data.get('week_name', tou_calendar.week_name)

                # Update Season-specific fields
                tou_calendar.season_start = season_start
                tou_calendar.week_name = week_name

            # Update common fields
            tou_calendar.calendar_name = calendar_name
            tou_calendar.status = status_choice
            tou_calendar.calendar_datetime = calendar_datetime

            # Save the updated instance
            tou_calendar.save()

            # Prepare the response data
            updated_data = {
                "id": tou_calendar.id,
                "device_id": tou_calendar.device_id,
                "calendar_name": tou_calendar.calendar_name,
                "entity_type": tou_calendar.entity_type,
                "status": tou_calendar.status,
                "calendar_datetime": tou_calendar.calendar_datetime
            }

            if entity_type == 'Day':
                updated_data['day_id'] = tou_calendar.day_id
                updated_data['profiles'] = tou_calendar.profiles
            elif entity_type == 'Week':
                updated_data['days'] = tou_calendar.days
                updated_data['week_name'] = tou_calendar.week_name
            elif entity_type == 'Season':
                updated_data['season_start'] = tou_calendar.season_start
                updated_data['week_name'] = tou_calendar.week_name

            return Response({"message": "TOU Calendar updated successfully", "updated_calendar": updated_data}, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Error occurred: {str(e)}")  # Log the error for debugging
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    


    
    
    def get(self, request, device_id=None, entity_type=None, status_type=None, format=None):
        try:
            # Validate device_id
            
            if device_id is None or not isinstance(device_id, int):
                raise ValidationError("Invalid or missing 'device_id'. It must be an integer.")

            # Validate entity_type
            valid_entity_types = ['Day', 'Week', 'Season']
            if entity_type not in valid_entity_types:
                raise ValidationError(f"Invalid 'entity_type'. It must be one of {valid_entity_types}.")

            # Validate status
            valid_status = ['Active', 'Passive']  # Adjust this to match your model's possible statuses
            if status_type not in valid_status:
                raise ValidationError(f"Invalid 'status'. It must be one of {valid_status}.")

            # Filter calendars based on device_id, entity_type, and status
            calendars = TOUCalendarManager.objects.filter(device_id=device_id, entity_type=entity_type, status=status_type)

            # Check if any calendars exist
            if not calendars.exists():
                return Response({"error": "No matching TOU Calendar found."}, status=status.HTTP_404_NOT_FOUND)

            # Prepare response based on entity_type
            calendar_data = []
            
            for calendar in calendars:
                if entity_type == 'Day':
                    calendar_data.append({
                        "calendar_id": calendar.id,
                        "device_id": calendar.device_id,
                        "calendar_name": calendar.calendar_name,
                        "entity_type": calendar.entity_type,
                        "status": calendar.status,
                        "day_id": calendar.day_id,
                        "profiles": calendar.profiles,
                        "calendar_datetime": calendar.calendar_datetime
                    })
                elif entity_type == 'Week':
                    calendar_data.append({
                        "calendar_id": calendar.id,
                        "device_id": calendar.device_id,
                        "calendar_name": calendar.calendar_name,
                        "entity_type": calendar.entity_type,
                        "status": calendar.status,
                        "days": calendar.days,
                        "week_name": calendar.week_name,
                        "calendar_datetime": calendar.calendar_datetime
                    })
                elif entity_type == 'Season':
                    calendar_data.append({
                        "calendar_id": calendar.id,
                        "device_id": calendar.device_id,
                        "calendar_name": calendar.calendar_name,
                        "entity_type": calendar.entity_type,
                        "status": calendar.status,
                        "season_start": calendar.season_start,  # Updated to season_start
                        "week_name": calendar.week_name,
                        "calendar_datetime": calendar.calendar_datetime
                    })

            return Response({"calendars": calendar_data}, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Log unexpected errors for debugging
            print(f"Unexpected error occurred: {str(e)}")
            return Response({"error": "An unexpected error occurred. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
     

    def delete(self, request, calendar_id=None, format=None):

        print("hello>>>>>", calendar_id)
        try:
            # Validate calendar_id
            if calendar_id is None or not isinstance(calendar_id, int):
                raise ValidationError("Invalid or missing 'calendar_id'. It must be an integer.")

            # Try to fetch the calendar by ID
            try:
                calendar = TOUCalendarManager.objects.get(id=calendar_id)
            except ObjectDoesNotExist:
                return Response({"error": "Calendar with the given ID not found."}, status=status.HTTP_404_NOT_FOUND)

            # Perform the delete operation
            calendar.delete()

            return Response({"message": f"Calendar with ID {calendar_id} deleted successfully."}, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Unexpected error occurred: {str(e)}")
            return Response({"error": "An unexpected error occurred. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        



from .models import RegisterLimiter, Device
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

@method_decorator(csrf_exempt, name='dispatch')
class RegisterLimiterAPIView(APIView):
    """
    API endpoint to handle adding threshold and action data to the RegisterLimiter model.
    """

    def post(self, request, format=None):
        print("data",request.data)
        # Extracting data from the request
        device_id = request.data.get('device_id')  # Include device_id in the request
        monitor_type = request.data.get('monitor_type')
        
        # Validate monitor type
        if monitor_type not in [choice[0] for choice in RegisterLimiter.MONITOR_TYPE_CHOICES]:
            return Response({'error': 'Invalid monitor type provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate device existence
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response({'error': 'Device with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        # Initialize variables
        threshold = request.data.get('threshold')
        thresholds_value = request.data.get('thresholds_value')  # This will be ignored if action data is provided
        action_up = request.data.get('action_up')
        action_down = request.data.get('action_down')

        # Check if both threshold and thresholds_value are provided
        if threshold is not None and thresholds_value is not None:
            # Create RegisterLimiter entry with threshold data
            register_limiter = RegisterLimiter.objects.create(
                device=device,
                monitor_type=monitor_type,
                threshold=threshold,
                thresholds_value=thresholds_value,
                action_up=None,  # Action data not provided
                action_down=None  # Action data not provided
            )
            return Response({'message': 'RegisterLimiter entry with thresholds added successfully.', 'id': register_limiter.id}, status=status.HTTP_201_CREATED)

        # If action data is provided, set thresholds_value to None
        elif action_up is not None and action_down is not None:
            # Create RegisterLimiter entry with action data, setting thresholds_value to None
            register_limiter = RegisterLimiter.objects.create(
                device=device,
                monitor_type=monitor_type,
                threshold=threshold,  # Keep the threshold value provided in the request, if any
                thresholds_value=None,  # Set thresholds_value to None
                action_up=action_up,
                action_down=action_down
            )
            return Response({'message': 'RegisterLimiter entry with actions added successfully.', 'id': register_limiter.id}, status=status.HTTP_201_CREATED)

        # If neither threshold nor action data is provided
        return Response({'error': 'You must provide either threshold data or action data.'}, status=status.HTTP_400_BAD_REQUEST)
    
    
    
   


    def get(self, request, device_id, monitor_type, format=None):
       
       
        print("device_id:", device_id, "monitor_type:", monitor_type)

        # Filter for threshold data
        threshold_data = RegisterLimiter.objects.filter(
            device__id=device_id,
            monitor_type=monitor_type,
            threshold__isnull=False,
            thresholds_value__isnull=False
        )

        # Filter for action data
        action_data = RegisterLimiter.objects.filter(
            device__id=device_id,
            monitor_type=monitor_type,
            action_up__isnull=False,
            action_down__isnull=False
        )

        # Prepare response data
        response_data = {}
        
        
        if threshold_data.exists():
            response_data['threshold_data'] = [
                {
                    'id': item.id,
                    'device_id': item.device.id,
                    'monitor_type': item.monitor_type,
                    'threshold': item.threshold,
                    'thresholds_value': item.thresholds_value
                } for item in threshold_data
            ]
        
        if action_data.exists():
            response_data['action_data'] = [
                {
                    'id': item.id,
                    'device_id': item.device.id,
                    'monitor_type': item.monitor_type,
                    'action_up': item.action_up,
                    'action_down': item.action_down
                } for item in action_data
            ]
       
        if not response_data:
            response_data = {"message": "No threshold or action data found for the given device ID and monitor type."}

        return Response(response_data, status=status.HTTP_200_OK)
   
    def delete(self, request, id, format=None):
        """
        Delete a RegisterLimiter entry by its ID.
        """
        print("delete Item")
        try:
            # Retrieve the entry by its ID
            register_limiter = RegisterLimiter.objects.get(id=id)
            register_limiter.delete()
            return Response({'message': f'RegisterLimiter entry with ID {id} deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except RegisterLimiter.DoesNotExist:
            return Response({'error': f'RegisterLimiter entry with ID {id} does not exist.'}, status=status.HTTP_404_NOT_FOUND)


from .models import SecuritySettings




class SecuritySettingsView(APIView):
    def post(self, request, format=None):
        # Extracting data from the request
        device_id = request.data.get('device_id')
        
        # Validate device existence
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response({'error': 'Device with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if security settings for the device already exist
        security_settings, created = SecuritySettings.objects.get_or_create(device=device)

        # Update or set each field from the request data
        security_settings.security_policy = request.data.get('security_policy', security_settings.security_policy)
        security_settings.security_suite = request.data.get('security_suite', security_settings.security_suite)
        security_settings.client_system_title = request.data.get('client_system_title', security_settings.client_system_title)
        security_settings.server_system_title = request.data.get('server_system_title', security_settings.server_system_title)
        security_settings.security_activate_method = request.data.get('security_activate_method', security_settings.security_activate_method)
        security_settings.old_master_key = request.data.get('old_master_key', security_settings.old_master_key)
        security_settings.global_unicast_key = request.data.get('global_unicast_key', security_settings.global_unicast_key)
        security_settings.global_broadcast_key = request.data.get('global_broadcast_key', security_settings.global_broadcast_key)
        security_settings.authentication_key = request.data.get('authentication_key', security_settings.authentication_key)
        security_settings.new_master_key = request.data.get('new_master_key', security_settings.new_master_key)

        # Save the updated or created security settings
        security_settings.save()

        # Manually create response data without using a serializer
        response_data = {
            'id': security_settings.id,
            'device_id': device_id,
            'security_policy': security_settings.security_policy,
            'security_suite': security_settings.security_suite,
            'client_system_title': security_settings.client_system_title,
            'server_system_title': security_settings.server_system_title,
            'security_activate_method': security_settings.security_activate_method,
            'old_master_key': security_settings.old_master_key,
            'global_unicast_key': security_settings.global_unicast_key,
            'global_broadcast_key': security_settings.global_broadcast_key,
            'authentication_key': security_settings.authentication_key,
            'new_master_key': security_settings.new_master_key,
            'created_at': security_settings.created_at,
            'updated_at': security_settings.updated_at
        }

        message = 'SecuritySettings created successfully.' if created else 'SecuritySettings updated successfully.'
        
        return Response({'message': message, 'data': response_data}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)




from .models import PushSetupItem, Device


class PushSetupItemView(APIView):
    
    def post(self, request, format=None):
        # Extracting data from the request
        device_id = request.data.get('device_id')
        print(device_id)
      
        name = request.data.get('name')
        code = request.data.get('code')
        data_index = request.data.get('data_index')
        
        # Validate device existence
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response({'error': 'Device with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if a PushSetupItem with the same device, name, code, and data_index already exists
        existing_item = PushSetupItem.objects.filter(
            device=device,
            name=name,
            code=code,
            data_index=data_index
        ).first()
        
        if existing_item:
            # If a duplicate item is found, return a conflict response
            return Response({
                'message': 'PushSetupItem with this data already exists.',
                'data': {
                    'id': existing_item.id,
                    'device_id': existing_item.device.id,
                    'name': existing_item.name,
                    'code': existing_item.code,
                    'data_index': existing_item.data_index,
                    'created_at': existing_item.created_at
                }
            }, status=status.HTTP_409_CONFLICT)  # 409 is for conflict (duplicate entry)

        # Create a new PushSetupItem instance
        push_setup_item = PushSetupItem(
            device=device,
            name=name,
            code=code,
            data_index=data_index
        )

        # Save the PushSetupItem instance
        push_setup_item.save()

        # Create response data
        response_data = {
            'id': push_setup_item.id,
            'device_id': push_setup_item.device.id,
            'name': push_setup_item.name,
            'code': push_setup_item.code,
            'data_index': push_setup_item.data_index,
            'created_at': push_setup_item.created_at
        }

        return Response({
            'message': 'PushSetupItem created successfully.',
            'data': response_data
        }, status=status.HTTP_201_CREATED)
    
    def get(self, request,device_id, format=None):
        
        
        if not device_id:
            return Response({'error': 'device_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate device existence
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response({'error': 'Device with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        # Fetch all PushSetupItems related to the given device
        push_setup_items = PushSetupItem.objects.filter(device=device)

        # If no items found, return an empty list
        if not push_setup_items.exists():
            return Response({'message': 'No PushSetupItems found for this device.'}, status=status.HTTP_404_NOT_FOUND)

        # Prepare the response data
        response_data = []
        for item in push_setup_items:
            response_data.append({
                'id': item.id,
                'device_id': item.device.id,
                'name': item.name,
                'code': item.code,
                'data_index': item.data_index,
                'created_at': item.created_at
            })

        return Response({
            'message': 'PushSetupItems retrieved successfully.',
            'data': response_data
        }, status=status.HTTP_200_OK)

    
    def delete(self, request, id, format=None):
        try:
            # Find the PushSetupItem by ID
            push_setup_item = PushSetupItem.objects.get(id=id)
        except PushSetupItem.DoesNotExist:
            # If the item does not exist, return a 404 response
            return Response({'error': 'PushSetupItem with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Delete the item
        push_setup_item.delete()
        
        return Response({
            'message': 'PushSetupItem deleted successfully.',
            'data': {
                'id': id
            }
        }, status=status.HTTP_200_OK)




from .models import Device, OtherParameters


class OtherParametersView(APIView):
    
    def post(self, request, format=None):
        # Extracting data from the request
        device_id = request.data.get('device_id')
        send_destination = request.data.get('send_destination')
        transport_service = request.data.get('transport_service')
        destination = request.data.get('destination')
        message_type = request.data.get('message_type')
        randomisation_start_interval = request.data.get('randomisation_start_interval')
        start_interval_value = request.data.get('start_interval_value', 0)
        retries_enabled = request.data.get('retries_enabled')
        retries = request.data.get('retries', 0)
        repetition_delay_enabled = request.data.get('repetition_delay_enabled')
        repetition_delay = request.data.get('repetition_delay', 0)
        
        # Validate device existence
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response({'error': 'Device with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if an OtherParameters instance with the same device exists
        other_parameters, created = OtherParameters.objects.get_or_create(
            device=device,
            defaults={
                'send_destination': send_destination,
                'transport_service': transport_service,
                'destination': destination,
                'message_type': message_type,
                'randomisation_start_interval': randomisation_start_interval,
                'start_interval_value': start_interval_value,
                'retries_enabled': retries_enabled,
                'retries': retries,
                'repetition_delay_enabled': repetition_delay_enabled,
                'repetition_delay': repetition_delay
            }
        )

        # If an instance already exists, update it with new data
        if not created:
            other_parameters.send_destination = send_destination
            other_parameters.transport_service = transport_service
            other_parameters.destination = destination
            other_parameters.message_type = message_type
            other_parameters.randomisation_start_interval = randomisation_start_interval
            other_parameters.start_interval_value = start_interval_value
            other_parameters.retries_enabled = retries_enabled
            other_parameters.retries = retries
            other_parameters.repetition_delay_enabled = repetition_delay_enabled
            other_parameters.repetition_delay = repetition_delay
            other_parameters.save()

        # Create response data
        response_data = {
            'id': other_parameters.id,
            'device_id': other_parameters.device.id,
            'send_destination': other_parameters.send_destination,
            'transport_service': other_parameters.transport_service,
            'destination': other_parameters.destination,
            'message_type': other_parameters.message_type,
            'start_interval_value': other_parameters.start_interval_value,
            'retries': other_parameters.retries,
            'repetition_delay': other_parameters.repetition_delay,
            'created_at': other_parameters.created_at
        }

        return Response({
            'message': 'OtherParameters created successfully.' if created else 'OtherParameters updated successfully.',
            'data': response_data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)





from .models import Scheduler, Device
from datetime import datetime


from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Scheduler, Device  # Assuming these models are imported correctly

class CreateSchedulerView(APIView):
    def post(self, request, format=None):
        # Extracting data from the request
        device_id = request.data.get('device_id')
        scheduler_type = request.data.get('scheduler_type', 'Not defined')
        executed_script = request.data.get('executed_script', 'Edit value is null')
        execution_time = request.data.get('execution_time', "ffff-ff-01T12:00:00")  # Default to 'ffff-ff-01T12:00:00'
        print(device_id,execution_time)
        # Validate device existence
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response({'error': 'Device with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        # Directly use the execution_time as provided by the frontend
        execution_time_obj = execution_time  # No parsing needed, just store as is

        # Create the Scheduler instance
        scheduler = Scheduler.objects.create(
            device=device,
            scheduler_type=scheduler_type,
            executed_script=executed_script,
            type=scheduler_type,
            execution_time=execution_time_obj,  # Store the time string as received
        )

        # Return success response
        response_data = {
            'id': scheduler.id,
            'device_id': scheduler.device.id,
            'scheduler_type': scheduler.scheduler_type,
            'executed_script': scheduler.executed_script,
            'execution_time': scheduler.execution_time,
            'created_at': scheduler.created_at
        }

        return Response({
            'message': 'Scheduler created successfully.',
            'data': response_data
        }, status=status.HTTP_201_CREATED)

   


    def get(self, request, device_id, scheduler_type, format=None):
        # Validate if both parameters are provided
        if not device_id or not scheduler_type:
            return Response({'error': 'Both device_id and scheduler_type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Try to retrieve the device
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response({'error': 'Device with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        # Filter schedulers based on the device and scheduler type
        schedulers = Scheduler.objects.filter(device=device, scheduler_type=scheduler_type)

        # Prepare the response data
        response_data = [
            {
                'id': scheduler.id,
                'device_id': scheduler.device.id,
                'scheduler_type': scheduler.scheduler_type,
                'executed_script': scheduler.executed_script,
                'execution_time': scheduler.execution_time,
                'created_at': scheduler.created_at
            }
            for scheduler in schedulers
        ]

        # If no schedulers are found, return an empty 'data' field with success message
        return Response({
            'message': 'Schedulers retrieved successfully.',
            'data': response_data  # Will be an empty list if no schedulers found
        }, status=status.HTTP_200_OK)


    def delete(self, request, scheduler_id, format=None):
        # Try to retrieve the scheduler by ID
        try:
            scheduler = Scheduler.objects.get(id=scheduler_id)
        except Scheduler.DoesNotExist:
            return Response({'error': 'Scheduler with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        # Delete the scheduler
        scheduler.delete()

        # Return a success message
        return Response({'message': 'Scheduler deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)




from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import AutoConnectSettings, Device

class CreateAutoConnectSettingsView(APIView):
    def post(self, request, format=None):
        # Extract data from the request
        device_id = request.data.get('device_id')
        conn_type = request.data.get('type', 'tcp')  # Default to 'tcp' if not provided
        mode = request.data.get('mode', 0)  # Default to 'No Auto Connect' (0)
        repetitions = request.data.get('repetitions', 0)  # Default to 0 if not provided
        delay = request.data.get('delay', 0)  # Default to 0 if not provided
        start_time = request.data.get('start_time', None)
        end_time = request.data.get('end_time', None)
        destination = request.data.get('destination', None)

        # Validate if device exists
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response({'error': 'Device with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        # Validate that either start_time/end_time or destination is provided
        if (start_time and end_time and destination) or (not start_time and not end_time and not destination):
            return Response({
                'error': 'Either start_time/end_time or destination must be provided, but not both.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create AutoConnectSettings object
        auto_connect_settings = AutoConnectSettings.objects.create(
            device=device,
            type=conn_type,
            mode=mode,
            repetitions=repetitions,
            delay=delay,
            start_time=start_time,
            end_time=end_time,
            destination=destination
        )

        # Prepare response data
        response_data = {
            'id': auto_connect_settings.id,
            'device_id': auto_connect_settings.device.id,
            'type': auto_connect_settings.type,
            'mode': auto_connect_settings.mode,
            'repetitions': auto_connect_settings.repetitions,
            'delay': auto_connect_settings.delay,
            'start_time': auto_connect_settings.start_time,
            'end_time': auto_connect_settings.end_time,
            'destination': auto_connect_settings.destination,
            'created_at': auto_connect_settings.created_at
        }

        return Response({
            'message': 'AutoConnectSettings created successfully.',
            'data': response_data
        }, status=status.HTTP_201_CREATED)


    def get(self, request, device_id, type, format=None):
        conn_type = type

        # Validate if device_id and type are provided
        if not device_id or not conn_type:
            return Response({'error': 'Both device_id and type must be provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate if the device exists
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response({'error': 'Device with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        # Query the AutoConnectSettings based on device_id and type
        auto_connect_settings = AutoConnectSettings.objects.filter(device=device, type=conn_type)

        # If no settings exist, return an empty list with a success message
        if not auto_connect_settings.exists():
            return Response({
                'message': 'No AutoConnectSettings found for the given device and type.',
                'data': [],
                'all_destinations': [],
                'all_times': []
            }, status=status.HTTP_200_OK)

        # Prepare response data
        data_list = []
        all_destinations = []
        all_times = []  # List of all start_time and end_time entries

        for setting in auto_connect_settings:
            data_list.append({
                'id': setting.id,
                'device_id': setting.device.id,
                'type': setting.type,
                'mode': setting.mode,
                'repetitions': setting.repetitions,
                'delay': setting.delay,
                'start_time': setting.start_time,
                'end_time': setting.end_time,
                'destination': setting.destination,
                'created_at': setting.created_at
            })

            # Collect all destinations with their IDs
            if setting.destination:
                all_destinations.append({
                    "id": setting.id,
                    "destination": setting.destination
                })

            # Collect all start_time and end_time entries with their IDs
            if setting.start_time and setting.end_time:
                all_times.append({
                    "id": setting.id,
                    "start_time": setting.start_time,
                    "end_time": setting.end_time
                })

        return Response({
            'message': 'AutoConnectSettings fetched successfully.',
            'data': data_list,
            'all_destinations': all_destinations,  # All destinations with IDs
            'all_times': all_times  # All start and end times with IDs
        }, status=status.HTTP_200_OK)


    

    

    def delete(self, request, id, format=None):
    # Validate if the ID is provided
        if not id:
            return Response({'error': 'ID must be provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Attempt to delete the AutoConnectSettings instance
        try:
            auto_connect_setting = AutoConnectSettings.objects.get(id=id)
            auto_connect_setting.delete()
            return Response({'message': 'AutoConnectSettings deleted successfully.'}, status=status.HTTP_200_OK)
        except AutoConnectSettings.DoesNotExist:
            return Response({'error': 'AutoConnectSettings with the given ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)



from .models import AutoAnswerSettings, AutoAnswerSettingsCallingWindow, AutoAnswerSettingsAllowedCaller
from django.http import JsonResponse


class AutoAnswerSettingsCreateView(APIView):

    def post(self, request, *args, **kwargs):
        
        
        data = request.data

        device = data.get('device')
        mode = data.get('mode')
        status = data.get('status')
        num_calls = data.get('num_calls')
        rings_in_window = data.get('rings_in_window')
        rings_out_window = data.get('rings_out_window')

        device = Device.objects.get(id=device)

        # Create AutoAnswerSettings instance
        auto_answer_settings = AutoAnswerSettings.objects.create(
            device=device,
            mode=mode,
            status=status,
            num_calls=num_calls,
            rings_in_window=rings_in_window,
            rings_out_window=rings_out_window
        )

        # Handle calling window if provided (single item, not a list)
        calling_window = data.get('calling_windows')
        if calling_window:
            AutoAnswerSettingsCallingWindow.objects.create(
                auto_answer_settings=auto_answer_settings,
                start_time=calling_window.get('start_time'),
                end_time=calling_window.get('end_time')
            )

        # Handle allowed caller if provided (single item, not a list)
        allowed_caller = data.get('allowed_callers')
        if allowed_caller:
            AutoAnswerSettingsAllowedCaller.objects.create(
                auto_answer_settings=auto_answer_settings,
                caller_id=allowed_caller.get('caller_id'),
                call_type=allowed_caller.get('call_type')
            )

        return Response({"message": "AutoAnswerSettings created successfully."}, status=201)
    


    def get(self, request, *args, **kwargs):
        # Get device_id from the URL parameters
        device_id = kwargs.get('device_id')
        
        # Retrieve all AutoAnswerSettings instances related to the given device_id
        auto_answer_settings = AutoAnswerSettings.objects.filter(device=device_id)
        
        # If no AutoAnswerSettings found for the given device_id
        if not auto_answer_settings.exists():
            return JsonResponse({"error": "No AutoAnswerSettings found for the given device."}, status=404)
        
        # Prepare the lists for calling windows and allowed callers
        calling_windows_list = []
        allowed_callers_list = []
        
        # Loop through all AutoAnswerSettings related to the device
        for settings in auto_answer_settings:
            # Retrieve calling windows for each AutoAnswerSettings instance
            calling_windows = AutoAnswerSettingsCallingWindow.objects.filter(auto_answer_settings=settings)
            for window in calling_windows:
                calling_windows_list.append({
                    "id": window.id,
                    "start_time": window.start_time,
                    "end_time": window.end_time,
                    "auto_answer_settings": window.auto_answer_settings.id,
                })
            
            # Retrieve allowed callers for each AutoAnswerSettings instance
            allowed_callers = AutoAnswerSettingsAllowedCaller.objects.filter(auto_answer_settings=settings)
            for caller in allowed_callers:
                allowed_callers_list.append({
                    "id": caller.id,
                    "caller_id": caller.caller_id,
                    "call_type": caller.get_call_type_display(),
                    "auto_answer_settings": caller.auto_answer_settings.id,
                })
        
        # Return both lists as a single JSON response
        return JsonResponse({
            "calling_windows": calling_windows_list,
            "allowed_callers": allowed_callers_list
        }, status=200)
    


    def delete(self, request, *args, **kwargs):
        # Retrieve the auto_answer_settings.id from the URL parameters
        auto_answer_settings_id = kwargs.get('auto_answer_settings_id')

        try:
            # Retrieve the AutoAnswerSettings instance based on the provided ID
            auto_answer_settings = AutoAnswerSettings.objects.get(id=auto_answer_settings_id)

            # Delete the AutoAnswerSettings instance and its related entries will be deleted automatically
            auto_answer_settings.delete()

            # Return success response
            return Response({"message": "AutoAnswerSettings and related entries deleted successfully."}, status=204)

        except AutoAnswerSettings.DoesNotExist:
            # If AutoAnswerSettings with the given ID does not exist
            return JsonResponse({"error": "AutoAnswerSettings not found."}, status=404)
    

    

    
    
from .models import IPv4Setup, MulticastIPAddress, IPOption, Device
from django.shortcuts import get_object_or_404

class IPv4SetupCreateView(APIView):

    def post(self, request, *args, **kwargs):
        data = request.data

        # Ensure that either multicast_addresses or ip_options is provided, but not both
        multicast_addresses = data.get('multicast_addresses', None)
        ip_options = data.get('ip_options', None)

        if multicast_addresses and ip_options:
            raise ValidationError("You can only provide either multicast_addresses or ip_options, not both.")

        # Get data from the request
        device_id = data.get('device')
        data_link_ref = data.get('data_link_ref')
        ip_address = data.get('ip_address')
        subnet_mask = data.get('subnet_mask')
        gateway_ip = data.get('gateway_ip')
        dhcp = data.get('dhcp')
        primary_dns = data.get('primary_dns')
        secondary_dns = data.get('secondary_dns')

        # Get the device instance using the device ID
        device = get_object_or_404(Device, id=device_id)

        # Create IPv4Setup instance
        ipv4_setup = IPv4Setup.objects.create(
            device=device,
            data_link_ref=data_link_ref,
            ip_address=ip_address,
            subnet_mask=subnet_mask,
            gateway_ip=gateway_ip,
            dhcp=dhcp,
            primary_dns=primary_dns,
            secondary_dns=secondary_dns
        )

        # Handle Multicast IP addresses if provided (either single or multiple)
        if multicast_addresses:
            if isinstance(multicast_addresses, list):
                for multicast_ip in multicast_addresses:
                    MulticastIPAddress.objects.create(
                        ipv4_setup=ipv4_setup,
                        ip_address=multicast_ip
                    )
            else:
                MulticastIPAddress.objects.create(
                    ipv4_setup=ipv4_setup,
                    ip_address=multicast_addresses
                )

        # Handle IP options if provided (either single or multiple)
        if ip_options:
            if isinstance(ip_options, list):
                for option in ip_options:
                    IPOption.objects.create(
                        ipv4_setup=ipv4_setup,
                        option_type=option.get('option_type'),
                        data=option.get('data')
                    )
            else:
                IPOption.objects.create(
                    ipv4_setup=ipv4_setup,
                    option_type=ip_options.get('option_type'),
                    data=ip_options.get('data')
                )

        return Response({"message": "IPv4 Setup created successfully."}, status=201)


 

    def get(self, request, *args, **kwargs):
        device_id = kwargs.get('device_id')  # Assuming device_id is passed as a URL parameter

        # Get the device instance using the device ID
        device = get_object_or_404(Device, id=device_id)

        # Get the IPv4 setups associated with this device
        ipv4_setups = IPv4Setup.objects.filter(device=device)

        if not ipv4_setups:
            return Response({"detail": "No IPv4 Setup found for this device."}, status=404)

        response_data = {
            "ipv4_setups": [],
            "multicast_addresses": [],
            "ip_options": []
        }

        # Iterate through all IPv4 setups for the device
        for ipv4_setup in ipv4_setups:
            # Fetch the related Multicast IP addresses
            multicast_addresses = MulticastIPAddress.objects.filter(ipv4_setup=ipv4_setup)

            # Fetch the related IP options
            ip_options = IPOption.objects.filter(ipv4_setup=ipv4_setup)

            # Prepare the data for each IPv4 setup
            ipv4_setup_data = {
                "setup_id": ipv4_setup.id,  # Setup ID
                "table_self_id": ipv4_setup.id,  # Assuming table_self_id is the same as setup_id
                "device_id": device.id,
                "data_link_ref": ipv4_setup.data_link_ref,
                "ip_address": ipv4_setup.ip_address,
                "subnet_mask": ipv4_setup.subnet_mask,
                "gateway_ip": ipv4_setup.gateway_ip,
                "dhcp": ipv4_setup.dhcp,
                "primary_dns": ipv4_setup.primary_dns,
                "secondary_dns": ipv4_setup.secondary_dns,
            }

            # Add current IPv4 setup data to the response
            response_data["ipv4_setups"].append(ipv4_setup_data)

            # Add the related multicast addresses to the response
            for address in multicast_addresses:
                response_data["multicast_addresses"].append({
                    "id": address.id,  # Multicast IP address ID
                    "ip_address": address.ip_address,
                    "ipv4_setup_id": address.ipv4_setup.id  # ForeignKey to IPv4Setup
                })
            
            # Add the related IP options to the response
            for option in ip_options:
                response_data["ip_options"].append({
                    "id": option.id,  # IP option ID
                    "option_type": option.option_type,
                    "data": option.data,
                    "ipv4_setup_id": option.ipv4_setup.id  # ForeignKey to IPv4Setup
                })

        # Return the aggregated data as a response
        return Response(response_data)





from .models import TcpUdpSetup

class CreateOrUpdateTcpUdpSetup1(APIView):

    def create_or_update(self, device_id, name, value, code, attribute):
        """
        Method to either update an existing record or create a new one
        based on device_id and name.
        """
        try:
            # Try to find the existing TCP-UDP setup for the device and name
            tcp_udp_setup = TcpUdpSetup.objects.get(device_id=device_id, name=name)
            # If found, update the value
            tcp_udp_setup.value = value
            tcp_udp_setup.save()
            return {"message": f"Value for {name} updated successfully!"}
        except TcpUdpSetup.DoesNotExist:
            # If not found, create a new one
            TcpUdpSetup.objects.create(
                device_id=device_id,
                name=name,
                value=value,
                code=code,
                attribute=attribute
            )
            return {"message": f"{name} created successfully!"}

    def get(self, request,device_id):
        """
        Retrieves the TCP-UDP setups for a specific device_id.
        """
        

        if not device_id:
            return Response({"error": "device_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve all TCP-UDP setups for the given device_id
        try:
            tcp_udp_setups = TcpUdpSetup.objects.filter(device_id=device_id)
            # Prepare the response data
            data = [
                {
                    "name": setup.name,
                    "value": setup.value,
                    "code": setup.code,
                    "attribute": setup.attribute
                }
                for setup in tcp_udp_setups
            ]
            
            if not data:
                return Response({"message": "No TCP-UDP setups found for this device."}, status=status.HTTP_404_NOT_FOUND)

            return Response(data, status=status.HTTP_200_OK)

        except TcpUdpSetup.DoesNotExist:
            return Response({"message": "No TCP-UDP setups found for this device."}, status=status.HTTP_404_NOT_FOUND)
        
    def post(self, request):
        # Expecting a list of dictionaries in the 'data' field of the request body
        data_list = request.data.get('data', [])

        if not data_list:
            return Response({"error": "Data list cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Initialize a list to store responses for each item in the list
        responses = []

        # Iterate through each item in the list
        for item in data_list:
            device_id = item.get('device_id')
            name = item.get('name')
            value = item.get('value')
            code = item.get('code')
            attribute = item.get('attribute')

            if not device_id or not name or not value or not code or not attribute:
                responses.append({"error": f"All fields for {name} are required."})
                continue

            # Call the create_or_update method
            response_message = self.create_or_update(device_id, name, value, code, attribute)
            responses.append(response_message)

        return Response(responses, status=status.HTTP_200_OK)





import random
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
import json

class CreateOrUpdateTcpUdpSetup(APIView):

    def update_value(self, device_id, name, value):
        """
        Method to update the value of an existing record
        based on device_id and name.
        """
        try:
            # Try to find the existing TCP-UDP setup for the device and name
            tcp_udp_setup = TcpUdpSetup.objects.get(device_id=device_id, name=name)
            # If found, update the value
            tcp_udp_setup.value = value
            tcp_udp_setup.save()
            return {"message": f"Value for {name} updated successfully!"}
        except TcpUdpSetup.DoesNotExist:
            # If not found, return an error
            return {"error": f"{name} not found for device {device_id}."}

    def get(self, request, device_id):
        """
        Retrieves the TCP-UDP setups for a specific device_id.
        And updates the value with random data.
        """
        if not device_id:
            return Response({"error": "device_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare random data to update the value
        data_list = self.generate_random_data()

        # Now update the values by sending data to the update method
        post_response = self.update_values(data_list, device_id)
        
        # Get the TCP-UDP setups for the device (for response)
        tcp_udp_setups = TcpUdpSetup.objects.filter(device_id=device_id)
        data = [
            {
                "name": setup.name,
                "value": setup.value,
                "code": setup.code,
                "attribute": setup.attribute
            }
            for setup in tcp_udp_setups
        ]
        
        if not data:
            return Response({"message": "No TCP-UDP setups found for this device."}, status=status.HTTP_404_NOT_FOUND)
        
        return  Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Handles posting of data list to update the values of TCP-UDP setups.
        """
        data_list = request.data.get('data', [])
        
        if not data_list:
            return Response({"error": "Data list cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        responses = []
        for item in data_list:
            device_id = item.get('device_id')
            name = item.get('name')
            value = item.get('value')

            if not device_id or not name or not value:
                responses.append({"error": f"All fields for {name} are required."})
                continue

            response_message = self.update_value(device_id, name, value)
            responses.append(response_message)

        return Response(responses, status=status.HTTP_200_OK)

    def generate_random_data(self):
        """
        Generates a list of random data for testing purposes.
        """
        names = ["TCP UDP port", "Ip reference", "Mss", "Maximum number of simultane", "Inactivity time out"]
        values = [random.randint(1, 1000) for _ in range(5)]  # Random values between 1 and 1000
        codes = ["{41,0-0.25.0.0.255}"] * 5  # For simplicity, using the same code for all
        attributes = [2, 3, 4, 5, 6]

        # Generate random data for each name
        data_list = []
        for i in range(5):
            data_list.append({
                "name": names[i],
                "value": str(values[i]),  # Random value as a string
                "code": codes[i],
                "attribute": attributes[i]
            })
        
        return data_list

    def update_values(self, data_list, device_id):
        """
        Method to update values of multiple TCP-UDP setups for a device.
        """
        responses = []
        for item in data_list:
            name = item.get('name')
            value = item.get('value')
            
            if name and value:
                response_message = self.update_value(device_id, name, value)
                responses.append(response_message)

        return responses





from .models import ModuleInformation


class ModuleInformationView1(APIView):
    def create_or_update(self, device_id, name, code, value):
        """
        Method to either update an existing record or create a new one
        based on device_id and name.
        """
        try:
            # Try to find the existing module information for the device and name
            module = ModuleInformation.objects.get(device_id=device_id, name=name)
            # If found, update the fields
            module.code = code
            module.value = value
            module.save()
            return {"message": f"Module '{name}' updated successfully!"}
        except ModuleInformation.DoesNotExist:
            # If not found, create a new one
            ModuleInformation.objects.create(
                device_id=device_id,
                name=name,
                code=code,
                value=value,
            )
            return {"message": f"Module '{name}' created successfully!"}

    def get(self, request, device_id=None):
        """
        Retrieves the module information for a specific device_id.
        """
        if not device_id:
            return Response({"error": "device_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve all modules for the given device_id
        try:
            modules = ModuleInformation.objects.filter(device_id=device_id)
            # Prepare the response data
            data = [
                {
                    "name": module.name,
                    "code": module.code,
                    "value": module.value,
                }
                for module in modules
            ]

            if not data:
                return Response({"message": "No module information found for this device."}, status=status.HTTP_404_NOT_FOUND)

            return Response(data, status=status.HTTP_200_OK)

        except ModuleInformation.DoesNotExist:
            return Response({"message": "No module information found for this device."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        """
        Processes a list of module data to create or update entries.
        Expects a list of dictionaries in the 'data' field of the request body.
        """
        # Expecting a list of dictionaries in the 'data' field of the request body
        data_list = request.data.get('data', [])

        if not data_list:
            return Response({"error": "Data list cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Initialize a list to store responses for each item in the list
        responses = []

        # Iterate through each item in the list
        for item in data_list:
            device_id = item.get('device_id')
            name = item.get('name')
            code = item.get('code')
            value = item.get('value')

            if not device_id or not name or not code or not value:
                responses.append({"error": f"All fields for '{name}' are required."})
                continue

            # Call the create_or_update method
            response_message = self.create_or_update(device_id, name, code, value)
            responses.append(response_message)

        return Response(responses, status=status.HTTP_200_OK)




from datetime import datetime
import random
import string

class ModuleInformationView(APIView):
    def create_or_update(self, device_id, name, code, value):
        """
        Method to either update an existing record or create a new one
        based on device_id and name.
        """
        try:
            # Try to find the existing module information for the device and name
            module = ModuleInformation.objects.get(device_id=device_id, name=name)
            # If found, update the fields
            module.code = code
            module.value = value
            module.save()
            return {"message": f"Module '{name}' updated successfully!"}
        except ModuleInformation.DoesNotExist:
            # If not found, create a new one
            ModuleInformation.objects.create(
                device_id=device_id,
                name=name,
                code=code,
                value=value,
            )
            return {"message": f"Module '{name}' created successfully!"}

    def generate_new_firmware_value(self):
        """
        Generates a new firmware version value. You can replace this with any
        logic to generate a unique value every time.
        For now, we are generating a random version string based on the current timestamp.
        """
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")  # Example: 20241119152030
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))  # Example: 1A2B
        new_value = f"v{timestamp}-{random_suffix}"
        return new_value

    def get(self, request, device_id=None):
        """
        Retrieves the module information for a specific device_id,
        but specifically updates or returns the module firmware identifier.
        """
        if not device_id:
            return Response({"error": "device_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Try to find the specific "Module firmware identifier (Version)" module
        try:
            # This should return only the "Module firmware identifier (Version)" module
            module = ModuleInformation.objects.get(device_id=device_id, name="Module firmware identifier (Version)")

            # Generate a new value for the firmware identifier (dynamically)
            new_value = self.generate_new_firmware_value()  # Generate dynamic value
            module.value = new_value
            module.save()

            data = [
                {
                    "name": module.name,
                    "code": module.code,
                    "value": module.value,
                }
            ]

            return Response(data, status=status.HTTP_200_OK)

        except ModuleInformation.DoesNotExist:
            return Response({"message": "Module 'Module firmware identifier (Version)' not found for this device."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        """
        Processes a list of module data to create or update entries.
        Expects a list of dictionaries in the 'data' field of the request body.
        """
        # Expecting a list of dictionaries in the 'data' field of the request body
        data_list = request.data.get('data', [])

        if not data_list:
            return Response({"error": "Data list cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Initialize a list to store responses for each item in the list
        responses = []

        # Iterate through each item in the list
        for item in data_list:
            device_id = item.get('device_id')
            name = item.get('name')
            code = item.get('code')
            value = item.get('value')

            if not device_id or not name or not code or not value:
                responses.append({"error": f"All fields for '{name}' are required."})
                continue

            # Call the create_or_update method
            response_message = self.create_or_update(device_id, name, code, value)
            responses.append(response_message)

        return Response(responses, status=status.HTTP_200_OK)



from .models import GprsSetup

@method_decorator(csrf_exempt, name='dispatch')
class GprsSetupView(APIView):
    """
    Handles creating or updating GPRS setup data.
    """

    def post(self, request, *args, **kwargs):
        try:
            data_list = json.loads(request.body).get('data', [])
            
            if not data_list:
                return JsonResponse({"error": "Data list cannot be empty."}, status=400)

            responses = []

            for item in data_list:
                device_id = item.get('device_id')
                apn = item.get('apn')
                pin_code = item.get('pin_code')
                default_precedence = item.get('default_precedence', 0)
                default_delay = item.get('default_delay', 0)
                default_reliability = item.get('default_reliability', 0)
                default_peak_throughput = item.get('default_peak_throughput', 0)
                requested_precedence = item.get('requested_precedence')
                requested_delay = item.get('requested_delay')
                requested_reliability = item.get('requested_reliability')
                requested_peak_throughput = item.get('requested_peak_throughput')
                requested_mean_throughput = item.get('requested_mean_throughput')

                # Validate and fetch the device instance
                if not device_id:
                    responses.append({"error": "device_id is required."})
                    continue

                device = get_object_or_404(Device, id=device_id)

                try:
                    # Check if an entry already exists
                    gprs_setup = GprsSetup.objects.get(device=device)
                    # Update existing entry
                    gprs_setup.apn = apn
                    gprs_setup.pin_code = pin_code
                    gprs_setup.default_precedence = default_precedence
                    gprs_setup.default_delay = default_delay
                    gprs_setup.default_reliability = default_reliability
                    gprs_setup.default_peak_throughput = default_peak_throughput
                    gprs_setup.requested_precedence = requested_precedence
                    gprs_setup.requested_delay = requested_delay
                    gprs_setup.requested_reliability = requested_reliability
                    gprs_setup.requested_peak_throughput = requested_peak_throughput
                    gprs_setup.requested_mean_throughput = requested_mean_throughput
                    gprs_setup.save()
                    responses.append({"message": f"GPRS setup for device {device_id} updated successfully!"})
                except GprsSetup.DoesNotExist:
                    # Create a new entry
                    GprsSetup.objects.create(
                        device=device,
                        apn=apn,
                        pin_code=pin_code,
                        default_precedence=default_precedence,
                        default_delay=default_delay,
                        default_reliability=default_reliability,
                        default_peak_throughput=default_peak_throughput,
                        requested_precedence=requested_precedence,
                        requested_delay=requested_delay,
                        requested_reliability=requested_reliability,
                        requested_peak_throughput=requested_peak_throughput,
                        requested_mean_throughput=requested_mean_throughput,
                    )
                    responses.append({"message": f"GPRS setup for device {device_id} created successfully!"})

            return JsonResponse(responses, safe=False, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format."}, status=400)














from .models import PPPSetup
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class PPPSetupView(APIView):
    
    def post(self, request):
        # Extract the data from the request
        data = request.data
        type_value = data.get("type")  # Get the type (LCP or IPCP)
        lcp_value = data.get("lcp_value")
        ipcp_value = data.get("ipcp_value")

        # Ensure only the correct value is saved based on the type
        if type_value == "LCP":
            ipcp_value = None  # Clear IPCP value if LCP type
            ipcp_type = None    # Set IPCP_TYPE to None if LCP type
            lcp_type = data.get("LCP_TYPE")  # Only get LCP_TYPE if type is LCP
        elif type_value == "IPCP":
            lcp_value = None  # Clear LCP value if IPCP type
            lcp_type = None    # Set LCP_TYPE to None if IPCP type
            ipcp_type = data.get("IPCP_TYPE")  # Only get IPCP_TYPE if type is IPCP
        else:
            return Response(
                {"error": "Invalid type. Must be 'LCP' or 'IPCP'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the PPPSetup object
        ppp_setup = PPPSetup.objects.create(
            device_id=data.get("device_id"),  # Assuming a ForeignKey to Device
            phy_reference=data.get("phy_reference"),
            type=type_value,
            lcp_value=lcp_value,
            ipcp_value=ipcp_value,
            auth_type=data.get("auth_type"),
            username=data.get("username"),
            password=data.get("password"),
            LCP_TYPE=lcp_type,  # Set LCP_TYPE (only if type is LCP)
            IPCP_TYPE=ipcp_type  # Set IPCP_TYPE (only if type is IPCP)
        )
        
        return Response(
            {"message": "PPP Setup created successfully", "id": ppp_setup.id},
            status=status.HTTP_201_CREATED
        )

    def get(self, request, type, device_id):
        # Ensure 'type' and 'device_id' are provided
        if not type or not device_id:
            return Response(
                {"error": "Both 'type' and 'device_id' are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if 'type' is valid (either LCP or IPCP)
        if type not in ["LCP", "IPCP"]:
            return Response(
                {"error": "Invalid type. Must be 'LCP' or 'IPCP'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filter PPP setup based on type and device_id
        ppp_setups = PPPSetup.objects.filter(type=type, device_id=device_id)

        # Serialize and return response
        ppp_setups_data = [
            {
                "id": ppp.id,
                "phy_reference": ppp.phy_reference,
                "type": ppp.type,
                "lcp_value": ppp.lcp_value,
                "ipcp_value": ppp.ipcp_value,
                "auth_type": ppp.auth_type,
                "username": ppp.username,
                "password": ppp.password,
                "LCP_TYPE": ppp.LCP_TYPE,  # Include LCP_TYPE in the response for LCP type
                "IPCP_TYPE": ppp.IPCP_TYPE  # Include IPCP_TYPE in the response for IPCP type
            }
            for ppp in ppp_setups
        ]

        if ppp_setups_data:
            return Response(ppp_setups_data, status=status.HTTP_200_OK)
        else:
            return Response(
                {"message": "No data found for the given type and device_id."},
                status=status.HTTP_404_NOT_FOUND
            )




from .models import EnergyRegister, Device
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
import json

class EnergyRegisterView(APIView):

    def post(self, request, *args, **kwargs):
        try:
            # Parse the incoming JSON request body
            data = json.loads(request.body)

            device_id = data.get('device_id')  # Get the device_id
            energy_registers = data.get('energy_registers')  # Get the list of energy registers

            # Validate that the device_id and energy_registers are provided
            if not device_id or not energy_registers:
                return JsonResponse({'error': 'Missing required fields (device_id, energy_registers)'}, status=400)

            # Check if the device exists
            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return JsonResponse({'error': 'Device not found'}, status=404)

            # Initialize a list to collect processed energy registers
            processed_registers = []

            # Process each energy register in the list
            for register in energy_registers:
                label = register.get('label')
                code = register.get('code')
                value = register.get('value')
                energy_type = register.get('energy_type')

                # Validate required fields for each energy register
                if not all([label, code, value is not None, energy_type]):
                    return JsonResponse({'error': 'Missing required fields in energy register (label, code, value, energy_type)'}, status=400)

                # Check if value is numeric
                if not isinstance(value, (int, float)):
                    return JsonResponse({'error': 'Value must be a number (int or float)'}, status=400)

                # Check if an energy register with the same device, label, code, and energy_type exists
                try:
                    energy_register = EnergyRegister.objects.get(
                        device=device,
                        label=label,
                        code=code,
                        energy_type=energy_type
                    )
                    # If it exists, update the value
                    energy_register.value = value
                    energy_register.save()
                except EnergyRegister.DoesNotExist:
                    # If it doesn't exist, create a new one
                    energy_register = EnergyRegister.objects.create(
                        device=device,
                        energy_type=energy_type,
                        label=label,
                        code=code,
                        value=value
                    )

                # Append the result (either updated or newly created) to the list
                processed_registers.append({
                    'id': energy_register.id,
                    'device_id': energy_register.device.id,
                    'energy_type': energy_register.energy_type,
                    'label': energy_register.label,
                    'code': energy_register.code,
                    'value': energy_register.value,
                })

            # Return a success response with all processed registers
            return JsonResponse({
                'message': 'Energy Registers processed successfully!',
                'data': processed_registers
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)

        except Exception as e:
            return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)




class EnergyRegisterViewRetrive(APIView):

    def post(self, request, *args, **kwargs):
        try:
            # Parse the incoming JSON request body
            data = json.loads(request.body)

            # Extract device_id and codes list from the request body
            device_id = data.get('device_id')
            codes = data.get('codes')  # Expecting 'codes' as a list of codes

            # Validate that device_id and codes are provided
            if not device_id or not codes:
                return JsonResponse({'error': 'Missing required fields (device_id, codes)'}, status=400)

            # Check if the device exists
            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return JsonResponse({'error': 'Device not found'}, status=404)

            # Retrieve the EnergyRegisters based on device_id and the list of codes
            energy_registers = EnergyRegister.objects.filter(device=device, code__in=codes)

            # Check if any energy registers were found
            if not energy_registers:
                return JsonResponse({'error': 'No Energy Registers found for this device and provided codes'}, status=404)

            # Prepare the data to return
            data = [
                {
                    'id': energy_register.id,
                    'device_id': energy_register.device.id,
                    'energy_type': energy_register.energy_type,
                    'label': energy_register.label,
                    'code': energy_register.code,
                    'value': energy_register.value,
                }
                for energy_register in energy_registers
            ]

            # Return the energy register data
            return JsonResponse({'data': data}, status=200)

        except Exception as e:
            return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import StateOfInternalControl, Device
from django.utils.timezone import localtime
import json  # For parsing the incoming JSON data

class StateOfInternalControlView(APIView):
    """
    View to handle POST requests for StateOfInternalControl.
    """

    def post(self, request):
        try:
            # Parse the incoming JSON request body
            data = request.data  # No need for json.loads(request.body) since request.data handles it
            
            # Extract device_id from the request body
            device_id = data.get('device_id')
            
            # Check if the device exists
            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Create a new StateOfInternalControl entry
            state_of_internal_control = StateOfInternalControl.objects.create(
                device=device,
                factory_mode=data.get('factory_mode', False),
                non_business_mode=data.get('non_business_mode', False),
                main_relay_open=data.get('main_relay_open', False),
                high_temperature=data.get('high_temperature', False),
                punish_measure=data.get('punish_measure', False),
                prepay_mode=data.get('prepay_mode', False),
                low_credit=data.get('low_credit', False),
                friendly_in_use=data.get('friendly_in_use', False),
                no_credit=data.get('no_credit', False),
                top_cover_open=data.get('top_cover_open', False),
                terminal_cover_open=data.get('terminal_cover_open', False),
                module_cover_open=data.get('module_cover_open', False),
                strong_magnetic_disturbance=data.get('strong_magnetic_disturbance', False),
                external_battery_low=data.get('external_battery_low', False),
                code=data.get('code', '{ 1, 0-0:96.5.0.255 }')  # Default code
            )

             # Convert UTC to local time (IST)
            created_at_ist = localtime(state_of_internal_control.created_at)  # Convert to IST

            # Return a success response with the created object details
            return Response(
                {
                    "message": "State of Internal Control created successfully!",
                    "id": state_of_internal_control.id,
                    "device_id": state_of_internal_control.device.id,
                   
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



from .models import InternalOperatingStatus, Device

class InternalOperatingStatusView(APIView):
    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            internal_status = InternalOperatingStatus.objects.create(
                device=device,
                code=data.get('code', '{1, 0-0:96.5.1.255}'),
                uncalibration=data.get('uncalibration', False),
                measure_error=data.get('measure_error', False),
                program_store_error=data.get('program_store_error', False),
                nvm_error=data.get('nvm_error', False),
                ram_error=data.get('ram_error', False),
                abnormal_reset=data.get('abnormal_reset', False),
                module_fault=data.get('module_fault', False),
                rtc_osc_fault=data.get('rtc_osc_fault', False),
                mcu_osc_fault=data.get('mcu_osc_fault', False),
                main_relay_fault=data.get('main_relay_fault', False),
                clock_invalid=data.get('clock_invalid', False),
                ppm_fault=data.get('ppm_fault', False)
            )

            created_at_ist = localtime(internal_status.created_at)

            return Response(
                {
                    "message": "Internal Operating Status created successfully!",
                    "id": internal_status.id,
                    "device_id": internal_status.device.id,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)






# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import PowerQualityStatus, Device
from django.utils.timezone import localtime

class PowerQualityStatusView(APIView):
    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')

            # Check if the device exists
            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Create new PowerQualityStatus entry
            power_quality_status = PowerQualityStatus.objects.create(
                device=device,
                a_phase_miss_voltage=data.get('a_phase_miss_voltage', False),
                a_phase_low_voltage=data.get('a_phase_low_voltage', False),
                a_phase_high_voltage=data.get('a_phase_high_voltage', False),
                a_phase_abnormal=data.get('a_phase_abnormal', False),
                low_frequency=data.get('low_frequency', False),
                high_frequency=data.get('high_frequency', False),
                code=data.get('code', '{1, 0-0:96.5.2.255}')
            )

            created_at_ist = localtime(power_quality_status.created_at)

            return Response({
                "message": "Power Quality Status created successfully!",
                "id": power_quality_status.id,
                "device_id": power_quality_status.device.id,
                "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)







from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TamperIndicateStatus, Device
from django.utils.timezone import localtime

class TamperIndicateStatusView(APIView):
    """
    Handles READ and WRITE DLMS operations for Tamper Indicate Status (OBIS: 0.0.96.5.3.255).
    Similar to MeterDetailAPIView - communicates with meter via DLMS.
    
    POST /api/tamper-indicate-status/
    Body: {
        "serial_number": "device_serial",
        "action": "read_obis" | "write_obis",
        "parameters": {...}  // For read: list of {obis_code, attribute_index}, For write: {obis_code, attribute_index, value}
    }
    """
    def post(self, request):
        action = request.data.get('action', 'read_obis')
        serial_number = request.data.get('serial_number')
        parameters = request.data.get('parameters', {})
        
        print(f"TamperIndicateStatusView received action '{action}' for SN '{serial_number}'")

        if not serial_number:
            return Response({"error": "serial_number is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # --- 1. Get Device and DLMS Config (same as MeterDetailAPIView) ---
            try:
                device = Device.objects.select_related('addressing', 'security', 'user').get(serial_number=serial_number)
                logger.info(f"Found Device with serial_number: {serial_number}")
            except Device.DoesNotExist:
                # Fallback: try via Meter
                try:
                    meter = Meter.objects.select_related('device__addressing', 'device__security', 'device__user').get(serial_number=serial_number)
                    device = meter.device
                    logger.info(f"Found Device via Meter with serial_number: {serial_number}")
                except Meter.DoesNotExist:
                    return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Get active media connection
            media = Media.objects.filter(device=device, is_active=True).first()
            if not media:
                return Response({"error": "No active media connection configured."}, status=status.HTTP_400_BAD_REQUEST)
            
            dlms_config = get_dlms_config_from_device(device, media)
            
            # --- 2. Execute DLMS Action ---
            if action == 'read_obis':
                # Read tamper status from meter
                result = execute_dlms_action(dlms_config, action_details={"action": action, "parameters": parameters})
                
                if result.get("status") == "success":
                    # Optionally update TamperIndicateStatus in DB with live values
                    # The result will contain the tamper flags which can be parsed
                    return Response(result, status=status.HTTP_200_OK)
                else:
                    return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            elif action == 'write_obis':
                # Write tamper status to meter (if supported)
                result = execute_dlms_action(dlms_config, action_details={"action": action, "parameters": parameters})
                
                if result.get("status") == "success":
                    return Response(result, status=status.HTTP_200_OK)
                else:
                    return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({"error": f"Unknown action: {action}"}, status=status.HTTP_400_BAD_REQUEST)

        except Device.DoesNotExist:
            return Response({"error": "Device not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in TamperIndicateStatusView: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)






from .models import ErrorRegister1, Device

class ErrorRegister1View(APIView):
    def post(self, request):
        try:
            data = request.data
            print(data)
            print("data", data)
            device_id = data.get('device_id')

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Try to find an existing ErrorRegister1 for the device
            error_register = ErrorRegister1.objects.filter(device=device).first()

            # If an existing record is found, update it
            if error_register:
                error_register.code = data.get('code', '{1, 0-0:97.98.1.255}')
                error_register.clock_invalid = data.get('clock_invalid', False)
                error_register.battery_replace = data.get('battery_replace', False)
                error_register.program_memory_error = data.get('program_memory_error', False)
                error_register.ram_error = data.get('ram_error', False)
                error_register.nv_memory_error = data.get('nv_memory_error', False)
                error_register.measurement_system_error = data.get('measurement_system_error', False)
                error_register.watchdog_error = data.get('watchdog_error', False)
                error_register.fraud_attempt = data.get('fraud_attempt', False)

                # Save the updated record
                error_register.save()

                message = "Error Register 1 updated successfully!"
            else:
                # If no existing record, create a new one
                error_register = ErrorRegister1.objects.create(
                    device=device,
                    code=data.get('code', '{1, 0-0:97.98.1.255}'),
                    clock_invalid=data.get('clock_invalid', False),
                    battery_replace=data.get('battery_replace', False),
                    program_memory_error=data.get('program_memory_error', False),
                    ram_error=data.get('ram_error', False),
                    nv_memory_error=data.get('nv_memory_error', False),
                    measurement_system_error=data.get('measurement_system_error', False),
                    watchdog_error=data.get('watchdog_error', False),
                    fraud_attempt=data.get('fraud_attempt', False)
                )
                message = "Error Register 1 created successfully!"

            created_at_ist = localtime(error_register.created_at)

            return Response(
                {
                    "message": message,
                    "id": error_register.id,
                    "device_id": error_register.device.id,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK if error_register.id else status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


    def get(self, request,device_id):
        try:
           
            
            if not device_id:
                return Response({'error': 'device_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Retrieve the ErrorRegister1 for the given device
            error_register = ErrorRegister1.objects.filter(device=device).first()

            if not error_register:
                return Response({'error': 'Error Register 1 not found for this device'}, status=status.HTTP_404_NOT_FOUND)

            created_at_ist = localtime(error_register.created_at)

            return Response(
                {
                    "id": error_register.id,
                    "device_id": error_register.device.id,
                    "code": error_register.code,
                    "clock_invalid": error_register.clock_invalid,
                    "battery_replace": error_register.battery_replace,
                    "program_memory_error": error_register.program_memory_error,
                    "ram_error": error_register.ram_error,
                    "nv_memory_error": error_register.nv_memory_error,
                    "measurement_system_error": error_register.measurement_system_error,
                    "watchdog_error": error_register.watchdog_error,
                    "fraud_attempt": error_register.fraud_attempt,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)




from django.utils.timezone import localtime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Device, ErrorRegister2

class ErrorRegister2View(APIView):

    def post(self, request):
        try:
            data = request.data
            print(data)
            print("data", data)
            device_id = data.get('device_id')

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Try to find an existing ErrorRegister2 for the device
            error_register = ErrorRegister2.objects.filter(device=device).first()

            # If an existing record is found, update it
            if error_register:
                error_register.code = data.get('code', '{1, 0-0:97.98.1.255}')
                error_register.total_power_failure = data.get('total_power_failure', False)
                error_register.power_resume = data.get('power_resume', False)
                error_register.voltage_missing_l1 = data.get('voltage_missing_l1', False)
                error_register.voltage_normal_l1 = data.get('voltage_normal_l1', False)
                error_register.missing_neutral = data.get('missing_neutral', False)
                error_register.phase_asymmetry = data.get('phase_asymmetry', False)
                error_register.current_reversal = data.get('current_reversal', False)
                error_register.unexpected_consumption = data.get('unexpected_consumption', False)
                error_register.key_exchanged = data.get('key_exchanged', False)
                error_register.bad_voltage_quality_l1 = data.get('bad_voltage_quality_l1', False)
                error_register.external_alert = data.get('external_alert', False)
                error_register.local_communication_attempt = data.get('local_communication_attempt', False)
                error_register.disconnect_reconnect_fail = data.get('disconnect_reconnect_fail', False)

                # Save the updated record
                error_register.save()

                message = "Error Register 2 updated successfully!"
            else:
                # If no existing record, create a new one
                error_register = ErrorRegister2.objects.create(
                    device=device,
                    code=data.get('code', '{1, 0-0:97.98.1.255}'),
                    total_power_failure=data.get('total_power_failure', False),
                    power_resume=data.get('power_resume', False),
                    voltage_missing_l1=data.get('voltage_missing_l1', False),
                    voltage_normal_l1=data.get('voltage_normal_l1', False),
                    missing_neutral=data.get('missing_neutral', False),
                    phase_asymmetry=data.get('phase_asymmetry', False),
                    current_reversal=data.get('current_reversal', False),
                    unexpected_consumption=data.get('unexpected_consumption', False),
                    key_exchanged=data.get('key_exchanged', False),
                    bad_voltage_quality_l1=data.get('bad_voltage_quality_l1', False),
                    external_alert=data.get('external_alert', False),
                    local_communication_attempt=data.get('local_communication_attempt', False),
                    disconnect_reconnect_fail=data.get('disconnect_reconnect_fail', False)
                )
                message = "Error Register 2 created successfully!"

            created_at_ist = localtime(error_register.created_at)

            return Response(
                {
                    "message": message,
                    "id": error_register.id,
                    "device_id": error_register.device.id,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK if error_register.id else status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, device_id):
        try:
            if not device_id:
                return Response({'error': 'device_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Retrieve the ErrorRegister2 for the given device
            error_register = ErrorRegister2.objects.filter(device=device).first()

            if not error_register:
                return Response({'error': 'Error Register 2 not found for this device'}, status=status.HTTP_404_NOT_FOUND)

            created_at_ist = localtime(error_register.created_at)

            return Response(
                {
                    "id": error_register.id,
                    "device_id": error_register.device.id,
                    "code": error_register.code,
                    "total_power_failure": error_register.total_power_failure,
                    "power_resume": error_register.power_resume,
                    "voltage_missing_l1": error_register.voltage_missing_l1,
                    "voltage_normal_l1": error_register.voltage_normal_l1,
                    "missing_neutral": error_register.missing_neutral,
                    "phase_asymmetry": error_register.phase_asymmetry,
                    "current_reversal": error_register.current_reversal,
                    "unexpected_consumption": error_register.unexpected_consumption,
                    "key_exchanged": error_register.key_exchanged,
                    "bad_voltage_quality_l1": error_register.bad_voltage_quality_l1,
                    "external_alert": error_register.external_alert,
                    "local_communication_attempt": error_register.local_communication_attempt,
                    "disconnect_reconnect_fail": error_register.disconnect_reconnect_fail,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)







from .models import AlarmRegister1




class AlarmRegister1View(APIView):

    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Try to find an existing AlarmRegister1 for the device
            alarm_register = AlarmRegister1.objects.filter(device=device).first()

            # If an existing record is found, update it
            if alarm_register:
                alarm_register.code = data.get('code', '{1,0-0:97.98.0.255}')
                alarm_register.clock_invalid = data.get('clock_invalid', False)
                alarm_register.battery_replace = data.get('battery_replace', False)
                alarm_register.program_memory_error = data.get('program_memory_error', False)
                alarm_register.ram_error = data.get('ram_error', False)
                alarm_register.nv_memory_error = data.get('nv_memory_error', False)
                alarm_register.measurement_system_error = data.get('measurement_system_error', False)
                alarm_register.watchdog_error = data.get('watchdog_error', False)
                alarm_register.fraud_attempt = data.get('fraud_attempt', False)

                # Save the updated record
                alarm_register.save()

                message = "Alarm Register 1 updated successfully!"
            else:
                # If no existing record, create a new one
                alarm_register = AlarmRegister1.objects.create(
                    device=device,
                    code=data.get('code', '{1,0-0:97.98.0.255}'),
                    clock_invalid=data.get('clock_invalid', False),
                    battery_replace=data.get('battery_replace', False),
                    program_memory_error=data.get('program_memory_error', False),
                    ram_error=data.get('ram_error', False),
                    nv_memory_error=data.get('nv_memory_error', False),
                    measurement_system_error=data.get('measurement_system_error', False),
                    watchdog_error=data.get('watchdog_error', False),
                    fraud_attempt=data.get('fraud_attempt', False)
                )
                message = "Alarm Register 1 created successfully!"

            created_at_ist = localtime(alarm_register.created_at)

            return Response(
                {
                    "message": message,
                    "id": alarm_register.id,
                    "device_id": alarm_register.device.id,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK if alarm_register.id else status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, device_id):
        try:
            if not device_id:
                return Response({'error': 'device_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Retrieve the AlarmRegister1 for the given device
            alarm_register = AlarmRegister1.objects.filter(device=device).first()

            if not alarm_register:
                return Response({'error': 'Alarm Register 1 not found for this device'}, status=status.HTTP_404_NOT_FOUND)

            created_at_ist = localtime(alarm_register.created_at)

            return Response(
                {
                    "id": alarm_register.id,
                    "device_id": alarm_register.device.id,
                    "code": alarm_register.code,
                    "clock_invalid": alarm_register.clock_invalid,
                    "battery_replace": alarm_register.battery_replace,
                    "program_memory_error": alarm_register.program_memory_error,
                    "ram_error": alarm_register.ram_error,
                    "nv_memory_error": alarm_register.nv_memory_error,
                    "measurement_system_error": alarm_register.measurement_system_error,
                    "watchdog_error": alarm_register.watchdog_error,
                    "fraud_attempt": alarm_register.fraud_attempt,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



from .models import AlarmRegister2



class AlarmRegister2View(APIView):

    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Try to find an existing AlarmRegister2 for the device
            alarm_register = AlarmRegister2.objects.filter(device=device).first()

            # If an existing record is found, update it
            if alarm_register:
                alarm_register.code = data.get('code', '{1,0-0:97.98.1.255}')
                alarm_register.total_power_failure = data.get('total_power_failure', False)
                alarm_register.power_resume = data.get('power_resume', False)
                alarm_register.voltage_missing_l1 = data.get('voltage_missing_l1', False)
                alarm_register.voltage_normal_l1 = data.get('voltage_normal_l1', False)  # Updated field
                alarm_register.missing_neutral = data.get('missing_neutral', False)
                alarm_register.phase_asymmetry = data.get('phase_asymmetry', False)
                alarm_register.current_reversal = data.get('current_reversal', False)
                alarm_register.unexpected_consumption = data.get('unexpected_consumption', False)
                alarm_register.key_exchanged = data.get('key_exchanged', False)
                alarm_register.bad_voltage_quality_l1 = data.get('bad_voltage_quality_l1', False)
                alarm_register.external_alert = data.get('external_alert', False)
                alarm_register.local_communication_attempt = data.get('local_communication_attempt', False)
                alarm_register.disconnect_reconnect_failure = data.get('disconnect_reconnect_failure', False)

                # Save the updated record
                alarm_register.save()

                message = "Alarm Register 2 updated successfully!"
            else:
                # If no existing record, create a new one
                alarm_register = AlarmRegister2.objects.create(
                    device=device,
                    code=data.get('code', '{1,0-0:97.98.1.255}'),
                    total_power_failure=data.get('total_power_failure', False),
                    power_resume=data.get('power_resume', False),
                    voltage_missing_l1=data.get('voltage_missing_l1', False),
                    voltage_normal_l1=data.get('voltage_normal_l1', False),  # New field
                    missing_neutral=data.get('missing_neutral', False),
                    phase_asymmetry=data.get('phase_asymmetry', False),
                    current_reversal=data.get('current_reversal', False),
                    unexpected_consumption=data.get('unexpected_consumption', False),
                    key_exchanged=data.get('key_exchanged', False),
                    bad_voltage_quality_l1=data.get('bad_voltage_quality_l1', False),
                    external_alert=data.get('external_alert', False),
                    local_communication_attempt=data.get('local_communication_attempt', False),
                    disconnect_reconnect_failure=data.get('disconnect_reconnect_failure', False)
                )
                message = "Alarm Register 2 created successfully!"

            created_at_ist = localtime(alarm_register.created_at)

            return Response(
                {
                    "message": message,
                    "id": alarm_register.id,
                    "device_id": alarm_register.device.id,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK if alarm_register.id else status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, device_id):
        try:
            if not device_id:
                return Response({'error': 'device_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Retrieve the AlarmRegister2 for the given device
            alarm_register = AlarmRegister2.objects.filter(device=device).first()

            if not alarm_register:
                return Response({'error': 'Alarm Register 2 not found for this device'}, status=status.HTTP_404_NOT_FOUND)

            created_at_ist = localtime(alarm_register.created_at)

            return Response(
                {
                    "id": alarm_register.id,
                    "device_id": alarm_register.device.id,
                    "code": alarm_register.code,
                    "total_power_failure": alarm_register.total_power_failure,
                    "power_resume": alarm_register.power_resume,
                    "voltage_missing_l1": alarm_register.voltage_missing_l1,
                    "voltage_normal_l1": alarm_register.voltage_normal_l1,  # Updated field
                    "missing_neutral": alarm_register.missing_neutral,
                    "phase_asymmetry": alarm_register.phase_asymmetry,
                    "current_reversal": alarm_register.current_reversal,
                    "unexpected_consumption": alarm_register.unexpected_consumption,
                    "key_exchanged": alarm_register.key_exchanged,
                    "bad_voltage_quality_l1": alarm_register.bad_voltage_quality_l1,
                    "external_alert": alarm_register.external_alert,
                    "local_communication_attempt": alarm_register.local_communication_attempt,
                    "disconnect_reconnect_failure": alarm_register.disconnect_reconnect_failure,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



from .models import AlarmFilter1
from django.utils.timezone import localtime


class AlarmFilter1View(APIView):

    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Try to find an existing AlarmFilter1 for the device
            alarm_filter = AlarmFilter1.objects.filter(device=device).first()

            # If an existing record is found, update it
            if alarm_filter:
                alarm_filter.code = data.get('code', '{1,0-0:97.98.1.255}')
                alarm_filter.clock_invalid = data.get('clock_invalid', False)
                alarm_filter.battery_replace = data.get('battery_replace', False)
                alarm_filter.program_memory_error = data.get('program_memory_error', False)
                alarm_filter.ram_error = data.get('ram_error', False)
                alarm_filter.nv_memory_error = data.get('nv_memory_error', False)
                alarm_filter.measurement_system_error = data.get('measurement_system_error', False)
                alarm_filter.watchdog_error = data.get('watchdog_error', False)
                alarm_filter.fraud_attempt = data.get('fraud_attempt', False)

                # Save the updated record
                alarm_filter.save()

                message = "Alarm Filter 1 updated successfully!"
            else:
                # If no existing record, create a new one
                alarm_filter = AlarmFilter1.objects.create(
                    device=device,
                    code=data.get('code', '{1,0-0:97.98.1.255}'),
                    clock_invalid=data.get('clock_invalid', False),
                    battery_replace=data.get('battery_replace', False),
                    program_memory_error=data.get('program_memory_error', False),
                    ram_error=data.get('ram_error', False),
                    nv_memory_error=data.get('nv_memory_error', False),
                    measurement_system_error=data.get('measurement_system_error', False),
                    watchdog_error=data.get('watchdog_error', False),
                    fraud_attempt=data.get('fraud_attempt', False)
                )
                message = "Alarm Filter 1 created successfully!"

            created_at_ist = localtime(alarm_filter.created_at)

            return Response(
                {
                    "message": message,
                    "id": alarm_filter.id,
                    "device_id": alarm_filter.device.id,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK if alarm_filter.id else status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, device_id):
        try:
            if not device_id:
                return Response({'error': 'device_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Retrieve the AlarmFilter1 for the given device
            alarm_filter = AlarmFilter1.objects.filter(device=device).first()

            if not alarm_filter:
                return Response({'error': 'Alarm Filter 1 not found for this device'}, status=status.HTTP_404_NOT_FOUND)

            created_at_ist = localtime(alarm_filter.created_at)

            return Response(
                {
                    "id": alarm_filter.id,
                    "device_id": alarm_filter.device.id,
                    "code": alarm_filter.code,
                    "clock_invalid": alarm_filter.clock_invalid,
                    "battery_replace": alarm_filter.battery_replace,
                    "program_memory_error": alarm_filter.program_memory_error,
                    "ram_error": alarm_filter.ram_error,
                    "nv_memory_error": alarm_filter.nv_memory_error,
                    "measurement_system_error": alarm_filter.measurement_system_error,
                    "watchdog_error": alarm_filter.watchdog_error,
                    "fraud_attempt": alarm_filter.fraud_attempt,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)





from .models import AlarmFilter2
from django.utils.timezone import localtime


class AlarmFilter2View(APIView):

    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Try to find an existing AlarmFilter2 for the device
            alarm_filter = AlarmFilter2.objects.filter(device=device).first()

            # If an existing record is found, update it
            if alarm_filter:
                alarm_filter.code = data.get('code', '{1,0-0:97.98.1.255}')
                alarm_filter.total_power_failure = data.get('total_power_failure', False)
                alarm_filter.power_resume = data.get('power_resume', False)
                alarm_filter.voltage_missing_L1 = data.get('voltage_missing_L1', False)
                alarm_filter.voltage_normal_L1 = data.get('voltage_normal_L1', False)
                alarm_filter.missing_neutral = data.get('missing_neutral', False)
                alarm_filter.phase_asymmetry = data.get('phase_asymmetry', False)
                alarm_filter.current_reversal = data.get('current_reversal', False)
                alarm_filter.unexpected_consumption = data.get('unexpected_consumption', False)
                alarm_filter.key_exchanged = data.get('key_exchanged', False)
                alarm_filter.bad_voltage_quality_L1 = data.get('bad_voltage_quality_L1', False)
                alarm_filter.external_alert = data.get('external_alert', False)
                alarm_filter.local_communication_attempt = data.get('local_communication_attempt', False)
                alarm_filter.disconnect_reconnect_failure = data.get('disconnect_reconnect_failure', False)

                # Save the updated record
                alarm_filter.save()

                message = "Alarm Filter 2 updated successfully!"
            else:
                # If no existing record, create a new one
                alarm_filter = AlarmFilter2.objects.create(
                    device=device,
                    code=data.get('code', '{1,0-0:97.98.1.255}'),
                    total_power_failure=data.get('total_power_failure', False),
                    power_resume=data.get('power_resume', False),
                    voltage_missing_L1=data.get('voltage_missing_L1', False),
                    voltage_normal_L1=data.get('voltage_normal_L1', False),
                    missing_neutral=data.get('missing_neutral', False),
                    phase_asymmetry=data.get('phase_asymmetry', False),
                    current_reversal=data.get('current_reversal', False),
                    unexpected_consumption=data.get('unexpected_consumption', False),
                    key_exchanged=data.get('key_exchanged', False),
                    bad_voltage_quality_L1=data.get('bad_voltage_quality_L1', False),
                    external_alert=data.get('external_alert', False),
                    local_communication_attempt=data.get('local_communication_attempt', False),
                    disconnect_reconnect_failure=data.get('disconnect_reconnect_failure', False)
                )
                message = "Alarm Filter 2 created successfully!"

            created_at_ist = localtime(alarm_filter.created_at)

            return Response(
                {
                    "message": message,
                    "id": alarm_filter.id,
                    "device_id": alarm_filter.device.id,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK if alarm_filter.id else status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, device_id):
        try:
            if not device_id:
                return Response({'error': 'device_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Retrieve the AlarmFilter2 for the given device
            alarm_filter = AlarmFilter2.objects.filter(device=device).first()

            if not alarm_filter:
                return Response({'error': 'Alarm Filter 2 not found for this device'}, status=status.HTTP_404_NOT_FOUND)

            created_at_ist = localtime(alarm_filter.created_at)

            return Response(
                {
                    "id": alarm_filter.id,
                    "device_id": alarm_filter.device.id,
                    "code": alarm_filter.code,
                    "total_power_failure": alarm_filter.total_power_failure,
                    "power_resume": alarm_filter.power_resume,
                    "voltage_missing_L1": alarm_filter.voltage_missing_L1,
                    "voltage_normal_L1": alarm_filter.voltage_normal_L1,
                    "missing_neutral": alarm_filter.missing_neutral,
                    "phase_asymmetry": alarm_filter.phase_asymmetry,
                    "current_reversal": alarm_filter.current_reversal,
                    "unexpected_consumption": alarm_filter.unexpected_consumption,
                    "key_exchanged": alarm_filter.key_exchanged,
                    "bad_voltage_quality_L1": alarm_filter.bad_voltage_quality_L1,
                    "external_alert": alarm_filter.external_alert,
                    "local_communication_attempt": alarm_filter.local_communication_attempt,
                    "disconnect_reconnect_failure": alarm_filter.disconnect_reconnect_failure,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)





from .models import AlarmDescriptor1


class AlarmDescriptor1View(APIView):

    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Try to find an existing AlarmDescriptor1 for the device
            alarm_descriptor = AlarmDescriptor1.objects.filter(device=device).first()

            # If an existing record is found, update it
            if alarm_descriptor:
                alarm_descriptor.code = data.get('code', '{1,0-0:97.98.20.255}')
                alarm_descriptor.clock_invalid = data.get('clock_invalid', False)
                alarm_descriptor.battery_replace = data.get('battery_replace', False)
                alarm_descriptor.program_memory_error = data.get('program_memory_error', False)
                alarm_descriptor.ram_error = data.get('ram_error', False)
                alarm_descriptor.nv_memory_error = data.get('nv_memory_error', False)
                alarm_descriptor.measurement_system_error = data.get('measurement_system_error', False)
                alarm_descriptor.watchdog_error = data.get('watchdog_error', False)
                alarm_descriptor.fraud_attempt = data.get('fraud_attempt', False)

                # Save the updated record
                alarm_descriptor.save()

                message = "Alarm Descriptor 1 updated successfully!"
            else:
                # If no existing record, create a new one
                alarm_descriptor = AlarmDescriptor1.objects.create(
                    device=device,
                    code=data.get('code', '{1,0-0:97.98.20.255}'),
                    clock_invalid=data.get('clock_invalid', False),
                    battery_replace=data.get('battery_replace', False),
                    program_memory_error=data.get('program_memory_error', False),
                    ram_error=data.get('ram_error', False),
                    nv_memory_error=data.get('nv_memory_error', False),
                    measurement_system_error=data.get('measurement_system_error', False),
                    watchdog_error=data.get('watchdog_error', False),
                    fraud_attempt=data.get('fraud_attempt', False)
                )
                message = "Alarm Descriptor 1 created successfully!"

            created_at_ist = localtime(alarm_descriptor.created_at)

            return Response(
                {
                    "message": message,
                    "id": alarm_descriptor.id,
                    "device_id": alarm_descriptor.device.id,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK if alarm_descriptor.id else status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, device_id):
        try:
            if not device_id:
                return Response({'error': 'device_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Retrieve the AlarmDescriptor1 for the given device
            alarm_descriptor = AlarmDescriptor1.objects.filter(device=device).first()

            if not alarm_descriptor:
                return Response({'error': 'Alarm Descriptor 1 not found for this device'}, status=status.HTTP_404_NOT_FOUND)

            created_at_ist = localtime(alarm_descriptor.created_at)

            return Response(
                {
                    "id": alarm_descriptor.id,
                    "device_id": alarm_descriptor.device.id,
                    "code": alarm_descriptor.code,
                    "clock_invalid": alarm_descriptor.clock_invalid,
                    "battery_replace": alarm_descriptor.battery_replace,
                    "program_memory_error": alarm_descriptor.program_memory_error,
                    "ram_error": alarm_descriptor.ram_error,
                    "nv_memory_error": alarm_descriptor.nv_memory_error,
                    "measurement_system_error": alarm_descriptor.measurement_system_error,
                    "watchdog_error": alarm_descriptor.watchdog_error,
                    "fraud_attempt": alarm_descriptor.fraud_attempt,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)




from .models import AlarmDescriptor2


class AlarmDescriptor2View(APIView):

    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Try to find an existing AlarmDescriptor2 for the device
            alarm_descriptor = AlarmDescriptor2.objects.filter(device=device).first()

            # If an existing record is found, update it
            if alarm_descriptor:
                alarm_descriptor.code = data.get('code', '{1,0-0:97.98.1.255}')
                alarm_descriptor.total_power_failure = data.get('total_power_failure', False)
                alarm_descriptor.power_resume = data.get('power_resume', False)
                alarm_descriptor.voltage_missing_l1 = data.get('voltage_missing_l1', False)
                alarm_descriptor.voltage_normal_l1 = data.get('voltage_normal_l1', False)
                alarm_descriptor.missing_neutral = data.get('missing_neutral', False)
                alarm_descriptor.phase_asymmetry = data.get('phase_asymmetry', False)
                alarm_descriptor.current_reversal = data.get('current_reversal', False)
                alarm_descriptor.unexpected_consumption = data.get('unexpected_consumption', False)
                alarm_descriptor.key_exchanged = data.get('key_exchanged', False)
                alarm_descriptor.bad_voltage_quality_l1 = data.get('bad_voltage_quality_l1', False)
                alarm_descriptor.external_alert = data.get('external_alert', False)
                alarm_descriptor.local_communication_attempt = data.get('local_communication_attempt', False)
                alarm_descriptor.disconnect_reconnect_failure = data.get('disconnect_reconnect_failure', False)

                # Save the updated record
                alarm_descriptor.save()

                message = "Alarm Descriptor 2 updated successfully!"
            else:
                # If no existing record, create a new one
                alarm_descriptor = AlarmDescriptor2.objects.create(
                    device=device,
                    code=data.get('code', '{1,0-0:97.98.1.255}'),
                    total_power_failure=data.get('total_power_failure', False),
                    power_resume=data.get('power_resume', False),
                    voltage_missing_l1=data.get('voltage_missing_l1', False),
                    voltage_normal_l1=data.get('voltage_normal_l1', False),
                    missing_neutral=data.get('missing_neutral', False),
                    phase_asymmetry=data.get('phase_asymmetry', False),
                    current_reversal=data.get('current_reversal', False),
                    unexpected_consumption=data.get('unexpected_consumption', False),
                    key_exchanged=data.get('key_exchanged', False),
                    bad_voltage_quality_l1=data.get('bad_voltage_quality_l1', False),
                    external_alert=data.get('external_alert', False),
                    local_communication_attempt=data.get('local_communication_attempt', False),
                    disconnect_reconnect_failure=data.get('disconnect_reconnect_failure', False)
                )
                message = "Alarm Descriptor 2 created successfully!"

            created_at_ist = localtime(alarm_descriptor.created_at)

            return Response(
                {
                    "message": message,
                    "id": alarm_descriptor.id,
                    "device_id": alarm_descriptor.device.id,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK if alarm_descriptor.id else status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, device_id):
        try:
            if not device_id:
                return Response({'error': 'device_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)

            # Retrieve the AlarmDescriptor2 for the given device
            alarm_descriptor = AlarmDescriptor2.objects.filter(device=device).first()

            if not alarm_descriptor:
                return Response({'error': 'Alarm Descriptor 2 not found for this device'}, status=status.HTTP_404_NOT_FOUND)

            created_at_ist = localtime(alarm_descriptor.created_at)

            return Response(
                {
                    "id": alarm_descriptor.id,
                    "device_id": alarm_descriptor.device.id,
                    "code": alarm_descriptor.code,
                    "total_power_failure": alarm_descriptor.total_power_failure,
                    "power_resume": alarm_descriptor.power_resume,
                    "voltage_missing_l1": alarm_descriptor.voltage_missing_l1,
                    "voltage_normal_l1": alarm_descriptor.voltage_normal_l1,
                    "missing_neutral": alarm_descriptor.missing_neutral,
                    "phase_asymmetry": alarm_descriptor.phase_asymmetry,
                    "current_reversal": alarm_descriptor.current_reversal,
                    "unexpected_consumption": alarm_descriptor.unexpected_consumption,
                    "key_exchanged": alarm_descriptor.key_exchanged,
                    "bad_voltage_quality_l1": alarm_descriptor.bad_voltage_quality_l1,
                    "external_alert": alarm_descriptor.external_alert,
                    "local_communication_attempt": alarm_descriptor.local_communication_attempt,
                    "disconnect_reconnect_failure": alarm_descriptor.disconnect_reconnect_failure,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


from .models import Device, EventReportFilter
from django.core.exceptions import ObjectDoesNotExist


class EventReportFilterView(APIView):


    def post(self, request):
        try:
            data = request.data
            print(data)
            device_id = data.get('device_id')

            # Try to retrieve the device by its ID
            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return JsonResponse({'error': 'Device not found'}, status=404)

            # Check if a filter with the given name exists in the database
            existing_filter = EventReportFilter.objects.filter(name=data.get('name')).first()

            # If the filter exists, update it; otherwise, create a new one
            if existing_filter:
                # Update the existing filter with the given data
                event_filter, created = EventReportFilter.objects.update_or_create(
                    device=device,
                    filter_type=data.get('filter_type'),
                    name=data.get('name'),  # Ensure we match the name for update
                    defaults={
                        'bit': data.get('bit', '0000'),
                        'checked': data.get('checked', False)
                    }
                )
                message = "Event Report Filter updated successfully!"
            else:
                # Create a new filter if the name doesn't exist
                event_filter = EventReportFilter.objects.create(
                    device=device,
                    filter_type=data.get('filter_type'),
                    name=data.get('name', 'Default Filter'),
                    bit=data.get('bit', '0000'),
                    checked=data.get('checked', False)
                )
                created = True  # Set created to True since it's a new entry
                message = "Event Report Filter created successfully!"

            # Return the response with appropriate status and message
            return JsonResponse(
                {
                    "message": message,
                    "id": event_filter.id,
                    "device_id": event_filter.device.id,
                },
                status=201 if created else 200
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)



    def get(self, request, device_id, filter_type=None):
        try:
            if not device_id:
                return JsonResponse({'error': 'device_id parameter is required'}, status=400)

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                return JsonResponse({'error': 'Device not found'}, status=404)

            # Retrieve event filters for the specified device
            event_filters = EventReportFilter.objects.filter(device=device)

            if filter_type:
                event_filters = event_filters.filter(filter_type=filter_type)

            # Check if there are any event filters
            if not event_filters.exists():
                # If no filters found, return an empty list
                return JsonResponse([], safe=False, status=200)

            # Process and return the event filters
            results = []
            for event_filter in event_filters:
                created_at_ist = localtime(event_filter.created_at)
                results.append({
                    "id": event_filter.id,
                    "filter_type": event_filter.filter_type,
                    "bit": event_filter.bit,
                    "name": event_filter.name,
                    "checked": event_filter.checked,
                    "created_at": created_at_ist.strftime('%Y-%m-%d %H:%M:%S')
                })

            return JsonResponse(results, safe=False, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)



from .models import DemandConfigure
from django.shortcuts import get_object_or_404
from django.utils.timezone import localtime


'''
{
  "device_id": 1,
  "name": "Sub-interval time for max",
  "code": "{5,1-0:1.4.0.255}",
  "attribute": 8,
  "checked": true
} '''

class DemandConfigureView(APIView):


    def post(self, request):
        try:
            data = request.data
            print(data)
            response_data = []
            
            # Iterate over each item in the list
            for item in data:
                device_id = item.get('device_id')
                device = get_object_or_404(Device, id=device_id)
                
                # Explicitly convert 'checked' to boolean
                checked_value = bool(item.get('checked'))
                
                # Update or create new configuration
                demand_config, created = DemandConfigure.objects.update_or_create(
                    device=device,
                    name=item.get('name'),
                    attribute=item.get('attribute'),
                    defaults={
                        'code': item.get('code', '{5,1-0:1.4.0.255}'),
                        'checked': checked_value
                    }
                )
                
                # Append success message to response
                response_data.append({
                    "message": "Created" if created else "Updated",
                    "id": demand_config.id,
                    "device_id": demand_config.device.id,
                    "name": demand_config.name
                })
                
            # Return full response
            return JsonResponse(response_data, safe=False, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)




    def get(self, request, device_id):
        try:
            device = get_object_or_404(Device, id=device_id)
            demand_configs = DemandConfigure.objects.filter(device=device)

            results = [
                {
                    "id": config.id,
                    "name": config.name,
                    "code": config.code,
                    "attribute": config.get_attribute_display(),
                    "checked": config.checked,
                }
                for config in demand_configs
            ]

            return JsonResponse(results, safe=False, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)




from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Payment


#[
#    {"name": "Credit Card", "code": "CC-001"},
#   {"name": "PayPal", "code": "PP-002"},
#   {"name": "Bank Transfer", "code": "BT-003"},
#   {"name": "Cash", "code": "CS-004"},
#   {"name": "Cryptocurrency", "code": "CR-005"}]


class PaymentCreateView(APIView):
    """
    API to add a list of payments (name and code) to the database.
    """

    def post(self, request):
        try:
            payment_data = request.data  # Get the list of payments from the request body
            
            if not isinstance(payment_data, list):  # Ensure the data is a list
                return Response({"error": "Expected a list of payment objects."}, status=status.HTTP_400_BAD_REQUEST)

            response_data = []  # To collect success or error details for each entry

            for payment in payment_data:
                name = payment.get("name")
                code = payment.get("code")

                # Validate if name and code exist
                if not name or not code:
                    response_data.append({
                        "message": "Missing required fields.",
                        "name": name,
                        "code": code,
                    })
                    continue

                # Add to the database or skip if it already exists
                payment_obj, created = Payment.objects.get_or_create(name=name, code=code)
                response_data.append({
                    "message": "Created" if created else "Already exists",
                    "name": payment_obj.name,
                    "code": payment_obj.code,
                })

            return Response(response_data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from .models import Payment, PaymentDetail, Device

class PaymentDetailView(APIView):

    def post(self, request):
        """
        Handles creation or update of PaymentDetail records.
        """
        try:
            data = request.data
            if not isinstance(data, list):
                raise ValidationError("Expected a list of payment details.")

            response_data = []

            # Iterate over each item in the list
            for item in data:
                # Validate required fields
                device_id = item.get('device_id')
                payment_id = item.get('payment_id')
                parameter_name = item.get('parameter_name')
                parameter_code = item.get('parameter_code')

                if not all([device_id, payment_id, parameter_name, parameter_code]):
                    raise ValidationError(
                        "Fields 'device_id', 'payment_id', 'parameter_name', and 'parameter_code' are required."
                    )

                # Get the device and payment objects
                device = get_object_or_404(Device, id=device_id)
                payment = get_object_or_404(Payment, id=payment_id)

                # Create or update payment details
                payment_detail, created = PaymentDetail.objects.update_or_create(
                    device=device,
                    payment=payment,
                    parameter_name=parameter_name,
                    parameter_code=parameter_code,
                    defaults={
                        'value': item.get('value', 0.0),
                    }
                )

                # Append success message to response
                response_data.append({
                    "message": "Created" if created else "Updated",
                    "id": payment_detail.id,
                    "payment_id": payment_detail.payment.id,
                    "parameter_name": payment_detail.parameter_name,
                    "parameter_code": payment_detail.parameter_code,
                    "value": payment_detail.value,
                })

            # Return the full response
            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

'''
[
    {
        "device_id": 1,
        "payment_id": 1,
        "parameter_name": "Residual credit",
        "parameter_code": "3,0-0:19.130.0.255",
        "value": 100.0
    },
    {
        "device_id": 1,
        "payment_id": 1,
        "parameter_name": "Energy used",
        "parameter_code": "3,1-0:15.9.0.255",
        "value": 50.5
    },
    {
        "device_id": 1,
        "payment_id": 1,
        "parameter_name": "Currency used",
        "parameter_code": "3,0-0:19.133.0.255",
        "value": 150.0
    },
    {
        "device_id": 1,
        "payment_id": 2,
        "parameter_name": "Cumulative purchase credit",
        "parameter_code": "3,1-65:1.140.2.255",
        "value": 100.0
    },
    {
        "device_id": 1,
        "payment_id": 1,
        "parameter_name": "Last purchase credit",
        "parameter_code": "3,1-65:1.1.140.10.255",
        "value": 75.0
    }
] '''



import logging

logger = logging.getLogger(__name__)

class PaymentDetailView(APIView):

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                raise ValidationError("Expected a list of payment details.")

            response_data = []

            for item in data:
                logger.debug(f"Processing item: {item}")
                
                # Validate required fields
                device_id = item.get('device_id')
                payment_id = item.get('payment_id')
                parameter_name = item.get('parameter_name')
                parameter_code = item.get('parameter_code')

                if not all([device_id, payment_id, parameter_name, parameter_code]):
                    raise ValidationError(
                        "Fields 'device_id', 'payment_id', 'parameter_name', and 'parameter_code' are required."
                    )

                # Get the device and payment objects
                try:
                    device = get_object_or_404(Device, id=device_id)
                    payment = get_object_or_404(Payment, id=payment_id)
                except Exception as e:
                    logger.error(f"Error retrieving device or payment: {e}")
                    raise ValidationError(f"Invalid device_id or payment_id: {device_id}, {payment_id}")

                # Create or update payment details
                payment_detail, created = PaymentDetail.objects.update_or_create(
                    device=device,
                    payment=payment,
                    parameter_name=parameter_name,
                    parameter_code=parameter_code,
                    defaults={'value': item.get('value', 0.0)},
                )

                response_data.append({
                    "message": "Created" if created else "Updated",
                    "id": payment_detail.id,
                    "payment_id": payment_detail.payment.id,
                    "parameter_name": payment_detail.parameter_name,
                    "parameter_code": payment_detail.parameter_code,
                    "value": payment_detail.value,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            logger.error(f"Unhandled exception: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)
        


    def get(self, request, device_id=None):
        try:
            logger.debug(f"Fetching payment details for device ID: {device_id}")

            # Fetch the device using the provided device_id
            device = get_object_or_404(Device, id=device_id)

            # Fetch all payment details for the given device
            payment_details = PaymentDetail.objects.filter(device=device)

            # Prepare the response data
            results = [
                {
                    "id": detail.id,
                    "payment_id": detail.payment.id,
                    "parameter_name": detail.parameter_name,
                    "parameter_code": detail.parameter_code,
                    "value": detail.value,
                }
                for detail in payment_details
            ]

            logger.debug(f"Found {len(results)} payment details for device ID {device_id}")
            
            return JsonResponse(results, safe=False, status=200)

        except Exception as e:
            logger.error(f"Unhandled exception while fetching payment details: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)   
        

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from .models import DailyPayment, Device, Payment
import logging

logger = logging.getLogger(__name__)

class DailyPaymentView(APIView):

    # POST method to create or update DailyPayment records
    def post(self, request):
        try:
            data = request.data
            print(data)
            if not isinstance(data, list):
                raise ValidationError("Expected a list of daily payment records.")

            response_data = []

            for item in data:
                logger.debug(f"Processing item: {item}")
                
                # Validate required fields
                device_id = item.get('device_id')
                payment_id = item.get('payment_id')
                parameter_name = item.get('parameter_name')
                parameter_code = item.get('parameter_code')

                if not all([device_id, payment_id, parameter_name, parameter_code]):
                    raise ValidationError(
                        "Fields 'device_id', 'payment_id', 'parameter_name', and 'parameter_code' are required."
                    )

                # Get the device and payment objects
                try:
                    device = get_object_or_404(Device, id=device_id)
                    payment = get_object_or_404(Payment, id=payment_id)
                except Exception as e:
                    logger.error(f"Error retrieving device or payment: {e}")
                    raise ValidationError(f"Invalid device_id or payment_id: {device_id}, {payment_id}")

                # Create or update daily payment records
                daily_payment, created = DailyPayment.objects.update_or_create(
                    device=device,
                    payment=payment,
                    parameter_name=parameter_name,
                    parameter_code=parameter_code,
                    defaults={'value': item.get('value', 0.0)},
                )

                response_data.append({
                    "message": "Created" if created else "Updated",
                    "id": daily_payment.id,
                    "payment_id": daily_payment.payment.id,
                    "parameter_name": daily_payment.parameter_name,
                    "parameter_code": daily_payment.parameter_code,
                    "value": daily_payment.value,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            logger.error(f"Unhandled exception: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    # GET method to fetch DailyPayment records based on device ID
    def get(self, request, device_id=None):
        try:
            logger.debug(f"Fetching daily payment records for device ID: {device_id}")

            # Fetch the device using the provided device_id
            device = get_object_or_404(Device, id=device_id)

            # Fetch all daily payment records for the given device
            daily_payments = DailyPayment.objects.filter(device=device)

            # Prepare the response data
            results = [
                {
                    "id": payment.id,
                    "payment_id": payment.payment.id,
                    "parameter_name": payment.parameter_name,
                    "parameter_code": payment.parameter_code,
                    "value": payment.value,
                }
                for payment in daily_payments
            ]

            logger.debug(f"Found {len(results)} daily payment records for device ID {device_id}")
            
            return JsonResponse(results, safe=False, status=200)

        except Exception as e:
            logger.error(f"Unhandled exception while fetching daily payment records: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)



from .models import ActiveEnergyRegister, Device
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)

class ActiveEnergyRegisterView(APIView):

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                raise ValidationError("Expected a list of active energy registers.")

            response_data = []

            for item in data:
                logger.debug(f"Processing item: {item}")

                # Validate required fields
                device_id = item.get('device_id')
                name = item.get('name')  # Name now includes rate info
                register_code = item.get('register_code')
                billing_period = item.get('billing_period')

                if not all([device_id, name, register_code, billing_period]):
                    raise ValidationError(
                        "Fields 'device_id', 'name', 'register_code', and 'billing_period' are required."
                    )

                # Get the device object
                try:
                    device = get_object_or_404(Device, id=device_id)
                except Exception as e:
                    logger.error(f"Error retrieving device: {e}")
                    raise ValidationError(f"Invalid device_id: {device_id}")

                # Create or update active energy register
                active_energy_register, created = ActiveEnergyRegister.objects.update_or_create(
                    device=device,
                    name=name,
                    register_code=register_code,
                    defaults={'value': item.get('value', 0.0), 'billing_period': billing_period},
                )

                response_data.append({
                    "message": "Created" if created else "Updated",
                    "id": active_energy_register.id,
                    "device_id": active_energy_register.device.id,
                    "name": active_energy_register.name,
                    "register_code": active_energy_register.register_code,
                    "value": active_energy_register.value,
                    "billing_period": active_energy_register.billing_period,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            logger.error(f"Unhandled exception: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            logger.debug(f"Fetching active energy registers for device ID: {device_id}")

            # Fetch the device using the provided device_id
            device = get_object_or_404(Device, id=device_id)

            # Fetch all active energy registers for the given device
            active_energy_registers = ActiveEnergyRegister.objects.filter(device=device)

            # Prepare the response data
            results = [
                {
                    "id": register.id,
                    "device_id": register.device.id,
                    "name": register.name,
                    "register_code": register.register_code,
                    "value": register.value,
                    "billing_period": register.billing_period,
                }
                for register in active_energy_registers
            ]

            logger.debug(f"Found {len(results)} active energy registers for device ID {device_id}")

            return JsonResponse(results, safe=False, status=200)

        except Exception as e:
            logger.error(f"Unhandled exception while fetching active energy registers: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)



import logging
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from .models import ActiveEnergyRegister, Device
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)


'''[
  {
    "device_id": 1,
    "name": "Active energy import (+A) 3,1-0:1.8.0.255",
    "register_code": "3,1-0:1.8.0.255",
    "value": 200.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy import (+A) rate 1 3,1-0:1.8.1.255",
    "register_code": "3,1-0:1.8.1.255",
    "value": 200.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy import (+A) rate 2 3,1-0:1.8.2.255",
    "register_code": "3,1-0:1.8.2.255",
    "value": 200.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy import (+A) rate 3 3,1-0:1.8.3.255",
    "register_code": "3,1-0:1.8.3.255",
    "value": 200.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy import (+A) rate 4 3,1-0:1.8.4.255",
    "register_code": "3,1-0:1.8.4.255",
    "value": 200.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy export (-A) 3,1-0:2.8.0.255",
    "register_code": "3,1-0:2.8.0.255",
    "value": 50.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy export (-A) rate 1 3,1-0:2.8.1.255",
    "register_code": "3,1-0:2.8.1.255",
    "value": 60.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy export (-A) rate 2 3,1-0:2.8.2.255",
    "register_code": "3,1-0:2.8.2.255",
    "value": 70.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy export (-A) rate 3 3,1-0:2.8.3.255",
    "register_code": "3,1-0:2.8.3.255",
    "value": 80.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy export (-A) rate 4 3,1-0:2.8.4.255",
    "register_code": "3,1-0:2.8.4.255",
    "value": 90.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| + |-A|) 3,1-0:15.8.0.255",
    "register_code": "3,1-0:15.8.0.255",
    "value": 200.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| + |-A|) rate 1 3,1-0:15.8.1.255",
    "register_code": "3,1-0:15.8.1.255",
    "value": 210.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| + |-A|) rate 2 3,1-0:15.8.2.255",
    "register_code": "3,1-0:15.8.2.255",
    "value": 100.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| + |-A|) rate 3 3,1-0:15.8.3.255",
    "register_code": "3,1-0:15.8.3.255",
    "value": 100.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| + |-A|) rate 4 3,1-0:15.8.4.255",
    "register_code": "3,1-0:15.8.4.255",
    "value": 100.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| - |-A|) 3,1-0:16.8.0.255",
    "register_code": "3,1-0:16.8.0.255",
    "value": 100.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| - |-A|) rate 1 3,1-0:16.8.1.255",
    "register_code": "3,1-0:16.8.1.255",
    "value": 310.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| - |-A|) rate 2 3,1-0:16.8.2.255",
    "register_code": "3,1-0:16.8.2.255",
    "value": 320.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| - |-A|) rate 3 3,1-0:16.8.3.255",
    "register_code": "3,1-0:16.8.3.255",
    "value": 330.0,
    "billing_period": "daily"
  },
  {
    "device_id": 1,
    "name": "Active energy Combined total (|+A| - |-A|) rate 4 3,1-0:16.8.4.255",
    "register_code": "3,1-0:16.8.4.255",
    "value": 340.0,
    "billing_period": "daily"
  }
]'''

class ActiveEnergyRegisterView(APIView):

   def post(self, request):
    try:
        data = request.data
        print('data')
        if not isinstance(data, list):
            raise ValidationError("Expected a list of active energy registers.")

        response_data = []

        for item in data:
            logger.debug(f"Processing item: {item}")

            # Validate required fields
            device_id = item.get('device_id')
            name = item.get('name')  # Name now includes rate info
            register_code = item.get('register_code')
            billing_period = item.get('billing_period')

            if not all([device_id, name, register_code, billing_period]):
                raise ValidationError(
                    "Fields 'device_id', 'name', 'register_code', and 'billing_period' are required."
                )

            # Get the device object
            try:
                device = get_object_or_404(Device, id=device_id)
            except Exception as e:
                logger.error(f"Error retrieving device: {e}")
                raise ValidationError(f"Invalid device_id: {device_id}")

            # Check if a register with the same device_id, name, and register_code exists with the correct billing period
            try:
                # Try to fetch the existing register based on device, name, register_code, and billing_period
                active_energy_register = ActiveEnergyRegister.objects.filter(
                    device=device,
                    name=name,
                    register_code=register_code,
                    billing_period=billing_period
                ).first()

                if active_energy_register:
                    # If a matching record is found, update its value
                    active_energy_register.value = item.get('value', 0.0)
                    active_energy_register.save()
                    response_message = "Updated"
                else:
                    # If no matching record is found, create a new one
                    active_energy_register = ActiveEnergyRegister.objects.create(
                        device=device,
                        name=name,
                        register_code=register_code,
                        value=item.get('value', 0.0),
                        billing_period=billing_period
                    )
                    response_message = "Created"

                response_data.append({
                    "message": response_message,
                    "id": active_energy_register.id,
                    "device_id": active_energy_register.device.id,
                    "name": active_energy_register.name,
                    "register_code": active_energy_register.register_code,
                    "value": active_energy_register.value,
                    "billing_period": active_energy_register.billing_period,
                })

            except Exception as e:
                logger.error(f"Error processing item: {e}")
                raise ValidationError("An error occurred while processing the active energy register.")

        return JsonResponse(response_data, safe=False, status=201)

    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return JsonResponse({"error": str(e)}, status=400)

    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)

   def get(self, request,billing_period=None, device_id=None):
    try:
        
        logger.debug(f"Fetching active energy registers for device ID: {device_id} with billing_period: {billing_period}")

        # Fetch the device using the provided device_id
        device = get_object_or_404(Device, id=device_id)

        # If billing_period is provided, filter based on the billing period; otherwise, fetch all
        if billing_period:
            active_energy_registers = ActiveEnergyRegister.objects.filter(device=device, billing_period=billing_period)
        else:
            active_energy_registers = ActiveEnergyRegister.objects.filter(device=device)

        # Prepare the response data
        results = [
            {
                "id": register.id,
                "device_id": register.device.id,
                "parameter_name": register.name,
                "parameter_code": register.register_code,
                "value": register.value,
                "billing_period": register.billing_period,
            }
            for register in active_energy_registers
        ]

        logger.debug(f"Found {len(results)} active energy registers for device ID {device_id}")

        return JsonResponse(results, safe=False, status=200)

    except Exception as e:
        logger.error(f"Unhandled exception while fetching active energy registers: {e}")
        return JsonResponse({"error": "An unexpected error occurred."}, status=500)

from .models import ReactiveEnergyRegister, Device

'''[
    {
        "device_id": 1,
        "name": "Reactive energy import (+R)",
        "register_code": "3,1-0:3.8.0.255",
        "value": 100.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy import (+R) rate 1",
        "register_code": "3,1-0:3.8.1.255",
        "value": 50.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy import (+R) rate 2",
        "register_code": "3,1-0:3.8.2.255",
        "value": 60.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy import (+R) rate 3",
        "register_code": "3,1-0:3.8.3.255",
        "value": 70.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy import (+R) rate 4",
        "register_code": "3,1-0:3.8.4.255",
        "value": 80.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy export (-R)",
        "register_code": "3,1-0:4.8.0.255",
        "value": 90.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy export (-R) rate 1",
        "register_code": "3,1-0:4.8.1.255",
        "value": 55.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy export (-R) rate 2",
        "register_code": "3,1-0:4.8.4.255",
        "value": 65.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy export (-R) rate 3",
        "register_code": "3,1-0:4.8.3.255",
        "value": 75.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri)",
        "register_code": "3,1-0:5.8.0.255",
        "value": 85.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri) rate 1",
        "register_code": "3,1-0:5.8.1.255",
        "value": 45.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri) rate 2",
        "register_code": "3,1-0:5.8.2.255",
        "value": 55.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri) rate 3",
        "register_code": "3,1-0:5.8.3.255",
        "value": 65.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri) rate 4",
        "register_code": "3,1-0:5.8.4.255",
        "value": 75.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc)",
        "register_code": "3,1-0:6.8.0.255",
        "value": 120.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc) rate 1",
        "register_code": "3,1-0:6.8.1.255",
        "value": 65.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc) rate 2",
        "register_code": "3,1-0:6.8.2.255",
        "value": 75.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc) rate 3",
        "register_code": "3,1-0:6.8.3.255",
        "value": 85.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc) rate 4",
        "register_code": "3,1-0:5.6.4.255",
        "value": 95.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri)",
        "register_code": "3,1-0:7.8.0.255",
        "value": 110.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri) rate 1",
        "register_code": "3,1-0:7.8.1.255",
        "value": 60.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri) rate 2",
        "register_code": "3,1-0:7.8.2.255",
        "value": 70.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri) rate 3",
        "register_code": "3,1-0:7.8.3.255",
        "value": 80.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri) rate 4",
        "register_code": "3,1-0:7.8.4.255",
        "value": 90.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc)",
        "register_code": "3,1-0:8.8.0.255",
        "value": 130.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc) rate 1",
        "register_code": "3,1-0:8.8.1.255",
        "value": 70.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc) rate 2",
        "register_code": "3,1-0:8.8.2.255",
        "value": 80.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc) rate 3",
        "register_code": "3,1-0:8.8.3.255",
        "value": 90.00,
        "billing_period": "monthly"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc) rate 4",
        "register_code": "3,1-8:5.6.4.255",
        "value": 100.00,
        "billing_period": "monthly"
    }
]
'''



'''
[
    {
        "device_id": 1,
        "name": "Reactive energy import (+R)",
        "register_code": "3,1-0:3.8.0.255",
        "value": 100.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy import (+R) rate 1",
        "register_code": "3,1-0:3.8.1.255",
        "value": 50.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy import (+R) rate 2",
        "register_code": "3,1-0:3.8.2.255",
        "value": 60.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy import (+R) rate 3",
        "register_code": "3,1-0:3.8.3.255",
        "value": 70.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy import (+R) rate 4",
        "register_code": "3,1-0:3.8.4.255",
        "value": 80.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy export (-R)",
        "register_code": "3,1-0:4.8.0.255",
        "value": 90.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy export (-R) rate 1",
        "register_code": "3,1-0:4.8.1.255",
        "value": 55.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy export (-R) rate 2",
        "register_code": "3,1-0:4.8.4.255",
        "value": 65.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy export (-R) rate 3",
        "register_code": "3,1-0:4.8.3.255",
        "value": 75.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri)",
        "register_code": "3,1-0:5.8.0.255",
        "value": 85.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri) rate 1",
        "register_code": "3,1-0:5.8.1.255",
        "value": 45.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri) rate 2",
        "register_code": "3,1-0:5.8.2.255",
        "value": 55.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri) rate 3",
        "register_code": "3,1-0:5.8.3.255",
        "value": 65.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QI (+Ri) rate 4",
        "register_code": "3,1-0:5.8.4.255",
        "value": 75.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc)",
        "register_code": "3,1-0:6.8.0.255",
        "value": 120.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc) rate 1",
        "register_code": "3,1-0:6.8.1.255",
        "value": 65.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc) rate 2",
        "register_code": "3,1-0:6.8.2.255",
        "value": 75.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc) rate 3",
        "register_code": "3,1-0:6.8.3.255",
        "value": 85.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QII (+Rc) rate 4",
        "register_code": "3,1-0:5.6.4.255",
        "value": 95.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri)",
        "register_code": "3,1-0:7.8.0.255",
        "value": 110.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri) rate 1",
        "register_code": "3,1-0:7.8.1.255",
        "value": 60.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri) rate 2",
        "register_code": "3,1-0:7.8.2.255",
        "value": 70.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri) rate 3",
        "register_code": "3,1-0:7.8.3.255",
        "value": 80.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIII (-Ri) rate 4",
        "register_code": "3,1-0:7.8.4.255",
        "value": 90.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc)",
        "register_code": "3,1-0:8.8.0.255",
        "value": 130.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc) rate 1",
        "register_code": "3,1-0:8.8.1.255",
        "value": 70.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc) rate 2",
        "register_code": "3,1-0:8.8.2.255",
        "value": 80.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc) rate 3",
        "register_code": "3,1-0:8.8.3.255",
        "value": 90.00,
        "billing_period": "daily"
    },
    {
        "device_id": 1,
        "name": "Reactive energy QIV (-Rc) rate 4",
        "register_code": "3,1-8:5.6.4.255",
        "value": 100.00,
        "billing_period": "daily"
    }
]
'''



class ReactiveEnergyRegisterView(APIView):
   

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                raise ValidationError("Expected a list of reactive energy registers.")

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                name = item.get('name')
                register_code = item.get('register_code')
                billing_period = item.get('billing_period')

                if not all([device_id, name, register_code, billing_period]):
                    raise ValidationError(
                        "Fields 'device_id', 'name', 'register_code', and 'billing_period' are required."
                    )

                device = get_object_or_404(Device, id=device_id)

                reactive_energy_register = ReactiveEnergyRegister.objects.filter(
                    device=device,
                    name=name,
                    register_code=register_code,
                    billing_period=billing_period
                ).first()

                if reactive_energy_register:
                    reactive_energy_register.value = item.get('value', 0.0)
                    reactive_energy_register.save()
                    response_message = "Updated"
                else:
                    reactive_energy_register = ReactiveEnergyRegister.objects.create(
                        device=device,
                        name=name,
                        register_code=register_code,
                        value=item.get('value', 0.0),
                        billing_period=billing_period
                    )
                    response_message = "Created"

                response_data.append({
                    "message": response_message,
                    "id": reactive_energy_register.id,
                    "device_id": reactive_energy_register.device.id,
                    "name": reactive_energy_register.name,
                    "register_code": reactive_energy_register.register_code,
                    "value": reactive_energy_register.value,
                    "billing_period": reactive_energy_register.billing_period,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)
        


    def get(self, request, billing_period=None, device_id=None):
        try:
            device = get_object_or_404(Device, id=device_id)

            if billing_period:
                reactive_energy_registers = ReactiveEnergyRegister.objects.filter(
                    device=device, billing_period=billing_period
                )
            else:
                reactive_energy_registers = ReactiveEnergyRegister.objects.filter(device=device)

            results = [
                {
                    "id": register.id,
                    "device_id": register.device.id,
                    "parameter_name": register.name,
                    "parameter_code": register.register_code,
                    "value": register.value,
                    "billing_period": register.billing_period,
                }
                for register in reactive_energy_registers
            ]

            return JsonResponse(results, safe=False, status=200)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)




from .models import Device, ApparentEnergyRegister



class ApparentEnergyRegisterView(APIView):

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                raise ValidationError("Expected a list of apparent energy registers.")

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                name = item.get('name')
                register_code = item.get('register_code')
                billing_period = item.get('billing_period')

                if not all([device_id, name, register_code, billing_period]):
                    raise ValidationError(
                        "Fields 'device_id', 'name', 'register_code', and 'billing_period' are required."
                    )

                device = get_object_or_404(Device, id=device_id)

                # Check for existing ApparentEnergyRegister
                apparent_energy_register = ApparentEnergyRegister.objects.filter(
                    device=device,
                    name=name,
                    register_code=register_code,
                    billing_period=billing_period
                ).first()

                if apparent_energy_register:
                    # Update the existing register
                    apparent_energy_register.value = item.get('value', 0.0)
                    apparent_energy_register.save()
                    response_message = "Updated"
                else:
                    # Create a new ApparentEnergyRegister
                    apparent_energy_register = ApparentEnergyRegister.objects.create(
                        device=device,
                        name=name,
                        register_code=register_code,
                        value=item.get('value', 0.0),
                        billing_period=billing_period
                    )
                    response_message = "Created"

                response_data.append({
                    "message": response_message,
                    "id": apparent_energy_register.id,
                    "device_id": apparent_energy_register.device.id,
                    "name": apparent_energy_register.name,
                    "register_code": apparent_energy_register.register_code,
                    "value": apparent_energy_register.value,
                    "billing_period": apparent_energy_register.billing_period,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)
        
    

    def get(self, request, billing_period=None, device_id=None):
        try:
            device = get_object_or_404(Device, id=device_id)

            if billing_period:
                apparent_energy_registers = ApparentEnergyRegister.objects.filter(
                    device=device, billing_period=billing_period
                )
            else:
                apparent_energy_registers = ApparentEnergyRegister.objects.filter(device=device)

            results = [
                {
                    "id": register.id,
                    "device_id": register.device.id,
                    "parameter_name": register.name,
                    "parameter_code": register.register_code,
                    "value": register.value,
                    "billing_period": register.billing_period,
                }
                for register in apparent_energy_registers
            ]

            return JsonResponse(results, safe=False, status=200)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)



'''[{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - Code: 4,1-0:15.6.0.255",
  "register_code": "4,1-0:15.6.0.255",
  "value": "2173",
  "device_id": 1
},
{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 1",
  "register_code": "4,1-0:15.6.1.255",
  "value": "220",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 1",
  "register_code": "4,1-0:15.6.1.255",
  "value": "230",
  "device_id": 1
},
{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 2",
  "register_code": "4,1-0:15.6.2.255",
  "value": "240",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 2",
  "register_code": "4,1-0:15.6.2.255",
  "value": "250",
  "device_id": 1
},
{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 3",
  "register_code": "4,1-0:15.6.3.255",
  "value": "260",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 3",
  "register_code": "4,1-0:15.6.3.255",
  "value": "270",
  "device_id": 1
},
{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 4",
  "register_code": "4,1-0:15.6.3.255",
  "value": "280",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 4",
  "register_code": "4,1-0:15.6.3.255",
  "value": "290",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|)",
  "register_code": "4,1-0:15.2.0.255",
  "value": "300",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|)",
  "register_code": "4,1-0:15.2.0.255",
  "value": "310",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 1",
  "register_code": "4,1-0:15.2.1.255",
  "value": "320",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 1",
  "register_code": "4,1-0:15.2.1.255",
  "value": "330",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 2",
  "register_code": "4,1-0:15.2.2.255",
  "value": "340",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 2",
  "register_code": "4,1-0:15.2.2.255",
  "value": "350",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 3",
  "register_code": "4,1-0:15.2.3.255",
  "value": "360",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 3",
  "register_code": "4,1-0:15.2.3.255",
  "value": "370",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 4",
  "register_code": "4,1-0:15.2.4.255",
  "value": "380",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 4",
  "register_code": "4,1-0:15.2.4.255",
  "value": "390",
  "device_id": 1
}]
'''

'''[{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - Code: 4,1-0:15.6.0.255",
  "register_code": "4,1-0:15.6.0.255",
  "value": "210",
  "device_id": 1
},
{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 1",
  "register_code": "4,1-0:15.6.1.255",
  "value": "220",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 1",
  "register_code": "4,1-0:15.6.1.255",
  "value": "230",
  "device_id": 1
},
{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 2",
  "register_code": "4,1-0:15.6.2.255",
  "value": "240",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 2",
  "register_code": "4,1-0:15.6.2.255",
  "value": "250",
  "device_id": 1
},
{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 3",
  "register_code": "4,1-0:15.6.3.255",
  "value": "260",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 3",
  "register_code": "4,1-0:15.6.3.255",
  "value": "270",
  "device_id": 1
},
{
  "name": "Maximum Demand Register - Active (|+A| + |-A|) - rate 4",
  "register_code": "4,1-0:15.6.3.255",
  "value": "280",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 4",
  "register_code": "4,1-0:15.6.3.255",
  "value": "290",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|)",
  "register_code": "4,1-0:15.2.0.255",
  "value": "300",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|)",
  "register_code": "4,1-0:15.2.0.255",
  "value": "310",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 1",
  "register_code": "4,1-0:15.2.1.255",
  "value": "320",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 1",
  "register_code": "4,1-0:15.2.1.255",
  "value": "330",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 2",
  "register_code": "4,1-0:15.2.2.255",
  "value": "340",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 2",
  "register_code": "4,1-0:15.2.2.255",
  "value": "350",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 3",
  "register_code": "4,1-0:15.2.3.255",
  "value": "360",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 3",
  "register_code": "4,1-0:15.2.3.255",
  "value": "370",
  "device_id": 1
},
{
  "name": "Cumulative Maximum Demand Register - Active (|+A| + |-A|) - rate 4",
  "register_code": "4,1-0:15.2.4.255",
  "value": "380",
  "device_id": 1
},
{
  "name": "Capture time - Maximum Demand Register - Active (|+A| + |-A|) - rate 4",
  "register_code": "4,1-0:15.2.4.255",
  "value": "390",
  "device_id": 1
}'''

'''[
  {
    "name": "Capture time - Maximum Demand Register - Active import (+A) - Code: 4,1-0:1.2.0.255",
    "register_code": "4,1-0:1.2.0.255",
    "value": "100",
    "device_id": 1
  },
  {
    "name": "Cumulative Maximum Demand Register - Active import (+A) - rate 1 - Code: 4,1-0:1.2.1.255",
    "register_code": "4,1-0:1.2.1.255",
    "value": "110",
    "device_id": 1
  },
  {
    "name": "Capture time - Maximum Demand Register - Active import (+A) - rate 1 - Code: 4,1-0:1.2.1.255",
    "register_code": "4,1-0:1.2.1.255",
    "value": "120",
    "device_id": 1
  },
  {
    "name": "Cumulative Maximum Demand Register - Active import (+A) - rate 2 - Code: 4,1-0:1.2.2.255",
    "register_code": "4,1-0:1.2.2.255",
    "value": "130",
    "device_id": 1
  },
  {
    "name": "Capture time - Maximum Demand Register - Active import (+A) - rate 2 - Code: 4,1-0:1.2.2.255",
    "register_code": "4,1-0:1.2.2.255",
    "value": "140",
    "device_id": 1
  },
  {
    "name": "Cumulative Maximum Demand Register - Active import (+A) - rate 3 - Code: 4,1-0:1.2.3.255",
    "register_code": "4,1-0:1.2.3.255",
    "value": "150",
    "device_id": 1
  },
  {
    "name": "Capture time - Maximum Demand Register - Active import (+A) - rate 3 - Code: 4,1-0:1.2.3.255",
    "register_code": "4,1-0:1.2.3.255",
    "value": "160",
    "device_id": 1
  },
  {
    "name": "Cumulative Maximum Demand Register - Active import (+A) - rate 4 - Code: 4,1-0:1.2.4.255",
    "register_code": "4,1-0:1.2.4.255",
    "value": "170",
    "device_id": 1
  },
  {
    "name": "Capture time - Maximum Demand Register - Active import (+A) - rate 4 - Code: 4,1-0:1.2.4.255",
    "register_code": "4,1-0:1.2.4.255",
    "value": "180",
    "device_id": 1
  },
  {
    "name": "Cumulative Maximum Demand Register - Active export (-A) - Code: 4,1-0:2.2.0.255",
    "register_code": "4,1-0:2.2.0.255",
    "value": "190",
    "device_id": 1
  },
  {
    "name": "Capture time - Maximum Demand Register - Active export (-A) - Code: 4,1-0:2.2.0.255",
    "register_code": "4,1-0:2.2.0.255",
    "value": "200",
    "device_id": 1
  },
  {
    "name": "Cumulative Maximum Demand Register - Active export (-A) - rate 1 - Code: 4,1-0:2.2.1.255",
    "register_code": "4,1-0:2.2.1.255",
    "value": "210",
    "device_id": 1
  },
  {
    "name": "Capture time - Maximum Demand Register - Active export (-A) - rate 1 - Code: 4,1-0:2.2.1.255",
    "register_code": "4,1-0:2.2.1.255",
    "value": "220",
    "device_id": 1
  },
  {
    "name": "Cumulative Maximum Demand Register - Active export (-A) - rate 2 - Code: 4,1-0:2.2.2.255",
    "register_code": "4,1-0:2.2.2.255",
    "value": "230",
    "device_id": 1
  },
  {
    "name": "Capture time - Maximum Demand Register - Active export (-A) - rate 2 - Code: 4,1-0:2.2.2.255",
    "register_code": "4,1-0:2.2.2.255",
    "value": "240",
    "device_id": 1
  },
  {
    "name": "Cumulative Maximum Demand Register - Active export (-A) - rate 3 - Code: 4,1-0:2.2.3.255",
    "register_code": "4,1-0:2.2.3.255",
    "value": "250",
    "device_id": 1
  },
  {
    "name": "Capture time - Maximum Demand Register - Active export (-A) - rate 3 - Code: 4,1-0:2.2.3.255",
    "register_code": "4,1-0:2.2.3.255",
    "value": "260",
    "device_id": 1
  },
  {
    "name": "Cumulative Maximum Demand Register - Active export (-A) - rate 4 - Code: 4,1-0:2.2.4.255",
    "register_code": "4,1-0:2.2.4.255",
    "value": "270",
    "device_id": 1
  },
  {
    "name": "Capture time - Maximum Demand Register - Active export (-A) - rate 4 - Code: 4,1-0:2.2.4.255",
    "register_code": "4,1-0:2.2.4.255",
    "value": "280",
    "device_id": 1
  }
]
'''



from django.http import JsonResponse
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from .models import ActiveMaximumDemandRegister, Device

class ActiveMaximumDemandRegisterView(APIView):

    def post(self, request):
        try:
            data = request.data
            print("data",data)
            if not isinstance(data, list):
                raise ValidationError("Expected a list of active maximum demand registers.")

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                name = item.get('name')
                register_code = item.get('register_code')
                
                value = item.get('value')

                if not all([device_id, name, register_code, value is not None]):
                    raise ValidationError(
                        "Fields 'device_id', 'name', 'register_code', 'capture_time', and 'value' are required."
                    )

                device = get_object_or_404(Device, id=device_id)

                # Check for existing ActiveMaximumDemandRegister
                active_maximum_demand_register = ActiveMaximumDemandRegister.objects.filter(
                    device=device,
                    name=name,
                    register_code=register_code,
                  
                ).first()

                if active_maximum_demand_register:
                    # Update the existing register
                    active_maximum_demand_register.value = value
                    active_maximum_demand_register.save()
                    response_message = "Updated"
                else:
                    # Create a new ActiveMaximumDemandRegister
                    active_maximum_demand_register = ActiveMaximumDemandRegister.objects.create(
                        device=device,
                        name=name,
                        register_code=register_code,
                       
                        value=value
                    )
                    response_message = "Created"

                response_data.append({
                    "message": response_message,
                    "id": active_maximum_demand_register.id,
                    "device_id": active_maximum_demand_register.device.id,
                    "name": active_maximum_demand_register.name,
                    "register_code": active_maximum_demand_register.register_code,
                    
                    "value": active_maximum_demand_register.value,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            device = get_object_or_404(Device, id=device_id)

            # Fetch all ActiveMaximumDemandRegister records for the device
            active_maximum_demand_registers = ActiveMaximumDemandRegister.objects.filter(device=device)

            results = [
                {
                    "id": register.id,
                    "device_id": register.device.id,
                    "parameter_name": register.name,
                   
                    "parameter_code": register.register_code,
                    
                    "value": register.value,
                }
                for register in active_maximum_demand_registers
            ]

            return JsonResponse(results, safe=False, status=200)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)




'''[
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive import (+R)",
        "register_code": "4,1-0:3.6.0.255",
        "value": 67.89
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive import (+R)",
        "register_code": "4,1-0:3.6.0.255",
        "value": 12.34
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive import (+R) - rate 1",
        "register_code": "4,1-0:3.6.1.255",
        "value": 45.67
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive import (+R) - rate 1",
        "register_code": "4,1-0:3.6.1.255",
        "value": 89.01
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive import (+R) - rate 2",
        "register_code": "4,1-0:3.6.2.255",
        "value": 34.56
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive import (+R) - rate 2",
        "register_code": "4,1-0:3.6.2.255",
        "value": 78.90
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive import (+R) - rate 3",
        "register_code": "4,1-0:3.6.3.255",
        "value": 23.45
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive import (+R) - rate 3",
        "register_code": "4,1-0:3.6.3.255",
        "value": 56.78
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive import (+R) - rate 4",
        "register_code": "4,1-0:3.6.4.255",
        "value": 12.34
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive import (+R) - rate 4",
        "register_code": "4,1-0:3.6.4.255",
        "value": 90.12
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive export (-R)",
        "register_code": "4,1-0:4.6.0.255",
        "value": 78.90
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive export (-R)",
        "register_code": "4,1-0:4.6.0.255",
        "value": 34.56
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive export (-R) - rate 1",
        "register_code": "4,1-0:4.6.1.255",
        "value": 56.78
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive export (-R) - rate 1",
        "register_code": "4,1-0:4.6.1.255",
        "value": 90.12
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive export (-R) - rate 2",
        "register_code": "4,1-0:4.6.2.255",
        "value": 23.45
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive export (-R) - rate 2",
        "register_code": "4,1-0:4.6.2.255",
        "value": 67.89
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive export (-R) - rate 3",
        "register_code": "4,1-0:4.6.3.255",
        "value": 45.67
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive export (-R) - rate 3",
        "register_code": "4,1-0:4.6.3.255",
        "value": 89.01
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Reactive export (-R) - rate 4",
        "register_code": "4,1-0:4.6.4.255",
        "value": 34.56
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Reactive export (-R) - rate 4",
        "register_code": "4,1-0:4.6.4.255",
        "value": 78.90
    }
]'''


from .models import ReactiveMaximumDemandRegister, Device


class ReactiveMaximumDemandRegisterView(APIView):
    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                raise ValidationError("Expected a list of reactive maximum demand registers.")

            response_data = []
            for item in data:
                device_id = item.get('device_id')
                name = item.get('name')
                register_code = item.get('register_code')
                value = item.get('value')

                if not all([device_id, name, register_code, value is not None]):
                    raise ValidationError(
                        "Fields 'device_id', 'name', 'register_code', and 'value' are required."
                    )

                device = get_object_or_404(Device, id=device_id)

                # Check for existing ReactiveMaximumDemandRegister
                reactive_register = ReactiveMaximumDemandRegister.objects.filter(
                    device=device,
                    name=name,
                    register_code=register_code,
                ).first()

                if reactive_register:
                    # Update the existing register
                    reactive_register.value = value
                    reactive_register.save()
                    response_message = "Updated"
                else:
                    # Create a new ReactiveMaximumDemandRegister
                    reactive_register = ReactiveMaximumDemandRegister.objects.create(
                        device=device,
                        name=name,
                        register_code=register_code,
                        value=value
                    )
                    response_message = "Created"

                response_data.append({
                    "message": response_message,
                    "id": reactive_register.id,
                    "device_id": reactive_register.device.id,
                    "name": reactive_register.name,
                    "register_code": reactive_register.register_code,
                    "value": reactive_register.value,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            device = get_object_or_404(Device, id=device_id)

            # Fetch all ReactiveMaximumDemandRegister records for the device
            reactive_registers = ReactiveMaximumDemandRegister.objects.filter(device=device)

            results = [
                {
                    "id": register.id,
                    "device_id": register.device.id,
                    "parameter_name": register.name,
                    "parameter_code": register.register_code,
                    "value": register.value,
                }
                for register in reactive_registers
            ]

            return JsonResponse(results, safe=False, status=200)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)
















'''[
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent import (+VA)",
        "register_code": "4,1-0:6.0.255",
        "value": 100.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent import (+VA)",
        "register_code": "4,1-0:9.6.0.255",
        "value": 1640000000.00
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent import (+VA) - rate 1",
        "register_code": "4,1-0:9.6.1.255",
        "value": 200.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent import (+VA) - rate 1",
        "register_code": "4,1-0:9.6.1.255",
        "value": 1640000100.00
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent import (+VA) - rate 2",
        "register_code": "4,1-0:9.6.2.255",
        "value": 300.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent import (+VA) - rate 2",
        "register_code": "4,1-0:9.6.2.255",
        "value": 1640000200.00
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent import (+VA) - rate 3",
        "register_code": "4,1-0:9.6.3.255",
        "value": 400.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent import (+VA) - rate 3",
        "register_code": "4,1-0:9.6.3.255",
        "value": 1640000300.00
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent import (+VA) - rate 4",
        "register_code": "4,1-0:9.6.4.255",
        "value": 500.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent import (+VA) - rate 4",
        "register_code": "4,1-0:9.6.4.255",
        "value": 1640000400.00
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent export (-VA)",
        "register_code": "4,1-0:10.6.0.255",
        "value": 600.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent export (-VA)",
        "register_code": "4,1-0:10.6.0.255",
        "value": 1640000500.00
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent export (-VA) - rate 1",
        "register_code": "4,1-0:10.6.1.255",
        "value": 700.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent export (-VA) - rate 1",
        "register_code": "4,1-0:10.6.1.255",
        "value": 1640000600.00
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent export (-VA) - rate 2",
        "register_code": "4,1-0:10.6.2.255",
        "value": 800.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent export (-VA) - rate 2",
        "register_code": "4,1-0:10.6.2.255",
        "value": 1640000700.00
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent export (-VA) - rate 3",
        "register_code": "4,1-0:10.6.3.255",
        "value": 900.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent export (-VA) - rate 3",
        "register_code": "4,1-0:10.6.3.255",
        "value": 1640000800.00
    },
    {
        "device_id": 1,
        "name": "Maximum Demand Register - Apparent export (-VA) - rate 4",
        "register_code": "4,1-0:10.6.4.255",
        "value": 1000.00
    },
    {
        "device_id": 1,
        "name": "Capture time - Maximum Demand Register - Apparent export (-VA) - rate 4",
        "register_code": "4,1-0:10.6.4.255",
        "value": 1640000900.00
    }
]
'''

from .models import ApparentMaximumDemandRegister, Device

class ApparentMaximumDemandRegisterView(APIView):
    def post(self, request):
        try:
            data = request.data
            print(data)
            if not isinstance(data, list):
                raise ValidationError("Expected a list of apparent maximum demand registers.")

            response_data = []
            for item in data:
                device_id = item.get('device_id')
                name = item.get('name')
                register_code = item.get('register_code')
                value = item.get('value')

                if not all([device_id, name, register_code, value is not None]):
                    raise ValidationError(
                        "Fields 'device_id', 'name', 'register_code', and 'value' are required."
                    )

                device = get_object_or_404(Device, id=device_id)

                # Check for existing ApparentMaximumDemandRegister
                apparent_register = ApparentMaximumDemandRegister.objects.filter(
                    device=device,
                    name=name,
                    register_code=register_code,
                ).first()

                if apparent_register:
                    # Update the existing register
                    apparent_register.value = value
                    apparent_register.save()
                    response_message = "Updated"
                else:
                    # Create a new ApparentMaximumDemandRegister
                    apparent_register = ApparentMaximumDemandRegister.objects.create(
                        device=device,
                        name=name,
                        register_code=register_code,
                        value=value
                    )
                    response_message = "Created"

                response_data.append({
                    "message": response_message,
                    "id": apparent_register.id,
                    "device_id": apparent_register.device.id,
                    "name": apparent_register.name,
                    "register_code": apparent_register.register_code,
                    "value": apparent_register.value,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            device = get_object_or_404(Device, id=device_id)

            # Fetch all ApparentMaximumDemandRegister records for the device
            apparent_registers = ApparentMaximumDemandRegister.objects.filter(device=device)

            results = [
                {
                    "id": register.id,
                    "device_id": register.device.id,
                    "parameter_name": register.name,
                    "parameter_code": register.register_code,
                    "value": register.value,
                }
                for register in apparent_registers
            ]

            return JsonResponse(results, safe=False, status=200)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)


'''
[
    {
        "device_id": 1,
        "account_mode_and_status": true,
        "payment_mode": "Credit",
        "account_status": "Active",
        "current_credit_in_use": "100.50",
        "current_credit_status": "Valid",
        "method": "Active account"
    }
]
'''


from .models import AccountDetailsStatus

class AccountDetailsStatusView(APIView):
    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                raise ValidationError("Expected a list of account details statuses.")

            response_data = []
            print(data)
            for item in data:
                device_id = item.get('device_id')
                account_mode_and_status = item.get('account_mode_and_status', False)
                payment_mode = item.get('payment_mode')
                account_status = item.get('account_status')
                current_credit_in_use = item.get('current_credit_in_use')
                current_credit_status = item.get('current_credit_status')
                method = item.get('method')

                if not device_id:
                    raise ValidationError("The 'device_id' field is required.")

                device = get_object_or_404(Device, id=device_id)

                # Always create a new AccountDetailsStatus record
                account_status_obj = AccountDetailsStatus.objects.create(
                    device=device,
                    account_mode_and_status=account_mode_and_status,
                    payment_mode=payment_mode,
                    account_status=account_status,
                    current_credit_in_use=current_credit_in_use,
                    current_credit_status=current_credit_status,
                    method=method,
                )

                response_data.append({
                    "message": "Created",
                    "id": account_status_obj.id,
                    "device_id": account_status_obj.device.id,
                    "account_mode_and_status": account_status_obj.account_mode_and_status,
                    "payment_mode": account_status_obj.payment_mode,
                    "account_status": account_status_obj.account_status,
                    "current_credit_in_use": account_status_obj.current_credit_in_use,
                    "current_credit_status": account_status_obj.current_credit_status,
                    "method": account_status_obj.method,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            device = get_object_or_404(Device, id=device_id)

            # Fetch all AccountDetailsStatus records for the device
            account_statuses = AccountDetailsStatus.objects.filter(device=device)

            results = [
                {
                    "id": status.id,
                    "device_id": status.device.id,
                    "account_mode_and_status": status.account_mode_and_status,
                    "payment_mode": status.payment_mode,
                    "account_status": status.account_status,
                    "current_credit_in_use": status.current_credit_in_use,
                    "current_credit_status": status.current_credit_status,
                    "method": status.method,
                }
                for status in account_statuses
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)




from .models import AccountDetailsValue

'''[
    {
        "device_id": 1,
        "available_credit": 1000.5,
        "amount_to_clear": 250.0,
        "clearance_threshold": 50.0,
        "aggregated_debt": 500.0,
        "account_activation_time": "2025-01-28T12:00:00Z",
        "account_closure_time": "2025-12-31T23:59:59Z",
        "currency_name": "USD",
        "currency_scale": 1,
        "currency_unit_name": "Dollar",
        "low_credit_threshold": 100.0,
        "next_credit_available_threshold": 300.0,
        "max_provision": 10000.0,
        "max_provision_period": 30
    }
]'''

class AccountDetailsValueView(APIView):
    def post(self, request):
        try:
            # Parse the incoming data
            data = json.loads(request.body)

            print("data",data)
           
            
            if not isinstance(data, list):
                raise ValidationError("Expected a list of account details values.")
            
            response_data = []
            
            for item in data:
                # Extract values from the incoming request
                device_id = item.get('device_id')
                available_credit = item.get('available_credit')
                amount_to_clear = item.get('amount_to_clear')
                clearance_threshold = item.get('clearance_threshold')
                aggregated_debt = item.get('aggregated_debt')
                account_activation_time = item.get('account_activation_time')
                account_closure_time = item.get('account_closure_time')
                currency_name = item.get('currency_name', None)  # Optional
                currency_scale = item.get('currency_scale')
                currency_unit_name = item.get('currency_unit_name')
                low_credit_threshold = item.get('low_credit_threshold')
                next_credit_available_threshold = item.get('next_credit_available_threshold')
                max_provision = item.get('max_provision')
                max_provision_period = item.get('max_provision_period')

                # Validate that required fields are present
                if not device_id:
                    raise ValidationError("The 'device_id' field is required.")
                
                device = get_object_or_404(Device, id=device_id)

                # Create a new AccountDetailsValue record
                account_details_value = AccountDetailsValue.objects.create(
                    device=device,
                    available_credit=available_credit,
                    amount_to_clear=amount_to_clear,
                    clearance_threshold=clearance_threshold,
                    aggregated_debt=aggregated_debt,
                    account_activation_time=account_activation_time,
                    account_closure_time=account_closure_time,
                    currency_name=currency_name,
                    currency_scale=currency_scale,
                    currency_unit_name=currency_unit_name,
                    low_credit_threshold=low_credit_threshold,
                    next_credit_available_threshold=next_credit_available_threshold,
                    max_provision=max_provision,
                    max_provision_period=max_provision_period,
                )

                response_data.append({
                    "message": "Created",
                    "id": account_details_value.id,
                    "device_id": account_details_value.device.id,
                    "available_credit": account_details_value.available_credit,
                    "amount_to_clear": account_details_value.amount_to_clear,
                    "clearance_threshold": account_details_value.clearance_threshold,
                    "aggregated_debt": account_details_value.aggregated_debt,
                    "account_activation_time": account_details_value.account_activation_time,
                    "account_closure_time": account_details_value.account_closure_time,
                    "currency_name": account_details_value.currency_name,
                    "currency_scale": account_details_value.currency_scale,
                    "currency_unit_name": account_details_value.currency_unit_name,
                    "low_credit_threshold": account_details_value.low_credit_threshold,
                    "next_credit_available_threshold": account_details_value.next_credit_available_threshold,
                    "max_provision": account_details_value.max_provision,
                    "max_provision_period": account_details_value.max_provision_period,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            device = get_object_or_404(Device, id=device_id)

            # Fetch all AccountDetailsValue records for the device
            account_details_values = AccountDetailsValue.objects.filter(device=device)

            results = [
                {
                    "id": value.id,
                    "device_id": value.device.id,
                    "available_credit": value.available_credit,
                    "amount_to_clear": value.amount_to_clear,
                    "clearance_threshold": value.clearance_threshold,
                    "aggregated_debt": value.aggregated_debt,
                    "account_activation_time": value.account_activation_time,
                    "account_closure_time": value.account_closure_time,
                    "currency_name": value.currency_name,
                    "currency_scale": value.currency_scale,
                    "currency_unit_name": value.currency_unit_name,
                    "low_credit_threshold": value.low_credit_threshold,
                    "next_credit_available_threshold": value.next_credit_available_threshold,
                    "max_provision": value.max_provision,
                    "max_provision_period": value.max_provision_period,
                }
                for value in account_details_values
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)





from .models import CreditReference


class CreditReferenceView(APIView):
    
    def post(self, request):
        try:
            # Parse the incoming data
            data = json.loads(request.body)
            print("data", data)
            
            if not isinstance(data, list):
                raise ValidationError("Expected a list of credit reference values.")
            
            response_data = []
            
            for item in data:
                # Extract values from the incoming request
                credit_reference = item.get('credit_reference')
                device_id = item.get('device_id')
                 # Validate that required fields are present
                if not device_id:
                    raise ValidationError("The 'device_id' field is required.")
                
                device = get_object_or_404(Device, id=device_id)

                # Validate that required fields are present
                if not credit_reference:
                    raise ValidationError("The 'credit_reference' field is required.")

                # Create a new CreditReference record
                new_credit_reference = CreditReference.objects.create(
                     device=device,
                    credit_reference=credit_reference
                )


                # Prepare the response data
                response_data.append({
                    "message": "Created",
                    "id": new_credit_reference.id,
                    "credit_reference": new_credit_reference.credit_reference,
                    "created_at": new_credit_reference.created_at
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)
        
    

    def get(self, request, device_id=None):
        
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            # Fetch the device by device_id
            device = get_object_or_404(Device, id=device_id)

            # Fetch all CreditReference records for the given device
            credit_references = CreditReference.objects.filter(device=device)

            results = [
                {
                    "id": ref.id,
                    "credit_reference": ref.credit_reference,
                    "created_at": ref.created_at
                }
                for ref in credit_references
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)
    

   

from django.http import JsonResponse
from rest_framework.views import APIView
from .models import CreditChargeConfig, Device
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
import json


class CreditChargeConfigView(APIView):

    def post(self, request):
        try:
            # Parse the incoming data
            data = json.loads(request.body)
            print("data", data)
            
            if not isinstance(data, list):
                raise ValidationError("Expected a list of credit charge configuration values.")
            
            response_data = []

            for item in data:
                # Extract values from the incoming request
                credit_reference = item.get('credit_reference')
                charge_reference = item.get('charge_reference')
                device_id = item.get('device_id')

                # Validate that required fields are present
                if not device_id:
                    raise ValidationError("The 'device_id' field is required.")
                
                device = get_object_or_404(Device, id=device_id)

                if not credit_reference:
                    raise ValidationError("The 'credit_reference' field is required.")

                if not charge_reference:
                    raise ValidationError("The 'charge_reference' field is required.")

                # Create a new CreditChargeConfig record
                new_credit_charge_config = CreditChargeConfig.objects.create(
                    device=device,
                    credit_reference=credit_reference,
                    charge_reference=charge_reference
                )

                # Prepare the response data
                response_data.append({
                    "message": "Created",
                    "id": new_credit_charge_config.id,
                    "credit_reference": new_credit_charge_config.credit_reference,
                    "charge_reference": new_credit_charge_config.charge_reference,
                    "created_at": new_credit_charge_config.created_at
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)


    def get(self, request, device_id=None):
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            # Fetch the device by device_id
            device = get_object_or_404(Device, id=device_id)

            # Fetch all CreditChargeConfig records for the given device
            credit_charge_configs = CreditChargeConfig.objects.filter(device=device)

            results = [
                {
                    "id": config.id,
                    "credit_reference": config.credit_reference,
                    "charge_reference": config.charge_reference,
                    "created_at": config.created_at
                }
                for config in credit_charge_configs
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)


from .models import Device, TokenGatewayConfig


class TokenGatewayConfigView(APIView):

    def post(self, request):
        try:
            # Parse the incoming data
            data = json.loads(request.body)
            print("data", data)
            
            if not isinstance(data, list):
                raise ValidationError("Expected a list of token gateway configuration values.")
            
            response_data = []

            for item in data:
                # Extract values from the incoming request
                credit_reference = item.get('credit_reference')
                token_proportion = item.get('token_proportion')
                device_id = item.get('device_id')

                # Validate that required fields are present
                if not device_id:
                    raise ValidationError("The 'device_id' field is required.")
                
                device = get_object_or_404(Device, id=device_id)

                if not credit_reference:
                    raise ValidationError("The 'credit_reference' field is required.")

                if not token_proportion:
                    raise ValidationError("The 'token_proportion' field is required.")

                # Create a new TokenGatewayConfig record
                new_token_gateway_config = TokenGatewayConfig.objects.create(
                    device=device,
                    credit_reference=credit_reference,
                    token_proportion=token_proportion
                )

                # Prepare the response data
                response_data.append({
                    "message": "Created",
                    "id": new_token_gateway_config.id,
                    "credit_reference": new_token_gateway_config.credit_reference,
                    "token_proportion": new_token_gateway_config.token_proportion,
                    "created_at": new_token_gateway_config.created_at
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            # Fetch the device by device_id
            device = get_object_or_404(Device, id=device_id)

            # Fetch all TokenGatewayConfig records for the given device
            token_gateway_configs = TokenGatewayConfig.objects.filter(device=device)

            results = [
                {
                    "id": config.id,
                    "credit_reference": config.credit_reference,
                    "token_proportion": config.token_proportion,
                    "created_at": config.created_at
                }
                for config in token_gateway_configs
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)




def get_mac_address():
    mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xFF) for elements in range(0, 2 * 6, 2)][::-1])
    print("mac",mac)
    return mac  
    
print(get_mac_address())



def reset_meter(device_id):
    try:
        device = Device.objects.get(id=device_id)  # Fetch device instance

        print(f"Device ID {device_id} - Related Tables and Row Counts Before Deletion:")

        # Iterate over all related models dynamically
        for field in device._meta.get_fields():
            if field.one_to_many:  # Check for ForeignKey relationships
                related_name = field.get_accessor_name()  # Always returns a valid name
                related_manager = getattr(device, related_name, None)  # Get related manager
                
                if isinstance(related_manager, models.Manager):
                    count = related_manager.count()  # Count rows before deletion
                    print(f"Table: {field.related_model._meta.db_table}, Rows: {count}")

                    related_manager.all().delete()  # Bulk delete related records

        print(f"\nAll related data for Device ID {device_id} has been deleted.")

    except Device.DoesNotExist:
        print(f"Device with ID {device_id} does not exist.")

# Usage:
#reset_meter(5)  # Replace with the actual device ID









from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from .models import TokenCredit, Device
import json
from decimal import Decimal

class TokenCreditView(APIView):

    def post(self, request):
        try:
            data = json.loads(request.body)
            print("data", data)

            if not isinstance(data, list):
                raise ValidationError("Expected a list of token credit values.")

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                current_credit_amount = item.get('current_credit_amount', 0.00)
                credit_type = item.get('credit_type', 'prepaid')
                priority = item.get('priority', 0)
                limit = item.get('limit', 0.00)
                credit_configuration = item.get('credit_configuration', '')
                preset_credit_amount = item.get('preset_credit_amount', 0.00)
                credit_available_threshold = item.get('credit_available_threshold', 0.00)
                period = item.get('period', '')

                if not device_id:
                    raise ValidationError("The 'device_id' field is required.")

                device = get_object_or_404(Device, id=device_id)

                new_token_credit = TokenCredit.objects.create(
                    device=device,
                    current_credit_amount=current_credit_amount,
                    credit_type=credit_type,
                    priority=priority,
                    limit=limit,
                    credit_configuration=credit_configuration,
                    preset_credit_amount=preset_credit_amount,
                    credit_available_threshold=credit_available_threshold,
                    period=period
                )

                response_data.append({
                    "message": "Created",
                    "id": new_token_credit.id,
                    "device_id": device.id,
                    "current_credit_amount": str(new_token_credit.current_credit_amount),
                    "credit_type": new_token_credit.credit_type,
                    "priority": new_token_credit.priority,
                    "limit": str(new_token_credit.limit),
                    "credit_configuration": new_token_credit.credit_configuration,
                    "preset_credit_amount": str(new_token_credit.preset_credit_amount),
                    "credit_available_threshold": str(new_token_credit.credit_available_threshold),
                    "period": new_token_credit.period
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            device = get_object_or_404(Device, id=device_id)
            token_credits = TokenCredit.objects.filter(device=device)

            results = [
                {
                    "id": credit.id,
                    "device_id": credit.device.id,
                    "current_credit_amount": str(credit.current_credit_amount),
                    "credit_type": credit.credit_type,
                    "priority": credit.priority,
                    "limit": str(credit.limit),
                    "credit_configuration": credit.credit_configuration,
                    "preset_credit_amount": str(credit.preset_credit_amount),
                    "credit_available_threshold": str(credit.credit_available_threshold),
                    "period": credit.period
                }
                for credit in token_credits
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)




    def put(self, request, action):

        """
        Handles update_amount, set_amount, and invoke_credit based on action.

        """
        
        try:
            data = json.loads(request.body)
            device_id = data.get('device_id')
            amount = data.get('amount',100)

            print(device_id,amount,action)

            if not device_id or amount is None:
                return Response({"error": "device_id and amount are required"}, status=status.HTTP_400_BAD_REQUEST)

            token_credit = get_object_or_404(TokenCredit, device_id=device_id)
             # Convert amount to Decimal to prevent type errors
            amount = Decimal(str(amount))  # Convert float to Decimal safely

            if action == "update-amount":
                updated_amount = token_credit.update_amount(amount)
                return Response({"message": "Amount updated successfully", "current_credit_amount": updated_amount}, status=status.HTTP_200_OK)

            elif action == "set-amount":
                updated_amount = token_credit.set_amount(amount)
                return Response({"message": "Amount set successfully", "current_credit_amount": updated_amount}, status=status.HTTP_200_OK)

            elif action == "invoke-credit":
                print("hello")
                try:
                    
                    updated_amount = token_credit.invoke_credit(100)
                    return Response({"message": "Credit invoked successfully", "current_credit_amount": updated_amount}, status=status.HTTP_200_OK)
                except ValueError as e:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON format"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        




from .models import EmergencyCredit, Device

class EmergencyCreditView(APIView):

    def post(self, request):
        try:
            data = json.loads(request.body)
            print("data", data)

            if not isinstance(data, list):
                raise ValidationError("Expected a list of emergency credit values.")

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                current_credit_amount = item.get('current_credit_amount', 0.00)
                credit_type = item.get('credit_type', 'emergency')
                priority = item.get('priority', 0)
                warning_threshold_1 = item.get('warning_threshold_1', 0.00)  # ✅ Added missing field
                limit = item.get('limit', 0.00)
                credit_configuration = item.get('credit_configuration', '')
                preset_credit_amount = item.get('preset_credit_amount', 0.00)
                credit_available_threshold = item.get('credit_available_threshold', 0.00)
                period = item.get('period', '')

                if not device_id:
                    raise ValidationError("The 'device_id' field is required.")

                device = get_object_or_404(Device, id=device_id)

                new_emergency_credit = EmergencyCredit.objects.create(
                    device=device,
                    current_credit_amount=current_credit_amount,
                    credit_type=credit_type,
                    priority=priority,
                    warning_threshold_1=warning_threshold_1,  # ✅ Save `warning_threshold_1`
                    limit=limit,
                    credit_configuration=credit_configuration,
                    preset_credit_amount=preset_credit_amount,
                    credit_available_threshold=credit_available_threshold,
                    period=period
                )

                response_data.append({
                    "message": "Created",
                    "id": new_emergency_credit.id,
                    "device_id": device.id,
                    "current_credit_amount": str(new_emergency_credit.current_credit_amount),
                    "credit_type": new_emergency_credit.credit_type,
                    "priority": new_emergency_credit.priority,
                    "warning_threshold_1": str(new_emergency_credit.warning_threshold_1),  # ✅ Return `warning_threshold_1`
                    "limit": str(new_emergency_credit.limit),
                    "credit_configuration": new_emergency_credit.credit_configuration,
                    "preset_credit_amount": str(new_emergency_credit.preset_credit_amount),
                    "credit_available_threshold": str(new_emergency_credit.credit_available_threshold),
                    "period": new_emergency_credit.period
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            device = get_object_or_404(Device, id=device_id)
            emergency_credits = EmergencyCredit.objects.filter(device=device)

            results = [
                {
                    "id": credit.id,
                    "device_id": credit.device.id,
                    "current_credit_amount": str(credit.current_credit_amount),
                    "credit_type": credit.credit_type,
                    "priority": credit.priority,
                    "warning_threshold_1": str(credit.warning_threshold_1),  # ✅ Added missing field
                    "limit": str(credit.limit),
                    "credit_configuration": credit.credit_configuration,
                    "preset_credit_amount": str(credit.preset_credit_amount),
                    "credit_available_threshold": str(credit.credit_available_threshold),
                    "period": credit.period
                }
                for credit in emergency_credits
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)


  

    def put(self, request, action):
        """
        Handles update_amount, set_amount, and invoke_credit based on action.
        """
        
        try:
            data = json.loads(request.body)
            device_id = data.get('device_id')
            amount = data.get('amount', 100)

            print(device_id, amount, action)

            if not device_id or amount is None:
                return Response({"error": "device_id and amount are required"}, status=status.HTTP_400_BAD_REQUEST)

            emergency_credit = get_object_or_404(EmergencyCredit, device_id=device_id)
             # Convert amount to Decimal to prevent type errors
            amount = Decimal(str(amount))  # Convert float to Decimal safely

            if action == "update-amount":
                updated_amount = emergency_credit.update_amount(amount)
                return Response({"message": "Amount updated successfully", "current_credit_amount": updated_amount}, status=status.HTTP_200_OK)

            elif action == "set-amount":
                updated_amount = emergency_credit.set_amount(amount)
                return Response({"message": "Amount set successfully", "current_credit_amount": updated_amount}, status=status.HTTP_200_OK)

            elif action == "invoke-credit":
                print("hello")
                try:
                    updated_amount = emergency_credit.invoke_credit(amount)
                    return Response({"message": "Credit invoked successfully", "current_credit_amount": updated_amount}, status=status.HTTP_200_OK)
                except ValueError as e:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON format"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



from .models import Device, PaymentChargeValueData
import logging

logger = logging.getLogger(__name__)



class PaymentChargeValueDataView(APIView):

    def post(self, request):
        try:
            data = request.data
            if not isinstance(data, list):
                raise ValidationError("Expected a list of payment charge values.")

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                total_amount_paid = item.get('total_amount_paid')
                charge_type = item.get('charge_type')
                priority = item.get('priority')
                charge_configuration = item.get('charge_configuration')
                last_collection_time = item.get('last_collection_time')
                last_collection_amount = item.get('last_collection_amount')
                total_amount_remaining = item.get('total_amount_remaining')
                proportion = item.get('proportion')

                if not device_id:
                    raise ValidationError("The 'device_id' field is required.")

                device = get_object_or_404(Device, id=device_id)

                # Convert last_collection_time to datetime if necessary
                if last_collection_time and isinstance(last_collection_time, str):
                    try:
                        last_collection_time = datetime.fromisoformat(last_collection_time.replace("Z", "+00:00"))
                    except ValueError:
                        raise ValidationError("Invalid date format for 'last_collection_time'.")

                payment_data = PaymentChargeValueData.objects.create(
                    device=device,
                    total_amount_paid=total_amount_paid,
                    charge_type=charge_type,
                    priority=priority,
                    charge_configuration=charge_configuration,
                    last_collection_time=last_collection_time,
                    last_collection_amount=last_collection_amount,
                    total_amount_remaining=total_amount_remaining,
                    proportion=proportion
                )

                response_data.append({
                    "message": "Created",
                    "id": payment_data.id,
                    "device_id": payment_data.device.id,
                    "total_amount_paid": payment_data.total_amount_paid,
                    "charge_type": payment_data.charge_type,
                    "priority": payment_data.priority,
                    "charge_configuration": payment_data.charge_configuration,
                    "last_collection_time": payment_data.last_collection_time.strftime('%Y-%m-%d %H:%M:%S') if payment_data.last_collection_time else None,
                    "last_collection_amount": payment_data.last_collection_amount,
                    "total_amount_remaining": payment_data.total_amount_remaining,
                    "proportion": payment_data.proportion,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            print(f"Unexpected error: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            device = get_object_or_404(Device, id=device_id)

            # Fetch all PaymentChargeValueData records for the device
            payment_data = PaymentChargeValueData.objects.filter(device=device)

            results = [
                {
                    "id": data.id,
                    "device_id": data.device.id,
                    "total_amount_paid": data.total_amount_paid,
                    "charge_type": data.charge_type,
                    "priority": data.priority,
                    "charge_configuration": data.charge_configuration,
                    "last_collection_time": data.last_collection_time.strftime('%Y-%m-%d %H:%M:%S') if data.last_collection_time else None,
                    "last_collection_amount": data.last_collection_amount,
                    "total_amount_remaining": data.total_amount_remaining,
                    "proportion": data.proportion,
                }
                for data in payment_data
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            print(f"Unexpected error: {e}")
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)






from .models import TokenGateway, Device

class TokenGatewayView(APIView):

    def post(self, request):
        try:
            data = request.data

            print('data',data)


            device_id = data.get("device_id")
            token = data.get("token")
            token_time = data.get("token_time")  # Expecting snake_case
            token_description = data.get("token_description", [])  # Expecting snake_case
            token_delivery_method = data.get("token_delivery_method")  # Expecting snake_case
            status_code = data.get("status_code")  # Expecting snake_case
            data_value = data.get("data_value")  # Expecting snake_case
            enter_method = data.get("enter_method")  # Expecting snake_case

            device = Device.objects.get(id=device_id)

            TokenGateway.objects.create(
                device=device,
                token=token,
                tokenTime=token_time,
                tokenDescription=token_description,
                tokenDeliveryMethod=token_delivery_method,
                statusCode=status_code,
                datavalue=data_value,
                enterMethod=enter_method
            )

            return JsonResponse({"message": "Token created successfully!"}, status=201)

        except Device.DoesNotExist:
            return JsonResponse({"error": "Device not found!"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    


    def get(self, request,device_id=None):
        try:
            
            
            if not device_id:
                return JsonResponse({"error": "Device ID is required!"}, status=400)

            tokens = TokenGateway.objects.filter(device_id=device_id).values()
            
            if not tokens:
                return JsonResponse({"message": "No tokens found for this device!"}, status=404)

            return JsonResponse({"tokens": list(tokens)}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


   


from .models import Device, PaymentInformation

class PaymentInformationView(APIView):

    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')
            payment_data = data.get('payment_data')

            if not device_id:
                raise ValidationError("The 'device_id' field is required.")

            if not isinstance(payment_data, list):
                raise ValidationError("The 'payment_data' field must be a list.")

            device = get_object_or_404(Device, id=device_id)
            response_data = []

            for item in payment_data:
                name = item.get('name')
                code = item.get('code')
                value = item.get('value')
                unit = item.get('unit')

                if not all([name, code]):
                    raise ValidationError("Each payment data entry must have 'name' and 'code'.")

                # Check if record exists, update or create
                payment_info, created = PaymentInformation.objects.get_or_create(
                    device=device,
                    code=code,
                    name=name,
                    defaults={"value": value, "unit": unit}
                )

                if not created:  # If record exists, update the value
                    payment_info.value = value
                    payment_info.unit = unit
                    payment_info.save()

                response_data.append({
                    "message": "Updated" if not created else "Created",
                    "id": payment_info.id,
                    "device_id": payment_info.device.id,
                    "name": payment_info.name,
                    "code": payment_info.code,
                    "value": payment_info.value,
                    "unit": payment_info.unit,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)


  

    
    def get(self, request, device_id=None):
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            device = get_object_or_404(Device, id=device_id)

            # Fetch all PaymentInformation records for the device
            payment_data = PaymentInformation.objects.filter(device=device)

            results = [
                {
                    "id": data.id,
                    "device_id": data.device.id,
                    "name": data.name,
                    "code": data.code,
                    "value": data.value,
                    "unit": data.unit,
                }
                for data in payment_data
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)


from django.utils.dateparse import parse_time
import json
from .models import FriendlyPeriod, Device

class FriendlyPeriodAPI(APIView):

    
    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')
            start_time = parse_time(data.get('start_time'))
            end_time = parse_time(data.get('end_time'))

            if not device_id:
                raise ValidationError("The 'device_id' field is required.")

            if not (start_time and end_time):
                raise ValidationError("Both 'start_time' and 'end_time' are required.")

            device = get_object_or_404(Device, id=device_id)

            # Create a new friendly period for the device
            friendly_period = FriendlyPeriod.objects.create(
                device=device,
                start_time=start_time,
                end_time=end_time
            )

            response_data = {
                "message": "Created",
                "id": friendly_period.id,
                "device_id": friendly_period.device.id,
                "start_time": str(friendly_period.start_time),
                "end_time": str(friendly_period.end_time),
            }

            return JsonResponse(response_data, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format."}, status=400)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            device = get_object_or_404(Device, id=device_id)

            # Fetch all FriendlyPeriod records for the device
            periods = FriendlyPeriod.objects.filter(device=device)

            results = [
                {
                    "id": period.id,
                    "device_id": period.device.id,
                    "start_time": str(period.start_time),
                    "end_time": str(period.end_time),
                }
                for period in periods
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)



from .models import FriendlyWeekday

class FriendlyWeekdayView(APIView):
    def get(self, request, device_id):
        """Fetch selected weekdays for a specific device"""
        try:
            weekdays = FriendlyWeekday.objects.get(device_id=device_id)
            data = {
                "device_id": weekdays.device_id,
                "monday": weekdays.monday,
                "tuesday": weekdays.tuesday,
                "wednesday": weekdays.wednesday,
                "thursday": weekdays.thursday,
                "friday": weekdays.friday,
                "saturday": weekdays.saturday,
                "sunday": weekdays.sunday
            }
            return JsonResponse(data, status=200)
        except FriendlyWeekday.DoesNotExist:
            return JsonResponse({"message": "No data found"}, status=404)

    def post(self, request):
        """Create or update weekday selection for a device"""
        try:
            data = request.data
            print('data',data)
            device_id = data.get("device_id")

            weekdays, created = FriendlyWeekday.objects.get_or_create(device_id=device_id)

            # Update fields based on request
            weekdays.monday = data.get("monday", False)
            weekdays.tuesday = data.get("tuesday", False)
            weekdays.wednesday = data.get("wednesday", False)
            weekdays.thursday = data.get("thursday", False)
            weekdays.friday = data.get("friday", False)
            weekdays.saturday = data.get("saturday", False)
            weekdays.sunday = data.get("sunday", False)

            weekdays.save()
            return JsonResponse({"message": "Weekdays updated successfully!"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)



from .models import FriendlyHoliday



class FriendlyHolidayView(APIView):


    def get(self, request, device_id):
        print("device_id", device_id)
        """Fetch holidays for a specific device"""
        holidays = FriendlyHoliday.objects.filter(device_id=device_id)
        
        # Always return a list, even if it's empty.
        data = [
            {
                "id": holiday.id,
                "date": holiday.date,
            }
            for holiday in holidays
        ]
        return Response(data, status=status.HTTP_200_OK)



    def post(self, request):
        """Create a new holiday for a device"""
        data = request.data
        print("data",data)
        device_id = data.get("device_id")
        date = data.get("date")
        
        if not device_id or not date:
            return Response(
                {"error": "Both device_id and date are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            holiday = FriendlyHoliday.objects.create(device_id=device_id, date=date)
            return Response(
                {"message": "Holiday created successfully!", "holiday_id": holiday.id},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
    
    def delete(self, request, holiday_id):
        """Delete a holiday by its id"""
        try:
            holiday = FriendlyHoliday.objects.get(id=holiday_id)
            holiday.delete()
            return Response({"message": "Holiday deleted successfully!"}, status=status.HTTP_200_OK)
        except FriendlyHoliday.DoesNotExist:
            return Response({"error": "Holiday not found."}, status=status.HTTP_404_NOT_FOUND)



class ClearFriendlyHolidayView(APIView):
    def delete(self, request, device_id):
        """
        Delete all holidays associated with a given device.
        """
        try:
            holidays = FriendlyHoliday.objects.filter(device_id=device_id)
            if not holidays.exists():
                return Response(
                    {"message": "No holidays found for this device."},
                    status=status.HTTP_404_NOT_FOUND
                )
            count, _ = holidays.delete()
            return Response(
                {"message": f"{count} holidays deleted successfully for device {device_id}."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


from .models import AlarmOfCredit, Device


from .models import AlarmOfCredit, Device

class AlarmOfCreditView(APIView):

    def post(self, request):
        try:
            data = request.data
            device_id = data.get('device_id')
            alarm_data = data.get('alarm_data')

            if not device_id:
                raise ValidationError("The 'device_id' field is required.")

            if not isinstance(alarm_data, list):
                raise ValidationError("The 'alarm_data' field must be a list.")

            device = get_object_or_404(Device, id=device_id)
            response_data = []

            for item in alarm_data:
                name = item.get('name')
                code = item.get('code')
                value = item.get('value', 0)
                unit = item.get('unit', "GHC")

                if not all([name, code]):
                    raise ValidationError("Each alarm entry must have 'name' and 'code'.")

                # Check if the alarm exists, update value if found
                alarm, created = AlarmOfCredit.objects.get_or_create(
                    device=device,
                    code=code,
                    name=name,
                    defaults={"value": value, "unit": unit}
                )

                if not created:  # If the alarm already exists, update value
                    alarm.value = value
                    alarm.unit = unit
                    alarm.save()

                response_data.append({
                    "message": "Updated" if not created else "Created",
                    "id": alarm.id,
                    "device_id": alarm.device.id,
                    "name": alarm.name,
                    "code": alarm.code,
                    "value": alarm.value,
                    "unit": alarm.unit,
                })

            return JsonResponse(response_data, safe=False, status=201)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            print("Error:", str(e))  # Debugging output
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)

    def get(self, request, device_id=None):
        

        try:
            if not device_id:
                raise ValidationError("The 'device_id' parameter is required.")

            device = get_object_or_404(Device, id=device_id)

            # Fetch all AlarmOfCredit records for the device
            alarm_data = AlarmOfCredit.objects.filter(device=device)

            results = [
                {
                    "id": data.id,
                    "device_id": data.device.id,
                    "name": data.name,
                    "code": data.code,
                    "value": data.value,
                    "unit": data.unit,
                }
                for data in alarm_data
            ]

            return JsonResponse(results, safe=False, status=200)

        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

        except Exception as e:
            print("Error:", str(e))  # Debugging output
            return JsonResponse({"error": "An unexpected error occurred."}, status=500)



from .models import StepPrice, Device
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import StepPrice, Device

# Configure logging
logger = logging.getLogger(__name__)

class StepPriceAPIView(APIView):

    def get(self, request, device_id):
        """
        Fetch all step prices for a given device ID.
        """
        try:
            logger.info(f"Fetching step prices for device_id: {device_id}")
            step_prices = StepPrice.objects.filter(device_id=device_id).order_by('step')

            if not step_prices.exists():
                logger.warning(f"No step prices found for device_id: {device_id}")
                return Response({"message": "No step prices found."}, status=status.HTTP_404_NOT_FOUND)

            data = [{"id": sp.id, "step": sp.step, "price": float(sp.price)} for sp in step_prices]
            logger.info(f"Successfully fetched {len(data)} step prices for device_id: {device_id}")

            return Response({"step_prices": data}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching step prices for device_id {device_id}: {str(e)}", exc_info=True)
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """
        Create a new step price for the given device.
        The step number will be assigned automatically as the next available step.
        """
        try:
            data = request.data
            print("data",data)
            device_id = data.get('device_id')
            price = data.get("price", 0.00)  # Default price if not provided

            if device_id is None:
                logger.warning("Device ID is missing in the request data")
                return Response({"error": "Device ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            device = get_object_or_404(Device, id=device_id)  # Ensure the device exists
            logger.info(f"Device found: {device.id}")

            # Get the last step for the device and increment
            last_step = StepPrice.objects.filter(device=device).order_by('-step').first()
            next_step = (last_step.step + 1) if last_step else 1

            step_price = StepPrice.objects.create(device=device, step=next_step, price=price)
            logger.info(f"Step price added: {step_price.id}, step: {step_price.step}, price: {step_price.price}")

            return Response({
                "message": "Step price added successfully",
                "id": step_price.id,
                "step": step_price.step,
                "price": float(step_price.price),
            }, status=status.HTTP_201_CREATED)

        except Device.DoesNotExist:
            logger.error(f"Device with ID {device_id} does not exist")
            return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Error adding step price: {str(e)}", exc_info=True)
            return Response({"error": "An unexpected error occurred while adding step price."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, step_id):
        """
        Delete a step price by its ID.
        """
        try:
            logger.info(f"Attempting to delete step price with ID: {step_id}")
            step_price = get_object_or_404(StepPrice, id=step_id)
            step_price.delete()
            logger.info(f"Step price {step_id} deleted successfully")

            return Response({"message": "Step price deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        except StepPrice.DoesNotExist:
            logger.warning(f"Step price with ID {step_id} not found")
            return Response({"error": "Step price not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Error deleting step price ID {step_id}: {str(e)}", exc_info=True)
            return Response({"error": "An unexpected error occurred while deleting step price."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def put(self, request, step_id):
        """
        Update the price of a step price by its ID.
        """
        try:
            data = request.data
            new_price = data.get("price")

            if new_price is None:
                logger.warning("Price field is missing in the request data")
                return Response({"error": "Price is required"}, status=status.HTTP_400_BAD_REQUEST)

            step_price = get_object_or_404(StepPrice, id=step_id)
            logger.info(f"Step price found: {step_id}, current price: {step_price.price}")

            step_price.price = new_price
            step_price.save()

            logger.info(f"Step price {step_id} updated successfully to price: {step_price.price}")

            return Response({
                "message": "Step price updated successfully",
                "id": step_price.id,
                "step": step_price.step,
                "price": float(step_price.price),
            }, status=status.HTTP_200_OK)

        except StepPrice.DoesNotExist:
            logger.warning(f"Step price with ID {step_id} not found")
            return Response({"error": "Step price not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Error updating step price ID {step_id}: {str(e)}", exc_info=True)
            return Response({"error": "An unexpected error occurred while updating step price."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)







from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UnitCharge, Device
from django.utils.dateparse import parse_datetime

class BulkUnitChargeCreateAPIView(APIView):
    def post(self, request):
        data = request.data  # Expecting a list of unit charges
        print("data",data)
        if not isinstance(data, list):
            return Response({"error": "Expected a list of objects"}, status=status.HTTP_400_BAD_REQUEST)
        
        unit_charges = []
        for item in data:
            try:
                device = Device.objects.get(id=item["device"])  # Fetch Device instance
                unit_charge = UnitCharge(
                    device=device,
                    unit_type=item.get("unit_type", "active"),
                    commodity_scale=item["commodity_scale"],
                    price_scale=item["price_scale"],
                    class_id=item["class_id"],
                    logical_name=item["logical_name"],
                    attribute_id=item["attribute_id"],
                    tariff_1=item.get("tariff_1", 0.00),
                    tariff_2=item.get("tariff_2", 0.00),
                    tariff_3=item.get("tariff_3", 0.00),
                    tariff_4=item.get("tariff_4", 0.00),
                    unit_charge_activation_time=parse_datetime(item["unit_charge_activation_time"]),
                )
                unit_charges.append(unit_charge)
            except Device.DoesNotExist:
                return Response({"error": f"Device ID {item['device']} not found"}, status=status.HTTP_400_BAD_REQUEST)
            except KeyError as e:
                return Response({"error": f"Missing field: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Bulk create all unit charges
        UnitCharge.objects.bulk_create(unit_charges)
        return Response({"message": "Unit charges created successfully"}, status=status.HTTP_201_CREATED)

    

    def get(self, request, device_id,unit_type):
       
        # Filter based on provided parameters
        filters = {}
        if device_id:
            filters["device_id"] = device_id
        if unit_type:
            filters["unit_type"] = unit_type

        unit_charges = UnitCharge.objects.filter(**filters)

        # If no records found, return an empty response
        if not unit_charges.exists():
            return Response({"message": "No unit charges found"}, status=status.HTTP_404_NOT_FOUND)

        # Convert queryset to list of dictionaries
        unit_charge_list = [
            {
                "id": uc.id,
                "device": uc.device.id,
                "unit_type": uc.unit_type,
                "commodity_scale": uc.commodity_scale,
                "price_scale": uc.price_scale,
                "class_id": uc.class_id,
                "logical_name": uc.logical_name,
                "attribute_id": uc.attribute_id,
                "tariff_1": float(uc.tariff_1),
                "tariff_2": float(uc.tariff_2),
                "tariff_3": float(uc.tariff_3),
                "tariff_4": float(uc.tariff_4),
                "unit_charge_activation_time": uc.unit_charge_activation_time.isoformat(),
            }
            for uc in unit_charges
        ]

        return Response(unit_charge_list, status=status.HTTP_200_OK)



class ScrollDisplayView(APIView):

    def post(self, request):
    
        try:
            data = json.loads(request.body)
            print(data)

            if not isinstance(data, list):
                raise ValidationError("Expected a list of scroll display items.")

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                category = item.get('category')
                name = item.get('name')
                code = item.get('code')
                value = item.get('value', 100)

                if not (device_id and category and name and code):
                    raise ValidationError("Fields 'device_id', 'category', 'name', and 'code' are required.")

                device = get_object_or_404(Device, id=device_id)

                # Explicitly check if the item already exists
                existing_scroll_display = ScrollDisplay.objects.filter(
                    device=device,
                    category=category,
                    name=name,
                    code=code
                ).first()

                if existing_scroll_display:
                    response_data.append({
                        "message": "Already exists",
                        "id": existing_scroll_display.id,
                        "device_id": device.id,
                        "category": existing_scroll_display.category,
                        "name": existing_scroll_display.name,
                        "code": existing_scroll_display.code,
                        "value": existing_scroll_display.value
                    })
                else:
                    scroll_display = ScrollDisplay.objects.create(
                        device=device,
                        category=category,
                        name=name,
                        code=code,
                        value=value
                    )
                    response_data.append({
                        "message": "Created",
                        "id": scroll_display.id,
                        "device_id": device.id,
                        "category": scroll_display.category,
                        "name": scroll_display.name,
                        "code": scroll_display.code,
                        "value": scroll_display.value
                    })

            return Response(response_data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Unexpected error: {e}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def get(self, request, device_id):


        try:
            scroll_displays = ScrollDisplay.objects.filter(device_id=device_id)
            response_data = [
                {
                    "id": item.id,
                    "device_id": item.device.id,
                    "category": item.category,
                    "name": item.name,
                    "code": item.code,
                    "value": item.value
                }
                for item in scroll_displays
            ]

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        




class ManualDisplayView(APIView):

    def post(self, request):
        try:
            data = json.loads(request.body)
            print(data)

            if not isinstance(data, list):
                raise ValidationError("Expected a list of manual display items.")

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                category = item.get('category')
                name = item.get('name')
                code = item.get('code')
                value = item.get('value', 100)

                if not (device_id and category and name and code):
                    raise ValidationError("Fields 'device_id', 'category', 'name', and 'code' are required.")

                device = get_object_or_404(Device, id=device_id)

                # Explicitly check if the item already exists
                existing_manual_display = ManualDisplay.objects.filter(
                    device=device,
                    category=category,
                    name=name,
                    code=code
                ).first()

                if existing_manual_display:
                    response_data.append({
                        "message": "Already exists",
                        "id": existing_manual_display.id,
                        "device_id": device.id,
                        "category": existing_manual_display.category,
                        "name": existing_manual_display.name,
                        "code": existing_manual_display.code,
                        "value": existing_manual_display.value
                    })
                else:
                    manual_display = ManualDisplay.objects.create(
                        device=device,
                        category=category,
                        name=name,
                        code=code,
                        value=value
                    )
                    response_data.append({
                        "message": "Created",
                        "id": manual_display.id,
                        "device_id": device.id,
                        "category": manual_display.category,
                        "name": manual_display.name,
                        "code": manual_display.code,
                        "value": manual_display.value
                    })

            return Response(response_data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Unexpected error: {e}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def get(self, request, device_id):
        try:
            manual_displays = ManualDisplay.objects.filter(device_id=device_id)

            if not manual_displays.exists():
                return Response({"message": "No manual display items found for this device."}, status=status.HTTP_404_NOT_FOUND)

            response_data = [
                {
                    "id": manual_display.id,
                    "device_id": manual_display.device.id,
                    "category": manual_display.category,
                    "name": manual_display.name,
                    "code": manual_display.code,
                    "value": manual_display.value
                }
                for manual_display in manual_displays
            ]

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Unexpected error: {e}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




from .models import LcdDisplayFormat, Device


class LcdDisplayFormatView(APIView):

    def post(self, request):
        try:
            data = json.loads(request.body)
            print(data)

            if not isinstance(data, list):
                raise ValidationError("Expected a list of LCD display format items.")

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                energy_leading_zero = item.get('energy_leading_zero', 'Disable')
                energy_decimal = item.get('energy_decimal', 2)
                power_decimal = item.get('power_decimal', 3)
                current_decimal = item.get('current_decimal', 3)
                voltage_decimal = item.get('voltage_decimal', 1)
                date_format = item.get('date_format', 'DD-MM-YY')
                time_format = item.get('time_format', 'HH:MM:SS')

                # Get device object by device_id
                device = get_object_or_404(Device, id=device_id)

                # Check if the LCD Display Format already exists for the given device
                existing_format = LcdDisplayFormat.objects.filter(device=device).first()

                if existing_format:
                    # Update the existing format
                    existing_format.energy_leading_zero = energy_leading_zero
                    existing_format.energy_decimal = energy_decimal
                    existing_format.power_decimal = power_decimal
                    existing_format.current_decimal = current_decimal
                    existing_format.voltage_decimal = voltage_decimal
                    existing_format.date_format = date_format
                    existing_format.time_format = time_format
                    existing_format.save()
                    
                    response_data.append({
                        "message": "Updated",
                        "device_id": device.id,
                        "energy_leading_zero": existing_format.energy_leading_zero,
                        "energy_decimal": existing_format.energy_decimal,
                        "power_decimal": existing_format.power_decimal,
                        "current_decimal": existing_format.current_decimal,
                        "voltage_decimal": existing_format.voltage_decimal,
                        "date_format": existing_format.date_format,
                        "time_format": existing_format.time_format
                    })
                else:
                    # Create a new format if it doesn't exist
                    lcd_display_format = LcdDisplayFormat.objects.create(
                        device=device,
                        energy_leading_zero=energy_leading_zero,
                        energy_decimal=energy_decimal,
                        power_decimal=power_decimal,
                        current_decimal=current_decimal,
                        voltage_decimal=voltage_decimal,
                        date_format=date_format,
                        time_format=time_format
                    )
                    response_data.append({
                        "message": "Created",
                        "device_id": device.id,
                        "energy_leading_zero": lcd_display_format.energy_leading_zero,
                        "energy_decimal": lcd_display_format.energy_decimal,
                        "power_decimal": lcd_display_format.power_decimal,
                        "current_decimal": lcd_display_format.current_decimal,
                        "voltage_decimal": lcd_display_format.voltage_decimal,
                        "date_format": lcd_display_format.date_format,
                        "time_format": lcd_display_format.time_format
                    })

            return Response(response_data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Unexpected error: {e}")
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

     
    def get(self, request, device_id):
        try:
            # Fetch LCD display format for the given device_id
            lcd_display_format = LcdDisplayFormat.objects.filter(device_id=device_id)
            
            # If no records found, return empty list
            if not lcd_display_format:
                return Response([], status=status.HTTP_200_OK)
            
            # Manually format the data into a list of dictionaries
            formatted_data = [
                {
                    "id": item.id,
                    "device_id": item.device.id,  # or item.device_id if it's just the ID
                    "energy_leading_zero": item.energy_leading_zero,
                    "energy_decimal": item.energy_decimal,
                    "power_decimal": item.power_decimal,
                    "current_decimal": item.current_decimal,
                    "voltage_decimal": item.voltage_decimal,
                    "date_format": item.date_format,
                    "time_format": item.time_format
                }
                for item in lcd_display_format
            ]
            
            # Return the manually formatted data
            return Response(formatted_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






'''[
  {
    "device_id": 1,
    "name": "Auto display scroll interval",
    "code": "3,1-0:35.5.0.255",
    "value": 31,
    "unit": "s"
  },
  {
    "device_id": 1,
    "name": "Manual display interval",
    "code": "3,1-0:35.5.0.256",
    "value": 45,
    "unit": "s"
  }
]
'''

from .models import DisplayParameter, Device



class DisplayParameterListCreateUpdateView(APIView):

    def post(self, request):
        try:
            data = json.loads(request.body)

            if not isinstance(data, list):
                return JsonResponse({"error": "Expected a list of display parameters."}, status=400)

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                name = item.get('name')
                code = item.get('code')
                value = item.get('value')
                unit = item.get('unit')

                # Validate required fields
                if not all([device_id, name, code]):
                    return JsonResponse({"error": "device_id, name, and code are required fields."}, status=400)

                # Get the device object
                device = get_object_or_404(Device, id=device_id)

                # Check if the DisplayParameter already exists based on name and code
                existing_parameter = DisplayParameter.objects.filter(device=device, name=name, code=code).first()

                if existing_parameter:
                    # Update the existing parameter
                    existing_parameter.value = value
                    existing_parameter.unit = unit
                    existing_parameter.save()

                    response_data.append({
                        "message": "Updated",
                        "device_id": device.id,
                        "name": existing_parameter.name,
                        "code": existing_parameter.code,
                        "value": existing_parameter.value,
                        "unit": existing_parameter.unit
                    })
                else:
                    # Create a new parameter
                    new_parameter = DisplayParameter.objects.create(
                        device=device,
                        name=name,
                        code=code,
                        value=value,
                        unit=unit
                    )
                    response_data.append({
                        "message": "Created",
                        "device_id": device.id,
                        "name": new_parameter.name,
                        "code": new_parameter.code,
                        "value": new_parameter.value,
                        "unit": new_parameter.unit
                    })

            return JsonResponse(response_data, safe=False, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format."}, status=400)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


    def get(self, request, device_id):
        try:
            device = get_object_or_404(Device, id=device_id)
            parameters = DisplayParameter.objects.filter(device=device)

            response_data = [
                {
                    "device_id": device.id,
                    "name": param.name,
                    "code": param.code,
                    "value": param.value,
                    "unit": param.unit
                }
                for param in parameters
            ]

            return JsonResponse(response_data, safe=False, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)



from django.shortcuts import get_object_or_404

from .models import LoadControlSettings, Device

class LoadControlSettingsListCreateUpdateView(APIView):

    def post(self, request):
        try:
            data = request.data
            print("data", data)

            # Handle single object (convert to list)
            if isinstance(data, dict):
                data = [data]

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                monitored_value = item.get('monitored_value')
                threshold_active_kw = item.get('threshold_active_kw')
                threshold_normal_kw = item.get('threshold_normal_kw')
                min_over_threshold_duration_s = item.get('min_over_threshold_duration_s', 0)
                min_under_threshold_duration_s = item.get('min_under_threshold_duration_s', 0)
                emergency_profile_id = item.get('emergency_profile_id', "")
                emergency_activation_time = item.get('emergency_activation_time')
                emergency_duration = item.get('emergency_duration', 0)
                emergency_profile_group_id_list = item.get('emergency_profile_group_id_list', [])
                emergency_profile_active = item.get('emergency_profile_active', True)
                action_over_threshold = item.get('action_over_threshold', "")
                action_under_threshold = item.get('action_under_threshold', "")

                if not device_id or not monitored_value:
                    return Response({"error": "device_id and monitored_value are required fields."}, status=400)

                device = get_object_or_404(Device, id=device_id)

                # Check if LoadControlSettings already exists
                existing_setting = LoadControlSettings.objects.filter(device=device, monitored_value=monitored_value).first()

                if existing_setting:
                    # Update existing settings
                    existing_setting.threshold_active_kw = threshold_active_kw
                    existing_setting.threshold_normal_kw = threshold_normal_kw
                    existing_setting.min_over_threshold_duration_s = min_over_threshold_duration_s
                    existing_setting.min_under_threshold_duration_s = min_under_threshold_duration_s
                    existing_setting.emergency_profile_id = emergency_profile_id
                    existing_setting.emergency_activation_time = emergency_activation_time
                    existing_setting.emergency_duration = emergency_duration
                    existing_setting.emergency_profile_group_id_list = json.dumps(emergency_profile_group_id_list)  # Store as JSON
                    existing_setting.emergency_profile_active = emergency_profile_active
                    existing_setting.action_over_threshold = action_over_threshold
                    existing_setting.action_under_threshold = action_under_threshold
                    existing_setting.save()

                    response_data.append({
                        "message": "Updated",
                        "device_id": device.id,
                        "monitored_value": existing_setting.monitored_value,
                        "threshold_active_kw": existing_setting.threshold_active_kw,
                        "threshold_normal_kw": existing_setting.threshold_normal_kw,
                        "emergency_profile_active": existing_setting.emergency_profile_active
                    })
                else:
                    # Create new LoadControlSettings
                    new_setting = LoadControlSettings.objects.create(
                        device=device,
                        monitored_value=monitored_value,
                        threshold_active_kw=threshold_active_kw,
                        threshold_normal_kw=threshold_normal_kw,
                        min_over_threshold_duration_s=min_over_threshold_duration_s,
                        min_under_threshold_duration_s=min_under_threshold_duration_s,
                        emergency_profile_id=emergency_profile_id,
                        emergency_activation_time=emergency_activation_time,
                        emergency_duration=emergency_duration,
                        emergency_profile_group_id_list=json.dumps(emergency_profile_group_id_list),  # Store as JSON
                        emergency_profile_active=emergency_profile_active,
                        action_over_threshold=action_over_threshold,
                        action_under_threshold=action_under_threshold
                    )

                    response_data.append({
                        "message": "Created",
                        "device_id": device.id,
                        "monitored_value": new_setting.monitored_value,
                        "threshold_active_kw": new_setting.threshold_active_kw,
                        "threshold_normal_kw": new_setting.threshold_normal_kw,
                        "emergency_profile_active": new_setting.emergency_profile_active
                    })

            return Response(response_data, status=201)

        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON format."}, status=400)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def get(self, request, device_id):
        try:
            device = get_object_or_404(Device, id=device_id)
            settings = LoadControlSettings.objects.filter(device=device)

            response_data = [
                {
                    "device_id": device.id,
                    "monitored_value": setting.monitored_value,
                    "threshold_active_kw": setting.threshold_active_kw,
                    "threshold_normal_kw": setting.threshold_normal_kw,
                    "min_over_threshold_duration_s": setting.min_over_threshold_duration_s,
                    "min_under_threshold_duration_s": setting.min_under_threshold_duration_s,
                    "emergency_profile_id": setting.emergency_profile_id,
                    "emergency_activation_time": setting.emergency_activation_time,
                    "emergency_duration": setting.emergency_duration,
                    "emergency_profile_group_id_list": json.loads(setting.emergency_profile_group_id_list),  # Retrieve JSON
                    "emergency_profile_active": setting.emergency_profile_active,
                    "action_over_threshold": setting.action_over_threshold,
                    "action_under_threshold": setting.action_under_threshold
                }
                for setting in settings
            ]

            return Response(response_data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)



from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_201_CREATED, HTTP_200_OK

from .models import DisconnectControl, Device


class DisconnectControlListCreateUpdateView(APIView):

    def post(self, request):
        try:
            data = request.data

            # Convert to list if single object
            if isinstance(data, dict):
                data = [data]

            response_data = []

            print("data",data)

            for item in data:
                device_id = item.get('device_id')
                relay_select = item.get('relay_select', "Disconnect control (Main relay)")
                output_state = item.get('output_state', "Disconnected")
                control_state = item.get('control_state', "Disconnected")
                control_mode = item.get('control_mode', "Mode 0")
                method = item.get('method', "(0) Reconnected")
                test_times = item.get('test_times', 1)
                hold_connection_ms = item.get('hold_connection_ms', 5000)
                hold_disconnection_ms = item.get('hold_disconnection_ms', 5000)

                if not device_id:
                    return Response({"error": "device_id is required."}, status=HTTP_400_BAD_REQUEST)

                device = get_object_or_404(Device, id=device_id)

                # Check if DisconnectControl already exists
                existing_control = DisconnectControl.objects.filter(device=device).first()

                if existing_control:
                    # Update existing record
                    existing_control.relay_select = relay_select
                    existing_control.output_state = output_state
                    existing_control.control_state = control_state
                    existing_control.control_mode = control_mode
                    existing_control.method = method
                    existing_control.test_times = test_times
                    existing_control.hold_connection_ms = hold_connection_ms
                    existing_control.hold_disconnection_ms = hold_disconnection_ms
                    existing_control.save()

                    response_data.append({
                        "message": "Updated",
                        "device_id": device.id,
                        "relay_select": existing_control.relay_select,
                        "output_state": existing_control.output_state,
                        "control_state": existing_control.control_state
                    })
                else:
                    # Create new DisconnectControl entry
                    new_control = DisconnectControl.objects.create(
                        device=device,
                        relay_select=relay_select,
                        output_state=output_state,
                        control_state=control_state,
                        control_mode=control_mode,
                        method=method,
                        test_times=test_times,
                        hold_connection_ms=hold_connection_ms,
                        hold_disconnection_ms=hold_disconnection_ms
                    )

                    response_data.append({
                        "message": "Created",
                        "device_id": device.id,
                        "relay_select": new_control.relay_select,
                        "output_state": new_control.output_state,
                        "control_state": new_control.control_state
                    })

            return Response(response_data, status=HTTP_201_CREATED)

        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON format."}, status=HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def get(self, request, device_id):
        try:
            device = get_object_or_404(Device, id=device_id)
            controls = DisconnectControl.objects.filter(device=device)

            response_data = [
                {
                    "device_id": device.id,
                    "relay_select": control.relay_select,
                    "output_state": control.output_state,
                    "control_state": control.control_state,
                    "control_mode": control.control_mode,
                    "method": control.method,
                    "test_times": control.test_times,
                    "hold_connection_ms": control.hold_connection_ms,
                    "hold_disconnection_ms": control.hold_disconnection_ms
                }
                for control in controls
            ]

            return Response(response_data, status=HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=500)




from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST
from .models import LoadControlRelated, Device


class LoadControlListCreateUpdateView(APIView):

    def post(self, request):
        try:
            data = request.data

            # Convert single object to list
            if isinstance(data, dict):
                data = [data]

            response_data = []

            for item in data:
                device_id = item.get('device_id')
                name = item.get('name', "Load Control Default Name")
                code = item.get('code')
                value = item.get('value', "Default Value")
                checked = item.get('checked', True)

                if not device_id or not code:
                    return Response({"error": "device_id and code are required."}, status=HTTP_400_BAD_REQUEST)

                device = get_object_or_404(Device, id=device_id)

                # Check if LoadControlRelated already exists
                existing_control = LoadControlRelated.objects.filter(device=device, code=code).first()

                if existing_control:
                    # Update existing record
                    existing_control.name = name
                    existing_control.value = value
                    existing_control.checked = checked
                    existing_control.save()

                    response_data.append({
                        "message": "Updated",
                        "device_id": device.id,
                        "name": existing_control.name,
                        "code": existing_control.code,
                        "value": existing_control.value,
                        "checked": existing_control.checked
                    })
                else:
                    # Create new LoadControlRelated entry
                    new_control = LoadControlRelated.objects.create(
                        device=device,
                        name=name,
                        code=code,
                        value=value,
                        checked=checked
                    )

                    response_data.append({
                        "message": "Created",
                        "device_id": device.id,
                        "name": new_control.name,
                        "code": new_control.code,
                        "value": new_control.value,
                        "checked": new_control.checked
                    })

            return Response(response_data, status=HTTP_201_CREATED)

        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON format."}, status=HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def get(self, request, device_id):
        try:
            device = get_object_or_404(Device, id=device_id)
            controls = LoadControlRelated.objects.filter(device=device)

            response_data = [
                {
                    "device_id": device.id,
                    "name": control.name,
                    "code": control.code,
                    "value": control.value,
                    "checked": control.checked
                }
                for control in controls
            ]

            return Response(response_data, status=HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=500)




from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST
from django.shortcuts import get_object_or_404
from .models import Relay1Status, Device
import json

class Relay1StatusListCreateUpdateView(APIView):

    def post(self, request):
        try:
            data = request.data

            print("data",data)

            # Convert single object to list
            if isinstance(data, dict):
                data = [data]

            response_data = []

            for item in data:
                device_id = item.get('device_id')

                if not device_id:
                    return Response({"error": "device_id is required."}, status=HTTP_400_BAD_REQUEST)

                device = get_object_or_404(Device, id=device_id)

                # Get or create Relay1Status
                relay_status, created = Relay1Status.objects.get_or_create(device=device)

                # Update relay status fields dynamically
                for key in [
                    "top_cover_open", "terminal_cover_open", "module_cover_open",
                    "dc_field_detected", "over_voltage", "current_reverse",
                    "no_credit", "under_voltage", "ct_bypass", "low_credit_2", "o_price"
                ]:
                    if key in item:
                        setattr(relay_status, key, item[key])

                relay_status.status_of_control_signals = item.get("status_of_control_signals", relay_status.status_of_control_signals)
                relay_status.save()

                response_data.append({
                    "message": "Updated" if not created else "Created",
                    "device_id": device.id,
                    "status_of_control_signals": relay_status.status_of_control_signals,
                    "top_cover_open": relay_status.top_cover_open,
                    "terminal_cover_open": relay_status.terminal_cover_open,
                    "module_cover_open": relay_status.module_cover_open,
                    "dc_field_detected": relay_status.dc_field_detected,
                    "over_voltage": relay_status.over_voltage,
                    "current_reverse": relay_status.current_reverse,
                    "no_credit": relay_status.no_credit,
                    "under_voltage": relay_status.under_voltage,
                    "ct_bypass": relay_status.ct_bypass,
                    "low_credit_2": relay_status.low_credit_2,
                    "o_price": relay_status.o_price
                })

            return Response(response_data, status=HTTP_201_CREATED)

        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON format."}, status=HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def get(self, request, device_id):
        try:
            device = get_object_or_404(Device, id=device_id)
            relay_status = get_object_or_404(Relay1Status, device=device)

            response_data = {
                "device_id": device.id,
                "status_of_control_signals": relay_status.status_of_control_signals,
                "top_cover_open": relay_status.top_cover_open,
                "terminal_cover_open": relay_status.terminal_cover_open,
                "module_cover_open": relay_status.module_cover_open,
                "dc_field_detected": relay_status.dc_field_detected,
                "over_voltage": relay_status.over_voltage,
                "current_reverse": relay_status.current_reverse,
                "no_credit": relay_status.no_credit,
                "under_voltage": relay_status.under_voltage,
                "ct_bypass": relay_status.ct_bypass,
                "low_credit_2": relay_status.low_credit_2,
                "o_price": relay_status.o_price
            }

            return Response(response_data, status=HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=500)



from .models import Relay2Status, Device

class Relay2StatusView(APIView):
    def get(self, request, device_id):
        try:
            relay_status = get_object_or_404(Relay2Status, device__id=device_id)

            data = {
                "device_id": relay_status.device.id,
                "status_of_control_signals": relay_status.status_of_control_signals,
                "top_cover_open": relay_status.top_cover_open,
                "terminal_cover_open": relay_status.terminal_cover_open,
                "module_cover_open": relay_status.module_cover_open,
                "dc_field_detected": relay_status.dc_field_detected,
                "over_voltage": relay_status.over_voltage,
                "current_reverse": relay_status.current_reverse,
                "no_credit": relay_status.no_credit,
                "under_voltage": relay_status.under_voltage,
                "ct_bypass": relay_status.ct_bypass,
                "low_credit_2": relay_status.low_credit_2,
                "o_price": relay_status.o_price,
            }
            return Response(data, status=HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        try:
            data = request.data

            if "device_id" not in data:
                return Response({"error": "device_id is required."}, status=HTTP_400_BAD_REQUEST)

            device = get_object_or_404(Device, id=data["device_id"])

            # Get or create Relay2Status for the device
            relay_status, created = Relay2Status.objects.get_or_create(device=device)

            # Update fields dynamically
            for key in [
                "status_of_control_signals", "top_cover_open", "terminal_cover_open",
                "module_cover_open", "dc_field_detected", "over_voltage",
                "current_reverse", "no_credit", "under_voltage", "ct_bypass",
                "low_credit_2", "o_price"
            ]:
                if key in data:
                    setattr(relay_status, key, data[key])

            relay_status.save()

            return Response({
                "message": "Updated" if not created else "Created",
                "device_id": relay_status.device.id,
                "status_of_control_signals": relay_status.status_of_control_signals,
                "top_cover_open": relay_status.top_cover_open,
                "terminal_cover_open": relay_status.terminal_cover_open,
                "module_cover_open": relay_status.module_cover_open,
                "dc_field_detected": relay_status.dc_field_detected,
                "over_voltage": relay_status.over_voltage,
                "current_reverse": relay_status.current_reverse,
                "no_credit": relay_status.no_credit,
                "under_voltage": relay_status.under_voltage,
                "ct_bypass": relay_status.ct_bypass,
                "low_credit_2": relay_status.low_credit_2,
                "o_price": relay_status.o_price
            }, status=HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=500)



from .models import BeepControlFilter, Device

class BeepControlFilterView(APIView):
    def get(self, request, device_id):
        try:
            beep_control = get_object_or_404(BeepControlFilter, device__id=device_id)

            data = {
                "device_id": beep_control.device.id,
                "beep_control_filter": beep_control.beep_control_filter , 
                "step_1": beep_control.step_1,
                "step_2": beep_control.step_2,
                "step_3": beep_control.step_3,
                "step_4": beep_control.step_4,
                "step_5": beep_control.step_5,
                "step_6": beep_control.step_6,
                "step_7": beep_control.step_7,
                "step_8": beep_control.step_8,
                "step_9": beep_control.step_9,
                "step_10": beep_control.step_10,
                "disenable_buzzer_alarm": beep_control.disenable_buzzer_alarm,
            }
            return Response(data, status=HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):

        try:
            data = request.data
            print("data", data)  # Debug incoming data

            if "device_id" not in data:
                return Response({"error": "device_id is required."}, status=HTTP_400_BAD_REQUEST)

            device = get_object_or_404(Device, id=data["device_id"])

            # Get or create BeepControlFilter for the device
            beep_control, created = BeepControlFilter.objects.get_or_create(device=device)

            # Field name mapping
            field_mapping = {
                "status_of_beep_control": "beep_control_filter",
                "step_1_close": "step_1",
                "step_2_close": "step_2",
                "step_3_close": "step_3",
                "step_4_close": "step_4",
                "step_5_close": "step_5",
                "step_6_close": "step_6",
                "step_7_close": "step_7",
                "step_8_close": "step_8",
                "step_9_close": "step_9",
                "step_10_close": "step_10",
                "disable_buzzer": "disenable_buzzer_alarm",
            }

            # Update fields dynamically
            for incoming_key, model_field in field_mapping.items():
                if incoming_key in data:
                    setattr(beep_control, model_field, data[incoming_key])

            beep_control.save()

            return Response({
                "message": "Updated" if not created else "Created",
                "device_id": beep_control.device.id,
                "beep_control_filter": beep_control.beep_control_filter,
                "step_1": beep_control.step_1,
                "step_2": beep_control.step_2,
                "step_3": beep_control.step_3,
                "step_4": beep_control.step_4,
                "step_5": beep_control.step_5,
                "step_6": beep_control.step_6,
                "step_7": beep_control.step_7,
                "step_8": beep_control.step_8,
                "step_9": beep_control.step_9,
                "step_10": beep_control.step_10,
                "disenable_buzzer_alarm": beep_control.disenable_buzzer_alarm,
            }, status=HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=500)







#second phase 

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
import json, time

from .models import InstantaneousReading, Device

# views.py
import json
import time
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Device, InstantaneousReading

class InstantaneousReadingsAPIView(APIView):
    def post(self, request):
        serial_number = request.data.get('serial_number')
        action = request.data.get('action')
        parameters = request.data.get('parameters', [])
        # optional flag if you ever want to stream without persisting
        persist = request.data.get('persist', True)

        if not serial_number or not parameters:
            return Response(
                {"error": "serial_number and parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        device = get_object_or_404(Device, serial_number=serial_number)

        def event_stream():
            # iterate parameters and stream values; update DB using update_or_create
            for param in parameters:
                obis_code = param.get('obis_code')
                attribute_index = param.get('attribute_index', '2')

                # simulate a reading value (replace with real reading code)
                fake_value = f"{round(200 + 50 * (time.time() % 1), 2)}"

                # update existing record (or create it once) instead of creating duplicates
                if persist:
                    try:
                        InstantaneousReading.objects.update_or_create(
                            device=device,
                            obis_code=obis_code,
                            attribute_index=attribute_index,
                            defaults={
                                "value": fake_value,
                                "timestamp": timezone.now()
                            }
                        )
                    except Exception as e:
                        # log, but still stream the value to client
                        # use your logger instead of print in production
                        print("DB upsert error:", e)

                # stream the single reading chunk to the client (SSE format)
                data = {
                    "obis_code": obis_code,
                    "attribute_index": attribute_index,
                    "value": fake_value
                }
                yield f"data: {json.dumps(data)}\n\n"

                # pause between simulated readings
                time.sleep(1)

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        return response




# views.py (only the helpers + simulator + filter updated — keep the rest of your file as-is)

import json
import time
import logging
from datetime import datetime, timezone as dt_timezone
from typing import List, Dict, Any, Optional

from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse
from django.utils.dateparse import parse_datetime
from django.utils import timezone as dj_timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Device, MonthlyBillingReading

logger = logging.getLogger(__name__)


def _ensure_aware_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Ensure dt is timezone-aware in UTC. If dt is naive, assume UTC.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=dt_timezone.utc)
    return dt.astimezone(dt_timezone.utc)


def _norm_parse_datetime(s: Optional[str]) -> Optional[datetime]:
    """
    Parse a datetime string into an aware UTC datetime.
    Accepts ISO forms, trailing 'Z' and plain 'YYYY-MM-DD HH:MM:SS'.
    Returns None if parsing fails.
    """
    if not s:
        return None
    s = s.strip()
    # Normalise trailing Z to +00:00 (parse_datetime understands offsets)
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"

    parsed = None
    try:
        parsed = parse_datetime(s)  # django parser; returns aware if offset present
    except Exception:
        parsed = None

    if parsed is None:
        try:
            # Python 3.7+ fromisoformat (may raise for some formats)
            parsed = datetime.fromisoformat(s)
        except Exception:
            parsed = None

    # Last resort: try parsing common 'YYYY-MM-DD HH:MM:SS' (no timezone)
    if parsed is None:
        try:
            parsed = datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
        except Exception:
            parsed = None

    return _ensure_aware_utc(parsed)


def _simulate_readings() -> List[Dict[str, Any]]:
    """
    Simple simulator for testing when DB empty.
    NOTE: simulated reading datetimes are returned as timezone-aware ISO strings (+00:00).
    """
    base_date = datetime(2024, 3, 19, 14, 28, 0, tzinfo=dt_timezone.utc)
    readings = []
    for i in range(1, 14):
        # increase day safely (works for this range)
        dt = base_date.replace(day=19 + (i - 1))
        readings.append({
            "no": i,
            "date": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "reading_datetime": dt.isoformat(),          # includes +00:00
            "active_import": f"{round(13.0 + (i * 0.001), 3)} kWh",
            "active_export": "0.000 kWh",
            "reactive_import": "0.174 kvarh",
            "reactive_export": "0.000 kvarh",
            "residual": f"{round(100 - i, 2)} currency",
            "energy_used": f"{round(0.013 * i, 3)} kWh",
        })
    return readings


def _get_stored_readings(device: Device) -> List[Dict[str, Any]]:
    """
    Read DB rows for device; fall back to simulator if no DB rows exist.
    Ensures serialized reading_datetime includes offset.
    """
    qs = MonthlyBillingReading.objects.filter(device=device).order_by('entry_no')
    if not qs.exists():
        return _simulate_readings()
    out = []
    for r in qs:
        dt = r.reading_datetime
        if dt is None:
            iso = None
            pretty = None
        else:
            # Make sure we output an ISO with timezone info
            dt = _ensure_aware_utc(dt)
            iso = dt.isoformat()
            pretty = dt.strftime("%Y-%m-%d %H:%M:%S")
        out.append({
            "no": r.entry_no,
            "date": pretty,
            "reading_datetime": iso,
            "active_import": r.active_import,
            "active_export": r.active_export,
            "reactive_import": r.reactive_import,
            "reactive_export": r.reactive_export,
            "residual": r.residual,
            "energy_used": r.energy_used,
        })
    return out


def _filter_by_mode(readings: List[Dict[str, Any]],
                    mode: str,
                    from_entry: Optional[int] = None,
                    to_entry: Optional[int] = None,
                    from_date: Optional[datetime] = None,
                    to_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """
    Filter readings based on mode.
    - entry: uses numeric 'no'
    - range: uses reading_datetime (inclusive) after robust parsing + timezone normalization
    - latest: last reading
    - all: return all
    """
    mode = (mode or "all").lower()

    if mode == "entry":
        if from_entry is None:
            return []
        if to_entry is None:
            return [r for r in readings if r.get("no") == from_entry]
        return [r for r in readings if from_entry <= r.get("no", 0) <= to_entry]

     
    # Replace the entire 'mode == "range"' block with this:

    if mode == "range":
        return readings


    if mode == "latest":
        return [readings[-1]] if readings else []

    # default: all
    return readings

# -------------------- Views --------------------

class MonthlyBillingAPIView(APIView):
    """
    POST payload examples:
      - All (streaming): {"serial_number":"MTR1","mode":"all","stream":true}
      - Entry (single):  {"serial_number":"MTR1","mode":"entry","from_entry":5,"stream":true}
      - Entry range:     {"serial_number":"MTR1","mode":"entry","from_entry":2,"to_entry":6,"stream":false}
      - Date range:      {"serial_number":"MTR1","mode":"range","from_date":"2025-09-01T18:22:00.000Z","to_date":"2025-09-13T18:22:00.000Z","stream":true}
      - Latest:          {"serial_number":"MTR1","mode":"latest","stream":true}
    """

    def post(self, request, *args, **kwargs):
        payload = request.data or {}
        print("payload",payload)
        logger.info("monthly_billing payload: %s", payload)

        serial_number = payload.get("serial_number")
        mode = payload.get("mode", "all")
        from_entry = payload.get("from_entry")
        to_entry = payload.get("to_entry")
        from_date_raw = payload.get("from_date")
        to_date_raw = payload.get("to_date")
        stream = bool(payload.get("stream", True))
        save_to_db = bool(payload.get("save_to_db", False))

        if not serial_number:
            return Response({"error": "serial_number is required"}, status=status.HTTP_400_BAD_REQUEST)

        logger.info("mode=%s from_entry=%s to_entry=%s from_date=%s to_date=%s stream=%s",
                    mode, from_entry, to_entry, from_date_raw, to_date_raw, stream)

        device = get_object_or_404(Device, serial_number=serial_number)

        # parse integers and dates
        try:
            from_entry_i = int(from_entry) if from_entry is not None else None
        except Exception:
            from_entry_i = None
        try:
            to_entry_i = int(to_entry) if to_entry is not None else None
        except Exception:
            to_entry_i = None

        from_date = _norm_parse_datetime(from_date_raw) if from_date_raw else None
        to_date = _norm_parse_datetime(to_date_raw) if to_date_raw else None

        

        logger.info("parsed from_entry=%s to_entry=%s from_date=%s to_date=%s",
                    from_entry_i, to_entry_i, from_date, to_date)

        readings = _get_stored_readings(device)
        print("readings",readings)
        logger.info("total available readings: %d", len(readings))

        selected = _filter_by_mode(
            readings,
            mode=mode,
            from_entry=from_entry_i,
            to_entry=to_entry_i,
            from_date=from_date,
            to_date=to_date
        ) 

        print("selected",selected)

        logger.info("selected count=%d for mode=%s", len(selected), mode)

        if not selected:
            debug = {
                "data": [],
                "debug": {
                    "reason": "no matching readings",
                    "total_available": len(readings),
                    "mode": mode,
                    "from_entry": from_entry_i,
                    "to_entry": to_entry_i,
                    "from_date_raw": from_date_raw,
                    "to_date_raw": to_date_raw,
                    "parsed_from_date": from_date.isoformat() if from_date else None,
                    "parsed_to_date": to_date.isoformat() if to_date else None
                }
            }
            return Response(debug, status=status.HTTP_200_OK)

        # Streaming (SSE) response — frontend should read via getReader() loop
        if stream:
            def generator():
                for item in selected:
                    
                    # optionally persist each row
                    if save_to_db:
                        try:
                            MonthlyBillingReading.objects.update_or_create(
                                device=device,
                                entry_no=item["no"],
                                defaults={
                                    "reading_datetime": _norm_parse_datetime(item.get("reading_datetime")) or dj_timezone.now(),
                                    "active_import": item.get("active_import"),
                                    "active_export": item.get("active_export"),
                                    "reactive_import": item.get("reactive_import"),
                                    "reactive_export": item.get("reactive_export"),
                                    "residual": item.get("residual"),
                                    "energy_used": item.get("energy_used"),
                                }
                            )
                        except Exception:
                            logger.exception("DB save error for item %s", item)
                    yield f"data: {json.dumps(item)}\n\n"
                    time.sleep(0.05)  # small gap so frontend processes one by one

            resp = StreamingHttpResponse(generator(), content_type="text/event-stream")
            
            resp["Cache-Control"] = "no-cache"
            resp["X-Accel-Buffering"] = "no"  # useful for nginx
            resp["Access-Control-Allow-Origin"] = "*"  # for local dev; tighten in prod
            return resp

        # Non-streaming JSON response (single array)
       
        return Response({"data": selected}, status=status.HTTP_200_OK)




class SaveMonthlyReadingsAPIView(APIView):
    """
    Accepts a list of readings from frontend and persists them.
    Expected payload:
    {
      "serial_number": "MTR1",
      "readings": [
         { "entry_no": 1, "reading_datetime":"2024-03-19T14:28:00Z", "active_import":"13.044 kWh", ... },
         ...
      ]
    }
    """
    def post(self, request, *args, **kwargs):
        payload = request.data or {}
        serial_number = payload.get("serial_number")
        readings = payload.get("readings", [])

        if not serial_number or not isinstance(readings, list):
            return Response({"error": "serial_number and readings[] are required"}, status=status.HTTP_400_BAD_REQUEST)

        device = get_object_or_404(Device, serial_number=serial_number)
        saved = 0
        errors = []
        for item in readings:
            try:
                entry_no = int(item.get("entry_no"))
                dt = _norm_parse_datetime(item.get("reading_datetime")) or dj_timezone.now()
                MonthlyBillingReading.objects.update_or_create(
                    device=device,
                    entry_no=entry_no,
                    defaults={
                        "reading_datetime": dt,
                        "active_import": item.get("active_import"),
                        "active_export": item.get("active_export"),
                        "reactive_import": item.get("reactive_import"),
                        "reactive_export": item.get("reactive_export"),
                        "residual": item.get("residual"),
                        "energy_used": item.get("energy_used"),
                    }
                )
                saved += 1
            except Exception as e:
                logger.exception("Error saving reading: %s", e)
                errors.append({"item": item, "error": str(e)})

        return Response({"message": "Saved", "saved": saved, "errors": errors}, status=status.HTTP_200_OK)

















# views.py
import time
import json
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# adjust the import to your app layout
from .models import EnergyReading, Device

class EnergyReadingsAPIView(APIView):
    """
    POST /api/energy-readings/stream/
    Accepts JSON payload like:
    {
      "serial_number": "sai2",
      "action": "read_obis",              # optional label for client (not strictly required)
      "energy_type": "active",           # optional global energy_type default for parameters
      "parameters": [
         {"obis_code":"1.0.1.8.0.255","attribute_index":"2"},
         {"obis_code":"1.0.2.8.0.255","attribute_index":"2","energy_type":"active"}
      ],
      "persist": true                     # optional, default true - if false will stream but not save
    }

    Responds as Server-Sent Events stream with chunks:
      data: {"obis_code":"1.0.1.8.0.255","attribute_index":"2","energy_type":"active","value":"13.123"}\n\n
    """

    def post(self, request):
        serial_number = request.data.get("serial_number")
        action = request.data.get("action", "")
        parameters = request.data.get("parameters", [])
        global_energy_type = request.data.get("energy_type", None)
        persist = request.data.get("persist", True)
        print("global_energy_type",action,parameters,global_energy_type)
        
        if not serial_number or not isinstance(parameters, list) or len(parameters) == 0:
            return Response(
                {"error": "serial_number and non-empty parameters list are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        device = get_object_or_404(Device, serial_number=serial_number)

        def event_stream():
            """
            For each parameter yield an SSE chunk. Attempt to upsert into EnergyReading
            if persist is True. We intentionally continue streaming even if DB upsert fails.
            """
            # optional starting event
            start_data = {"status": "started", "action": action, "serial_number": serial_number}
            yield f"data: {json.dumps(start_data)}\n\n"

            for param in parameters:
                obis_code = param.get("obis_code")
                attribute_index = str(param.get("attribute_index", "2"))
                # per-parameter energy type overrides global
                energy_type = param.get("energy_type") or global_energy_type or "active"

                # if obis_code is missing skip with an error event
                if not obis_code:
                    err = {"error": "missing obis_code in parameter", "parameter": param}
                    yield f"data: {json.dumps(err)}\n\n"
                    continue

                # TODO: replace fake_value generation with real meter read logic
                fake_value = f"{round(100 + 50 * (time.time() % 1), 3)}"

                # Persist/upsert into DB if requested
                if persist:
                    try:
                        EnergyReading.objects.update_or_create(
                            device=device,
                            energy_type=energy_type,
                            obis_code=obis_code,
                            attribute_index=attribute_index,
                            defaults={
                                "value": fake_value,
                                "timestamp": timezone.now()
                            }
                        )
                    except Exception as e:
                        # don't stop streaming; emit an error chunk so client can log it
                        err = {"warning": "DB upsert failed", "detail": str(e), "parameter": param}
                        yield f"data: {json.dumps(err)}\n\n"

                # Emit the reading as SSE
                data = {
                    "obis_code": obis_code,
                    "attribute_index": attribute_index,
                    "energy_type": energy_type,
                    "value": fake_value,
                    "timestamp": timezone.now().isoformat()
                }
                yield f"data: {json.dumps(data)}\n\n"

                # pace the stream (adjust interval as needed)
                time.sleep(1)

            # optional finished event
            finish_data = {"status": "finished", "action": action, "serial_number": serial_number}
            yield f"data: {json.dumps(finish_data)}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        return response



from .models import EnergyReading, Device,EventLogInformation

class DemandReadingsAPIView(APIView):
    """
    POST /api/energy-readings/stream/
    Accepts JSON payload like:
    {
      "serial_number": "sai2",
      "action": "read_obis",              # optional label for client (not strictly required)
      "energy_type": "active",           # optional global energy_type default for parameters
      "parameters": [
         {"obis_code":"1.0.1.8.0.255","attribute_index":"2"},
         {"obis_code":"1.0.2.8.0.255","attribute_index":"2","energy_type":"active"}
      ],
      "persist": true                     # optional, default true - if false will stream but not save
    }

    Responds as Server-Sent Events stream with chunks:
      data: {"obis_code":"1.0.1.8.0.255","attribute_index":"2","energy_type":"active","value":"13.123"}\n\n
    """

    def post(self, request):
        serial_number = request.data.get("serial_number")
        action = request.data.get("action", "")
        parameters = request.data.get("parameters", [])
        global_energy_type = request.data.get("energy_type", None)
        persist = request.data.get("persist", True)
        print("global_energy_type",action,parameters,global_energy_type)
        
        if not serial_number or not isinstance(parameters, list) or len(parameters) == 0:
            return Response(
                {"error": "serial_number and non-empty parameters list are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        device = get_object_or_404(Device, serial_number=serial_number)

        def event_stream():
            """
            For each parameter yield an SSE chunk. Attempt to upsert into EnergyReading
            if persist is True. We intentionally continue streaming even if DB upsert fails.
            """
            # optional starting event
            start_data = {"status": "started", "action": action, "serial_number": serial_number}
            yield f"data: {json.dumps(start_data)}\n\n"

            for param in parameters:
                obis_code = param.get("obis_code")
                attribute_index = str(param.get("attribute_index", "2"))
                # per-parameter energy type overrides global
                energy_type = param.get("energy_type") or global_energy_type or "active"

                # if obis_code is missing skip with an error event
                if not obis_code:
                    err = {"error": "missing obis_code in parameter", "parameter": param}
                    yield f"data: {json.dumps(err)}\n\n"
                    continue

                # TODO: replace fake_value generation with real meter read logic
                fake_value = f"{round(100 + 50 * (time.time() % 1), 3)}"

                # Persist/upsert into DB if requested
                if persist:
                    try:
                        DemandReading.objects.update_or_create(
                            device=device,
                            energy_type=energy_type,
                            obis_code=obis_code,
                            attribute_index=attribute_index,
                            defaults={
                                "value": fake_value,
                                "timestamp": timezone.now()
                            }
                        )
                    except Exception as e:
                        # don't stop streaming; emit an error chunk so client can log it
                        err = {"warning": "DB upsert failed", "detail": str(e), "parameter": param}
                        yield f"data: {json.dumps(err)}\n\n"

                # Emit the reading as SSE
                data = {
                    "obis_code": obis_code,
                    "attribute_index": attribute_index,
                    "energy_type": energy_type,
                    "value": fake_value,
                    "timestamp": timezone.now().isoformat()
                }
                yield f"data: {json.dumps(data)}\n\n"

                # pace the stream (adjust interval as needed)
                time.sleep(1)

            # optional finished event
            finish_data = {"status": "finished", "action": action, "serial_number": serial_number}
            yield f"data: {json.dumps(finish_data)}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        return response




class EventLogAPIView(APIView):
    """
    POST /api/energy-readings/stream/
    Accepts JSON payload like:
    {
      "serial_number": "sai2",
      "action": "read_obis",              # optional label for client (not strictly required)
      "energy_type": "active",           # optional global energy_type default for parameters
      "parameters": [
         {"obis_code":"1.0.1.8.0.255","attribute_index":"2"},
         {"obis_code":"1.0.2.8.0.255","attribute_index":"2","energy_type":"active"}
      ],
      "persist": true                     # optional, default true - if false will stream but not save
    }

    Responds as Server-Sent Events stream with chunks:
      data: {"obis_code":"1.0.1.8.0.255","attribute_index":"2","energy_type":"active","value":"13.123"}\n\n
    """

    def post(self, request):
        serial_number = request.data.get("serial_number")
        action = request.data.get("action", "")
        parameters = request.data.get("parameters", [])
        
        persist = request.data.get("persist", True)
        print("global_energy_type",action,parameters,)
        
        if not serial_number or not isinstance(parameters, list) or len(parameters) == 0:
            return Response(
                {"error": "serial_number and non-empty parameters list are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        device = get_object_or_404(Device, serial_number=serial_number)

        def event_stream():
            """
            For each parameter yield an SSE chunk. Attempt to upsert into EnergyReading
            if persist is True. We intentionally continue streaming even if DB upsert fails.
            """
            # optional starting event
            start_data = {"status": "started", "action": action, "serial_number": serial_number}
            yield f"data: {json.dumps(start_data)}\n\n"

            for param in parameters:
                obis_code = param.get("obis_code")
                attribute_index = str(param.get("attribute_index", "2"))
                # per-parameter energy type overrides global
                energy_type = param.get("energy_type")  or "active"

                # if obis_code is missing skip with an error event
                if not obis_code:
                    err = {"error": "missing obis_code in parameter", "parameter": param}
                    yield f"data: {json.dumps(err)}\n\n"
                    continue

                # TODO: replace fake_value generation with real meter read logic
                fake_value = f"{round(100 + 50 * (time.time() % 1), 3)}"

                # Persist/upsert into DB if requested
                if persist:
                    try:
                        EventLogInformation.objects.update_or_create(
                            device=device,
                            
                            obis_code=obis_code,
                            attribute_index=attribute_index,
                            defaults={
                                "value": fake_value,
                                "timestamp": timezone.now()
                            }
                        )
                    except Exception as e:
                        # don't stop streaming; emit an error chunk so client can log it
                        err = {"warning": "DB upsert failed", "detail": str(e), "parameter": param}
                        yield f"data: {json.dumps(err)}\n\n"

                # Emit the reading as SSE
                data = {
                    "obis_code": obis_code,
                    "attribute_index": attribute_index,
                   
                    "value": fake_value,
                    "timestamp": timezone.now().isoformat()
                }
                yield f"data: {json.dumps(data)}\n\n"

                # pace the stream (adjust interval as needed)
                time.sleep(1)

            # optional finished event
            finish_data = {"status": "finished", "action": action, "serial_number": serial_number}
            yield f"data: {json.dumps(finish_data)}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        return response


import json
import time
import logging
from datetime import datetime
from django.utils import timezone as dj_timezone
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import Device, EventLog

logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------

def _norm_parse_datetime(dt_str):
    """Convert ISO-like datetime strings to tz-aware datetime."""
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return None


def _get_stored_event_logs(device, log_type="standard"):
    """Return all event logs for a given device (list of dicts)."""
    qs = EventLog.objects.filter(device=device, log_type=log_type).order_by("entry_no")
    return [
        {
            "no": log.entry_no,
            "time": log.event_time.isoformat(),
            "event_code": log.event_code,
        }
        for log in qs
    ]


def _filter_by_mode(logs, mode, from_entry=None, to_entry=None, from_date=None, to_date=None):
    """Apply entry or date range filters."""
    if mode == "entry" and from_entry is not None:
        if to_entry is not None:
            return [r for r in logs if from_entry <= r["no"] <= to_entry]
        else:
            return [r for r in logs if r["no"] == from_entry]
    elif mode == "range" and from_date and to_date:
        return [
            r
            for r in logs
            if _norm_parse_datetime(r["time"])
            and from_date <= _norm_parse_datetime(r["time"]) <= to_date
        ]
    elif mode == "latest":
        return logs[-1:] if logs else []
    else:
        return logs


# -------------------------------------------------------------------
# API: Read / Stream / Generate Logs (with 13-event-code limit)
# -------------------------------------------------------------------
from django.db import transaction




class EventLogAPIView1(APIView):
    MAX_EVENT_CODES = 13

    # mapping from log_type to a short prefix (keeps codes readable)
    PREFIX_MAP = {
        "standard": "standard",
        "fraud": "fraud",
        "disconnector": "disconnector",
        "power_quality": "power_quality",
        "communication": "communication",
        "other": "other",
    }

    def _make_code(self, prefix: str, index: int) -> str:
        """Return event code like 'standard_EVT0001'"""
        return f"{prefix}_EVT{index:04d}"

    def post(self, request, *args, **kwargs):
        payload = request.data or {}
        logger.info("EventLog request: %s", payload)
        print("payload", payload)

        serial_number = payload.get("serial_number")
        log_type = payload.get("type_log", "standard")
        mode = payload.get("mode", "all")  # 'all', 'latest', 'entry', 'range'
        from_entry = payload.get("from_entry")
        to_entry = payload.get("to_entry")
        from_date_raw = payload.get("from_date")
        to_date_raw = payload.get("to_date")
        stream = bool(payload.get("stream", True))

        if not serial_number:
            return Response({"error": "serial_number is required"}, status=400)

        device = get_object_or_404(Device, serial_number=serial_number)

        # get prefix for this log_type (fallback to raw log_type)
        prefix = self.PREFIX_MAP.get(log_type, log_type)

        # Determine next entry_no (only used during initial creation / new rows)
        last_entry = (
            EventLog.objects.filter(device=device, log_type=log_type)
            .order_by("-entry_no")
            .first()
        )
        next_entry_no = last_entry.entry_no + 1 if last_entry else 1

        with transaction.atomic():
            existing_codes_qs = (
                EventLog.objects.filter(device=device, log_type=log_type)
                .values_list("event_code", flat=True)
                .distinct()
                .order_by("event_code")
            )
            existing_codes = list(existing_codes_qs)
            existing_count = len(existing_codes)

            # If no events exist -> create 13 initial entries using the prefix
            if existing_count == 0:
                now = dj_timezone.now()
                for i in range(1, self.MAX_EVENT_CODES + 1):
                    code = self._make_code(prefix, i)
                    EventLog.objects.create(
                        device=device,
                        entry_no=i,
                        event_time=now,
                        event_code=code,
                        log_type=log_type,
                    )
                logger.info(
                    "Created initial %d EventLog entries for %s (prefix=%s).",
                    self.MAX_EVENT_CODES,
                    device,
                    prefix,
                )

            # If less than 13 exist -> create the next sequential one for this prefix
            elif existing_count < self.MAX_EVENT_CODES:
                new_slot = existing_count + 1
                event_code_to_use = self._make_code(prefix, new_slot)
                EventLog.objects.create(
                    device=device,
                    entry_no=next_entry_no,
                    event_time=dj_timezone.now(),
                    event_code=event_code_to_use,
                    log_type=log_type,
                )
                logger.info(
                    "Created event code %s for device=%s, log_type=%s",
                    event_code_to_use,
                    device,
                    log_type,
                )

            # If 13 entries already exist -> update event_time for ALL 13 (same log_type)
            else:
                now = dj_timezone.now()
                EventLog.objects.filter(device=device, log_type=log_type).update(event_time=now)
                logger.info(
                    "Updated event_time for all %d EventLog entries for device=%s, log_type=%s (prefix=%s).",
                    self.MAX_EVENT_CODES,
                    device,
                    log_type,
                    prefix,
                )

        # ---------------------------------------------------------
        # Fetch all event logs and apply filters (unchanged)
        # ---------------------------------------------------------
        all_logs = _get_stored_event_logs(device, log_type=log_type)

        try:
            from_entry_i = int(from_entry) if from_entry else None
            to_entry_i = int(to_entry) if to_entry else None
        except ValueError:
            return Response({"error": "Invalid entry numbers"}, status=400)

        from_date = _norm_parse_datetime(from_date_raw)
        to_date = _norm_parse_datetime(to_date_raw)

        if mode == "entry":
            if from_entry_i and to_entry_i:
                filtered = [
                    log for log in all_logs
                    if from_entry_i <= log["no"] <= to_entry_i
                ]
            elif from_entry_i:
                filtered = [log for log in all_logs if log["no"] == from_entry_i]
            else:
                filtered = []
        elif mode == "latest":
            filtered = all_logs[-1:] if all_logs else []
        elif mode == "range" and from_date and to_date:
            filtered = [
                log for log in all_logs
                if from_date <= _norm_parse_datetime(log["time"]) <= to_date
            ]
        else:
            filtered = all_logs

        if not filtered:
            return Response({"data": []}, status=200)

        if stream:
            def event_stream():
                for item in filtered:
                    yield f"data: {json.dumps(item)}\n\n"
                    time.sleep(0.05)

            resp = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
            resp["Cache-Control"] = "no-cache"
            resp["X-Accel-Buffering"] = "no"
            resp["Access-Control-Allow-Origin"] = "*"
            return resp

        return Response({"data": filtered}, status=200)





# meter1/views.py
import json
import time
import random
from decimal import Decimal
from datetime import datetime

from django.db import transaction
from django.utils import timezone as dj_timezone
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import StreamingHttpResponse

from .models import Device, EventLog2

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------
def _norm_parse_datetime(raw):
    """Safe datetime parser. Accepts ISO-like strings or returns None."""
    if not raw:
        return None
    if isinstance(raw, datetime):
        return raw
    try:
        return datetime.fromisoformat(raw)
    except Exception:
        try:
            return datetime.strptime(raw, "%Y-%m-%d %H:%M:%S")
        except Exception:
            return None


def _get_stored_event_logs(device, log_type="purchase"):
    """
    Return list of dict logs for the device+log_type ordered by entry_no.
    Keys: 'no','time','purchaseToken','purchaseCredit','log_type'
    """
    qs = EventLog2.objects.filter(device=device, log_type=log_type).order_by("entry_no")
    out = []
    for e in qs:
        out.append({
            "no": e.entry_no,
            "time": dj_timezone.localtime(e.event_time).isoformat() if e.event_time else None,
            "purchaseToken": e.purchase_token or "",
            "purchaseCredit": (str(e.purchase_credit) if e.purchase_credit is not None else ""),
            "log_type": e.log_type,
        })
    return out


# -------------------------------------------------------------------
# API View
# -------------------------------------------------------------------
class EventLogAPIView2(APIView):
    """
    Simple behaviour:
      - If no records for device+log_type: create 13 records with random token+credit+time.
      - If records exist: update all 13 records with new random token+credit+time.
      - Always return the logs (supports filtering modes).
    """
    MAX_SLOTS = 13

    def _generate_token_and_credit(self):
        # 16-digit numeric token
        token = str(random.randint(10**15, 10**16 - 1))
        # random credit between 50.00 and 500.00 with two decimals
        credit = Decimal(f"{random.uniform(50, 500):.2f}")
        return token, credit

    def post(self, request, *args, **kwargs):
        payload = request.data or {}

        serial = payload.get("serial_number")
        log_type = payload.get("type_log", "purchase")
        mode = payload.get("mode", "all")  # 'all', 'latest', 'entry', 'range'
        from_entry = payload.get("from_entry")
        to_entry = payload.get("to_entry")
        from_date_raw = payload.get("from_date")
        to_date_raw = payload.get("to_date")
        stream = bool(payload.get("stream", True))

        if not serial:
            return Response({"error": "serial_number is required"}, status=status.HTTP_400_BAD_REQUEST)

        device = get_object_or_404(Device, serial_number=serial)

        with transaction.atomic():
            qs = EventLog2.objects.filter(device=device, log_type=log_type).order_by("entry_no")
            count_existing = qs.count()
            now = dj_timezone.now()

            # Create 13 records if none exist (each with random token + credit)
            if count_existing == 0:
                objs = []
                for i in range(1, self.MAX_SLOTS + 1):
                    token, credit = self._generate_token_and_credit()
                    objs.append(EventLog2(
                        device=device,
                        entry_no=i,
                        event_time=now,
                        log_type=log_type,
                        purchase_token=token,
                        purchase_credit=credit,
                    ))
                EventLog2.objects.bulk_create(objs)
            else:
                # Update all existing records (assign new random token, credit, and time)
                # We iterate and save to ensure Decimal is stored correctly per record.
                for rec in qs:
                    token, credit = self._generate_token_and_credit()
                    rec.purchase_token = token
                    rec.purchase_credit = credit
                    rec.event_time = now
                    rec.save(update_fields=["purchase_token", "purchase_credit", "event_time"])

        # After create/update, fetch the logs to return
        all_logs = _get_stored_event_logs(device, log_type=log_type)

        # --------- apply filters ----------
        try:
            from_entry_i = int(from_entry) if from_entry else None
            to_entry_i = int(to_entry) if to_entry else None
        except (ValueError, TypeError):
            return Response({"error": "Invalid entry numbers"}, status=status.HTTP_400_BAD_REQUEST)

        from_date = _norm_parse_datetime(from_date_raw)
        to_date = _norm_parse_datetime(to_date_raw)

        if mode == "entry":
            if from_entry_i and to_entry_i:
                filtered = [l for l in all_logs if from_entry_i <= l["no"] <= to_entry_i]
            elif from_entry_i:
                filtered = [l for l in all_logs if l["no"] == from_entry_i]
            else:
                filtered = []
        elif mode == "latest":
            filtered = all_logs[-1:] if all_logs else []
        elif mode == "range" and from_date and to_date:
            filtered = []
            for l in all_logs:
                t = _norm_parse_datetime(l["time"])
                if t and from_date <= t <= to_date:
                    filtered.append(l)
        else:
            filtered = all_logs

        # If nothing matches after filtering, return empty list
        if not filtered:
            return Response({"data": []}, status=status.HTTP_200_OK)

        # Optionally stream results (SSE-like)
        if stream:
            def event_stream():
                for item in filtered:
                    yield f"data: {json.dumps(item)}\n\n"
                    time.sleep(0.05)
            resp = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
            resp["Cache-Control"] = "no-cache"
            resp["X-Accel-Buffering"] = "no"
            resp["Access-Control-Allow-Origin"] = "*"
            return resp

        return Response({"data": filtered}, status=status.HTTP_200_OK)








from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import ExecuteCommand, Device

from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import ExecuteCommand, Device


class ExecuteRunAPIView(APIView):
    @transaction.atomic
    def post(self, request):
        """
        Expected JSON:
        {
          "serial_number": "ABC123",            # <-- frontend sends serial_number now
          "password": "user_entered_password",
          "commands": [
            {"name": "MDI reset / End of billing period", "code": "[0, 0-10.0.1.255.0001]"},
            {"name": "Standard event log reset", "code": "[7, 0-0.99.98.0.255]"}
          ]
        }
        """
        serial_number = request.data.get("serial_number")
        password = request.data.get("password")
        commands = request.data.get("commands", [])

        if not serial_number or not commands:
            return Response(
                {"error": "serial_number and commands are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Find device by serial_number
        try:
            device = Device.objects.get(serial_number=serial_number)
        except Device.DoesNotExist:
            return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Get user (member) from device and verify password.
        member = device.user
        if not member:
            return Response({"error": "Device has no associated user"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # If member has check_password (Django User), use it (handles hashed passwords).
        password_valid = False
        if hasattr(member, "check_password"):
            try:
                password_valid = member.check_password(password)
            except Exception:
                password_valid = False
        else:
            # fallback to plain-text compare (only if you store plain text)
            password_valid = (password == getattr(member, "password", None))

        if not password_valid:
            return Response({"error": "Invalid password"}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        results = []

        # 3. Insert/update commands
        for cmd in commands:
            name = cmd.get("name")
            code = cmd.get("code")

            if not name or not code:
                # skip invalid entries
                continue

            existing = ExecuteCommand.objects.filter(device=device, name=name, code=code).first()

            if existing:
                # Update only last_executed_at
                existing.last_executed_at = now
                existing.save(update_fields=["last_executed_at"])
                results.append({"status": "updated", "id": existing.id, "name": existing.name})
            else:
                # Calculate next 'no' for this device
                last_cmd = ExecuteCommand.objects.filter(device=device).order_by("-no").first()
                next_no = (last_cmd.no + 1) if last_cmd else 1

                new_cmd = ExecuteCommand.objects.create(
                    device=device,
                    no=next_no,
                    name=name,
                    code=code,
                    is_active=True,
                    last_executed_at=now
                )
                results.append({"status": "created", "id": new_cmd.id, "name": new_cmd.name})

        return Response({"success": True, "results": results}, status=status.HTTP_200_OK)



import json
import random
import time
from decimal import Decimal

from django.db import transaction
from django.utils import timezone as dj_timezone
from django.utils.dateparse import parse_datetime
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


from .models import LoadProfileReading  # ensure this points to your model file


class LoadProfilePeriodAPIView(APIView):
    """
    API to create/update and return LoadProfile readings (period-based).
    Behavior:
      - If no records for device+period: create MAX_SLOTS records with random values.
      - If some records exist: update existing (and create missing) to keep MAX_SLOTS.
      - Return records according to filtering `mode`.
      - Optionally stream results as SSE-like chunks (stream=True).
    """
    MAX_SLOTS = 13

    def _rand_energy(self, low=0.0, high=1000.0, places=6):
        """Generate a Decimal energy value with requested precision."""
        return Decimal(f"{random.uniform(low, high):.{places}f}")

    def _normalize_datetime(self, val):
        """Parse a datetime string to an aware datetime (or return None)."""
        if not val:
            return None
        dt = parse_datetime(val)
        if dt is None:
            return None
        if dj_timezone.is_naive(dt):
            # assume server timezone if naive
            return dj_timezone.make_aware(dt, dj_timezone.get_default_timezone())
        return dt

    def _serialize_record(self, rec):
        """Serialize a LoadProfileReading instance into dict expected by frontend."""
        return {
            "entry_no": rec.entry_no,
            "timestamp": rec.reading_datetime.isoformat() if rec.reading_datetime else None,
            "active_import": str(rec.active_import) if rec.active_import is not None else None,
            "active_export": str(rec.active_export) if rec.active_export is not None else None,
            "reactive_import": str(rec.reactive_import) if rec.reactive_import is not None else None,
            "reactive_export": str(rec.reactive_export) if rec.reactive_export is not None else None,
            "period": rec.period,
            "device_serial": rec.device.serial_number if hasattr(rec.device, "serial_number") else None,
        }

    def _get_stored_readings(self, device, period):
        """Return a list of serialized readings ordered by entry_no for a device+period."""
        qs = LoadProfileReading.objects.filter(device=device, period=period).order_by("entry_no")
        return [self._serialize_record(r) for r in qs]

    def post(self, request, *args, **kwargs):
        payload = request.data or {}

        serial = payload.get("serial_number")
        period = int(payload.get("period", 1))
        mode = payload.get("mode", "all")  # 'all', 'latest', 'entry', 'range', 'atleast'
        from_entry = payload.get("from_entry")
        to_entry = payload.get("to_entry")
        from_date_raw = payload.get("from_date")
        to_date_raw = payload.get("to_date")
        stream = bool(payload.get("stream", True))

        if not serial:
            return Response({"error": "serial_number is required"}, status=status.HTTP_400_BAD_REQUEST)

        device = get_object_or_404(Device, serial_number=serial)

        # create / update records in db (ensure exactly MAX_SLOTS exist for device+period)
        with transaction.atomic():
            qs = LoadProfileReading.objects.filter(device=device, period=period).order_by("entry_no")
            existing_count = qs.count()
            now = dj_timezone.now()

            if existing_count == 0:
                # create MAX_SLOTS entries
                objs = []
                for i in range(1, self.MAX_SLOTS + 1):
                    objs.append(LoadProfileReading(
                        device=device,
                        period=period,
                        entry_no=i,
                        reading_datetime=now,
                        active_import=self._rand_energy(),
                        active_export=self._rand_energy(0, 200),
                        reactive_import=self._rand_energy(0, 50),
                        reactive_export=self._rand_energy(0, 50),
                    ))
                LoadProfileReading.objects.bulk_create(objs)
            else:
                # update existing records and create missing ones to reach MAX_SLOTS
                existing_entries = {r.entry_no: r for r in qs}
                # update existing
                for entry_no, rec in existing_entries.items():
                    rec.reading_datetime = now
                    rec.active_import = self._rand_energy()
                    rec.active_export = self._rand_energy(0, 200)
                    rec.reactive_import = self._rand_energy(0, 50)
                    rec.reactive_export = self._rand_energy(0, 50)
                    rec.save(update_fields=[
                        "reading_datetime", "active_import", "active_export",
                        "reactive_import", "reactive_export"
                    ])
                # create missing slots if any
                if existing_count < self.MAX_SLOTS:
                    to_create = []
                    for i in range(1, self.MAX_SLOTS + 1):
                        if i not in existing_entries:
                            to_create.append(LoadProfileReading(
                                device=device,
                                period=period,
                                entry_no=i,
                                reading_datetime=now,
                                active_import=self._rand_energy(),
                                active_export=self._rand_energy(0, 200),
                                reactive_import=self._rand_energy(0, 50),
                                reactive_export=self._rand_energy(0, 50),
                            ))
                    if to_create:
                        LoadProfileReading.objects.bulk_create(to_create)

        # fetch serialized readings
        all_reads = self._get_stored_readings(device, period)

        # parse filter inputs
        try:
            from_entry_i = int(from_entry) if from_entry is not None and str(from_entry).strip() != "" else None
            to_entry_i = int(to_entry) if to_entry is not None and str(to_entry).strip() != "" else None
        except (ValueError, TypeError):
            return Response({"error": "Invalid entry numbers"}, status=status.HTTP_400_BAD_REQUEST)

        from_date = self._normalize_datetime(from_date_raw)
        to_date = self._normalize_datetime(to_date_raw)

        # apply filters
        filtered = []
        if mode == "entry":
            if from_entry_i and to_entry_i:
                filtered = [r for r in all_reads if from_entry_i <= r["entry_no"] <= to_entry_i]
            elif from_entry_i:
                filtered = [r for r in all_reads if r["entry_no"] == from_entry_i]
            else:
                filtered = []
        elif mode == "latest":
            filtered = [all_reads[-1]] if all_reads else []
        elif mode == "range" and from_date and to_date:
            for r in all_reads:
                t = self._normalize_datetime(r["timestamp"])
                if t and from_date <= t <= to_date:
                    filtered.append(r)
        elif mode == "atleast":
            # return last N entries where from_entry represents count
            try:
                cnt = int(from_entry) if from_entry else self.MAX_SLOTS
            except (ValueError, TypeError):
                cnt = self.MAX_SLOTS
            filtered = all_reads[-cnt:] if all_reads else []
        else:
            filtered = all_reads

        # if nothing after filter -> empty list
        if not filtered:
            return Response({"data": []}, status=status.HTTP_200_OK)

        # stream results as SSE-like if requested
        if stream:
            def event_stream():
                for item in filtered:
                    yield f"data: {json.dumps(item)}\n\n"
                    # tiny sleep to allow frontend to receive incremental updates
                    time.sleep(0.05)

            resp = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
            resp["Cache-Control"] = "no-cache"
            resp["X-Accel-Buffering"] = "no"
            resp["Access-Control-Allow-Origin"] = "*"
            return resp

        # otherwise standard JSON response
        return Response({"data": filtered}, status=status.HTTP_200_OK)





from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse
from django.db import transaction
from django.utils import timezone as dj_timezone
from django.utils.dateparse import parse_datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from decimal import Decimal
import random
import json
import time

from .models import Device, PowerQualityReading


class PowerQualityAPIView(APIView):
    """
    API to create/update and return Power Quality readings.
    Behavior:
      - If no records for device: create MAX_SLOTS records with random values.
      - If some records exist: update existing (and create missing) to keep MAX_SLOTS.
      - Return records according to filtering `mode`.
      - Optionally stream results as SSE-like chunks (stream=True).
    """
    MAX_SLOTS = 13

    # ----------------------------
    # Helper functions
    # ----------------------------

    def _rand_decimal(self, low, high, places=3):
        """Generate random Decimal value."""
        return Decimal(f"{random.uniform(low, high):.{places}f}")

    def _rand_state(self):
        """Randomly pick a disconnect state."""
        return random.choice(["(1) Connected", "(0) Disconnected"])

    def _normalize_datetime(self, val):
        """Convert ISO datetime string to aware datetime (if possible)."""
        if not val:
            return None
        dt = parse_datetime(val)
        if dt is None:
            return None
        if dj_timezone.is_naive(dt):
            return dj_timezone.make_aware(dt, dj_timezone.get_default_timezone())
        return dt

    def _serialize_record(self, rec):
        """Convert PowerQualityReading to dict for frontend."""
        return {
            "entry_no": rec.entry_no,
            "timestamp": rec.reading_datetime.isoformat() if rec.reading_datetime else None,
            "disconnect_control_state": rec.disconnect_control_state,
            "instantaneous_voltage_l1": str(rec.instantaneous_voltage_l1) if rec.instantaneous_voltage_l1 is not None else None,
            "instantaneous_current_l1": str(rec.instantaneous_current_l1) if rec.instantaneous_current_l1 is not None else None,
            "device_serial": rec.device.serial_number if hasattr(rec.device, "serial_number") else None,
        }

    def _get_stored_readings(self, device):
        """Return all readings (serialized) for the device."""
        qs = PowerQualityReading.objects.filter(device=device).order_by("entry_no")
        return [self._serialize_record(r) for r in qs]

    # ----------------------------
    # Main POST endpoint
    # ----------------------------

    def post(self, request, *args, **kwargs):
        payload = request.data or {}
        serial = payload.get("serial_number")
        mode = payload.get("mode", "all")  # 'all', 'latest', 'entry', 'range', 'atleast'
        from_entry = payload.get("from_entry")
        to_entry = payload.get("to_entry")
        from_date_raw = payload.get("from_date")
        to_date_raw = payload.get("to_date")
        stream = bool(payload.get("stream", True))

        if not serial:
            return Response({"error": "serial_number is required"}, status=status.HTTP_400_BAD_REQUEST)

        # get device
        device = get_object_or_404(Device, serial_number=serial)

        # ----------------------------
        # Create or Update Data
        # ----------------------------
        with transaction.atomic():
            qs = PowerQualityReading.objects.filter(device=device).order_by("entry_no")
            existing_count = qs.count()
            now = dj_timezone.now()

            if existing_count == 0:
                objs = []
                for i in range(1, self.MAX_SLOTS + 1):
                    objs.append(PowerQualityReading(
                        device=device,
                        entry_no=i,
                        reading_datetime=now,
                        disconnect_control_state=self._rand_state(),
                        instantaneous_voltage_l1=self._rand_decimal(110, 140),
                        instantaneous_current_l1=self._rand_decimal(0.1, 10.0),
                    ))
                PowerQualityReading.objects.bulk_create(objs)
            else:
                existing_entries = {r.entry_no: r for r in qs}

                # Update existing
                for rec in existing_entries.values():
                    rec.reading_datetime = now
                    rec.disconnect_control_state = self._rand_state()
                    rec.instantaneous_voltage_l1 = self._rand_decimal(110, 140)
                    rec.instantaneous_current_l1 = self._rand_decimal(0.1, 10.0)
                    rec.save(update_fields=[
                        "reading_datetime",
                        "disconnect_control_state",
                        "instantaneous_voltage_l1",
                        "instantaneous_current_l1",
                    ])

                # Create missing if any
                if existing_count < self.MAX_SLOTS:
                    to_create = []
                    for i in range(1, self.MAX_SLOTS + 1):
                        if i not in existing_entries:
                            to_create.append(PowerQualityReading(
                                device=device,
                                entry_no=i,
                                reading_datetime=now,
                                disconnect_control_state=self._rand_state(),
                                instantaneous_voltage_l1=self._rand_decimal(110, 140),
                                instantaneous_current_l1=self._rand_decimal(0.1, 10.0),
                            ))
                    if to_create:
                        PowerQualityReading.objects.bulk_create(to_create)

        # ----------------------------
        # Get All Records
        # ----------------------------
        all_reads = self._get_stored_readings(device)

        # Parse filters
        try:
            from_entry_i = int(from_entry) if from_entry not in (None, "") else None
            to_entry_i = int(to_entry) if to_entry not in (None, "") else None
        except (ValueError, TypeError):
            return Response({"error": "Invalid entry numbers"}, status=status.HTTP_400_BAD_REQUEST)

        from_date = self._normalize_datetime(from_date_raw)
        to_date = self._normalize_datetime(to_date_raw)

        # ----------------------------
        # Apply filters by mode
        # ----------------------------
        filtered = []
        if mode == "entry":
            if from_entry_i and to_entry_i:
                filtered = [r for r in all_reads if from_entry_i <= r["entry_no"] <= to_entry_i]
            elif from_entry_i:
                filtered = [r for r in all_reads if r["entry_no"] == from_entry_i]
        elif mode == "latest":
            filtered = [all_reads[-1]] if all_reads else []
        elif mode == "range" and from_date and to_date:
            for r in all_reads:
                t = self._normalize_datetime(r["timestamp"])
                if t and from_date <= t <= to_date:
                    filtered.append(r)
        elif mode == "atleast":
            try:
                cnt = int(from_entry) if from_entry else self.MAX_SLOTS
            except (ValueError, TypeError):
                cnt = self.MAX_SLOTS
            filtered = all_reads[-cnt:] if all_reads else []
        else:
            filtered = all_reads

        if not filtered:
            return Response({"data": []}, status=status.HTTP_200_OK)

        # ----------------------------
        # Streaming or Standard JSON
        # ----------------------------
        if stream:
            def event_stream():
                for item in filtered:
                    yield f"data: {json.dumps(item)}\n\n"
                    time.sleep(0.05)

            resp = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
            resp["Cache-Control"] = "no-cache"
            resp["X-Accel-Buffering"] = "no"
            resp["Access-Control-Allow-Origin"] = "*"
            return resp

        return Response({"data": filtered}, status=status.HTTP_200_OK)











# meter1/views.py
import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction

from .models import MonthlyBilling, Device


@method_decorator(csrf_exempt, name="dispatch")
class MonthlyBillingView(View):
    """
    POST    /api/monthly-billing/
    GET     /api/monthly-billing/<device_id>/
    DELETE  /api/monthly-billing/item/<item_id>/
    DELETE  /api/monthly-billing/clean/<device_id>/
    """

    # ------------------------
    # POST – Bulk Add
    # ------------------------
    def post(self, request):
        try:
            payload = json.loads(request.body.decode())
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON")

        if not isinstance(payload, list):
            return HttpResponseBadRequest("Expected a list")

        created, skipped, errors = [], [], []

        for item in payload:
            device_id = item.get("device_id")
            name = item.get("name")
            code = item.get("code")
            category = item.get("category", "")
            value = item.get("value", 100)

            if not device_id or not name or not code:
                errors.append({"item": item, "error": "device_id, name, code required"})
                continue

            try:
                device = Device.objects.get(id=device_id)
            except Device.DoesNotExist:
                errors.append({"item": item, "error": "Invalid device_id"})
                continue

            # skip duplicates
            if MonthlyBilling.objects.filter(device=device, code=code).exists():
                skipped.append({"device_id": device_id, "code": code})
                continue

            created.append(
                MonthlyBilling(
                    device=device,
                    name=name,
                    code=code,
                    category=category,
                    value=value
                )
            )

        if created:
            with transaction.atomic():
                MonthlyBilling.objects.bulk_create(created)

        return JsonResponse({
            "created_count": len(created),
            "skipped": skipped,
            "errors": errors
        }, status=201)

    # ------------------------
    # GET – List by Device
    # ------------------------
    def get(self, request, device_id=None):
        if not device_id:
            return HttpResponseBadRequest("device_id required")

        items = MonthlyBilling.objects.filter(device_id=device_id).order_by("id")

        data = [
            {
                "id": item.id,
                "name": item.name,
                "code": item.code,
                "category": item.category,
                "value": item.value
            }
            for item in items
        ]

        return JsonResponse(data, safe=False)

    # ------------------------
    # DELETE – Single / Clean
    # ------------------------
    def delete(self, request, item_id=None, device_id=None):

        # delete single item
        if item_id:
            deleted, _ = MonthlyBilling.objects.filter(id=item_id).delete()
            return JsonResponse({
                "deleted": bool(deleted),
                "item_id": item_id
            })

        # delete all items of device
        if device_id:
            deleted, _ = MonthlyBilling.objects.filter(device_id=device_id).delete()
            return JsonResponse({
                "deleted_count": deleted,
                "device_id": device_id
            })

        return HttpResponseBadRequest("item_id or device_id required")








# meter1/views.py
import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction, IntegrityError

from .models import DailyBilling, Device


@method_decorator(csrf_exempt, name="dispatch")
class DailyBillingView(View):
    """
    Endpoints (same behavior as MonthlyBilling):
      POST    /api/daily-billing/                  -> bulk add (expects JSON list)
      GET     /api/daily-billing/<device_id>/      -> list items for device
      DELETE  /api/daily-billing/item/<item_id>/   -> delete single item by id
      DELETE  /api/daily-billing/clean/<device_id>/-> delete all items for device
    """

    # ------------------------
    # POST – Bulk Add
    # ------------------------
    def post(self, request, *args, **kwargs):
        try:
            payload = json.loads(request.body.decode())
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON")

        if not isinstance(payload, list):
            return HttpResponseBadRequest("Expected a list of items")

        created_objs = []
        skipped = []
        errors = []

        for item in payload:
            device_id = item.get("device_id")
            name = item.get("name")
            code = item.get("code")
            category = item.get("category", "")
            value = item.get("value", 100)

            if not device_id or not name or not code:
                errors.append({"item": item, "error": "device_id, name and code are required"})
                continue

            try:
                device = Device.objects.get(pk=device_id)
            except Device.DoesNotExist:
                errors.append({"item": item, "error": f"Device {device_id} does not exist"})
                continue

            # skip duplicates for same device,code
            if DailyBilling.objects.filter(device=device, code=code).exists():
                skipped.append({"device_id": device_id, "code": code})
                continue

            created_objs.append(DailyBilling(
                device=device,
                category=category,
                name=name,
                code=code,
                value=value
            ))

        if created_objs:
            try:
                with transaction.atomic():
                    DailyBilling.objects.bulk_create(created_objs)
            except IntegrityError as e:
                # fallback to per-item save to capture individual errors
                for obj in created_objs:
                    try:
                        obj.save()
                    except IntegrityError:
                        skipped.append({"device_id": obj.device_id, "code": obj.code})
                    except Exception as ex:
                        errors.append({"item": {"device_id": obj.device_id, "code": obj.code}, "error": str(ex)})

        return JsonResponse({
            "created_count": len(created_objs),
            "skipped": skipped,
            "errors": errors
        }, status=201 if created_objs else 200)

    # ------------------------
    # GET – List by Device
    # ------------------------
    def get(self, request, device_id=None, *args, **kwargs):
        if not device_id:
            return HttpResponseBadRequest("device_id is required in URL")

        qs = DailyBilling.objects.filter(device_id=device_id).order_by("id")
        data = [
            {"id": m.id, "name": m.name, "code": m.code, "category": m.category, "value": m.value}
            for m in qs
        ]
        return JsonResponse(data, safe=False)

    # ------------------------
    # DELETE – single item or clean device
    # ------------------------
    def delete(self, request, item_id=None, device_id=None, *args, **kwargs):
        # delete single item
        if item_id:
            deleted, _ = DailyBilling.objects.filter(id=item_id).delete()
            return JsonResponse({"deleted": bool(deleted), "item_id": item_id})

        # delete all items for a device
        if device_id:
            deleted, _ = DailyBilling.objects.filter(device_id=device_id).delete()
            return JsonResponse({"deleted_count": deleted, "device_id": device_id})

        return HttpResponseBadRequest("item_id or device_id required in URL")






import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.views import View
from django.db import transaction, IntegrityError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import Loadprofile1EnergyRegister, Device


@method_decorator(csrf_exempt, name="dispatch")
class Loadprofile1EnergyRegisterView(View):
    """
    Endpoints (same behavior as DailyBilling):

      POST    /api/loadprofile1-energy-register/                  -> bulk add
      GET     /api/loadprofile1-energy-register/<device_id>/      -> list items
      DELETE  /api/loadprofile1-energy-register/item/<item_id>/   -> delete single
      DELETE  /api/loadprofile1-energy-register/clean/<device_id>/-> delete all
    """

    # ------------------------
    # POST – Bulk Add
    # ------------------------
    def post(self, request, *args, **kwargs):
        try:
            payload = json.loads(request.body.decode())
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON")

        if not isinstance(payload, list):
            return HttpResponseBadRequest("Expected a list of items")

        created_objs = []
        skipped = []
        errors = []

        for item in payload:
            device_id = item.get("device_id")
            name = item.get("name")
            code = item.get("code")
            category = item.get("category", "")
            value = item.get("value", 100)

            if not device_id or not name or not code:
                errors.append({
                    "item": item,
                    "error": "device_id, name and code are required"
                })
                continue

            try:
                device = Device.objects.get(pk=device_id)
            except Device.DoesNotExist:
                errors.append({
                    "item": item,
                    "error": f"Device {device_id} does not exist"
                })
                continue

            # skip duplicate (device + code)
            if Loadprofile1EnergyRegister.objects.filter(
                device=device,
                code=code
            ).exists():
                skipped.append({
                    "device_id": device_id,
                    "code": code
                })
                continue

            created_objs.append(
                Loadprofile1EnergyRegister(
                    device=device,
                    category=category,
                    name=name,
                    code=code,
                    value=value
                )
            )

        if created_objs:
            try:
                with transaction.atomic():
                    Loadprofile1EnergyRegister.objects.bulk_create(created_objs)
            except IntegrityError:
                # fallback per-item save
                for obj in created_objs:
                    try:
                        obj.save()
                    except IntegrityError:
                        skipped.append({
                            "device_id": obj.device_id,
                            "code": obj.code
                        })
                    except Exception as ex:
                        errors.append({
                            "item": {
                                "device_id": obj.device_id,
                                "code": obj.code
                            },
                            "error": str(ex)
                        })

        return JsonResponse(
            {
                "created_count": len(created_objs),
                "skipped": skipped,
                "errors": errors
            },
            status=201 if created_objs else 200
        )

    # ------------------------
    # GET – List by Device
    # ------------------------
    def get(self, request, device_id=None, *args, **kwargs):
        if not device_id:
            return HttpResponseBadRequest("device_id is required in URL")

        qs = Loadprofile1EnergyRegister.objects.filter(
            device_id=device_id
        ).order_by("id")

        data = [
            {
                "id": m.id,
                "name": m.name,
                "code": m.code,
                "category": m.category,
                "value": m.value,
            }
            for m in qs
        ]
        return JsonResponse(data, safe=False)

    # ------------------------
    # DELETE – single item OR clean device
    # ------------------------
    def delete(self, request, item_id=None, device_id=None, *args, **kwargs):
        # delete single item
        if item_id:
            deleted, _ = Loadprofile1EnergyRegister.objects.filter(
                id=item_id
            ).delete()
            return JsonResponse({
                "deleted": bool(deleted),
                "item_id": item_id
            })

        # delete all items for a device
        if device_id:
            deleted, _ = Loadprofile1EnergyRegister.objects.filter(
                device_id=device_id
            ).delete()
            return JsonResponse({
                "deleted_count": deleted,
                "device_id": device_id
            })

        return HttpResponseBadRequest("item_id or device_id required in URL")


# app_name/views.py
import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.views import View
from django.db import IntegrityError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404

from .models import Loadprofile2EnergyRegister, Device

# Fixed (built-in) items – SAME as Loadprofile1
FIXED_ITEMS = [
    {"name": "Clock", "code": "8,0-0:1.0.0.256"},
    {"name": "Profile status -Load profile", "code": "1,0-0:96.10.1.255"},
]
FIXED_CODES = {item["code"] for item in FIXED_ITEMS}


@method_decorator(csrf_exempt, name="dispatch")
class Loadprofile2EnergyRegisterView(View):
    """
    Endpoints:
      POST    /api/loadprofile2/
      GET     /api/loadprofile2/<device_id>/
      DELETE  /api/loadprofile2/item/<item_id>/
      DELETE  /api/loadprofile2/clean/<device_id>/
    """

    # ------------------------
    # POST – Bulk Add
    # ------------------------
    def post(self, request, *args, **kwargs):
        try:
            payload = json.loads(request.body.decode())
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON")

        if not isinstance(payload, list):
            return HttpResponseBadRequest("Expected a list of items")

        processed = []
        skipped = []
        errors = []

        for item in payload:
            device_id = item.get("device_id")
            name = item.get("name")
            code = item.get("code")
            category = item.get("category", "")
            value = item.get("value", 100)

            if not device_id or not name or not code:
                errors.append({"item": item, "error": "device_id, name and code are required"})
                continue

            # 🚫 Skip fixed items
            if code in FIXED_CODES:
                skipped.append({"item": item, "reason": "fixed code (builtin)"})
                continue

            try:
                Device.objects.get(pk=device_id)
            except Device.DoesNotExist:
                errors.append({"item": item, "error": f"Device {device_id} does not exist"})
                continue

            try:
                obj, created = Loadprofile2EnergyRegister.objects.update_or_create(
                    device_id=device_id,
                    code=code,
                    defaults={
                        "category": category,
                        "name": name,
                        "value": value,
                    },
                )
                processed.append({
                    "id": obj.id,
                    "device_id": device_id,
                    "code": code,
                    "created": created
                })
            except IntegrityError as e:
                errors.append({"item": item, "error": str(e)})

        status = 201 if processed else (207 if errors else 200)
        return JsonResponse(
            {"processed": processed, "skipped": skipped, "errors": errors},
            status=status
        )

    # ------------------------
    # GET – List by Device
    # ------------------------
    def get(self, request, device_id=None, *args, **kwargs):
        if not device_id:
            return HttpResponseBadRequest("device_id is required")

        qs = list(
            Loadprofile2EnergyRegister.objects
            .filter(device_id=device_id)
            .order_by("id")
            .values("id", "name", "code", "category", "value")
        )

        # Ensure fixed items always appear
        existing_codes = {row["code"] for row in qs}
        for fixed in FIXED_ITEMS:
            if fixed["code"] not in existing_codes:
                qs.insert(0, {
                    "id": None,
                    "name": fixed["name"],
                    "code": fixed["code"],
                    "category": "Builtin",
                    "value": 0
                })

        return JsonResponse(qs, safe=False)

    # ------------------------
    # DELETE – Single Item / Clean Device
    # ------------------------
    def delete(self, request, item_id=None, device_id=None, *args, **kwargs):
        # Delete single item
        if item_id:
            obj = get_object_or_404(Loadprofile2EnergyRegister, pk=item_id)

            # 🚫 Block fixed items
            if obj.code in FIXED_CODES:
                return JsonResponse(
                    {"deleted": False, "error": "Cannot delete fixed/builtin item"},
                    status=400
                )

            obj.delete()
            return JsonResponse({"deleted": True, "item_id": item_id})

        # Clean device (non-fixed only)
        if device_id:
            deleted_count, _ = (
                Loadprofile2EnergyRegister.objects
                .filter(device_id=device_id)
                .exclude(code__in=FIXED_CODES)
                .delete()
            )
            return JsonResponse({
                "deleted_count": deleted_count,
                "device_id": device_id
            })

        return HttpResponseBadRequest("item_id or device_id required")


class InvocationCounterAPIView(APIView):
    """
    API endpoint to get and update the Invocation Counter (IC) value.
    GET: Returns current IC value from GXDLMSReader.stored_invocation_counter
    POST: Updates ic_obis in dlms_helper.py
    """
    
    def get(self, request, format=None):
        try:
            from .GXDLMSReader import GXDLMSReader
            current_ic = GXDLMSReader.stored_invocation_counter
            return Response({
                "current_ic": current_ic,
                "message": f"Current Invocation Counter: {current_ic}"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, format=None):
        try:
            from .GXDLMSReader import GXDLMSReader
            import os
            
            # Get IC value from request or use current stored value
            ic_value = request.data.get('ic_value')
            
            if ic_value is None:
                # If no value provided, use current stored value
                ic_value = GXDLMSReader.stored_invocation_counter
            else:
                # Validate the provided value
                try:
                    ic_value = int(ic_value)
                    if ic_value < 0:
                        return Response({"error": "IC value must be a positive number"}, status=status.HTTP_400_BAD_REQUEST)
                except (ValueError, TypeError):
                    return Response({"error": "Invalid IC value"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Path to dlms_helper.py
            helper_path = os.path.join(os.path.dirname(__file__), 'dlms_helper.py')
            
            # Read the file
            with open(helper_path, 'r') as f:
                content = f.read()
            
            # Replace ic_obis value (line 612)
            # Find the line: ic_obis = <number>
            import re
            pattern = r'ic_obis\s*=\s*\d+'
            replacement = f'ic_obis = {ic_value}'
            new_content = re.sub(pattern, replacement, content)
            
            # Write back to file
            with open(helper_path, 'w') as f:
                f.write(new_content)
            
            return Response({
                "message": f"IC updated successfully to {ic_value}",
                "updated_ic": ic_value
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
