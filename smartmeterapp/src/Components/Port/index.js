import React, { useState,useEffect } from 'react';
import './index.css';  // Ensure you have necessary styles in this CSS file
import axios from 'axios';
import { IoIosCloseCircle } from "react-icons/io";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

const mediaOptions = ['Optical', 'RS232/RS485', 'TCP/IP Client', 'TCP/IP Server'];
const protocolOptions = {
  Optical: ['HDLC', 'Mode E'],
  'RS232/RS485': ['HDLC', 'IEC62056-47'],
  'TCP/IP Client': ['HDLC', 'IEC62056-47', 'HES Transfer'],
  'TCP/IP Server': ['HDLC', 'IEC62056-47']
};
const baudRateOptions = [300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];

const baseUrl =BASE_URL;
const userId = localStorage.getItem('userId');;

const CounterBar = ({ count, setCount }) => {
  const handleInputChange = (e) => {
    const newCount = parseInt(e.target.value);
    if (!isNaN(newCount) && newCount > 0) {
      setCount(newCount);
    }
  };

  return (
    <div className="counter-bar">
      <label>Over Times (ms)</label>
      <input
        type="number"
        value={count}
        onChange={handleInputChange}
      />
    </div>
  );
};

const RetriesBar = ({ count }) => {
  return (
    <div className="retries-bar">
      <label>Retries</label>
      <input
        type="number"
        value={count}
        readOnly
      />
    </div>
  );
};

export default function Port({ closePortPopup,deviceId  }) {
  const [selectedMedia, setSelectedMedia] = useState(mediaOptions[0]);
  const [selectedProtocol, setSelectedProtocol] = useState(protocolOptions[mediaOptions[0]][0]);
  const [overTimes, setOverTimes] = useState(7000);
  const [retries, setRetries] = useState(3);
  const [portName, setPortName] = useState('');
  const [baudRate, setBaudRate] = useState(9600);
  const [remoteIP, setRemoteIP] = useState('');
  const [remotePort, setRemotePort] = useState('');
  const [wakeUpMode, setWakeUpMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [ports, setPorts] = useState([]);
  
  const serialNumber = localStorage.getItem('selectedSerialNumber');

  // Fetch serial ports on mount
  useEffect(() => {
    axios
      .get(`${BASE_URL}/serial-ports/`)
      .then(res => setPorts(res.data))
      .catch(err => console.error('Error loading serial ports:', err));
  }, []);

  // Fetch existing media configuration on mount - only for TCP/IP Client and TCP/IP Server
  useEffect(() => {
    const fetchMediaConfig = async () => {
      console.log('=== STARTING MEDIA CONFIG FETCH ===');
      console.log('Serial Number:', serialNumber);
      console.log('API URL:', `${BASE_URL}/media_data/active/${serialNumber}/`);
      
      try {
        const response = await axios.get(`${BASE_URL}/media_data/active/${serialNumber}/`);
        console.log('=== API RESPONSE RECEIVED ===');
        console.log('Full Response:', response);
        console.log('Response Data:', response.data);
        
        if (response.data && response.data.active_media) {
          const config = response.data.active_media;
          console.log('=== ACTIVE MEDIA CONFIG ===', config);
          
          // Only populate form fields for TCP/IP Client and TCP/IP Server
          if (config.media === 'TCP/IP Client' || config.media === 'TCP/IP Server') {
            // Populate form fields with existing data
            if (config.media) {
              setSelectedMedia(config.media);
              console.log('✓ Set media to:', config.media);
            }
            if (config.protocol) {
              setSelectedProtocol(config.protocol);
              console.log('✓ Set protocol to:', config.protocol);
            }
            if (config.overTimes !== undefined && config.overTimes !== null) {
              setOverTimes(config.overTimes);
              console.log('✓ Set overTimes to:', config.overTimes);
            }
            if (config.retries !== undefined && config.retries !== null) {
              setRetries(config.retries);
              console.log('✓ Set retries to:', config.retries);
            }
            if (config.remoteIP) {
              setRemoteIP(config.remoteIP);
              console.log('✓ Set remoteIP to:', config.remoteIP);
            }
            if (config.remotePort !== undefined && config.remotePort !== null) {
              setRemotePort(String(config.remotePort));
              console.log('✓ Set remotePort to:', config.remotePort);
            }
            if (config.wakeUpMode !== undefined) {
              setWakeUpMode(config.wakeUpMode);
              console.log('✓ Set wakeUpMode to:', config.wakeUpMode);
            }
            
            console.log('=== CONFIGURATION LOADED SUCCESSFULLY (TCP/IP) ===');
          } else {
            console.log('⚠ Media type is Optical/RS232, skipping value population');
          }
        } else {
          console.log('⚠ No active_media in response');
        }
      } catch (error) {
        console.error('=== ERROR LOADING MEDIA CONFIGURATION ===');
        console.error('Error:', error);
        if (error.response) {
          console.error('Error Status:', error.response.status);
          console.error('Error Data:', error.response.data);
        }
      } finally {
        setIsLoading(false);
        console.log('=== FETCH COMPLETE, isLoading set to false ===');
      }
    };

    if (serialNumber) {
      console.log('Serial number found, fetching config...');
      fetchMediaConfig();
    } else {
      console.log('⚠ No serial number found in localStorage');
      setIsLoading(false);
    }
  }, [serialNumber]);

  const handleMediaChange = (e) => {
    const newMedia = e.target.value;
    setSelectedMedia(newMedia);
    setSelectedProtocol(protocolOptions[newMedia][0]);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    console.log("=== SAVING CONFIGURATION ===");
    const formData = {
      media: selectedMedia,
      protocol: selectedProtocol,
      deviceId,
      overTimes,
      retries,
      userId,
    };

    if (selectedMedia === 'Optical' || selectedMedia === 'RS232/RS485') {
      formData.portName = portName;
      formData.baudRate = baudRate;
      console.log('Saving portName:', portName);
      console.log('Saving baudRate:', baudRate);
    }

    if (selectedMedia === 'TCP/IP Client') {
      formData.remoteIP = remoteIP;
      formData.remotePort = remotePort;
      console.log('Saving remoteIP:', remoteIP);
      console.log('Saving remotePort:', remotePort);
    }

    if (selectedMedia === 'TCP/IP Server') {
      formData.wakeUpMode = wakeUpMode;
    }

    console.log('Full formData being sent:', formData);

    try {
      const response = await axios.post(`${baseUrl}/media_data/`, formData);
      if (response.status === 201) {
        console.log('✓ Save Success:', response.data);
        
        // Only refetch and preserve values for TCP/IP Client and TCP/IP Server
        if (selectedMedia === 'TCP/IP Client' || selectedMedia === 'TCP/IP Server') {
          const serialNumber = localStorage.getItem('selectedSerialNumber');
          console.log('Refetching config for serial:', serialNumber);
          
          if (serialNumber) {
            try {
              const fetchResponse = await axios.get(`${BASE_URL}/media_data/active/${serialNumber}/`);
              console.log('=== REFETCH RESPONSE ===', fetchResponse.data);
              
              if (fetchResponse.data && fetchResponse.data.active_media) {
                const config = fetchResponse.data.active_media;
                console.log('Active media config:', config);
                
                // Update form with the newly saved values
                if (config.media) setSelectedMedia(config.media);
                if (config.protocol) setSelectedProtocol(config.protocol);
                if (config.overTimes !== undefined && config.overTimes !== null) setOverTimes(config.overTimes);
                if (config.retries !== undefined && config.retries !== null) setRetries(config.retries);
                if (config.remoteIP) setRemoteIP(config.remoteIP);
                if (config.remotePort !== undefined && config.remotePort !== null) setRemotePort(String(config.remotePort));
                if (config.wakeUpMode !== undefined) setWakeUpMode(config.wakeUpMode);
                
                console.log('=== CONFIGURATION REFRESHED AFTER SAVE ===');
              }
            } catch (fetchError) {
              console.error('Error refreshing configuration:', fetchError);
            }
          }
        }
        
        // Show success message
        alert('Successfully updated port configuration!');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to update port configuration. Please try again.');
    }
  };

  const closePopupOutside = (e) => {
    if (e.target.className === 'portpopup') {
      closePortPopup();
    }
  };



  const renderAdditionalFields = () => {
    if (selectedMedia === 'TCP/IP Client') {
      return (
        <>
          <div className="input-group">
            <label>Remote IP:</label>
            <input
              type="text"
              value={remoteIP}
              onChange={(e) => setRemoteIP(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Remote Port:</label>
            <input
              type="number"
              value={remotePort}
              onChange={(e) => setRemotePort(e.target.value)}
            />
          </div>
        </>
      );
    }

    if (selectedMedia === 'TCP/IP Server') {
      return (
        <div className="input-group">
          <label>Wake Up Mode:</label>
          <input
            type="checkbox"
            checked={wakeUpMode}
            onChange={(e) => setWakeUpMode(e.target.checked)}
          />
        </div>
      );
    }

    if (selectedMedia === 'Optical' || selectedMedia === 'RS232/RS485') {
      return (
        <>
          <div className="input-group">
            <label>Port Name:</label>
           

            <select
              value={portName}
              required
              onChange={e => setPortName(e.target.value)}
            >
              <option value="" disabled>-- select port --</option>
              {ports.map((p, i) => (
                <option key={i} value={p.device}>
                  {p.device} {p.description && `(${p.description})`}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Baud Rate:</label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(parseInt(e.target.value))}
            >
              {baudRateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="portpopup" onClick={closePopupOutside}>
      <div className="portpopup-container">
        <div className='port-header'>
          <h1 style={{ fontSize: '18px', marginLeft: '5px' }}>Settings</h1>
          <IoIosCloseCircle onClick={() => closePortPopup()} style={{ fontSize: '30px' }} />
        </div>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Loading configuration...
          </div>
        ) : (
          <form className='media_form' onSubmit={handleSave}>
            <div className="section">
              <h5 className="section-title">General</h5>
              <div className="input-group">
                <label>Media</label>
                <select
                  value={selectedMedia}
                  onChange={handleMediaChange}
                >
                  {mediaOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Protocol</label>
                <select
                  value={selectedProtocol}
                  onChange={(e) => setSelectedProtocol(e.target.value)}
                >
                  {protocolOptions[selectedMedia].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <CounterBar count={overTimes} setCount={setOverTimes} />
              <RetriesBar count={retries} />
            </div>
            <div className="section">
              {selectedMedia === 'TCP/IP Server' && <h5 className="section-title">TCP/IP Server</h5>}
              {selectedMedia === 'TCP/IP Client' && <h5 className="section-title">TCP/IP Client</h5>}
              {(selectedMedia === 'Optical' || selectedMedia === 'RS232/RS485') && <h5 className="section-title">Serial Port</h5>}
              {renderAdditionalFields()}
            </div>
            <div className='port_save_button'>
              <button type="submit" className="save-button">Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
