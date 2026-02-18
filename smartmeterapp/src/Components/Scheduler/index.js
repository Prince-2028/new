import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

function Scheduler() {
  const [executedScript, setExecutedScript] = useState('Edit value is null');
  const [type, setType] = useState('Not defined');
  const [executionTimes, setExecutionTimes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [yearType, setYearType] = useState('Every year');
  const [specialYear, setSpecialYear] = useState('');
  const [month, setMonth] = useState('Every Month');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [selectedButton, setSelectedButton] = useState('monthly');
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [selectedRowId, setSelectedRowId] = useState(null); // Add state for selected row

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
     
      useEffect(() => {
        const storedId = localStorage.getItem('selectedDeviceId');
        setDeviceId(storedId);
      }, []);

  // Fetch execution times data on component mount
  const fetchExecutionTimes = async (selectedButton) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/get-scheduler/${deviceId}/${selectedButton}/`);
      if (response.data && response.data.data) {
        setExecutionTimes(response.data.data);
        console.log('Fetched execution times:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching execution times:', error);
    }
  };

  useEffect(() => {
    fetchExecutionTimes(selectedButton);
  }, [selectedButton]);

  const handleButtonClick = (buttonType) => {
    setSelectedButton(buttonType);
    fetchExecutionTimes(buttonType);
  };

  const handleAddExecutionTime = () => {
    setShowModal(true);
  };

  const handleRowClick = (id) => {
    setSelectedRowId(id); // Set selected row ID
  };

  const handleDeleteExecutionTime = async () => {
    if (!selectedRowId) {
      alert('Please select a row to delete.');
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/api/delete-scheduler/${selectedRowId}/`);
      console.log('Scheduler deleted successfully:', response.data);

      // Update the table by filtering out the deleted item
      setExecutionTimes(executionTimes.filter((entry) => entry.id !== selectedRowId));
      setSelectedRowId(null); // Clear selected row after deletion
    } catch (error) {
      console.error('Error deleting scheduler:', error);
    }
  };

  const closePopup = () => {
    setShowModal(false);
  };

  const handleSave = async () => {
    let date = new Date();
    let year = date.getFullYear();
    let monthValue = date.getMonth() + 1;
    let day = dayOfMonth;
    let hours, minutes;

    if (yearType === 'Special Year' && specialYear) {
      year = specialYear;
    } else if (yearType === 'Every year') {
      year = "ffff";
    }

    if (month !== 'Every Month') {
      monthValue = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(month) + 1;
    } else {
      monthValue = "ff";
    }

    if (selectedDateTime) {
      [hours, minutes] = selectedDateTime.split(':');
    } else {
      console.error("Please select a valid time.");
      return;
    }

    const executionTime = `${year}-${monthValue}-${day}T${hours}:${minutes}:00`;
    console.log("Formatted Execution Time:", executionTime);

    let recurrence_type = 'once';
    if (yearType === 'Every year') {
      recurrence_type = 'every_year';
    } else if (month === 'Every Month') {
      recurrence_type = 'every_month';
    }

    const schedulerData = {
      device_id: deviceId,
      scheduler_type: selectedButton,
      executed_script: executedScript,
      type: type,
      execution_time: executionTime,
      recurrence_type: recurrence_type
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/create-scheduler/`, schedulerData);
      console.log('Scheduler created successfully:', response.data);
    } catch (error) {
      console.error('Error creating scheduler:', error);
    }

    setShowModal(false);
  };

  return (
    <div>
      <div >
        <button
          
          onClick={() => handleButtonClick('monthly')}
        >
          End of Monthly Billing Period Scheduler
        </button>
        <button
          
          onClick={() => handleButtonClick('daily')}
        >
          End of Daily Billing Period Scheduler
        </button>
        <button
        
          onClick={() => handleButtonClick('relay')}
        >
          Main Relay Control
        </button>
      </div>

     
    <div className='load-control-container'> 
      <div className='security-form'>
       


             <label>
                    <input type="checkbox" />
                    <span>Executed Script:</span>
                    <input
                         type="text"
          className="fixed-input"
         
                         value={executedScript}
                         onChange={(e) => setExecutedScript(e.target.value)}
                         readOnly
                    />
                </label>
      </div>
      <div  className='security-form'>
       


          <label>
                    <input type="checkbox" />
                    <span>Type:</span>
                    <input
                         type="text"
          className="fixed-input"
         
                          value={type}
          onChange={(e) => setType(e.target.value)}
          readOnly
                    />
                </label>
      </div>

      <div style={{ width: '80%', paddingRight: '10px' }}>
        

         <div  className='security-form'>
       


          <label>
                    <input type="checkbox" />
                    <span>Execution Time Table: </span>
                   
                </label>
      </div>

      

      <div className='scheduler-table-container'> 
        <table  className='tableTariff1'>
          <thead>
            <tr>
              <th>Index</th>
              <th>Execution Time</th>
            </tr>
          </thead>
          <tbody>
            {executionTimes.map((entry, index) => (
              <tr
                key={entry.id}
                onClick={() => handleRowClick(entry.id)}
                id={selectedRowId === entry.id ? 'selected-row' : ''}
              >
                <td>{index + 1}</td>
                <td>{entry.execution_time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        </div>

     
     
     
     
      </div>
     

      <div className="scheduler-button-container">
        <button className="scheduler-add-button" onClick={handleAddExecutionTime}>Add</button>
        <button className="scheduler-delete-button" onClick={handleDeleteExecutionTime}>Delete</button>
      </div>

      {showModal && (
        <div className="modal" onClick={closePopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Daylight Savings End</h3>
            <div className="modal-row">
              <label>Year Type:</label>
              <select value={yearType} onChange={(e) => setYearType(e.target.value)}>
                <option value="Every year">Every Year</option>
                <option value="Special Year">Special Year</option>
              </select>
              {yearType === 'Special Year' && (
                <input
                  type="number"
                  placeholder="Enter Year"
                  value={specialYear}
                  onChange={(e) => setSpecialYear(e.target.value)}
                />
              )}
            </div>
            <div className="modal-row">
              <label>Month:</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="Every Month">Every Month</option>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="modal-row">
              <label>Day of the Month:</label>
              <select value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="modal-row">
              <label>Select Time:</label>
              <input
                type="time"
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
              />
            </div>
            <div className="modal-row">
              <button onClick={closePopup}>Cancel</button>
              <button onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default Scheduler;

