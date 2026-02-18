import React, { useState,useEffect } from 'react';
import './index.css';
import axios from 'axios';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

const OtherParameters = () => {

    
    
    const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
       
        useEffect(() => {
          const storedId = localStorage.getItem('selectedDeviceId');
          setDeviceId(storedId);
        }, []);

    const [formData, setFormData] = useState({
        device_id: deviceId, // Assuming device_id is 1; change as needed
        send_destination: false,
        transport_service: '',
        destination: '',
        message_type: '',
        randomisation_start_interval: false,
        start_interval_value: 0,
        retries_enabled: false,
        retries: 0,
        repetition_delay_enabled: false,
        repetition_delay: 0,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async () => {
        const { transport_service, destination, message_type } = formData;
        
        // Check required fields
        if (!transport_service || !destination || !message_type) {
            alert('Please fill in Transport Service, Destination, and Message Type.');
            return;
        }

        try {
            console.log(formData); // Display data for debugging
            await axios.post(`${BASE_URL}/api/add-other-parameters/`, formData);
            alert('Data saved successfully');
        } catch (error) {
            console.error('Error sending data:', error);
            alert('Error saving data. Please try again.');
        }
    };

    return (
        <div className="pushsetup-other-parameters">
            <div className="pushsetup-form-container">
                <div className="pushsetup-item">
                    <input
                        type="checkbox"
                        name="send_destination"
                        checked={formData.send_destination}
                        onChange={handleChange}
                    />
                    <label>Send Destination and Method</label>
                </div>

                <div className="pushsetup-row">
                    <label>Transport Service:</label>
                    <input
                        type="text"
                        name="transport_service"
                        placeholder="Transport Service"
                        value={formData.transport_service}
                        onChange={handleChange}
                    />
                </div>

                <div className="pushsetup-row">
                    <label>Destination (IP:Port):</label>
                    <input
                        type="text"
                        name="destination"
                        placeholder="IP:Port"
                        value={formData.destination}
                        onChange={handleChange}
                    />
                </div>

                <div className="pushsetup-row">
                    <label>Message Type:</label>
                    <input
                        type="text"
                        name="message_type"
                        placeholder="Message Type"
                        value={formData.message_type}
                        onChange={handleChange}
                    />
                </div>

                <div className="pushsetup-row">
                    <input
                        type="checkbox"
                        name="randomisation_start_interval"
                        checked={formData.randomisation_start_interval}
                        onChange={handleChange}
                    />
                    <label>Randomisation Start Interval (s):</label>
                    <input
                        type="number"
                        name="start_interval_value"
                        placeholder="0"
                        value={formData.start_interval_value}
                        onChange={handleChange}
                        disabled={!formData.randomisation_start_interval}
                    />
                </div>

                <div className="pushsetup-row">
                    <input
                        type="checkbox"
                        name="retries_enabled"
                        checked={formData.retries_enabled}
                        onChange={handleChange}
                    />
                    <label>Number of Retries:</label>
                    <input
                        type="number"
                        name="retries"
                        placeholder="0"
                        value={formData.retries}
                        onChange={handleChange}
                        disabled={!formData.retries_enabled}
                    />
                </div>

                <div className="pushsetup-row">
                    <input
                        type="checkbox"
                        name="repetition_delay_enabled"
                        checked={formData.repetition_delay_enabled}
                        onChange={handleChange}
                    />
                    <label>Repetition Delay (s):</label>
                    <input
                        type="number"
                        name="repetition_delay"
                        placeholder="0"
                        value={formData.repetition_delay}
                        onChange={handleChange}
                        disabled={!formData.repetition_delay_enabled}
                    />
                </div>

                <button onClick={handleSubmit} className="pushsetup-submit-button">
                    Submit
                </button>
            </div>
        </div>
    );
};











function PushSetup() {
    const [activeView, setActiveView] = useState('pushObjectList');
    const [activeSections, setActiveSections] = useState({
        basicInfo: false,
        pushSetup: false,
        alarms: false,
        timeOfUse: false,
    });
    const [activeItems, setActiveItems] = useState({
        cosemLogicalDeviceName: false,
        pushNameForAlarm: false,
        alarmDescriptor1: false,
        alarmDescriptor2: false,
        clock: false,
    });
    const [activeViewButton, setActiveViewButton] = useState({
        basicInfo: false,
        pushSetup: false,
        alarms: false,
        timeOfUse: false,
    });



const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
    useEffect(() => {
      const storedId = localStorage.getItem('selectedDeviceId');
      setDeviceId(storedId);
    }, []);



    const [pushSetupItems, setPushSetupItems] = useState([]);

   


   

    const toggleSection = (section) => {
        setActiveSections((prevState) => {
            const newState = { ...prevState, [section]: !prevState[section] };

            if (newState[section]) {
                setActiveItems((prevItems) => {
                    switch (section) {
                        case 'basicInfo':
                            return { ...prevItems, cosemLogicalDeviceName: true };
                        case 'pushSetup':
                            return { ...prevItems, pushNameForAlarm: true };
                        case 'alarms':
                            return { ...prevItems, alarmDescriptor1: true, alarmDescriptor2: true };
                        case 'timeOfUse':
                            return { ...prevItems, clock: true };
                        default:
                            return prevItems;
                    }
                });
            } else {
                setActiveItems((prevItems) => {
                    switch (section) {
                        case 'basicInfo':
                            return { ...prevItems, cosemLogicalDeviceName: false };
                        case 'pushSetup':
                            return { ...prevItems, pushNameForAlarm: false };
                        case 'alarms':
                            return { ...prevItems, alarmDescriptor1: false, alarmDescriptor2: false };
                        case 'timeOfUse':
                            return { ...prevItems, clock: false };
                        default:
                            return prevItems;
                    }
                });
            }

            return newState;
        });
    };

    const toggleSection1 = (section) => {
        setActiveViewButton((prevState) => ({
            ...prevState,
            [section]: !prevState[section],
        }));
    };

    const toggleItem = (item) => {
        setActiveItems((prevItems) => {
            return { ...prevItems, [item]: !prevItems[item] };
        });
    };

    const handleViewChange = (view) => {
        setActiveView(view);
    };


    const fetchData = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/get-push-setup-item/${deviceId}/`);
            setPushSetupItems(response.data.data); // Store the "data" array from response
            console.log("Data fetched successfully:", response.data.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };


    useEffect(() => {
       

        fetchData();
    }, []);


  

    const handleAddItem = async () => {
        // Fetch existing items from the backend
        let existingItems = [];
        try {
            const response = await axios.get(`${BASE_URL}/api/get-push-setup-item/${deviceId}/`);
            existingItems = response.data.data;
        } catch (error) {
            console.error("Error fetching existing items:", error);
        }
    
        // Helper function to check if the item already exists
        const isItemExists = (itemName) => {
            return existingItems.some((existingItem) => existingItem.name === itemName);
        };
    
        // Initialize a new item object
        let item = null;
        let allItemsAdded = true; // Flag to track if all items are already added
    
        // Add active items to the item object, checking each item one at a time
        if (activeItems.cosemLogicalDeviceName && !isItemExists('COSEM Logical Device Name')) {
            item = {
                name: 'COSEM Logical Device Name',
                code: '{1, 0-0:42.0.0.255}',
                data_index: '00001',
            };
            allItemsAdded = false;
        } else if (activeItems.pushNameForAlarm && !isItemExists('Push Name (for Alarm)')) {
            item = {
                name: 'Push Name (for Alarm)',
                code: '{40, 0-4:25.9.0.255}',
                data_index: '00002',
            };
            allItemsAdded = false;
        } else if (activeItems.alarmDescriptor1 && !isItemExists('Alarm Descriptor 1')) {
            item = {
                name: 'Alarm Descriptor 1',
                code: '{1, 0-0:97.98.20.255}',
                data_index: '00003',
            };
            allItemsAdded = false;
        } else if (activeItems.alarmDescriptor2 && !isItemExists('Alarm Descriptor 2')) {
            item = {
                name: 'Alarm Descriptor 2',
                code: '{1, 0-0:97.98.21.255}',
                data_index: '00004',
            };
            allItemsAdded = false;
        } else if (activeItems.clock && !isItemExists('Clock')) {
            item = {
                name: 'Clock',
                code: '{8, 0-0:1.0.0.255}',
                data_index: '00005',
            };
            allItemsAdded = false;
        }
    
        if (item) {
            // Add device_id to the item
            const deviceId = 1; // Replace with the correct device ID dynamically if necessary
            item.device_id = deviceId;
    
            // Send the item to the backend
            try {
                const formattedData = {
                    device_id: item.device_id,
                    name: item.name,
                    code: item.code,
                    data_index: item.data_index,
                };
    
                console.log("Sending data:", formattedData); // Debugging
    
                // Send data to the backend (only one item)
                await axios.post(`${BASE_URL}/api/add-push-setup-item/`, formattedData);
                console.log("Data sent successfully");
                fetchData(); // Refresh data after adding the item
            } catch (error) {
                console.error("Error sending data:", error);
            }
        } else {
            // No new active items to send
            if (allItemsAdded) {
                alert("All items have already been added.");
            } else {
                alert("All active items are added. Please select new items to add.");
            }
        }
    };

    const [selectedRowId, setSelectedRowId] = useState(null); // To track selected row

  const handleRowClick = (id) => {
    setSelectedRowId(id);
    console.log('Row clicked with ID:', id); // Logs the selected row's ID
  };

  

const handleDeleteClick = () => {
  if (!selectedRowId) {
    console.log('No row selected');
    return;
  }

  const url = `${BASE_URL}/api/delete-setup-items/${selectedRowId}/`;

  axios
    .delete(url)
    .then((response) => {
      console.log('Delete successful', response.data);
      fetchData()
      // Optionally update your state to remove the deleted item from the table
    })
    .catch((error) => {
      console.error('Error deleting item:', error);
      // You can handle error (e.g., show a message or alert)
    });
};

    
    

    return (
        <div className="pushsetup-container">
            <div className="meter-info-list">
                <button onClick={() => handleViewChange('pushObjectList')} className={`meter-info-item ${activeView === 'pushObjectList' ? 'active' : ''}`}>Push Object List</button>
                <button onClick={() => handleViewChange('otherParameters')} className={`meter-info-item ${activeView === 'otherParameters' ? 'active' : ''}`}>Other Parameters</button>
            </div>

            {activeView === 'pushObjectList' && (
               
               
               <div className='pushObjactContainer'> 
                <div className="push-object">
                    {/* Basic Information Section */}
                    <div className="pushsetup-section">
                        <div className="label_and_icon">
                            <button
                                className={`triangle-button ${activeSections.basicInfo ? 'open' : ''}`}
                                onClick={() => toggleSection1('basicInfo')}
                            >
                                {activeViewButton.basicInfo ? '▼' : '▶'}
                            </button>
                            <label
                                className="pushsetup-label basicInfo-label"
                                onClick={() => toggleSection('basicInfo')}
                            >
                                <input
                                    type="checkbox"
                                    checked={activeSections.basicInfo}
                                    readOnly
                                /> Basic Information
                            </label>
                        </div>
                        {activeViewButton.basicInfo && (
                            <div className="sub-items">
                                <label className="pushsetup-label basicInfo-label">
                                    <input
                                        type="checkbox"
                                        checked={activeItems.cosemLogicalDeviceName}
                                        onChange={() => toggleItem('cosemLogicalDeviceName')}
                                    />
                                    COSEM Logical Device Name
                                    <span className="pushsetup-text">{`{1, 0-0:42.0.0.255}`}</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Push Setup Section */}
                    <div className="pushsetup-section">
                        <div className="label_and_icon">
                            <button
                                className={`triangle-button ${activeSections.pushSetup ? 'open' : ''}`}
                                onClick={() => toggleSection1('pushSetup')}
                            >
                                {activeViewButton.pushSetup ? '▼' : '▶'}
                            </button>
                            <label
                                className="pushsetup-label basicInfo-label"
                                onClick={() => toggleSection('pushSetup')}
                            >
                                <input
                                    type="checkbox"
                                    checked={activeSections.pushSetup}
                                    readOnly
                                /> Push Setup
                            </label>
                        </div>
                        {activeViewButton.pushSetup && (
                            <div className="sub-items">
                                <label className="pushsetup-label basicInfo-label">
                                    <input
                                        type="checkbox"
                                        checked={activeItems.pushNameForAlarm}
                                        onChange={() => toggleItem('pushNameForAlarm')}
                                    />
                                    Push Name (for Alarm)
                                    <span className="pushsetup-text">{`{40, 0-4:25.9.0.255}`}</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Alarms Section */}
                    <div className="pushsetup-section">
                        <div className="label_and_icon">
                            <button
                                className={`triangle-button ${activeSections.alarms ? 'open' : ''}`}
                                onClick={() => toggleSection1('alarms')}
                            >
                                {activeViewButton.alarms ? '▼' : '▶'}
                            </button>
                            <label
                                className="pushsetup-label basicInfo-label"
                                onClick={() => toggleSection('alarms')}
                            >
                                <input
                                    type="checkbox"
                                    checked={activeSections.alarms}
                                    readOnly
                                /> Alarms
                            </label>
                        </div>
                        {activeViewButton.alarms && (
                            <div className="sub-items">
                                <label className="pushsetup-label basicInfo-label">
                                    <input
                                        type="checkbox"
                                        checked={activeItems.alarmDescriptor1}
                                        onChange={() => toggleItem('alarmDescriptor1')}
                                    />
                                    Alarm Descriptor 1
                                    <span className="pushsetup-text">{`{1, 0-0:97.98.20.255}`}</span>
                                </label>
                                <label className="pushsetup-label basicInfo-label">
                                    <input
                                        type="checkbox"
                                        checked={activeItems.alarmDescriptor2}
                                        onChange={() => toggleItem('alarmDescriptor2')}
                                    />
                                    Alarm Descriptor 2
                                    <span className="pushsetup-text">{`{1, 0-0:97.98.21.255}`}</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Time of Use Section */}
                    <div className="pushsetup-section">
                        <div className="label_and_icon">
                            <button
                                className={`triangle-button ${activeSections.timeOfUse ? 'open' : ''}`}
                                onClick={() => toggleSection1('timeOfUse')}
                            >
                                {activeViewButton.timeOfUse ? '▼' : '▶'}
                            </button>
                            <label
                                className="pushsetup-label basicInfo-label"
                                onClick={() => toggleSection('timeOfUse')}
                            >
                                <input
                                    type="checkbox"
                                    checked={activeSections.timeOfUse}
                                    readOnly
                                /> Time of Use
                            </label>
                        </div>
                        {activeViewButton.timeOfUse && (
                            <div className="sub-items">
                                <label className="pushsetup-label basicInfo-label">
                                    <input
                                        type="checkbox"
                                        checked={activeItems.clock}
                                        onChange={() => toggleItem('clock')}
                                    />
                                    Clock
                                    <span className="pushsetup-text">{`{8, 0-0:1.0.0.255}`}</span>
                                </label>
                            </div>
                        )}
                    </div>


                    <div className="pushsetup-button-action">
        <button className='pushsetup-add-button' onClick={handleAddItem}>Add (+)</button>
      
      </div>
                
                
                </div>


                
     

                <div className="push-object">

                <table className="table-pushsetup">
      <thead>
        <tr>
          <th>Name</th>
          <th>Code</th>
          <th>Data Index</th>
          
        </tr>
      </thead>
      <tbody>
        {pushSetupItems.map((item, index) => (
          <tr
            key={index}
            onClick={() => handleRowClick(item.id)}  // Handle row click
            onDoubleClick={() => handleRowClick(item.id)} // Handle double-click
            style={{
              backgroundColor: item.id === selectedRowId ? 'lightblue' : '',
            }} // Optional: Highlight selected row
          >
            <td>{item.name}</td>
            <td>{item.code}</td>
            <td>{item.data_index}</td>
            
           
          </tr>
        ))}
      </tbody>
    </table>

    <div className='pushsetup-button-action'> 

               <button 
               className='pushsetup-delete-button'
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click action
                  handleDeleteClick(); // Handle delete button click
                }}
              >
                Delete
              </button>
              </div>
   
              

       </div>
       </div>


            )}

            {activeView === 'otherParameters' && <OtherParameters />}

           
        </div>
    );
}

export default PushSetup;

