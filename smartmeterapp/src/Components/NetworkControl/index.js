import React, { useState, useEffect } from 'react';
import './index.css'
import axios from "axios";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

const AutoConnect = () => {
  const [selectedType, setSelectedType] = useState('tcp');
  const [showWindowModal, setShowWindowModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [windowInput, setWindowInput] = useState({
    startYearType: 'Every Year',
    startMonth: 'Every Month',
    startDayOfMonth: 'Every Day',
    startTime: '',
    endYearType: 'Every Year',
    endMonth: 'Every Month',
    endDayOfMonth: 'Every Day',
    endTime: '',
    endYear:'',
    startYear:'',
  });
  const [destinationInput, setDestinationInput] = useState('');
  
  const [selectWindowId,setSelectWindowId]=useState("")
  const [selectDestinationId,setSelectDestinationId]=useState("")
  
  const [settings, setSettings] = useState({
    mode: 0,
    repetitions: 0,
    delay: 0,
  });

  const handleInputChange = (name, value) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: value, // Dynamically update the correct property in settings
    }));
  };

  
  const MODE_CHOICES = [
    { value: 0, label: 'No auto-connect, the device never connects' },
    { value: 1, label: 'Auto dialing allowed anytime, values in the calling window are ignored' },
    { value: 2, label: 'Auto dialing allowed within the validity time of the calling window' },
    { value: 3, label: 'Regular auto dialing allowed within the validity time of the calling window' },
    { value: 4, label: 'SMS sending via Public Land Mobile Network (PLMN)' },
    { value: 5, label: 'SMS sending via PSTN' },
    { value: 6, label: 'Email sending' },
    { value: 101, label: 'The device is permanently connected to the communication network' },
    { value: 102, label: 'Permanently connected within the validity time of the calling window' },
    { value: 104, label: 'Usually disconnected, connects when the connect method is invoked' },
  ];
  

  

  

  const [callingWindowData, setCallingWindowData] = useState([]);
  const [destinationList, setDestinationList] = useState([]);
  const [error, setError] = useState('');

  
   const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
     
    useEffect(() => {
      const storedId = localStorage.getItem('selectedDeviceId');
      setDeviceId(storedId);
    }, []);
  

  useEffect(() => {
    fetchAutoConnectSettings(deviceId, selectedType);
  }, [selectedType]);

  const fetchAutoConnectSettings = async (deviceId, type) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/get_auto_connect_settings/${deviceId}/${type}/`
      );
      const { data, all_destinations, all_times } = response.data;

      setCallingWindowData(all_times || []);
      setDestinationList(all_destinations || []);
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch data.');
    }
  };
  
  
 
  
  const handleAddWindow = () => {
    // Helper function to replace special cases
    const replaceSpecialCases = (value, placeholder, userInput) => {
      return value === "Every Year" || value === "Every Month" || value === "Every Day"
        ? placeholder
        : userInput || value;
    };
  
    // Construct full start and end times in year-month-day time format
    const startTime = `${replaceSpecialCases(windowInput.startYearType, "FFFF", windowInput.startYear)}-${replaceSpecialCases(
      windowInput.startMonth,
      "FF",
      windowInput.startMonth
    )}-${replaceSpecialCases(windowInput.startDayOfMonth, "FF", windowInput.startDayOfMonth)} ${windowInput.startTime}`;
  
    const endTime = `${replaceSpecialCases(windowInput.endYearType, "FFFF", windowInput.endYear)}-${replaceSpecialCases(
      windowInput.endMonth,
      "FF",
      windowInput.endMonth
    )}-${replaceSpecialCases(windowInput.endDayOfMonth, "FF", windowInput.endDayOfMonth)} ${windowInput.endTime}`;
  
    // Prepare data to send
    const windowData = {
      
      start_time:startTime,
      end_time:endTime,
      device_id: 1, // Example device_id
      type: selectedType, // Dynamically set type
      mode: settings.mode, // Use current mode from settings
      repetitions: settings.repetitions, // Use current repetitions from settings
      delay: settings.delay, // Use current delay from settings
    };
  
    // Log the complete window data object
    console.log("Complete Window Data:", windowData);
  
    // Send data to the backend using Axios
    axios.post(`${BASE_URL}/api/create_auto_connect_settings/`, windowData)
      .then(response => {
        console.log('AutoConnectSettings created:', response.data);
      })
      .catch(error => {
        console.error('Error creating AutoConnectSettings:', error);
      });
  
    // Reset the input fields
    setWindowInput({
      startYearType: "Every Year",
      startMonth: "Every Month",
      startDayOfMonth: "Every Day",
      startTime: "",
      endYearType: "Every Year",
      endMonth: "Every Month",
      endDayOfMonth: "Every Day",
      endTime: "",
      startYear: "",
      endYear: "",
    });
  
    // Close the modal after adding the window
    setShowWindowModal(false);
  };
  
  


  const handleAddDestination = () => {
    console.log(destinationInput)


    const Data = {
      
      destination:destinationInput,
      device_id: 1, // Example device_id
      type: selectedType, // Dynamically set type
      mode: settings.mode, // Use current mode from settings
      repetitions: settings.repetitions, // Use current repetitions from settings
      delay: settings.delay, // Use current delay from settings
    };

    axios.post('http://127.0.0.1:8000/meter1/api/create_auto_connect_settings/', Data)
    .then(response => {
      console.log('AutoConnectSettings created:', response.data);
      setShowDestinationModal(false)
      fetchAutoConnectSettings(deviceId, selectedType)
      
    })
    .catch(error => {
      console.error('Error creating AutoConnectSettings:', error);
    });




  };



  const handleDeleteItem = (id) => {
    axios      
      .delete(`${BASE_URL}/api/delete_auto_connect_settings/${id}/`)
      .then(() => {
        fetchAutoConnectSettings(deviceId, selectedType);
      })
      .catch((error) => console.error('Error deleting item:', error));
  };
  

 

  const renderForm = (type) => (
    <>
      <div className='security-form'>
      <label>
        <span> 
        Mode:
        </span>
      
      <select
        value={settings.mode}
        onChange={(e) => handleInputChange('mode', parseInt(e.target.value))}
      >
        {MODE_CHOICES.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
      </label>
    </div>
     
        <div className='security-form'>
      <label classname>
       <span>  Repetitions: </span>
       
        <input
          type="number"
          value={settings.repetitions}
          onChange={(e) => handleInputChange('repetitions', parseInt(e.target.value))}
        />
         </label>
 </div>


 <div className='security-form'>
      
      <label>
        <span> Repetition Delay (S): </span>
       
        <input
          type="number"
          value={settings.delay}
          onChange={(e) => handleInputChange('delay', parseInt(e.target.value))}
        />
         </label>
        </div>
        

         
       


     
        <div className="window-Destination-table-conatainer">
        <div className="window-table-container">
          <input type="checkbox"/> <span>Calling Window</span>
                <div className='table-container-networkcontrol'> 
          
          <table  className='tableTariff1'>
            <thead>
              <tr>
                <th>Index</th>
                <th>Start Time</th>
                <th>End Time</th>
              </tr>
            </thead>
            <tbody>
              {callingWindowData.map((item, index) => (
                <tr

                style={{
                  backgroundColor: selectWindowId === item.id ? "#ff8e0e" : "", // Apply background conditionally
                  cursor: "pointer",
                }}
                
                onClick={()=>setSelectWindowId(item.id)}  key={index}>
                  <td>{index + 1}</td>
                  <td>{item.start_time}</td>
                  <td>{item.end_time}</td>
                </tr>
              ))}
            </tbody>   
          </table>
          </div>
          <div className='button-container'> 
          <button className='network-add-button' onClick={() => setShowWindowModal(true)}>Add Window</button>
          <button className='network-delete-button' onClick={() => handleDeleteItem(selectWindowId)}>Delete</button>
          </div>
        </div>
        
        <div className="Destination-table-container">
       
            <input type="checkbox"/> <span>Destination List</span>
             <div className='table-container-networkcontrol'>
          <table className='tableTariff1'>
            <thead>
              <tr>
                <th>Index</th>
                <th>Destination</th>
              </tr>
            </thead>
            <tbody>
              {destinationList.map((item, index) => (
                <tr
                style={{
                  backgroundColor: selectDestinationId === item.id ? "#ff8e0e" : "", // Apply background conditionally
                  cursor: "pointer",
                }}
                
                
                
                onClick={()=> setSelectDestinationId(item.id)}  key={index}>
                  <td>{index + 1}</td>
                  <td>{item.destination}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className='button-container'> 
          <button className='network-add-button' onClick={() => setShowDestinationModal(true)}>Add Destination</button>
          <button className='network-delete-button' onClick={() => handleDeleteItem(selectDestinationId)}>Delete</button>
          </div>
        </div>


      </div>
    
    </>
  );

  const closePopup = () => {
    setShowWindowModal(false);
  };

  return (
    <div>
      <div>
        <button   onClick={() => setSelectedType('tcp')}>Auto Connect TCP</button>
        <button onClick={() => setSelectedType('ftp')}>Auto Connect FTP</button>
        <button  onClick={() => setSelectedType('ntp')}>Auto Connect NTP</button>
      </div>
     
      <div>{renderForm(selectedType)}</div>

      {showWindowModal && (
  <div className="modal" onClick={closePopup}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h4>Add Calling Window</h4>

      {/* Start Year Type */}
      <label>
        Start Year Type:
        <select
          value={windowInput.startYearType}
          onChange={(e) =>
            setWindowInput({ ...windowInput, startYearType: e.target.value })
          }
        >
          <option value="Every Year">Every Year</option>
          <option value="Special Year">Special Year</option>
        </select>
      </label>

      {/* Input for Start Year if "Special Year" is selected */}
      {windowInput.startYearType === "Special Year" && (
        <label>
          Enter Start Year:
          <input
            type="number"
            value={windowInput.startYear || ""}
            onChange={(e) =>
              setWindowInput({ ...windowInput, startYear: e.target.value })
            }
            placeholder="Enter year, e.g., 2024"
          />
        </label>
      )}

      {/* Start Month */}
      <label>
        Start Month:
        <select
          value={windowInput.startMonth}
          onChange={(e) =>
            setWindowInput({ ...windowInput, startMonth: e.target.value })
          }
        >
          <option value="Every Month">Every Month</option>
          {[
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      {/* Start Day of Month */}
      <label>
        Start Day of Month:
        <select
          value={windowInput.startDayOfMonth}
          onChange={(e) =>
            setWindowInput({ ...windowInput, startDayOfMonth: e.target.value })
          }
        >
          <option value="Every Day">Every Day</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </label>

      {/* Start Time */}
      <h5>Start Time:</h5>
      <input
        type="time"
        value={windowInput.startTime}
        onChange={(e) =>
          setWindowInput({ ...windowInput, startTime: e.target.value })
        }
      />

      {/* End Year Type */}
      <label>
        End Year Type:
        <select
          value={windowInput.endYearType}
          onChange={(e) =>
            setWindowInput({ ...windowInput, endYearType: e.target.value })
          }
        >
          <option value="Every Year">Every Year</option>
          <option value="Special Year">Special Year</option>
        </select>
      </label>

      {/* Input for End Year if "Special Year" is selected */}
      {windowInput.endYearType === "Special Year" && (
        <label>
          Enter End Year:
          <input
            type="number"
            value={windowInput.endYear || ""}
            onChange={(e) =>
              setWindowInput({ ...windowInput, endYear: e.target.value })
            }
            placeholder="Enter year, e.g., 2024"
          />
        </label>
      )}

      {/* End Month */}
      <label>
        End Month:
        <select
          value={windowInput.endMonth}
          onChange={(e) =>
            setWindowInput({ ...windowInput, endMonth: e.target.value })
          }
        >
          <option value="Every Month">Every Month</option>
          {[
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      {/* End Day of Month */}
      <label>
        End Day of Month:
        <select
          value={windowInput.endDayOfMonth}
          onChange={(e) =>
            setWindowInput({ ...windowInput, endDayOfMonth: e.target.value })
          }
        >
          <option value="Every Day">Every Day</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </label>

      {/* End Time */}
      <h5>End Time:</h5>
      <input
        type="time"
        value={windowInput.endTime}
        onChange={(e) =>
          setWindowInput({ ...windowInput, endTime: e.target.value })
        }
      />

      <button onClick={handleAddWindow}>Save</button>
      <button onClick={closePopup}>Cancel</button>
    </div>
  </div>
)}


      {showDestinationModal && (
        <div className="modal" onClick={closePopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Add Destination</h4>
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="Enter Destination"
            />
            <button onClick={handleAddDestination}>Save</button>
            <button onClick={closePopup}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};





const AutoAnswerSettings = () => {
  const [showWindowModal, setShowWindowModal] = useState(false);
  const [windowInput, setWindowInput] = useState({
    startYearType: "Every Year",
    startYear: "",
    startMonth: "Every Month",
    startDayOfMonth: "Every Day",
    startTime: "",
    endYearType: "Every Year",
    endYear: "",
    endMonth: "Every Month",
    endDayOfMonth: "Every Day",
    endTime: "",
  });

  const [mode, setMode] = useState(0); // Example of a mode value
  const MODE_OPTIONS = [
    { value: 0, label: 'Dedicated to the device' },
    { value: 1, label: 'Shared line management with a limited number of calls allowed. Once the number of calls is reached, the window status becomes...' },
    { value: 2, label: 'Shared line management with a limited number of successful calls allowed. Once the number of communications is reached...' },
    { value: 3, label: 'Currently no modem connected' },
    { value: 200, label: 'Manufacturer-specific modes' },
  ];
  const [status, setStatus] = useState("Inactive");
  const [numCalls, setNumCalls] = useState(0);
  const [ringsInWindow, setRingsInWindow] = useState(0);
  const [ringsOutWindow, setRingsOutWindow] = useState(0);

  const [callers, setCallers] = useState([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newCaller, setNewCaller] = useState({
    callerId: "",
    callType: "",
  });
  
  const [callingWindows, setCallingWindows] = useState([]);

  const handleModeChange = (e) => {
    setMode(Number(e.target.value));
  };

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
     
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);


 
  const handleSaveCallingWindows = async () => {
    try {

      const replaceSpecialCases = (value, placeholder, userInput) => {
        return value === "Every Year" || value === "Every Month" || value === "Every Day"
          ? placeholder
          : userInput || value;
      };



      const startTime = `${replaceSpecialCases(windowInput.startYearType, "FFFF", windowInput.startYear)}-${replaceSpecialCases(
        windowInput.startMonth,
        "FF",
        windowInput.startMonth
      )}-${replaceSpecialCases(windowInput.startDayOfMonth, "FF", windowInput.startDayOfMonth)} ${windowInput.startTime}`;
    
      const endTime = `${replaceSpecialCases(windowInput.endYearType, "FFFF", windowInput.endYear)}-${replaceSpecialCases(
        windowInput.endMonth,
        "FF",
        windowInput.endMonth
      )}-${replaceSpecialCases(windowInput.endDayOfMonth, "FF", windowInput.endDayOfMonth)} ${windowInput.endTime}`;
      // Define your calling window data, including start_time, end_time, and other fields
      const callingWindowData = {
        device: deviceId, // Example device ID, replace with actual data
        mode,
        status,
        num_calls: numCalls,
        rings_in_window: ringsInWindow,
        rings_out_window: ringsOutWindow,
        calling_windows:{
          start_time: startTime,
          end_time:endTime
        },
      };

      console.log("1",callingWindowData)
  
      // Send callingWindows data to the backend
      const response = await axios.post(   
        `${BASE_URL}/api/create-auto-answer-settings/`,  
        callingWindowData // Send the complete data object
      );
  
      console.log('Calling windows saved:', response.data);
    } catch (error) {
      console.error('Error saving calling windows:', error);
    }
  };



  const handleSaveCallers = async () => {
    try {
      // Prepare the data to send to the backend

      const allowed_callers= {
        caller_id:newCaller.callerId,
        call_type:newCaller.callType
      }
      const data = {
        device: deviceId,
        mode: mode,
        status: status,
        num_calls: numCalls,
        rings_in_window: ringsInWindow,
        rings_out_window: ringsOutWindow,
        allowed_callers:allowed_callers
      };
      console.log(data)

      // Send the data to the backend
      const response = await axios.post(
        `${BASE_URL}/api/create-auto-answer-settings/`, // Backend endpoint
        data
      );
      
      console.log('Auto-answer settings saved:', response.data);
    } catch (error) {
      console.error('Error saving auto-answer settings:', error);
    }
  };
  
  

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/get-auto-answer-settings/${deviceId}/`);
      const settings = response.data;

   
      setCallers(settings.allowed_callers || []);
      setCallingWindows(settings.calling_windows || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

    // Fetch data when component mounts
    useEffect(() => {
     
  
      fetchSettings();
    }, []);

 
  
 

  const handleAddCaller = () => {
    setCallers([...callers, newCaller]);
    setShowAddPopup(false);
    setNewCaller({
      callerId: "",
      callType: "",
    });
  };

  const handleDeleteCaller = (index) => {
    const updatedCallers = callers.filter((_, i) => i !== index);
    setCallers(updatedCallers);
  };
 

  const closePopup = () => setShowWindowModal(false);

  const handleDeleteWindow = (index) => {
    const updatedWindows = callingWindows.filter((_, i) => i !== index);
    setCallingWindows(updatedWindows);
  };

  return (
    <div className="auto-answer-settings-container">
      <div>



      <div  className="security-form">
      <label>
        <span>Mode:  </span>
      <select
        value={mode}
        onChange={handleModeChange}
         >
        {MODE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      </label>
      </div>
   
      <div className="security-form">
        <label> 
          <span> Status:</span> 
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="status-selector"
        >
          <option value="Inactive">Inactive</option>
          <option value="Active">Active</option>
        
          <option value="Locked">Locked</option>
        </select>
        </label>
      </div>
      <div className="security-form">
        <label> 
          <span > Number of calls: </span>
       
          
          <input
            type="number"
            value={numCalls}
            onChange={(e) => setNumCalls(Number(e.target.value))}
            className="input-box"
          /> 
          </label>
       
      </div>
      <div className="security-form">
        <label> 
          <span> Number of rings in window:  </span>
       
         
          <input
            type="number"
            value={ringsInWindow}
            onChange={(e) => setRingsInWindow(Number(e.target.value))}
            className="input-box"
          />
         </label>
       
      </div>
      <div className="security-form">
        <label>
          <span> Number of rings out of window: </span> 
       
        
          <input
            type="number"
            value={ringsOutWindow}
            onChange={(e) => setRingsOutWindow(Number(e.target.value))}
            className="input-box"
          />
        </label>
       
      </div>
    </div>
     


      <div className='window-Destination-table-conatainer'> 
      <div className="window-table-container">

         <input type="checkbox"/> <span>Calling Windows</span>
                <div className='table-container-autoanswer' > 
       
        <table className='tableTariff1'>
          <thead>
            <tr>
              <th>Index</th>
              <th>Start Time</th>
              <th>End Time</th>
            
            </tr>
          </thead>
          <tbody>
            {callingWindows.map((window, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{window.start_time}</td> 
                <td>{window.end_time}</td>
               
              </tr>
            ))}
          </tbody>
        </table>
        </div> 

        <div className="window-actions">
        <button className="btn" onClick={() => setShowWindowModal(true)}>
          Add Calling Window
        </button>
      </div>

      </div>



      <div className="Destination-table-container">
      
       <input type="checkbox"/> <span>Allowed Callers</span>
                <div className='table-container-autoanswer'> 
     
        <table className='tableTariff1'>
          <thead>
            <tr>
              <th>Index</th>
              <th>Caller ID</th>
              <th>Call Type</th>
             
            </tr>
          </thead>
          <tbody>
            {callers.map((caller, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{caller.caller_id}</td>
                <td>{caller.call_type}</td>
               
              </tr>
            ))}
          </tbody>
        </table>
       
      </div>
       <button className="btn add-btn" onClick={() => setShowAddPopup(true)}>
          Add Allowed Callers
        </button>
      </div>
      </div>

      


      {showWindowModal && (
        <div className="modal" onClick={closePopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Add Calling Window</h4>

            <label>
              Start Year Type:
              <select
                value={windowInput.startYearType}
                onChange={(e) =>
                  setWindowInput({
                    ...windowInput,
                    startYearType: e.target.value,
                  })
                }
              >
                <option value="Every Year">Every Year</option>
                <option value="Special Year">Special Year</option>
              </select>
            </label>

            {windowInput.startYearType === "Special Year" && (
              <label>
                Enter Start Year:
                <input
                  type="number"
                  value={windowInput.startYear || ""}
                  onChange={(e) =>
                    setWindowInput({
                      ...windowInput,
                      startYear: e.target.value,
                    })
                  }
                  placeholder="Enter year, e.g., 2024"
                />
              </label>
            )}

            <label>
              Start Month:
              <select
                value={windowInput.startMonth}
                onChange={(e) =>
                  setWindowInput({ ...windowInput, startMonth: e.target.value })
                }
              >
                <option value="Every Month">Every Month</option>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Start Day of Month:
              <select
                value={windowInput.startDayOfMonth}
                onChange={(e) =>
                  setWindowInput({
                    ...windowInput,
                    startDayOfMonth: e.target.value,
                  })
                }
              >
                <option value="Every Day">Every Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <h5>Start Time:</h5>
            <input
              type="time"
              value={windowInput.startTime}
              onChange={(e) =>
                setWindowInput({ ...windowInput, startTime: e.target.value })
              }
            />

            <label>
              End Year Type:
              <select
                value={windowInput.endYearType}
                onChange={(e) =>
                  setWindowInput({ ...windowInput, endYearType: e.target.value })
                }
              >
                <option value="Every Year">Every Year</option>
                <option value="Special Year">Special Year</option>
              </select>
            </label>

            {windowInput.endYearType === "Special Year" && (
              <label>
                Enter End Year:
                <input
                  type="number"
                  value={windowInput.endYear || ""}
                  onChange={(e) =>
                    setWindowInput({
                      ...windowInput,
                      endYear: e.target.value,
                    })
                  }
                  placeholder="Enter year, e.g., 2024"
                />
              </label>
            )}

            <label>
              End Month:
              <select
                value={windowInput.endMonth}
                onChange={(e) =>
                  setWindowInput({ ...windowInput, endMonth: e.target.value })
                }
              >
                <option value="Every Month">Every Month</option>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label>
              End Day of Month:
              <select
                value={windowInput.endDayOfMonth}
                onChange={(e) =>
                  setWindowInput({
                    ...windowInput,
                    endDayOfMonth: e.target.value,
                  })
                }
              >
                <option value="Every Day">Every Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <h5>End Time:</h5>
            <input
              type="time"
              value={windowInput.endTime}
              onChange={(e) =>
                setWindowInput({ ...windowInput, endTime: e.target.value })
              }
            />

            <button onClick={handleSaveCallingWindows}>Save</button>
            <button onClick={closePopup}>Cancel</button>
          </div>
        </div>
      )}


{showAddPopup && (
        <div className="modal" onClick={() => setShowAddPopup(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the popup
          >
            <h4>Add Caller</h4>
            <label>
              Caller ID:
              <input
                type="text"
                value={newCaller.callerId}
                onChange={(e) =>
                  setNewCaller({ ...newCaller, callerId: e.target.value })
                }
                placeholder="Enter Caller ID"
              />
            </label>
            <label>
              Call Type:
              <select
                value={newCaller.callType}
                onChange={(e) =>
                  setNewCaller({ ...newCaller, callType: e.target.value })
                }
              >
                <option value="">Select Call Type</option>
                <option value="normal_CSD_call">normal_CSD_call</option>
                <option value="wakeup_request">wakeup_request</option>
              </select>
            </label>
            <button className="btn save-btn" onClick={handleSaveCallers}>
              Save
            </button>
            <button className="btn cancel-btn" onClick={() => setShowAddPopup(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    
      
      
    </div>
  );
};




const IPv4Setup = () => {
  const [formData, setFormData] = useState({
    dataLinkRef: "",
    ipAddress: "",
    subnetMask: "",
    gatewayIP: "",
    dhcp: "",
    primaryDNS: "",
    secondaryDNS: "",
  });

  const [multicastAddresses, setMulticastAddresses] = useState([]);
  const [ipOptionsList, setIpOptionsList] = useState([]);

  const [showMulticastPopup, setShowMulticastPopup] = useState(false);
  const [showIPOptionsPopup, setShowIPOptionsPopup] = useState(false);

  const [multicastIpAddress, setMulticastIpAddress] = useState("");
  const [ipOptions, setIpOptions] = useState({
    option_type: "",
    data: "",
  });

  // Fetch the data from backend API

  console.log(multicastAddresses,ipOptionsList)

  
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
     
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);


  

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/get_ipv4_setup/${deviceId}/`);
      const data = response.data;
  
      console.log(data);  // Log the entire response to inspect the structure
  
      // Assuming that data contains "ipv4_setups", "multicast_addresses", and "ip_options" arrays
      if (data.ipv4_setups && data.ipv4_setups.length > 0) {
        // Populate ipv4 setup form fields (using the first setup as an example)
        const ipv4Setup = data.ipv4_setups[0];  // Choose first ipv4 setup or loop through if needed
        console.log("ipv4Setup", ipv4Setup);
  
        // Populate the form fields with the first ipv4 setup values
       
        // Populate Multicast Addresses (map all addresses to an array of IPs)
        setMulticastAddresses(
          data.multicast_addresses.map((item) => item.ip_address)
        );
  
        // Populate IP Options (map them into a list of option types and data)
        setIpOptionsList(
          data.ip_options.map((item) => ({
            type: item.option_type,
            data: item.data,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };
  




  useEffect(() => {
   

    fetchData();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Handle changes for input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  




  const handleSubmitMulticast= async () => {
    const dataToSend = {
      device: deviceId, // Device ID or other unique identifier
      data_link_ref: formData.dataLinkRef,
      ip_address: formData.ipAddress,
      subnet_mask: formData.subnetMask,
      gateway_ip: formData.gatewayIP,
      dhcp: formData.dhcp,
      primary_dns: formData.primaryDNS,
      secondary_dns: formData.secondaryDNS,
     
      multicast_addresses:multicastIpAddress
  
    };

    console.log(dataToSend)

    try {
      const response = await axios.post(`${BASE_URL}/api/create_ipv4_setup/`, dataToSend);
      console.log("Data sent successfully:", response.data);
      
      setMulticastIpAddress("")
      // You can perform further actions after successful submission, like showing a success message
    } catch (error) {
      console.error("Error sending data:", error);
      // You can show an error message here if needed
    }
  };
  

  const handleSubmitipOptions= async () => {
    const dataToSend = {
      device: deviceId, // Device ID or other unique identifier
      data_link_ref: formData.dataLinkRef,
      ip_address: formData.ipAddress,
      subnet_mask: formData.subnetMask,
      gateway_ip: formData.gatewayIP,
      dhcp: formData.dhcp,
      primary_dns: formData.primaryDNS,
      secondary_dns: formData.secondaryDNS,
      ip_options:ipOptions
      
    
    };

     // Send either multicast_addresses or ip_options based on which is non-empty
 console.log(dataToSend)

    try {
      const response = await axios.post(`${BASE_URL}/api/create_ipv4_setup/`, dataToSend);
      console.log("Data sent successfully:", response.data);
      setIpOptions({
        type: "",    // Reset type to empty
        data: ""     // Reset data to empty
      });
      setMulticastIpAddress("")
      // You can perform further actions after successful submission, like showing a success message
    } catch (error) {
      console.error("Error sending data:", error);
      // You can show an error message here if needed
    }
  };



  return (
    <div>
    
      <form className='gprs_grid'>
           
        <label className='gprs_grid-label'>
          Data Link Reference:
          <input
            className='gprs-input'
            type="text"
            name="dataLinkRef"
            value={formData.dataLinkRef}
            onChange={handleChange}
            placeholder="Enter value"
          />
        </label>
        <label className='gprs_grid-label'>
          IP Address:
          <input
            type="text"
            name="ipAddress"
            className='gprs-input'
            value={formData.ipAddress}
            onChange={handleChange}
            placeholder="Enter IP Address"
          />
        </label>
        <label className='gprs_grid-label'>
          Subnet Mask:
          <input
            type="text"
            className='gprs-input'
            name="subnetMask"
            value={formData.subnetMask}
            onChange={handleChange}
            placeholder="Enter Subnet Mask"
          />
        </label>
        <label className='gprs_grid-label'>
          Gateway IP Address:
          <input
            type="text"
             className='gprs-input'
            name="gatewayIP"
            value={formData.gatewayIP}
            onChange={handleChange}
            placeholder="Enter Gateway IP"
          />
        </label>
        <label className='gprs_grid-label'>
          DHCP:
          <select
           className='gprs-input'
            name="dhcp"
            value={formData.dhcp}
            onChange={handleChange}
            defaultValue=""
          >
            <option value="" disabled>
              Select DHCP
            </option>
            <option value="enable">Enable</option>
            <option value="disable">Disable</option>
          </select>
        </label>
        <label className='gprs_grid-label'>
          Primary DNS Address:
          <input
           className='gprs-input'
            type="text"
            name="primaryDNS"
            value={formData.primaryDNS}
            onChange={handleChange}
            placeholder="Enter Primary DNS"
          />
        </label>
        <label className='gprs_grid-label'>
          Secondary DNS Address:
          <input
           className='gprs-input'
            type="text"
            name="secondaryDNS"
            value={formData.secondaryDNS}
            onChange={handleChange}
            placeholder="Enter Secondary DNS"
          />
        </label>
      
      </form>

    

        <div className='window-Destination-table-conatainer'>
     

      {/* Table for Multicast IP Addresses */}
     
     
      <div className='table-Container'> 
      <table className='small-table' border="1" style={{ width: "100%", marginBottom: "20px" }}>
        <thead>
          <tr>
            <th>No</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {multicastAddresses.map((address, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{address}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      </div>
      


    
      {/* Table for IP Options */}
     
       <div className='table-Container'> 
      <table className='small-table'  border="1" style={{ width: "100%", marginBottom: "20px" }}>
        <thead>
          <tr>
            <th>No</th>
            <th>Type</th>
            <th>Data</th>
            <th>Length</th>
          </tr>
        </thead>
        <tbody>
          {ipOptionsList.map((option, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{option.type}</td>
              <td>{option.data}</td>
              <td>{option.data.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
     
      </div>
      
      {/* Multicast Popup */}

      </div>

       <div>
          <button
            type="button"
            onClick={() => setShowMulticastPopup(true)}
            style={{ marginRight: "10px" }}
          >
            Multicast IP Address
          </button>

           <button type="button" onClick={() => setShowIPOptionsPopup(true)}>
            IP Options
          </button>
          </div>


      {showMulticastPopup && (
        <div className="modal" onClick={() => setShowMulticastPopup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Multicast IP Address</h3>
            <input
              type="text"
              value={multicastIpAddress}
              onChange={(e) => setMulticastIpAddress(e.target.value)}
              placeholder="Enter Multicast IP Address"
            />
            <div style={{ marginTop: "10px" }}>
              <button onClick={handleSubmitMulticast}>Add</button>
              <button onClick={() => setShowMulticastPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* IP Options Popup */}
      {showIPOptionsPopup && (
        <div className="modal" onClick={() => setShowIPOptionsPopup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>IP Options</h3>
            <label>
              Type:
              <select
                value={ipOptions.option_type}
                onChange={(e) =>
                  setIpOptions((prev) => ({ ...prev, option_type: e.target.value }))
                }
              >
                <option value="">Select Type</option>
                <option value="security">Security</option>
                <option value="looseRoute">Loose Source and Record Route</option>
                <option value="strictRoute">Strict Source and Record Route</option>
                <option value="recordRoute">Record Route</option>
                <option value="timestamp">Internet Timestamp</option>
              </select>
            </label>
            <label>
              Data:
              <input
                type="text"
                value={ipOptions.data}
                onChange={(e) =>
                  setIpOptions((prev) => ({ ...prev, data: e.target.value }))
                }
                placeholder="Enter Data"
              />
            </label>
            <div style={{ marginTop: "10px" }}>
              <button onClick={handleSubmitipOptions}>Add</button>
              <button onClick={() => setShowIPOptionsPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};








const TcpUdpSetup = () => {
  const [apiData, setApiData] = useState(null);


    
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
     
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);

 

  const handleGetClick = async () => {
    try {
      // Make the API call to fetch the TCP-UDP setup data
      const response = await axios.get(`${BASE_URL}/api/get_tcpudpsetup/${deviceId}`); // Adjusted URL based on your backend
      setApiData(response.data);
      console.log(response.data);  // Log the response to see the data structure
    } catch (error) {
      console.error("Error fetching TCP-UDP setup data:", error);
    }
  };

  


  const getValue = (name) => {
    if (!apiData) return "";

    const item = apiData.find((data) => data.name === name);
    return item ? item.value : "";
  };

  const renderTcpUdpTable = () => {
    return (
      <table className="meter-info-table">
        <thead>
          <tr>
            <th>Checked</th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
            <th>Attribute</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><input type="checkbox" /></td>
            <td>1</td>
            <td>TCP UDP port</td>
            <td>{'{41,0-0.25.0.0.255}'}</td> {/* Fixed code */}
            <td>{'2'}</td> {/* Fixed attribute */}
            <td>{getValue("TCP UDP port")}</td> {/* Dynamic value from backend */}
          </tr>
          <tr>
            <td><input type="checkbox" /></td>
            <td>2</td>
            <td>Ip reference</td>
            <td>{'{41,0-0.25.0.0.255}'}</td> {/* Fixed code */}
            <td>{'3'}</td> {/* Fixed attribute */}
            <td>{getValue("Ip reference")}</td> {/* Dynamic value from backend */}
          </tr>
          <tr>
            <td><input type="checkbox" /></td>
            <td>3</td>
            <td>Mss</td>
            <td>{'{41,0-0.25.0.0.255}'}</td> {/* Fixed code */}
            <td>{'4'}</td> {/* Fixed attribute */}
            <td>{getValue("Mss") }</td> {/* Dynamic value from backend */}
          </tr>
          <tr>
            <td><input type="checkbox" /></td>
            <td>4</td>
            <td>Maximum number of simultane</td>
            <td>{'{41,0-0.25.0.0.255}'}</td> {/* Fixed code */}
            <td>{'5'}</td> {/* Fixed attribute */}
            <td>{getValue("Maximum number of simultane")}</td> {/* Dynamic value from backend */}
          </tr>
          <tr>
            <td><input type="checkbox" /></td>
            <td>5</td>
            <td>Inactivity timeout</td>
            <td>{'{41,0-0.25.0.0.255}'}</td> {/* Fixed code */}
            <td>{'6'}</td> {/* Fixed attribute */}
            <td>{getValue("Inactivity time out")}</td> {/* Dynamic value from backend */}
          </tr>
        </tbody>
      </table>   
    );
  };

  return (
    <div>
      <button onClick={handleGetClick}>Get TCP-UDP Setup</button>
      <div className="tcp-udp-content">
        {renderTcpUdpTable()}
      </div>
    </div>
  );
};




const ModuleInformation = () => {
  const [data, setData] = useState([
    {
      checked: false,
      no: 1,
      name: "Module firmware identifier (Version)",
      code: "{ 1, 1-2.0.2.0.255}",
      value: "",
    },
  ]);

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
     
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);


  const [modules, setModules] = useState([]);

  const handleCheckboxChange = (index) => {
    const updatedData = [...data];
    updatedData[index].checked = !updatedData[index].checked;
    setData(updatedData);
  };  

  


  const fetchModules = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/get_modules/${deviceId}/`);
        setModules(response.data);
        
    } catch (err) {
        console.log("Failed to fetch module information.");
       
    }
};

const getValue = (name) => {
  if (!modules) return "";

  const item = modules.find((data) => data.name === name);
  return item ? item.value : "";
};

  return (
    <div className="module-info">
      
      <button onClick={fetchModules}>getValue</button>
      <table className="meter-info-table">
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
          {data.map((item, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleCheckboxChange(index)}
                />
              </td>
              <td>{item.no}</td>
              <td>{item.name}</td>
              <td>{item.code}</td>
              
              <td>{getValue("Module firmware identifier (Version)")}</td>
              
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};







const PPPSetup = () => {
  const [lcpOptions, setLcpOptions] = useState([]);
  const [ipcpOptions, setIpcpOptions] = useState([]);
  const [popupType, setPopupType] = useState(null); // "LCP" or "IPCP"
  const [popupData, setPopupData] = useState({ type: "", data: "" });
  const [authType, setAuthType] = useState("PAP LOGIN"); // Default authentication type
  const [username, setUsername] = useState(""); // Username state
  const [password, setPassword] = useState(""); // PAP password state
  const [phyReference, setPhyReference] = useState(""); // State for PHY Reference
  


  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
     
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);


    // Fetch LCP Data
    const fetchLcpData = async () => {
      
      try {                           
        const response = await axios.get(`${BASE_URL}/api/get-ppp-setup/${deviceId}/LCP/`);
        setLcpOptions(response.data);
      } catch (error) {
        
        console.error("Error fetching LCP data:", error);
      } 
    };
  
    // Fetch IPCP Data
    const fetchIpcpData = async () => {
      
      try {
        const response = await axios.get(`${BASE_URL}/api/get-ppp-setup/${deviceId}/IPCP/`);
        setIpcpOptions(response.data);
      } catch (error) {
        
        console.error("Error fetching IPCP data:", error);
      }
    };




    useEffect(() => {
      fetchLcpData();
      fetchIpcpData();
    }, []); 




    const handleAddOption = () => {
      // Prepare the data to be sent
      const dataToSend = {
        device_id:deviceId,
        phy_reference: phyReference,  // Example data
        type: popupType,  // LCP or IPCP
        lcp_value: popupType === "LCP" ? popupData.data : null,  // LCP value if type is LCP
        ipcp_value: popupType === "IPCP" ? popupData.data : null,  // IPCP value if type is IPCP
        auth_type: authType,  // Example data
        username: username,  // Example data
        password: password,  // Example data
        LCP_TYPE: popupType === "LCP" ? popupData.type : null,  // Set LCP_TYPE if type is LCP, else null
        IPCP_TYPE: popupType === "IPCP" ? popupData.type : null,  // Set IPCP_TYPE if type is IPCP, else null
      };
    
      // Send the data using axios
      axios
        .post(`${BASE_URL}/api/create-ppp-setup/`, dataToSend)
        .then((response) => {
          console.log("Data sent successfully:", response.data);
          // Update state based on the response or perform other actions
          if (popupType === "LCP") {
            fetchLcpData();
          } else if (popupType === "IPCP") {
            fetchIpcpData();
          }
          // Reset the popup data and type after successful submission
          setPopupData({ type: "", data: "" });
          setPopupType(null);
        })
        .catch((error) => {
          console.error("Error sending data:", error);
        });
    };
    
  
  // Handle Delete Option
  const handleDeleteOption = (type, index) => {
    if (type === "LCP") {
      setLcpOptions(lcpOptions.filter((_, i) => i !== index));
    } else if (type === "IPCP") {
      setIpcpOptions(ipcpOptions.filter((_, i) => i !== index));
    }
  };

  const lcpTypes = [
    "Maximum Receive Unit",
    "Async Control Character Map",
    "Authentication Protocol",
    "Magic Number",
    "Protocol Field Compression",
    "Address and Control Field Compression",
    "FCS Alternatives",
  ];

  const ipcpTypes = [
    "IP Compression Protocol",
    "Grant Access Only to Preferred Person List",
    "Preferred Local IP Address",
    "Preferred Peer IP Address",
    "Use Static IP Pool",
  ];

  return (
    <div style={{ padding: "10px" }}>
    

      <label className='lc-row' style={{ display: "flex", alignItems: "center" }}>
        <input
          type="checkbox"
          style={{ marginRight: "10px" }}
          onChange={(e) =>
            setPhyReference(e.target.checked ? phyReference : "")
          }
        />
        PHY Reference:
        <input
          type="text"
          value={phyReference}
          onChange={(e) => setPhyReference(e.target.value)}
          placeholder="Enter reference"
         
          style={{ marginLeft: "10px",width:"60%" }}
        />
      </label>

      {/* LCP Options */}
      <div className='window-Destination-table-conatainer'>
      
       <div  className='ipcp-Container'>
        <div className='table-Container'> 
        <table className='small-table' >
          <thead>
            <tr>
              <th>No</th>
              <th>Type</th>
              <th>Value</th>
              
             
            </tr>
          </thead>
          <tbody>
            {lcpOptions.map((option, index) => (
              <tr key={index}>
                <td>{index+1}</td>
                <td>{option.LCP_TYPE}</td>
                
                <td>{option.lcp_value}</td>
              
              </tr>
            ))}
          </tbody>
        </table>

       </div>
        <div className='button-container'>
        <button className='network-add-button'  onClick={() => setPopupType("LCP")}>Add LCP Option</button>
        <button className='network-delete-button'>Delete LCP</button>
        </div>
        </div>
        
      

      {/* IPCP Options */}
      <div  className='ipcp-Container'>
       
       <div className='table-Container'>
        <table  className='small-table' >
          <thead>
            <tr>
              <th>No</th>
              <th>Type</th>
              <th>Value</th>
             
            </tr>
          </thead>
          <tbody>
            {ipcpOptions.map((option, index) => (
              <tr key={index}>
                <td>{index+1}</td>
                <td>{option.IPCP_TYPE}</td>
                <td>{option.ipcp_value}</td>
               
              </tr>
            ))}
          </tbody>
        </table>
         </div>
        <div className='button-container'>
        <button className='network-add-button'  onClick={() => setPopupType("IPCP")}>Add IPCP Option</button>
        <button className='network-delete-button'>Delete Ipcp</button>
        </div> 
      </div>

      </div>
    
      


     

      <div className='ppp-container'>
      <h3 className='ppp-heading'>PPP Authentication</h3>
      <div className='lc-row'>
        <label className='lc-label'>
          Type:
            </label>
          <select className='lc-select'
            value={authType}
            onChange={(e) => setAuthType(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="PAP LOGIN">PAP LOGIN</option>
            <option value="CHAP">CHAP</option>
          </select>
      
      </div>
      <div className='lc-row'>
        <label  className='lc-label'>
          Username:</label>
          <input id='lc-input-username'
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            
          />
        
      </div>
      <div  className='lc-row' >
        <label className='lc-label'>
          PAP Password:
             </label>
          <input
          id='lc-input-username'
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
           
          />
     
      </div>
      
    </div>

      {/* Popup Modal */}
      {popupType && (
        <div
          style={{
            position: "fixed",
            top: "20%",
            left: "30%",
            background: "#fff",
            padding: "20px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
          }}
        >
          <h3>Add {popupType} Option</h3>
          <label>
            Type:
            <select
              value={popupData.type}
              onChange={(e) =>
                setPopupData({ ...popupData, type: e.target.value })
              }
              style={{ marginLeft: "10px" }}
            >
              <option value="">Select Type</option>
              {(popupType === "LCP" ? lcpTypes : ipcpTypes).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <br />
          <label style={{ marginTop: "10px" }}>
            Value:
            {popupType === "LCP" ? (
              <input
                type="number"
                value={popupData.data}
                onChange={(e) =>
                  setPopupData({ ...popupData, data: e.target.value })
                }
                style={{ marginLeft: "10px" }}
              />
            ) : (
              <select
                value={popupData.data}
                onChange={(e) =>
                  setPopupData({ ...popupData, data: e.target.value })
                }
                style={{ marginLeft: "10px" }}
              >
                <option value="">Select Value</option>
                <option value="Enable">Enable</option>
                <option value="Disable">Disable</option>
              </select>
            )}
          </label>
          <br />
          <button onClick={handleAddOption} style={{ marginTop: "10px" }}>
            Add
          </button>
          <button
            onClick={() => setPopupType(null)}
            style={{ marginTop: "10px", marginLeft: "10px" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};






const GprsSetup = () => {
  const [formData, setFormData] = useState({
    apn: "",
    pinCode: "",
    default: {
      precedence: 0,
      delay: 0,
      reliability: 0,
      peakThroughput: 0,
    },
    requested: {
      precedence: "",
      delay: "",
      reliability: "",
      peakThroughput: "",
      meanThroughput: "",
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRequestedChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      requested: { ...formData.requested, [name]: value },
    });
  };

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
     
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      data: [
        {
          device_id: deviceId, // Update this with the actual device ID
          apn: formData.apn,
          pin_code: formData.pinCode,
          default_precedence: formData.default.precedence,
          default_delay: formData.default.delay,
          default_reliability: formData.default.reliability,
          default_peak_throughput: formData.default.peakThroughput,
          requested_precedence: formData.requested.precedence || 0,
          requested_delay: formData.requested.delay || 0,
          requested_reliability: formData.requested.reliability || 0,
          requested_peak_throughput: formData.requested.peakThroughput || 0,
          requested_mean_throughput: formData.requested.meanThroughput || 0,
        },
      ],
    };

    try {
      const response = await axios.post(
        `${BASE_URL}/api/create-gprs-setup/`,
        payload
      );
      console.log("Data submitted successfully:", response.data);
      alert("GPRS setup created successfully!");
    } catch (error) {
      console.error("Error submitting data:", error.response?.data || error.message);
      alert("Failed to submit GPRS setup.");
    }
  };

  return (
   
   
    <form onSubmit={handleSubmit}>
       <div className='ppp-container'>
     
      <div className='ppp-heading'> 
        <label  className="gprs_checkbox-label">
          <input type="checkbox" className="gprs_checkbox" />
          GPRS Modern Setup
        </label>
        </div>

      <div className="gprs_grid">
       
       
          <label className="gprs_label">
            APN:
            <input
              type="text"
              className="gprs_input"
              name="apn"
              placeholder="Enter APN"
              value={formData.apn}
              onChange={handleInputChange}
            />
          </label>
          <label className="gprs_label">
            PIN Code:
            <input
              type="text"
              className="gprs_input"
              name="pinCode"
              placeholder="Enter PIN code"
              value={formData.pinCode}
              onChange={handleInputChange}
            />
          </label>
       
      </div>
      </div>

   
      <div className="ppp-container">
           <div className='ppp-heading'> 
         <label  className="gprs_checkbox-label">
          <input type="checkbox" className="gprs_checkbox" />
        Default Configuration
        </label>
        </div>

                <div className="gprs_grid">
          {Object.entries(formData.default).map(([key, value]) => (
            <label className="gprs_grid-label" key={`default-${key}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
              <input className="gprs_readonly-input" type="number" value={value} readOnly />
            </label>
          ))}
        </div>
        </div>
      <div className="ppp-container">
        
        <div className='ppp-heading'> 
           <label  className="gprs_checkbox-label">
          <input type="checkbox" className="gprs_checkbox" />
         Requested Configuration
        </label>
      
        </div>
        <div className="gprs_grid">
          {Object.keys(formData.requested).map((key) => (
            <label className="gprs_grid-label" key={`requested-${key}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)}:
              <input
                className="gprs_input"
                type="number"
                name={key}
                placeholder="Enter Value"
                value={formData.requested[key]}
                onChange={handleRequestedChange}
              />
            </label>
          ))}
        </div>
      </div>
      <button className="gprs_submit-button" type="submit">
        Submit
      </button>
    </form>
  );
};









const NetworkControl = () => {
  const [activeSection, setActiveSection] = useState('AutoConnect');

  const renderSection = () => {
    switch (activeSection) {

      case 'AutoConnect':
        return <AutoConnect />;
      case 'AutoAnswer':             
        return < AutoAnswerSettings/>;     
      
      case 'TcpUdpSetup':
        return <TcpUdpSetup />;
      case 'ModuleInformation':
        return <ModuleInformation />;
      case 'PppSetup':
        return <PPPSetup />

      case 'GprsModemSetup':
        return <GprsSetup/>
       
      case 'IPv4Setup':
        return <IPv4Setup />;
          
        
      default:
        return <AutoConnect />;
    }
  };

  return (
    <div className="network-control-container">
     
      <div> 
        <button  onClick={() => setActiveSection('AutoConnect')}>Auto Connect</button>
        <button onClick={() => setActiveSection('AutoAnswer')}>Auto Answer</button>
        <button  onClick={() => setActiveSection('IPv4Setup')}>IPv4 Setup</button>
        <button  onClick={() => setActiveSection('TcpUdpSetup')}>TCP-UDP Setup</button>
        <button  onClick={() => setActiveSection('GprsModemSetup')}>GPRS Modem Setup</button>
        <button  onClick={() => setActiveSection('PppSetup')}>PPP Setup</button>
        <button  onClick={() => setActiveSection('ModuleInformation')}>Module Information</button>
      </div>
      <div className="load-control-container">{renderSection()}</div>
    </div>
  );
};

export default NetworkControl;

