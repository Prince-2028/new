import React, { useState, useEffect ,useMemo,useRef } from 'react';
import axios from 'axios';
import './index.css';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

const RegisterLimiter = () => {
  const [thresholdsField, setThresholdsField] = useState("");
  const [selectedSubDashboard, setSelectedSubDashboard] = useState("Supervision Monitor 1");
  const [thresholds, setThresholds] = useState([]);
  const [actions, setActions] = useState([]);
  const [openAddThresholds, setOpenAddThresholds] = useState(false);
  const [openAddAction, setOpenAddAction] = useState(false);

  const [actionUp, setActionUp] = useState("");
  const [actionDown, setActionDown] = useState("");
  const [selectedThreshold, setSelectedThreshold] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [thresholdsValue, setThresholdsValue] = useState("");

 const monitorTypeMap = {
      "Supervision Monitor 1": 'supervision_monitor_1',
      "Supervision Monitor 2": 'supervision_monitor_2',
      "Supervision Monitor 3": 'supervision_monitor_3',

      "Alarm Monitor 1": 'alarm_monitor_1',
      "Alarm Monitor 2": 'alarm_monitor_2',
    };

  const SUPERVISION_MONITOR_OPTIONS = [
  { label: "Instantaneous current L1", code: "0100470700FF" },
  { label: "Sliding average current L1", code: "0100470400FF" },
];

const SUPERVISION_MONITOR_OPTIONS2 = [
  { label: "Instantaneous current L2", code: "0100470700FF" },
  { label: "Sliding average current L2", code: "0100470400FF" },
];

const SUPERVISION_MONITOR_OPTIONS3 = [
  { label: "Instantaneous current L3", code: "0100470700FF" },
  { label: "Sliding average current L3", code: "0100470400FF" },
];






    const monitorType = monitorTypeMap[selectedSubDashboard];
  // 🔥 Dynamic options based on selected tab
  const { actionUpOptions, actionDownOptions } = useMemo(() => {
    if (monitorType === "supervision_monitor_1") {
      return {
        actionUpOptions: [
          { value: "set_ready_reconnection", label: "Set ready for reconnection" },
          { value: "no_action", label: "No action" },
        ],
        actionDownOptions: [
          { value: "set_connected", label: "Set connected" },
          { value: "no_action", label: "No action" },
        ],
      };
    } else {
      // Alarm Monitor 1 & 2
      return {
        actionUpOptions: [
          { value: "push_on_alarm", label: "Push-on alarm" },
          { value: "no_action", label: "No action" },
        ],
        actionDownOptions: [
          { value: "no_action", label: "No action" },
        ],
      };
    }
  }, [monitorType]);

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
         
          useEffect(() => {
            const storedId = localStorage.getItem('selectedDeviceId');
            setDeviceId(storedId);
          }, []);

           const fetchData = async () => {
      const monitorTypeMap = {
        "Supervision Monitor 1": 'supervision_monitor_1',
         "Supervision Monitor 2": 'supervision_monitor_2',
          "Supervision Monitor 3": 'supervision_monitor_3',
        "Alarm Monitor 1": 'alarm_monitor_1',
        "Alarm Monitor 2": 'alarm_monitor_2',
      };

      const monitorType = monitorTypeMap[selectedSubDashboard];

      

      try {
        const response = await axios.get(`${BASE_URL}/api/get-register-limiter/${deviceId}/${monitorType}/`);
        setThresholds(response.data.threshold_data || []); // Ensure it's an empty array if null or undefined
        setActions(response.data.action_data || []); // Ensure it's an empty array if null or undefined
      } catch (error) {
        console.error('Error fetching data:', error);
        setThresholds([]);
        setActions([]);
      }
    };
  // Fetch data when selectedSubDashboard changes
  useEffect(() => {
   

    fetchData();
  }, [selectedSubDashboard]);

  const addThreshold = () => {
    const monitorTypeMap = {
      "Supervision Monitor 1": 'supervision_monitor_1',
       "Supervision Monitor 2": 'supervision_monitor_2',
        "Supervision Monitor 3": 'supervision_monitor_3',
      "Alarm Monitor 1": 'alarm_monitor_1',
      "Alarm Monitor 2": 'alarm_monitor_2',
    };

    const monitorType = monitorTypeMap[selectedSubDashboard];

    const data = {
      device_id: deviceId, // Replace with dynamic ID as needed
      monitor_type: monitorType,
      threshold: 1,
      thresholds_value: parseInt(thresholdsValue),
    };

    console.log('Data to be sent:1', data);

    setThresholdsValue("");
    setThresholdsField("");
    setOpenAddThresholds(false);

    // Send threshold data to backend using Axios
    axios.post(`${BASE_URL}/api/add-register-limiter/`, data)
      .then(response => {
        console.log('Threshold added:', response.data);
        // Optionally refresh thresholds
         fetchData();
      })
      .catch(error => {
        console.error('Error adding threshold:', error);
      });
  };

  const addAction = () => {
    const monitorTypeMap = {
      "Supervision Monitor 1": 'supervision_monitor_1',
      "Alarm Monitor 1": 'alarm_monitor_1',
      "Alarm Monitor 2": 'alarm_monitor_2',
    };

    const monitorType = monitorTypeMap[selectedSubDashboard];

    const data = {
      device_id: deviceId, // Replace with dynamic ID as needed
      monitor_type: monitorType,
      action_up: actionUp,
      action_down: actionDown,
    };

    console.log(data); // Log the data before sending to backend
    setActionUp("step1");
    setActionDown("step1");
    setOpenAddAction(false);

    // Send action data to backend using Axios
    axios.post(`${BASE_URL}/api/add-register-limiter/`, data)
      .then(response => {
        console.log('Action added:', response.data);
        // Optionally refresh actions
        fetchData();
      })
      .catch(error => {
        console.error('Error adding action:', error);
      });
  };

   const [selectedValues, setSelectedValues] = useState({
  "Supervision Monitor 1": SUPERVISION_MONITOR_OPTIONS[0],
  "Supervision Monitor 2": SUPERVISION_MONITOR_OPTIONS2[0],
  "Supervision Monitor 3": SUPERVISION_MONITOR_OPTIONS3[0],
});
 
   const [showCodes, setShowCodes] = useState(false);



   const handleChange = (e) => {
  const optionsMap = {
    "Supervision Monitor 1": SUPERVISION_MONITOR_OPTIONS,
    "Supervision Monitor 2": SUPERVISION_MONITOR_OPTIONS2,
    "Supervision Monitor 3": SUPERVISION_MONITOR_OPTIONS3,
  };

  const currentOptions = optionsMap[selectedSubDashboard] || [];

  const opt = currentOptions.find(
    (o) => o.code === e.target.value
  );

  if (opt) {
    setSelectedValues((prev) => ({
      ...prev,
      [selectedSubDashboard]: opt,
    }));
  }
};


  const renderMonitorContent = () => {
    switch (selectedSubDashboard) {
      case "Supervision Monitor 1":
        
        return (
  <div className="security-form" >
      <label>
        <span>Monitored Value</span>

        <select
          aria-label="Monitored value"
          value={selectedValues[selectedSubDashboard]?.code}
          onChange={handleChange}
          onFocus={() => setShowCodes(true)}   // show label + code while open/focused
          onBlur={() => setShowCodes(false)}   // hide code after closing/blur
          style={{
            display: "block",
            width: "100%",
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 14,
          }}
        >
          {SUPERVISION_MONITOR_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {showCodes ? `${opt.label} (${opt.code})` : opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
       
      
       case "Supervision Monitor 2":
        
        return (
  <div className="security-form" >
      <label>
        <span>Monitored Value</span>

        <select
          aria-label="Monitored value"
         value={selectedValues[selectedSubDashboard]?.code}
          onChange={handleChange}
          onFocus={() => setShowCodes(true)}   // show label + code while open/focused
          onBlur={() => setShowCodes(false)}   // hide code after closing/blur
          style={{
            display: "block",
            width: "100%",
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 14,
          }}
        >
          {SUPERVISION_MONITOR_OPTIONS2.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {showCodes ? `${opt.label} (${opt.code})` : opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );


  case "Supervision Monitor 3":
        
        return (
  <div className="security-form" >
      <label>
        <span>Monitored Value</span>

        <select
          aria-label="Monitored value"
          value={selectedValues[selectedSubDashboard]?.code}
          onChange={handleChange}
          onFocus={() => setShowCodes(true)}   // show label + code while open/focused
          onBlur={() => setShowCodes(false)}   // hide code after closing/blur
          style={{
            display: "block",
            width: "100%",
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 14,
          }}
        >
          {SUPERVISION_MONITOR_OPTIONS3.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {showCodes ? `${opt.label} (${opt.code})` : opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  case "Alarm Monitor 2":
        return <ThresholdActionTable title="Alarm Monitor 2" monitoredValue="Alarm descriptor 2" />;
      case "Alarm Monitor 1":
        return <ThresholdActionTable title="Alarm Monitor 1" monitoredValue="Alarm descriptor 1" />;   
      default:
        return null;
    }
  };

  const deleteItem=()=> 
  {
    console.log(selectedThreshold)
    handleDelete(selectedThreshold.id)
  }

  const deleteActionItem=()=> 
    {
      console.log(selectedAction) 
      handleDelete(selectedAction.id)
    }



  const handleDelete = async (id) => {
    if (!id) {
      alert('Please enter an Action Item Item  to delete.');
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/api/delete-register-limiter/${id}/`);
      alert(`RegisterLimiter entry with ID ${id} deleted successfully.`);
      console.log(response.data);
      fetchData()
    } catch (error) {
      if (error.response && error.response.status === 404) {
        alert(`Error: RegisterLimiter entry with ID ${id} does not exist.`);
      } else {
        alert('An error occurred while trying to delete the entry.');
      }
      console.error(error);
    }
  };


  

  return (
    <div>
     

<div className="view-toggle" role="tablist" aria-label="Sub dashboard selector">
  {["Supervision Monitor 1","Supervision Monitor 2","Supervision Monitor 3", "Alarm Monitor 1", "Alarm Monitor 2"].map((monitor) => (
    <button
      key={monitor}
      type="button"
      role="tab"
      aria-pressed={selectedSubDashboard === monitor}
      className={`view-btn ${selectedSubDashboard === monitor ? "active" : ""}`}
      onClick={() => setSelectedSubDashboard(monitor)}
    >
      {monitor}
    </button>
  ))}
</div>

     <div className='load-control-container'> 
      <div>
        {renderMonitorContent()}
      </div>

     

      <div style={{ display: 'flex' }}>
        {/* Thresholds Table */}
        <div style={{ width: '50%', paddingRight: '10px' }}>
       
            <label>
                    <input type="checkbox" />
                    <span> Thresholds </span>
                   
                </label>
                <div className='table-container'> 
          <table className="tableTariff1" border="1" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Index</th>
                <th>Thresholds (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.length > 0 ? (
                thresholds.map((threshold, index) => (
                  <tr
                    key={threshold.id}
                    style={{ cursor: 'pointer' }}
                    id={selectedThreshold === threshold ? 'selected' : ''}
                    onClick={() => {
                      setSelectedThreshold(threshold);
                      console.log('Selected Threshold ID:', threshold.id);
                    }}
                  >
                    <td>{index + 1}</td>
                    <td>{threshold.thresholds_value}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No thresholds available</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <div className='buttons_Container'>
          <button className="scheduler-add-button" onClick={() => setOpenAddThresholds(true)}>Add Threshold</button>
          <button className="scheduler-delete-button" onClick={deleteItem}> Delete Threshold</button>
          </div>
        </div>

        {/* Actions Table */}
        <div style={{ width: '50%', paddingRight: '10px' }}>
        
            <label>
                    <input type="checkbox" />
                    <span> Actions </span>
                   
                </label>
                <div className='table-container'>
          <table className="tableTariff1" border="1" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Index</th>
                <th>Action-up</th>
                <th>Action-down</th>
              </tr>
            </thead>
            <tbody>
              {actions.length > 0 ? (
                actions.map((action, index) => (
                  <tr
                    key={action.id}
                    style={{ cursor: 'pointer' }}
                    id={selectedAction === action ? 'selected' : ''}
                    onClick={() => {
                      setSelectedAction(action);
                      console.log('Selected Action ID:', action.id);
                    }}
                  >
                    <td>{index + 1}</td>
                    <td>{action.action_up}</td>
                    <td>{action.action_down}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No actions available</td>
                </tr>
              )}
            </tbody>
          </table>
           </div>
          <div className='buttons_Container'>
          <button className="scheduler-add-button" onClick={() => setOpenAddAction(true)}>Add Action</button>
          <button className="scheduler-delete-button" onClick={deleteActionItem}> Delete Action</button>
          </div>
        </div>
      </div>

      {/* Add Threshold Modal */}
      {openAddThresholds && (
        <div className="modal">
          <div className="modal-content">
            <h2>THRESHOLD</h2>
            <div>
              <label>Threshold: </label>
              <input
                type="number"
                value={thresholdsValue}
                onChange={(e) => setThresholdsValue(e.target.value)}
              />
              <span style={{ marginLeft: '10px' }}>kWh</span>
            </div>
            <div>
              <button onClick={addThreshold}>OK</button>
              <button onClick={() => setOpenAddThresholds(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Action Modal */}
      {openAddAction && (
        <div className="modal">
          <div className="modal-content">
            <h2>ACTIONS</h2>
           










            
      <div>
        <label>Action up:</label>
        <select value={actionUp} onChange={(e) => setActionUp(e.target.value)}>
           <option value="">-- Select Monitor Type --</option>
          {actionUpOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Action down:</label>
        <select value={actionDown} onChange={(e) => setActionDown(e.target.value)}>
           <option value="">-- Select Monitor Type --</option>
          {actionDownOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>


            <div>
              <button onClick={addAction}>OK</button>
              <button onClick={() => setOpenAddAction(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

const ThresholdActionTable = ({  monitoredValue }) => (
  <div className='security-form'>

         <label>
                    <input type="checkbox" />
                    <span>Monitored Value:</span>
                    <input
                        type="text"
                        name="security_suite"
                        value={monitoredValue}
                        
                    />
                </label>
   
   
  </div>
);




export default RegisterLimiter;
