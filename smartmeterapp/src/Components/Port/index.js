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

  const [ports, setPorts] = useState([]);
   // 1️⃣ Fetch serial ports on mount
  useEffect(() => {
    axios
      .get(`${BASE_URL}/serial-ports/`)
      .then(res => setPorts(res.data))
      .catch(err => console.error('Error loading serial ports:', err));
  }, []);

  const handleMediaChange = (e) => {
    const newMedia = e.target.value;
    setSelectedMedia(newMedia);
    setSelectedProtocol(protocolOptions[newMedia][0]);
  };

  const handleSave = async (e) => {

    
    e.preventDefault();

    console.log("hello sai")
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
    }

    if (selectedMedia === 'TCP/IP Client') {
      formData.remoteIP = remoteIP;
      formData.remotePort = remotePort;
    }

    if (selectedMedia === 'TCP/IP Server') {
      formData.wakeUpMode = wakeUpMode;
    }

    try {
      const response = await axios.post(`${baseUrl}/media_data/`, formData);
      if (response.status === 201) {
        console.log('Success:', response.data);
        setSelectedMedia(mediaOptions[0]);
        setSelectedProtocol(protocolOptions[mediaOptions[0]][0]);
        setOverTimes(7000);
        setRetries(3);
        setPortName('');
        setBaudRate(9600);
        setRemoteIP('');
        setRemotePort('');
        setWakeUpMode(false);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      // Optionally, add user feedback here
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
      </div>
    </div>
  );
}
