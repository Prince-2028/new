import React, { useState,useEffect} from 'react';
import axios from 'axios';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import './index.css'

const monthNames = [
  "Every Month", "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const LoadControlComponent = () => {
  const [formData, setFormData] = useState({
   
    
    monitoredValueText: "Instantaneous active power ( |+A| + |-A| )",
    thresholdActive: 0,
    thresholdNormal: 0,
    minOverThresholdDuration: 0,
    minUnderThresholdDuration: 0,
    emergencyProfileId: '',
    emergencyActivationTime: '',
    emergencyDuration: 0,
    emergencyProfileGroupIds: '',
    emergencyProfileActive: 'Enable',  // Default to "Enable"
    actionOverThreshold: 'Set ready for reconnection',
    actionUnderThreshold: 'Set connected'
  });

   // Time popup state
   const [showTimePopup, setShowTimePopup] = useState(false);
   const [yearType, setYearType] = useState('Every Year');
   const [specialYear, setSpecialYear] = useState('');
   const [month, setMonth] = useState('January');
   const [day, setDay] = useState('1');
   const [hour, setHour] = useState('00');
   const [minute, setMinute] = useState('00');
   const [second, setSecond] = useState('00');

   // Handle Emergency Activation Time click
  const handleTimeClick = () => {
    setShowTimePopup(true);
  };


  // Handle input and checkbox changes
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  

   // Handle save time from popup
   const handleSaveTime = () => {
    const formattedTime = `${yearType === 'Every Year' ? 'Every Year' : specialYear}, ${month} ${day}, ${hour}:${minute}:${second}`;
    setFormData({ ...formData, emergencyActivationTime: formattedTime });
    setShowTimePopup(false);
  };


  const formatEmergencyTime = () => {
    const months = {
        January: "01", February: "02", March: "03", April: "04",
        May: "05", June: "06", July: "07", August: "08",
        September: "09", October: "10", November: "11", December: "12"
    };

    let formattedYear = yearType === "Every Year" ? "ffff" : (specialYear || new Date().getFullYear());
    let formattedMonth = month === "Every Month" ? "ff" : months[month];
    let formattedDay = day.padStart(2, "0");
    let formattedHour = hour.padStart(2, "0");
    let formattedMinute = minute.padStart(2, "0");
    let formattedSecond = second.padStart(2, "0");

    return `${formattedYear}-${formattedMonth}-${formattedDay} ${formattedHour}:${formattedMinute}:${formattedSecond}`;
};


const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
    useEffect(() => {
      const storedId = localStorage.getItem('selectedDeviceId');
      setDeviceId(storedId);
    }, []);

const handleSubmit = async () => {
  const formattedData = {
      device_id: formData.deviceId || 1,
      monitored_value: formData.monitoredValueText.trim(),
      threshold_active_kw: Number(formData.thresholdActive) || 0,
      threshold_normal_kw: Number(formData.thresholdNormal) || 0,
      min_over_threshold_duration_s: Number(formData.minOverThresholdDuration) || 0,
      min_under_threshold_duration_s: Number(formData.minUnderThresholdDuration) || 0,
      emergency_profile_id: formData.emergencyProfileId.trim(),
      emergency_activation_time: formatEmergencyTime(),  // ✅ Now in custom format
      emergency_duration: Number(formData.emergencyDuration) || 0,
      emergency_profile_group_id_list: formData.emergencyProfileGroupIds
          ? formData.emergencyProfileGroupIds.split(',').map(id => id.trim()) // Convert to list
          : [],
      emergency_profile_active: formData.emergencyProfileActive === "Enable",
      action_over_threshold: formData.actionOverThreshold.trim(),
      action_under_threshold: formData.actionUnderThreshold.trim(),
  };

  try {
      const response = await axios.post(`${BASE_URL}/api/load-control-settings/`, formattedData);
      alert('Data saved successfully!');
      console.log(response.data);
  } catch (error) {
      console.error('Error saving data:', error?.response?.data || error.message);
      alert('Failed to save data. Check input values.');
  }
};

  return (
    <>
    

    <div className="load-control-container">

  {/* Monitored Value */}
  <div className="lc-row">
    <label className="lc-label">Monitored Value :</label>
    <input
      className="lc-input"
      value="Instantaneous active power (|+A| + |-A|)"
      readOnly
    />
  </div>

  {/* Thresholds */}
  <div className="lc-row">
    <label className="lc-label">Threshold Active (KW):</label>
    <input
      className="lc-input"
      type="number"
      name="thresholdActive"
      value={formData.thresholdActive}
      onChange={handleChange}
    />
  </div>

  <div className="lc-row">
    <label className="lc-label">Threshold Normal (KW):</label>
    <input
      className="lc-input"
      type="number"
      name="thresholdNormal"
      value={formData.thresholdNormal}
      onChange={handleChange}
    />
  </div>

  {/* Min Duration */}
  <div className="lc-row">
    <label className="lc-label">Min Over Threshold Duration (s):</label>
    <input
      className="lc-input"
      type="number"
      name="minOverThresholdDuration"
      value={formData.minOverThresholdDuration}
      onChange={handleChange}
    />
  </div>

  <div className="lc-row">
    <label className="lc-label">Min Under Threshold Duration (s):</label>
    <input
      className="lc-input"
      type="number"
      name="minUnderThresholdDuration"
      value={formData.minUnderThresholdDuration}
      onChange={handleChange}
    />
  </div>

  {/* Emergency Profile */}
  <div className="lc-row">
    <label className="lc-label">Emergency Profile ID:</label>
    <input
      className="lc-input"
      type="text"
      name="emergencyProfileId"
      value={formData.emergencyProfileId}
      onChange={handleChange}
    />
  </div>

  <div className="lc-row">
    <label className="lc-label">Emergency Activation Time:</label>
    <input
      className="lc-input"
      type="text"
      name="emergencyActivationTime"
      value={formData.emergencyActivationTime}
      onClick={handleTimeClick}
      readOnly
    />
  </div>

  {/* Emergency Duration */}
  <div className="lc-row">
    <label className="lc-label">Emergency Duration:</label>
    <input
      className="lc-input"
      type="number"
      name="emergencyDuration"
      value={formData.emergencyDuration}
      onChange={handleChange}
    />
  </div>

  {/* Emergency Profile Group */}
  <div className="lc-row">
    <label className="lc-label">Emergency Profile Group ID List:</label>
    <input
      className="lc-input"
      type="text"
      name="emergencyProfileGroupIds"
      value={formData.emergencyProfileGroupIds}
      onChange={handleChange}
    />
  </div>
  

  {/* Emergency Profile Active */}
  <div className="lc-row">
    <label className="lc-label">Emergency Profile Active:</label>
    <select
      className="lc-select"
      name="emergencyProfileActive"
      value={formData.emergencyProfileActive}
      onChange={handleChange}
    >
      <option value="Enable">Enable</option>
      <option value="Disable">Disable</option>
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
  </div>

  {/* Actions */}
  <div className="lc-row">
    <label className="lc-label">Action Over Threshold:</label>
    <select
      className="lc-select"
      name="actionOverThreshold"
      value={formData.actionOverThreshold}
      onChange={handleChange}
    >
      <option value="0001">0001 Set ready for reconnection</option>
      <option value="0000">0000 No action</option>
    </select>
  </div>

  <div className="lc-row">
    <label className="lc-label">Action Under Threshold:</label>
    <select
      className="lc-select"
      name="actionUnderThreshold"
      value={formData.actionUnderThreshold}
      onChange={handleChange}
    >
      <option value="0002">0002 Set connected</option>
      <option value="0000">0000 No action</option>
    </select>
  </div>

  {/* Submit */}
  <div className="lc-actions">
    <button className="lc-btn" onClick={handleSubmit}>
      Save Values
    </button>
  </div>
 {/* Time selection modal */}
      {showTimePopup && (
        <div className="modal" role="dialog" id="time-popup" aria-modal="true">
          <div className="modal-content" role="document">
            <header className="modal-header">
              <h3>Select Emergency Activation Time</h3>
            </header>

            <div className="modal-body">
              <div className="modal-row">
                <label className="lc-label">Year Type</label>
                <select value={yearType} onChange={(e) => setYearType(e.target.value)} className="lc-select">
                  <option>Every Year</option>
                  <option>Special Year</option>
                </select>
                {yearType === "Special Year" && (
                  <input type="number" value={specialYear} onChange={(e)=>setSpecialYear(e.target.value)}
                    placeholder="Year (e.g. 2026)" className="lc-input" />
                )}
              </div>

              <div className="modal-row">
                <label className="lc-label">Month</label>
                <select value={month} onChange={(e)=>setMonth(e.target.value)} className="lc-select">
                  {monthNames.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="modal-row">
                <label className="lc-label">Day</label>
                <select value={day} onChange={(e)=>setDay(e.target.value)} className="lc-select">
                  {Array.from({length:31}, (_,i)=>String(i+1)).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="modal-row time-row">
                <label className="lc-label">Time (hh:mm:ss)</label>
                <div className="time-selects">
                  <select value={hour} onChange={(e)=>setHour(e.target.value)} className="lc-select small">
                    {Array.from({length:24}, (_,i)=>String(i).padStart(2,"0")).map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                  <span>:</span>
                  <select value={minute} onChange={(e)=>setMinute(e.target.value)} className="lc-select small">
                    {Array.from({length:60}, (_,i)=>String(i).padStart(2,"0")).map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  <span>:</span>
                  <select value={second} onChange={(e)=>setSecond(e.target.value)} className="lc-select small">
                    {Array.from({length:60}, (_,i)=>String(i).padStart(2,"0")).map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <button className="btn-primary" onClick={handleSaveTime}>Save</button>
              <button className="btn-ghost" onClick={()=>setShowTimePopup(false)}>Cancel</button>
            </footer>
          </div>
        </div>
      )}
</div>
 </>
    
  );
};




const DisconnectControl = () => {
  const [formData, setFormData] = useState({
    disconnectControl: false,
    relaySelect: "Disconnect control (Main relay)",
    outputState: "connected",
    controlState: "Disconnected",
    controlMode: "Mode 0",
    method: "(0) Reconnected",
    testTimes: 1,
    holdConnectionMS: 5000,
    holdDisconnectionMS: 5000,
  });

  // Handle input, checkbox, and dropdown changes
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
    useEffect(() => {
      const storedId = localStorage.getItem('selectedDeviceId');
      setDeviceId(storedId);
    }, []);
  

  const handleSubmit = async () => {
    const device_id = deviceId; // Replace with the actual device ID
    if (!device_id) {
      alert("Device ID is required.");
      return;
    }
  
    // Validate required fields
    const requiredFields = {
      relaySelect: formData.relaySelect,
      outputState: formData.outputState,
      controlState: formData.controlState,
      controlMode: formData.controlMode,
      method: formData.method,
      testTimes: formData.testTimes,
      holdConnectionMS: formData.holdConnectionMS,
      holdDisconnectionMS: formData.holdDisconnectionMS,
    };
  
    for (const [key, value] of Object.entries(requiredFields)) {
      if (value === "" || value === null || value === undefined) {
        alert(`Please fill in the ${key.replace(/([A-Z])/g, ' $1')}`);
        return;
      }
    }
  
    // Prepare payload with correct field names
    const payload = {
      device_id,
      relay_select: formData.relaySelect,
      output_state: formData.outputState,
      control_state: formData.controlState,
      control_mode: formData.controlMode,
      method: formData.method,
      test_times: formData.testTimes,
      hold_connection_ms: formData.holdConnectionMS,
      hold_disconnection_ms: formData.holdDisconnectionMS
    };
   
    try {
      const response = await axios.post(`${BASE_URL}/api/disconnect-control/`, payload);
      alert(response.data.message || "Data saved successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Error saving data:", error.response?.data || error.message);
      alert("Failed to save data.");
    }
  };

  
  return (
    <div className="load-control-container" style={{paddingTop:'5%'}}>
      

     
{/* Relay Select */}
<div className='lc-row'>
  <label className="lc-label">Relay Select:</label>
  <select
    className="lc-select"
    name="relaySelect"
    value={formData.relaySelect}
    onChange={handleChange}
  >
    <option value="Disconnect control (Main relay)">
      Disconnect control (Main relay)
    </option>
  </select>
</div>

      {/* Output State Select */}
<div className='lc-row'>
  <label className="lc-label">Output State:</label>
  <select
   className="lc-select"
    name="outputState"
    value={formData.outputState}
    onChange={handleChange}
  >
    <option value="Connected">Connected</option>
  </select>
</div>


     

     {/* Control State Select */}
<div className='lc-row'>
  <label className="lc-label">Control State:</label>
  <select
   className="lc-select"
    name="controlState"
    value={formData.controlState}
    onChange={handleChange}
  >
    <option value="Disconnected">(0) Disconnected</option>
  </select>
</div>

      {/* Control Mode Dropdown */}
      <div className='lc-row'>
        <label className="lc-label">Control Mode:</label>
        <select  className="lc-select" value={formData.controlMode} onChange={handleChange}>
          <option value="Mode 0">Mode 0</option>
          <option value="Mode 1">Mode 1</option>
          <option value="Mode 2">Mode 2</option>
          <option value="Mode 3">Mode 3</option>
          <option value="Mode 4">Mode 4</option>
          <option value="Mode 5">Mode 5</option> 
          <option value="Mode 6">Mode 6</option>
                
        </select>
      </div>

      {/* Method Dropdown */}
      <div className='lc-row'>
        <label className="lc-label">Method:</label>
        <select className="lc-select" name="method" value={formData.method} onChange={handleChange}>
          <option value="(0) Reconnected">(0) Reconnected</option>
          <option value="(1) Disconnected">(1) Disconnected</option>
        </select>
      </div>

      {/* Test Times */}
      <div className='lc-row'>
        <label className="lc-label">Test Times:</label>
        <input  className="lc-input" type="number" name="testTimes" value={formData.testTimes} onChange={handleChange} min="1" />
      </div>

      {/* Hold Connection (MS) */}
      <div className='lc-row'>
        <label className="lc-label">Hold Connection (MS):</label>
        <input  className="lc-input" type="number" name="holdConnectionMS" value={formData.holdConnectionMS} onChange={handleChange} min="1" />
      </div>

      {/* Hold Disconnection (MS) */}
      <div className='lc-row'>
        <label className="lc-label">Hold Disconnection (MS):</label>
        <input  className="lc-input" type="number" name="holdDisconnectionMS" value={formData.holdDisconnectionMS} onChange={handleChange} min="1" />
      </div>
          

       <div className="lc-actions">
      {/* Submit Button */}
      <button className='lc-btn' onClick={handleSubmit}>Save Values</button>
      </div>
    </div>
  );
};




const LoadControlRelated = () => {
  // Fixed data (only "value" will be updated from the backend)
  const [items, setItems] = useState([
    {
      id: 1,
      checked: true,
      name: "Overload Switch Off Count",
      code: "{1,0-0.96.50.12.255}",
      value: "" // Value will be updated when fetching data
    }
  ]);
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);
  


  const handleGetData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/load-control-related/${deviceId}/`);
      console.log("hello", response.data);

      // ✅ Make sure to define updatedItems before using it
      const updatedItems = items.map((item) => {
        const newValue = response.data.find((data) => data.code === item.code)?.value || "";
        return { ...item, value: newValue };
      });

      setItems(updatedItems);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data.");
    }
  };

  return (
    <div  className="load-control-container">
    
      <button onClick={handleGetData}>Get Data</button>
   
      <table className='meter-info-table' border="1">
        <thead>
          <tr>
            <th>Checked</th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <input type="checkbox" checked={item.checked} readOnly />
              </td>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.code}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    
  );
};




const StatusOfRelay1Configuration = ({ deviceId }) => {
  const [statusValue, setStatusValue] = useState(false); // Boolean for status control signals
  const [checkboxes, setCheckboxes] = useState([
    { id: 1, name: "Top cover open", key: "top_cover_open", checked: false },
    { id: 2, name: "Terminal cover open", key: "terminal_cover_open", checked: false },
    { id: 3, name: "Module cover open", key: "module_cover_open", checked: false },
    { id: 4, name: "DC field detected", key: "dc_field_detected", checked: false },
    { id: 5, name: "Over voltage", key: "over_voltage", checked: false },
    { id: 6, name: "Current reverse", key: "current_reverse", checked: false },
    { id: 7, name: "No credit", key: "no_credit", checked: false },
    { id: 8, name: "Under voltage", key: "under_voltage", checked: false },
    { id: 9, name: "CT bypass", key: "ct_bypass", checked: false },
    { id: 10, name: "Low credit 2", key: "low_credit_2", checked: false },
    { id: 11, name: "O price", key: "o_price", checked: false }
  ]);


 
  // Fetch data from API
  const handleGetData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/relay1-status/${deviceId}`);

      setStatusValue(response.data.status_of_control_signals === true); // Ensure it's boolean

      // Update checkboxes based on response
      setCheckboxes(prevCheckboxes =>
        prevCheckboxes.map(item => ({
          ...item,
          checked: response.data[item.key] || false // Map API response to checkboxes
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data.");
    }
  };

  useEffect(() => {
    if (deviceId) {
      handleGetData();
    }
  }, [deviceId]);

  // Send data to API
  const handleSendData = async () => {
    const requestData = {
      device_id: deviceId,  // Ensure device_id is included!
      status_of_control_signals: statusValue,
      ...checkboxes.reduce((acc, item) => ({ ...acc, [item.key]: item.checked }), {})
    };
  
    try {
      await axios.post(`${BASE_URL}/api/relay1-status/`, requestData);
      alert("Data sent successfully!");
    } catch (error) {
      console.error("Error sending data:", error.response?.data || error.message);
      alert("Failed to send data.");
    }
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (index) => {
    setCheckboxes(prevCheckboxes =>
      prevCheckboxes.map((item, idx) =>
        idx === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div>
      

      {/* Table for Status of Relay 1 */}
      <table style={{margin:'0.5%'}} className='meter-info-table' border="1">
        <thead>
          <tr>
            <th>Checked</th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input type="checkbox" checked={statusValue} onChange={() => setStatusValue(!statusValue)} />
            </td>
            <td>1</td>
            <td>Status of relay 1 control signals - current status</td>
            <td>{`{1,0-0.96.50.12.255}`}</td>
          </tr>
        </tbody>
      </table>

      {/* Buttons to Get & Send Data */}
     
      <button onClick={handleSendData}>Send Data</button>

      {/* Checkboxes for additional status options */}
      
        

         <div className="options-grid1">
          
            {checkboxes.map((item, index) => (
               <div key={item.id}>
              <label className="option-label">
                <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleCheckboxChange(index)}
               className="option-checkbox"
            />
                <span className="option-text">{item.name}</span>
              </label>
               </div>
            ))}
           
          </div>


        
      
    </div>
  );
};




const StatusOfRelay2Configuration = ({ deviceId }) => {
  const [statusValue, setStatusValue] = useState(false); // Boolean for status control signals
  const [checkboxes, setCheckboxes] = useState([
    { id: 1, name: "Top cover open", key: "top_cover_open", checked: false },
    { id: 2, name: "Terminal cover open", key: "terminal_cover_open", checked: false },
    { id: 3, name: "Module cover open", key: "module_cover_open", checked: false },
    { id: 4, name: "DC field detected", key: "dc_field_detected", checked: false },
    { id: 5, name: "Over voltage", key: "over_voltage", checked: false },
    { id: 6, name: "Current reverse", key: "current_reverse", checked: false },
    { id: 7, name: "No credit", key: "no_credit", checked: false },
    { id: 8, name: "Under voltage", key: "under_voltage", checked: false },
    { id: 9, name: "CT bypass", key: "ct_bypass", checked: false },
    { id: 10, name: "Low credit 2", key: "low_credit_2", checked: false },
    { id: 11, name: "O price", key: "o_price", checked: false }
  ]);

  // Fetch data from API
  const handleGetData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/relay2-status/${deviceId}`);
      
      setStatusValue(response.data.status_of_control_signals === true); // Ensure boolean

      // Update checkboxes based on API response
      setCheckboxes(prevCheckboxes =>
        prevCheckboxes.map(item => ({
          ...item,
          checked: response.data[item.key] || false
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data.");
    }
  };

  useEffect(() => {
    if (deviceId) {
      handleGetData();
    }
  }, [deviceId]);

  // Send data to API
  const handleSendData = async () => {
    const requestData = {
      device_id: deviceId,
      status_of_control_signals: statusValue,
      ...checkboxes.reduce((acc, item) => ({ ...acc, [item.key]: item.checked }), {})
    };

    try {
      await axios.post(`${BASE_URL}/api/relay2-status/`, requestData);
      alert("Data sent successfully!");
    } catch (error) {
      console.error("Error sending data:", error.response?.data || error.message);
      alert("Failed to send data.");
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (index) => {
    setCheckboxes(prevCheckboxes =>
      prevCheckboxes.map((item, idx) =>
        idx === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div>
   

      {/* Table for Status of Relay 2 */}
      <table style={{margin:'0.5%'}} className='meter-info-table' border="1">
        <thead>
          <tr>
            <th>Checked</th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input type="checkbox" checked={statusValue} onChange={() => setStatusValue(!statusValue)} />
            </td>
            <td>1</td>
            <td>Status of relay 2 control signals - current status</td>
            <td>{`{1,0-0.96.4.1.255}`}</td>
          </tr>
        </tbody>
      </table>

      {/* Buttons to Get & Send Data */}
     
      <button onClick={handleSendData}>Send Data</button>

        <div className="options-grid1">
          
            {checkboxes.map((item, index) => (
               <div key={item.id}>
              <label className="option-label">
                <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleCheckboxChange(index)}
               className="option-checkbox"
            />
                <span className="option-text">{item.name}</span>
              </label>
               </div>
            ))}
           
          </div>

      {/* Checkboxes for additional status options */}
    
    </div>
  );
};




const BeepControlFilter = ({ deviceId }) => {
  const [statusValue, setStatusValue] = useState(false); // Boolean for beep control status
  const [checkboxes, setCheckboxes] = useState([
    { id: 1, name: "Step 1 close deductions", key: "step_1_close", checked: false },
    { id: 2, name: "Step 2 close deductions", key: "step_2_close", checked: false },
    { id: 3, name: "Step 3 close deductions", key: "step_3_close", checked: false },
    { id: 4, name: "Step 4 close deductions", key: "step_4_close", checked: false },
    { id: 5, name: "Step 5 close deductions", key: "step_5_close", checked: false },
    { id: 6, name: "Step 6 close deductions", key: "step_6_close", checked: false },
    { id: 7, name: "Step 7 close deductions", key: "step_7_close", checked: false },
    { id: 8, name: "Step 8 close deductions", key: "step_8_close", checked: false },
    { id: 9, name: "Step 9 close deductions", key: "step_9_close", checked: false },
    { id: 10, name: "Step 10 close deductions", key: "step_10_close", checked: false },
    { id: 11, name: "Disenable buzzer alarm", key: "disable_buzzer", checked: false }
  ]);
  const handleGetData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/beep-control/${deviceId}`);
  
      console.log("API Response:", response.data);
  
      setStatusValue(response.data.beep_control_filter); // Map correct key
  
      const apiData = {
        step_1_close: response.data.step_1,
        step_2_close: response.data.step_2,
        step_3_close: response.data.step_3,
        step_4_close: response.data.step_4,
        step_5_close: response.data.step_5,
        step_6_close: response.data.step_6,
        step_7_close: response.data.step_7,
        step_8_close: response.data.step_8,
        step_9_close: response.data.step_9,
        step_10_close: response.data.step_10,
        disable_buzzer: response.data.disenable_buzzer_alarm, // Correct key mapping
      };
  
      setCheckboxes(prevCheckboxes =>
        prevCheckboxes.map(item => ({
          ...item,
          checked: apiData[item.key] || false
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data.");
    }
  };
  

  useEffect(() => {
    if (deviceId) {
      handleGetData();
    }
  }, [deviceId]);

  // Send data to API
  const handleSendData = async () => {
    const requestData = {
      device_id: deviceId,
      status_of_beep_control: statusValue,
      ...checkboxes.reduce((acc, item) => ({ ...acc, [item.key]: item.checked }), {})
    };

    try {
      await axios.post(`${BASE_URL}/api/beep-control/`, requestData);
      alert("Data sent successfully!");
    } catch (error) {
      console.error("Error sending data:", error.response?.data || error.message);
      alert("Failed to send data.");
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (index) => {
    setCheckboxes(prevCheckboxes =>
      prevCheckboxes.map((item, idx) =>
        idx === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div>
    

      {/* Table for Beep Control Filter */}
      <table style={{margin:'0.5%'}} className='meter-info-table'  border="1">
        <thead>
          <tr>
            <th>Checked</th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input type="checkbox" checked={statusValue} onChange={() => setStatusValue(!statusValue)} />
            </td>
            <td>1</td>
            <td>Beep Control Filter</td>
            <td>{`{1,0-0.96.4.2.255}`}</td>
          </tr>
        </tbody>
      </table>

      {/* Buttons to Get & Send Data */}
     
      <button onClick={handleSendData}>Send Data</button>

      {/* Checkboxes for additional Beep Control options */}
    <div className="options-grid1">
          
            {checkboxes.map((item, index) => (
               <div key={item.id}>
              <label className="option-label">
                <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleCheckboxChange(index)}
               className="option-checkbox"
            />
                <span className="option-text">{item.name}</span>
              </label>
               </div>
            ))}
           
          </div>
    </div>
  );
};




const ControlConfiguration = () => {
  const [activeComponent, setActiveComponent] = useState("relay1");
 

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);


  return (
    <div className="load-control-container">
    

      {/* Buttons to display respective components */}
      <div>
        <button onClick={() => setActiveComponent("relay1")}>Status of Relay 1</button>
        <button onClick={() => setActiveComponent("relay2")}>Status of Relay 2</button>
        <button onClick={() => setActiveComponent("beep")}>Beep Control Filter</button>
      </div>

      {/* Conditional Rendering of Components */}
      
        {activeComponent === "relay1" && <StatusOfRelay1Configuration deviceId={deviceId} />}
        {activeComponent === "relay2" && <StatusOfRelay2Configuration deviceId={deviceId} />}
        {activeComponent === "beep" && <BeepControlFilter  deviceId={deviceId}  />}
    
    </div>
  );
};






const Relay = () => {
  const [activeComponent, setActiveComponent] = useState(null);

  return (
    <div className="relay-container">
    

      {/* Buttons to display respective components */}
      <div className="">
        <button onClick={() => setActiveComponent("loadControl")}>Load Control</button>
        <button onClick={() => setActiveComponent("disconnect")}>Disconnect Control</button>
        <button onClick={() => setActiveComponent("loadRelated")}>Load Control Related</button>
        <button onClick={() => setActiveComponent("controlConfig")}>Control Configuration</button>
      </div>

      {/* Conditional Rendering of Components */}
      <div className="component-display">
        {activeComponent === "loadControl" && <LoadControlComponent />}
        {activeComponent === "disconnect" && <DisconnectControl />}
        {activeComponent === "loadRelated" && <LoadControlRelated />}
        {activeComponent === "controlConfig" && <ControlConfiguration />}
      </div>
    </div>
  );
};

export default Relay;

