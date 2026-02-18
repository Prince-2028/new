import React, { useState, useEffect ,useRef} from 'react';
import axios from 'axios';
import './AddDevice.css';
import { IoIosCloseCircle } from "react-icons/io";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

const AddDevice = ({ closeAdddevicePopup, deviceData }) => {
  console.log("deviceData", deviceData);

    const userId = localStorage.getItem('userId');
 
  const underlineRef = useRef(null);
  const buttonRefs = {
    general: useRef(null),
    addressing: useRef(null),
    security: useRef(null)
  };




  

  const baseUrl = BASE_URL;
  const [currentView, setCurrentView] = useState('general');
  const [serialNumber, setSerialNumber] = useState('');
  const [meterType, setMeterType] = useState('');
  const [manufacturerCode, setManufacturerCode] = useState('CLE');
  const [serverSAPHex46, setServerSAPHex46] = useState('01');
  const [serverSAPHex, setServerSAPHex] = useState('01');
  const [clientSAPHex, setClientSAPHex] = useState('01');
  const [securityLevel, setSecurityLevel] = useState('HLS');
  const [userSecurityPolicy, setUserSecurityPolicy] = useState('All messages to be authenticated');
  const [securityPolicy, setSecurityPolicy] = useState('All messages to be authenticated');
  const [securityPassword1, setSecurityPassword1] = useState('0123456789abcdef0123456789abcdef');
  const [securityPassword2, setSecurityPassword2] = useState('0123456789abcdef0123456789abcdef');
  const [password, setPassword] = useState('default_password');
  const [getFrameCount, setGetFrameCount] = useState(false);
  const [meterTypes, setMeterTypes] = useState([]);


 console.log("real_data>>>>>>>>>",deviceData)


const fetchMeterTypes=async() =>
  {
  try {
    const { data } = await axios.get(`${baseUrl}/meter-types/`);
    
    setMeterTypes(data);
  } catch (err) {
    console.error('Could not load meter types', err);
    throw err;
  }
}

useEffect(()=> 
{
  fetchMeterTypes()

},[])
 

 useEffect(() => {
 
  const activeButton = buttonRefs[currentView].current;
  const underline = underlineRef.current;


  if (activeButton && underline) {
    const { offsetLeft, offsetWidth } = activeButton;
    
    underline.classList.add('moving');
    underline.style.left = `${offsetLeft}px`;
    underline.style.width = `${offsetWidth}px`;

    // Remove the 'moving' class after the transition
    setTimeout(() => {
      underline.classList.remove('moving');
    }, 500); // Match the transition duration
  }
  
}, [currentView]);





  useEffect(() => { 
    if (deviceData) {
      setSerialNumber(deviceData.serial_number);
      setMeterType(deviceData.meter_type);
      setManufacturerCode(deviceData.manufacturer_code);
      setServerSAPHex46(deviceData.addressing.server_sap_hex_46);
      setServerSAPHex(deviceData.addressing.server_sap_hex);
      setClientSAPHex(deviceData.addressing.client_sap_hex);
      const securityLevel = deviceData.security.security_level; 
      setSecurityLevel(securityLevel)
      
      setUserSecurityPolicy(deviceData.security.user_info_security_policy);
      setSecurityPolicy(deviceData.security.security_policy);
      setSecurityPassword1(deviceData.security.guek_hex);
      setSecurityPassword2(deviceData.security.gak_hex);
      setPassword(deviceData.security.password);
      setGetFrameCount(deviceData.security.get_frame_count);
    }
  }, [deviceData]);


  



  const selectSecurityLevel=(e) => {
    setSecurityLevel(e.target.value)
    if(e.target.value==='HLS' && deviceData) 
    {



      
     setUserSecurityPolicy('All messages to be authenticated');
      setSecurityPolicy('All messages to be authenticated');
      setSecurityPassword1('0123456789abcdef0123456789abcdef');
       setSecurityPassword2('0123456789abcdef0123456789abcdef');
       setPassword('default_password');
      


    }
  }


  console.log(
    currentView,
    serialNumber,
    meterType,
    manufacturerCode,
    serverSAPHex46,
    serverSAPHex,
    clientSAPHex,
    securityLevel,
    userSecurityPolicy,
    securityPolicy,
    securityPassword1,
    securityPassword2,
    password,
    getFrameCount
  );




  
  

 
  const securityLevels = [
    { value: 'HLS', label: 'HLS' },
    { value: 'NoSec', label: 'NoSec' },
    { value: 'LLS', label: 'LLS' },
  ];



  const closePopupOutside = (e) => {
    if (e.target.className === 'AdddeviceContainer') {
      closeAdddevicePopup();
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  let device_id=null

  if (deviceData) {
    device_id=deviceData.id
  }

  const handleSubmit = async () => {
    const devicePayload = {
      device: {
        serial_number: serialNumber,
        meter_type: meterType,
        manufacturer_code: manufacturerCode,
      },
      addressing: {
        server_sap_hex_46: serverSAPHex46,
        server_sap_hex: serverSAPHex,
        client_sap_hex: clientSAPHex,
      },
      security: {
        security_level: securityLevel,
        user_info_security_policy: securityLevel === 'HLS' ? userSecurityPolicy : null,
        security_policy: securityLevel === 'HLS' ? securityPolicy : null,
        guek_hex: securityLevel === 'HLS' ? securityPassword1 : null,
        gak_hex: securityLevel === 'HLS' ? securityPassword2 : null,
        password: securityLevel === 'LLS' ? password : null,
        get_frame_count: securityLevel === 'HLS' ? getFrameCount : false,
      },
      user_id: userId, // Replace with the actual user ID
      device_id:device_id
     
    };

    console.log("payload>>>>>>>>>>>>>>>", devicePayload)

     const serialTrimmed = (serialNumber ?? "").toString().trim();
      const meterTypeTrimmed = (meterType ?? "").toString().trim();

  // Validation
  if (!serialTrimmed) {
    // prefer showing UI error instead of alert for better UX
    alert("Please  or enter the serialNumber");
    return;
  }

  if (!meterTypeTrimmed) {
    alert("Please select a meter type.");
    return;
  }


    try {
      if (deviceData) {
        const response = await axios.put(`${baseUrl}/edit-device/`, devicePayload);
        console.log('Data updated successfully', response.data);
        closeAdddevicePopup();
      } else {
        const response = await axios.post(`${baseUrl}/add-device/`, devicePayload);
        console.log('Data saved successfully', response.data);
        closeAdddevicePopup();
      }

      // Reset form fields after successful submission
      setSerialNumber('');
      setMeterType('');
      setManufacturerCode('CLE');
      setServerSAPHex46('01');
      setServerSAPHex('01');
      setClientSAPHex('01');
      setSecurityLevel('2');
      setUserSecurityPolicy('All messages to be authenticated');
      setSecurityPolicy('All messages to be authenticated');
      setSecurityPassword1('0123456789abcdef0123456789abcdef');
      setSecurityPassword2('0123456789abcdef0123456789abcdef');
      setPassword('default_password');
      setGetFrameCount(false);

    } catch (error) {
      console.error('Error saving data', error);
    }
  };


  
   

  return (
    <div className="AdddeviceContainer" onClick={closePopupOutside}>
      <div className='Adddevicepopup-container'>
        <div className='port-header'>
          <h1 style={{ fontSize: '18px', marginLeft: '5px' }}>Add Device</h1>
          <IoIosCloseCircle onClick={closeAdddevicePopup} style={{ fontSize: '30px' }} />
        </div>
        
        
        
        <div>
      <nav>
        <ul>
          <li className="controlsGroup_addDevice">
            <button
              ref={buttonRefs.general}
              className={`button ${currentView === 'general' ? 'activeButton' : ''}`}
              onClick={() => handleViewChange('general')}
            >
              General
            </button>
            <button
              ref={buttonRefs.addressing}
              className={`button ${currentView === 'addressing' ? 'activeButton' : ''}`}
              onClick={() => handleViewChange('addressing')}
            >
              Addressing
            </button>
            <button
              ref={buttonRefs.security}
              className={`button ${currentView === 'security' ? 'activeButton' : ''}`}
              onClick={() => handleViewChange('security')}
            >
              Security
            </button>

            <div ref={underlineRef} className="underline"></div>
          </li>
        </ul>
      </nav>
    </div>


        <div className='from_Container'> 
      
        <div className="controlsContainer">
          {currentView === 'general' && (
            <div className="inputGroups">
              <div className="inputGroup">
                <label>Serial Number:</label>
                <input
                  className="input"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  required
                />
              </div>
              <div className="inputGroup">
                <label>Meter Type:</label>
                <select
                  className="input"
                  value={meterType}
                  onChange={(e) => setMeterType(e.target.value)}
                  required
                >
                   <option value="" disabled>
                   Select meter type
                  </option>
                  {meterTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="inputGroup">
                <label>Manufacturer's Identification Code:</label>
                <input
                  className="input"
                  type="text"
                  value={manufacturerCode}
                  onChange={(e) => setManufacturerCode(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          {currentView === 'addressing' && (
            <div className="inputGroups">
              <div className="inputGroup">
                <label>Server SAPs for IEC62056-48 (HEX):</label>
                <input
                  className="input"
                  type="text"
                  value={serverSAPHex46}
                  onChange={(e) => setServerSAPHex46(e.target.value)}
                  required
                />
              </div>
              <div className="inputGroup">
                <label>Server SAPs for IEC62056-47 (HEX):</label>
                <input
                  className="input"
                  type="text"
                  value={serverSAPHex}
                  onChange={(e) => setServerSAPHex(e.target.value)}
                  required
                />
              </div>
              <div className="inputGroup">
                <label>Client SAPs (HEX):</label>
                <input
                  className="input"
                  type="text"
                  value={clientSAPHex}
                  onChange={(e) => setClientSAPHex(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          {currentView === 'security' && (
            <div className="inputGroups">
              <div className="inputGroup">
                <label>Security Level:</label>
                <select
                  className="input"
                  value={securityLevel}
                  onChange={selectSecurityLevel}
                  required
                >
                  {securityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              {securityLevel === 'HLS' && (
                <>
                  <div className="inputGroup">
                    <label>User Information Security Policy:</label>
                    <input
                      className="input"
                      type="text"
                      value={userSecurityPolicy}
                      readOnly
                      required
                    />
                  </div>
                  <div className="inputGroup">
                    <label>Security Policy:</label>
                    <input
                      className="input"
                      type="text"
                      value={securityPolicy}
                      readOnly
                      required
                    />
                  </div>
                  <div className="inputGroup">
                    <label>GUEK (HEX):</label>
                    <input
                      className="input"
                      type="password"
                      value={securityPassword1}
                      onChange={(e) => setSecurityPassword1(e.target.value)}
                      required
                    />
                  </div>
                  <div className="inputGroup">
                    <label>GAK (HEX):</label>
                    <input
                      className="input"
                      type="password"
                      value={securityPassword2}
                      onChange={(e) => setSecurityPassword2(e.target.value)}
                      required
                    />
                  </div>
                  <div className="inputGroup">
                    <label>Get Frame Count:</label>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={getFrameCount}
                      onChange={(e) => setGetFrameCount(e.target.checked)}
                    />
                  </div>
                </>
              )}
              {securityLevel === 'LLS' && (
                <div className="inputGroup">
                  <label>Password:</label>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          )}
          <div className="buttonsGroup">
            <div className='import_button'>
              <button className="button">Import</button>
              <button className="button">Export</button>
            </div>
            <div className='import_button'>
              <button className="button" onClick={handleSubmit}>OK</button>
              <button className="button" onClick={closeAdddevicePopup}>Exit</button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AddDevice;
