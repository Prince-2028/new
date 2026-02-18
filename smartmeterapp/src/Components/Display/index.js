import React, { useState ,useEffect} from "react";
import './index.css'
import axios from "axios";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure




const categories = [
  {
    name: "Time of Use",
    items: [
      { label: "Local Date", code: "1,1-0:0.9.2.255" },
      { label: "Local Timer", code: "1,1-0:0.9.1.255" },
    ],
  },
  {
    name: "Energy Register",
    items: [
      { label: "Active energy import (+A)", code: "3,1-0:1.8.0.255" },
      { label: "Active energy export (-A)", code: "3,1-0:2.8.0.255" },
      { label: "Reactive energy import (+R)", code: "3,1-0:3.8.0.255" },
      { label: "Reactive energy export (-R)", code: "3,1-0:4.8.0.255" },
      { label: "Apparent energy import (+VA)", code: "3,1-0:9.8.0.255" },
      { label: "Apparent energy export (-VA)", code: "3,1-0:10.8.0.255" },
      { label: "Active energy (|+A|+|-A|)", code: "3,1-0:15.8.0.255" },
    ],
  },
  {
    name: "Demand Register",
    items: [
      { label: "Maximum Demand Register - Active (|+A| + |+A|)", code: "4,1-0:15.6.0.255" },
      { label: "Capture time - Maximum Demand Register - Active (|+A| + |+A|)", code: "4,1-0:15.6.0.255" },
      { label: "Maximum Demand Register - Active import (+A)", code: "4,1-0:1.6.0.255" },
      { label: "Capture time - Maximum Demand Register - Active import (+A)", code: "4,1-0:1.6.0.255" },
      { label: "Maximum Demand Register - Active export (-A)", code: "4,1-0:2.6.0.255" },
      { label: "Capture time - Maximum Demand Register - Active export (-A)", code: "4,1-0:2.6.0.255" },
      { label: "Current average value - Demand Register 2 - Active energy export (-A)", code: "5,1-0:2.4.0.255" },
      { label: "Last average value - Demand Register 2 - Active energy export (-A)", code: "5,1-0:2.4.0.255" },
      { label: "Current average value - Demand Register - Active energy export (+A)", code: "5,1-0:1.4.0.255" },
      { label: "Last average value - Demand Register - Active energy export (+A)", code: "5,1-0:1.4.0.255" },
    ],
  },
  
    {
      name: "Payment",
      items: [
        { label: "Cumulative purchase Credit", code: "3,1-65:1.140.2.255" },
        { label: "Residual Credit", code: "3,0-0:19.130.0.255" },
        { label: "Residual Credit Use Day's", code: "1,0-0:19.130.3.255" },
        { label: "Monthly Rent Credit", code: "30-0:19.10.2.255" },
        { label: "Currently Active Price", code: "3,0-0:96.14.1.255" },
        { label: "Currently Active Step", code: "1,0-1:96.14.1.255" },
        { label: "Currently Active Energy Tariff", code: "1,0-0:96.14.0.255" },
        { label: "Currently Monthly Consumption Credit Increment", code: "3,0-0:19.133.0.255" },
        { label: "Consumption Credit Increment of Last 1st Day", code: "3,0-0:19.133.0.255" },
        { label: "Consumption Active Energy Increment of Last 1st Day (+A | + | -A|)", code: "3,1-0:15.9.0.101" },
        { label: "Consumption Credit Increment of Last 1st Month", code: "3,0-0:19.133.0.101" },
        { label: "Consumption Credit Increment of Last 2nd Month", code: "3,0-0:19.133.0.102" },
        { label: "Consumption Credit Increment of Last 3rd Month", code: "3,0-0:19.133.0.103" },
        { label: "Consumption Credit Increment of Last 4th Month", code: "3,0-0:19.133.0.104" },
        { label: "Consumption Credit Increment of Last 5th Month", code: "3,0-0:19.133.0.105" },
        { label: "Consumption Credit Increment of Last 6th Month", code: "3,0-0:19.133.0.106" },
        { label: "Consumption Credit Increment of Last 7th Month", code: "3,0-0:19.133.0.107" },
        { label: "Consumption Credit Increment of Last 8th Month", code: "3,0-0:19.133.0.108" },
        { label: "Consumption Credit Increment of Last 9th Month", code: "3,0-0:19.133.0.109" },
        { label: "Consumption Credit Increment of Last 10th Month", code: "3,0-0:19.133.0.100" },
        { label: "Consumption Credit Increment of Last 11th Month", code: "3,0-0:19.133.0.111" },
        { label: "Consumption Credit Increment of Last 12th Month", code: "3,0-0:19.133.0.112" },
        { label: "Total Active Energy Increment of 1st Month", code: "3,1-0:15.9.0.0.101" },
        { label: "Total Active Energy Increment of 2nd Month", code: "3,1-0:15.9.0.0.102" },
        { label: "Total Active Energy Increment of 3rd Month", code: "3,1-0:15.9.0.0.103" },
        { label: "Total Active Energy Increment of 4th Month", code: "3,1-0:15.9.0.0.104" },
        { label: "Total Active Energy Increment of 5th Month", code: "3,1-0:15.9.0.0.105" },
        { label: "Total Active Energy Increment of 6th Month", code: "3,1-0:15.9.0.0.106" },
        { label: "Total Active Energy Increment of 7th Month", code: "3,1-0:15.9.0.0.107" },
        { label: "Total Active Energy Increment of 8th Month", code: "3,1-0:15.9.0.0.108" },
        { label: "Total Active Energy Increment of 9th Month", code: "3,1-0:15.9.0.0.109" },
        { label: "Total Active Energy Increment of 10th Month", code: "3,1-0:15.9.0.0.110" },
        { label: "Total Active Energy Increment of 11th Month", code: "3,1-0:15.9.0.0.111" },
        { label: "Total Active Energy Increment of 12th Month", code: "3,1-0:15.9.0.0.112" },
        { label: "Last 1st Purchase Token", code: "1,0-68:128.1.1.255" },
        { label: "Last 2nd Purchase Token", code: "1,0-68:128.1.1.101" },
        { label: "Last 3rd Purchase Token", code: "1,0-68:128.1.1.102" },
        { label: "Last 4th Purchase Token", code: "1,0-68:128.1.1.103" },
        { label: "Last 5th Purchase Token", code: "1,0-68:128.1.1.104" },
      ],
    },
  
  {
    name: "Basic Information",
    items: [
      { label: " Device id #1 Meter Serial Number", code: "3,0-0:96.1.0.255" },
      { label: "Device id #2 Manufacturer ID", code: "3,0-0:96.1.1.255" },
      
    ],
  },
  {
    name: "Instantaneous",
    items: [
      { label: "Instantaneous Voltage L1", code: "3,1-0:32.70.255" },
      { label: "Instantaneous Current L1", code: "3,1-0:31.7.0.255" },
      { label: "Instantaneous Current L0", code: "3,1-0:91.7.0.255" },
      { label: "Instant Supply Frequency", code: "3,1-0:14.7.0.255" },
      { label: "Instantaneous Import Active Power (+A)", code: "3,1-0:1.7.0.255" },
      { label: "Instantaneous Export Active Power (-A)", code: "3,1-0:.7.0.255" },
      { label: "Instantaneous Import Reactive Power (+R)", code: "3,1-0:3.7.0.255" },
      { label: "Instantaneous Export Reactive Power (-R)", code: "3,1-0:4.7.0.255" },
      { label: "Instantaneous Import Apparent Power (+VA)", code: "3,1-0:9.7.0.255" },
      { label: "Instantaneous Export Apparent Power (-VA)", code: "3,1-0:10.7.0.255" },
      { label: "Instantaneous Active Power (|+A| + |-A|)", code: "3,1-0:15.7.0.255" },
      { label: "Instantaneous Power Factor (|+A/ + VA|)", code: "3,1-0:13.7.0.255" },
    ],
  },
  
];



const manualCategories = [
    

    {
        name: "Basic Information",
        items: [
          { 
            label: "Customer Meter Equipment Identifier", 
            code: "1,0-0:96.1.1.225" 
          }
        ]
      },
      {
        name: "Time of Use",
        items: [
          { 
            label: "Local Date", 
            code: "1,1-0:0.9.2.255" 
          },
          { 
            label: "Local Time", 
            code: "1,1-0:0.9.1.255" 
          }
        ]
      },

      {
        name: "Energy Register",
        items: [
          { label: "Total Active Energy (|+A| + |+A|)", code: "3,1-0:15.8.0.255" },
          { label: "Total Active Energy (|+A| + |+A|) - Rate 1", code: "3,1-0:15.8.1.255" },
          { label: "Total Active Energy (|+A| + |+A|) - Rate 2", code: "3,1-0:15.8.2.255" },
          { label: "Total Active Energy (|+A| + |+A|) - Rate 3", code: "3,1-0:15.8.3.255" },
          { label: "Total Active Energy (|+A| + |+A|) - Rate 4", code: "3,1-0:15.8.4.255" },
          { label: "Active Energy Import (+A)", code: "3,1-0:1.8.0.255" },
          { label: "Active Energy Import (+A) - Rate 1", code: "3,1-0:1.8.1.255" },
          { label: "Active Energy Import (+A) - Rate 2", code: "3,1-0:1.8.2.255" },
          { label: "Active Energy Import (+A) - Rate 3", code: "3,1-0:1.8.3.255" },
          { label: "Active Energy Import (+A) - Rate 4", code: "3,1-0:1.8.4.255" },
          { label: "Active Energy Export (-A)", code: "3,1-0:2.8.0.255" },
          { label: "Active Energy Export (-A) - Rate 1", code: "3,1-0:2.8.1.255" },
          { label: "Active Energy Export (-A) - Rate 2", code: "3,1-0:2.8.2.255" },
          { label: "Active Energy Export (-A) - Rate 3", code: "3,1-0:2.8.3.255" },
          { label: "Active Energy Export (-A) - Rate 4", code: "3,1-0:2.8.4.255" },
          { label: "Reactive Energy Import (+R)", code: "3,1-0:3.8.0.255" },
          { label: "Reactive Energy Import (+R) - Rate 1", code: "3,1-0:3.8.1.255" },
          { label: "Reactive Energy Import (+R) - Rate 2", code: "3,1-0:3.8.2.255" },
          { label: "Reactive Energy Import (+R) - Rate 3", code: "3,1-0:3.8.4.255" },
          { label: "Reactive Energy Import (+R) - Rate 4", code: "3,1-0:3.8.5.255" },
          { label: "Reactive Energy Export (-R)", code: "3,1-0:4.8.0.255" },
          { label: "Reactive Energy Export (-R) - Rate 1", code: "3,1-0:4.8.1.255" },
          { label: "Reactive Energy Export (-R) - Rate 2", code: "3,1-0:4.8.2.255" },
          { label: "Reactive Energy Export (-R) - Rate 3", code: "3,1-0:4.8.3.255" },
          { label: "Reactive Energy Export (-R) - Rate 4", code: "3,1-0:4.8.4.255" },
          { label: "Apparent Energy Import (+VA)", code: "3,1-0:9.8.0.255" },
          { label: "Apparent Energy Import (+VA)", code: "3,1-0:10.8.0.255" }
        ]
      },

      {
        "name": "Demand Register",
        "items": [
          { "label": "Cumulative Maximum Active Demand (|+A| + |-A|)", "code": "4,1-0:15.2.0.255" },
          { "label": "Maximum Demand Register - Active (|+A| + |-A|)", "code": "4,1-0:15.6.0.255" },
          { "label": "Capture Time - Maximum Demand Register - Active (|+A| + |-A|)", "code": "4,1-0:15.6.0.255" },
          { "label": "Maximum Demand Register - Active (|+A| + |-A|) - Rate 1", "code": "4,1-0:15.6.1.255" },
          { "label": "Capture Time - Maximum Demand Register - Active (|+A| + |-A|) - Rate 1", "code": "4,1-0:15.6.1.255" },
          { "label": "Maximum Demand Register - Active (|+A| + |-A|) - Rate 2", "code": "4,1-0:15.6.2.255" },
          { "label": "Capture Time - Maximum Demand Register - Active (|+A| + |-A|) - Rate 2", "code": "4,1-0:15.6.2.255" },
          { "label": "Maximum Demand Register - Active Import (+A)", "code": "4,1-0:2.6.0.255" },
          { "label": "Capture Time - Maximum Demand Register - Active Import (+A)", "code": "4,1-0:1.6.0.255" },
          { "label": "Maximum Demand Register - Active Export (-A)", "code": "4,1-0:2.6.0.255" },
          { "label": "Capture Time - Maximum Demand Register - Active Export (-A)", "code": "4,1-0:2.6.0.255" },
          { "label": "Current Average Value - Demand Register 1 - Active Energy Import (+A)", "code": "5,1-0:1.4.0.255" },
          { "label": "Last Average Value - Demand Register 1 - Active Energy Import (+A)", "code": "5,1-0:1.4.0.255" },
          { "label": "Current Average Value - Demand Register 2 - Active Energy Import (+A)", "code": "5,1-0:2.4.0.255" },
          { "label": "Last Average Value - Demand Register 2 - Active Energy Import (+A)", "code": "5,1-0:2.4.0.255" },
          { "label": "Current Average Value - Active Increase Demand (|+A| + |-A|)", "code": "5,1-0:15.4.0.255" }
        ]
      },


      {
        "name": "Instantaneous",
        "items": [
          { "label": "Instantaneous Voltage L1", "code": "3,1-0:32.7.0.255" },
          { "label": "Instantaneous Current L1", "code": "3,1-0:31.7.0.255" },
          { "label": "Instantaneous Current L0", "code": "3,1-0:91.7.0.255" },
          { "label": "Instantaneous Active Power (|+A| |-A|)", "code": "3,1-0:15.7.0.255" },
          { "label": "Instantaneous Power Factor (|+A| |-A|)", "code": "3,1-0:13.7.0.255" },
          { "label": "Instantaneous Supply Frequency", "code": "3,1-0:14.7.0.255" }
        ]
      },

      {
        "name": "Others",
        "items": [
          { "label": "Number of Meter Readings", "code": "1,0-0:96.2.128.255" },
          { "label": "Cumulative Power On Duration", "code": "3,0-0:96.91.14.255" },
          { "label": "Cumulative Billing Times", "code": "1,0-0:0.1.1.255" },
          { "label": "Cumulative Tamper Per Hour", "code": "1,0-0:19.135.0.255" },
          { "label": "Cumulative Tamper Count", "code": "1,0-0:96.91.0.255" },
          { "label": "Last Open Face Cover Date and Time", "code": "1,0-0:96.20.1.255" },
          { "label": "Last Open Terminal Cover Date and Time", "code": "1,0-0:96.20.6.255" },
          { "label": "Last Magnetic Field Interference Date and Time", "code": "1,0-0:96.20.6.255" },
          { "label": "Currently Active Energy Tariff", "code": "1,0-0:96.14.0.255" }
        ]
      },

      {
        "name": "Display",
        "items": [
          { "label": "LCD Display ALL", "code": "1,0-0:96.13.128.255" }
        ]
      }
      
    
]




const ManualDisplayCaptureObjects = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [addedItems, setAddedItems] = useState([]);

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
 
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);
  


  const handleCheckboxChange = (categoryName, label, code, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, { category: categoryName, label, code }]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => !(item.label === label && item.code === code)));
    }
  };

  

  const fetchManualDisplayData = async () => {

  

    
       try {
      const response = await axios.get(`${BASE_URL}/api/manual-display/${deviceId}/`);
      setAddedItems(response.data);
      const preSelectedItems = response.data.map((item) => ({
        category: item.category,
        label: item.name,
        code: item.code,
        value: item.value || 100,
      }));
      setSelectedItems(preSelectedItems);
    } catch (error) {
      console.error('Error fetching manual display data:', error);
    }
  };

  useEffect(() => {
    fetchManualDisplayData();
  }, []);

  const handleAdd = async () => {
    const itemsWithDeviceId = selectedItems.map((item) => ({
      category: item.category,
      name: item.label,
      code: item.code,
      device_id: deviceId,
      value: item.value || 100,
    }));
    try {
      const response = await axios.post(`${BASE_URL}/api/manual-display/`, itemsWithDeviceId);
      console.log('Data sent successfully:', response.data);
      fetchManualDisplayData();
      setSelectedItems([]);
    } catch (error) {
      console.error('Error sending data:', error);
    }
  };

  const handleSave = () => {
    console.log('Selected Items:', addedItems);
  };

  return (
    <div className="DisplayContainer">
      <div className="sub_container_display">
        {manualCategories.map((category, index) => (
          <div key={index}>
            <label>
              <input type="checkbox" /> {category.name}
            </label>
            <div
              style={{ textAlign: 'start', border: '1px solid black', padding: '10px', marginBottom: '10px' }}>
              {category.items.map((item, idx) => (
                <label key={idx} style={{ display: 'block' }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.some(
                      (selected) => selected.label === item.label && selected.code === item.code
                    )}
                    onChange={(e) => handleCheckboxChange(category.name, item.label, item.code, e.target.checked)}
                  />{' '}
                  {item.label} ({item.code})
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sub_container_display_2">
        <div className="display_buttons_container">
          <button style={{ margin: '5px' }} onClick={handleAdd}>
            Add
          </button>
          <button onClick={handleSave}>Save</button>
        </div>

        <div className="display_table">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Code</th>
              </tr>
            </thead>
            <tbody>
              {addedItems.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};




const ScrollableCaptureObjects = () => {
  const [selectedItems, setSelectedItems] = useState([]);
 
  

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
 
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);
  
  
  const [addedItems, setAddedItems] = useState([]);

  const handleCheckboxChange = (categoryName, label, code, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, { category: categoryName, label, code }]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => !(item.label === label && item.code === code)));
    }
  };


  const fetchScrollData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/scroll-display/${deviceId}/`);
      setAddedItems(response.data);
       // Pre-select items that are already in the backend
  const preSelectedItems = response.data.map((item) => ({
    category: item.category,
    label: item.name,
    code: item.code,
    value: item.value || 100
  }));

  setSelectedItems(preSelectedItems);
    } catch (error) {
      console.error("Error fetching scroll display data:", error);
    }
  };

  


  useEffect(() => {
    fetchScrollData()
  }, []);


  const handleAdd = async () => { 
    const itemsWithDeviceId = selectedItems.map(item => ({
      category:item.category, 
      name:item.label,
      code:item.code,
      device_id: 1, // Replace with the actual device ID
      value: item.value || 100 // Include value, default to empty string if not provided
    })); 
    try {
      const response = await axios.post(`${BASE_URL}/api/scroll-display/`, itemsWithDeviceId);
      console.log("Data sent successfully:", response.data);
      fetchScrollData()
      
      setSelectedItems([]); // Clear selected items after adding
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  const handleSave = () => {
    console.log("Selected Items:", addedItems);
    // You can further process or save `addedItems` as needed
  };

  return (
    <>
    <div className="DisplayContainer"> 
    <div className="sub_container_display">
      {categories.map((category, index) => (
        <div key={index}>
          <label>
            <input type="checkbox" /> {category.name}
          </label>
          <div style={{ textAlign: "start", border: "1px solid black", padding: "10px", marginBottom: "10px" }}>
            {category.items.map((item, idx) => (
              <label key={idx} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={selectedItems.some(selected => selected.label === item.label && selected.code === item.code)}
                  onChange={(e) => handleCheckboxChange(category.name, item.label, item.code, e.target.checked)}
                />{" "}
                {item.label} ({item.code})
              </label>
            ))}
          </div>
        </div>
      ))}
     
     </div>

 <div className="sub_container_display_2"> 
     <div className="display_buttons_container"> 

      <button style={{margin:'5px'}} onClick={handleAdd}>
        Add 
      </button>
      <button onClick={handleSave}>
        Save
      </button>
      </div>


      <div className="display_table">
 
  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
    <thead>
      <tr>
        
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>name</th>
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Code</th>
      </tr>
    </thead>
    <tbody>
      {addedItems.map((item, index) => (
        <tr key={index}>
         
          <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.name}</td>
          <td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.code}</td>
        </tr>
      ))}
    </tbody>
  </table>
  </div>
  </div>
  </div>


  </>  
    
  );
};



const LcdDisplayFormat = () => {
  const [lcdData, setLcdData] = useState([
    { name: "Energy Leading Zero", value: "Disable", type: "select", options: ["Enable", "Disable"] },
    { name: "Energy Decimal", value: 2, type: "number" },
    { name: "Power Decimal", value: 3, type: "number" },
    { name: "Current Decimal", value: 3, type: "number" },
    { name: "Voltage Decimal", value: 1, type: "number" },
    { name: "Date Format", value: "DD-MM-YY", type: "select", options: ["DD-MM-YY", "MM-DD-YY", "YY-MM-DD"] },
    { name: "Time Format", value: "HH-MM-SS", type: "select", options: ["HH:MM:SS", "HH-MM-SS", "MM-HH-SS"] }
  ]);
  
  
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
 
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);
  



  // Function to fetch LCD data
  const fetchLcdData1 = (deviceId) => {

    axios
    .get(`${BASE_URL}/api/lcd-display-format/${deviceId}/`)
    .then((response) => {
      const data = response.data;
      console.log("fetch_data",data)
      if (data && Array.isArray(data)) {
        const updatedLcdData = lcdData.map((item) => {
          const match = data.find((d) => d.device_id === item.device_id);
          if (match) {
            return { ...item, value: match[item.name.toLowerCase().replace(/ /g, "_")] || item.value };
          }
          return item;
        });
        console.log(updatedLcdData)
        setLcdData(updatedLcdData);
      }
    })
    .catch((error) => {
      console.error("Error fetching LCD data:", error);
    })
   
    }


    const fetchLcdData = (deviceId) => {
      axios
        .get(`${BASE_URL}/api/lcd-display-format/${deviceId}/`)
        .then((response) => {
          const data = response.data;
          console.log("fetch_data", data);
    
          // Ensure data is in the correct format and array
          if (data && Array.isArray(data) && data.length > 0) {
            const deviceData = data[0]; // Get the first entry since the array has one object
    
            const updatedLcdData = lcdData.map((item) => {
              // Match the LCD data with backend data by the name, converted to lowercase and underscores
              const key = item.name.toLowerCase().replace(/ /g, "_");
              
              // If there's a match in the fetched data, update it
              if (deviceData[key] !== undefined) {
                return { ...item, value: deviceData[key] };
              }
    
              return item; // If no match, keep the current item
            });
    
            console.log("Updated LCD data", updatedLcdData);
            setLcdData(updatedLcdData); // Update state with fetched data
          } else {
            console.error("No valid data found in the response");
          }
        })
        .catch((error) => {
          console.error("Error fetching LCD data:", error);
        });
    };
    
  // Trigger the fetchLcdData function when component mounts or deviceId changes


  useEffect(() => {
    if (deviceId) {
      fetchLcdData(deviceId);
    }
  }, [deviceId]);





  const handleChange = (index, newValue) => {
    setLcdData((prevData) =>
      prevData.map((item, i) => (i === index ? { ...item, value: newValue } : item))
    );
  };

  const handleSave = () => {
    const updatedData = [{
      device_id: deviceId, // Include the device ID
      energy_leading_zero: lcdData.find(item => item.name === 'Energy Leading Zero')?.value,
      energy_decimal: parseInt(lcdData.find(item => item.name === 'Energy Decimal')?.value, 10), // Convert to integer
      power_decimal: parseInt(lcdData.find(item => item.name === 'Power Decimal')?.value, 10), // Convert to integer
      current_decimal: parseInt(lcdData.find(item => item.name === 'Current Decimal')?.value, 10), // Convert to integer
      voltage_decimal: parseInt(lcdData.find(item => item.name === 'Voltage Decimal')?.value, 10), // Convert to integer
      date_format: lcdData.find(item => item.name === 'Date Format')?.value,
      time_format: lcdData.find(item => item.name === 'Time Format')?.value,
    }];
  
    // POST request to send updated data
    axios
      .post(`${BASE_URL}/api/lcd-display-format/`, updatedData)
      .then((response) => {
        console.log("Data saved successfully:", response.data);
        fetchLcdData()
        alert("LCD Display Format saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving data:", error);
        alert("Failed to save LCD Display Format.");
      });
  };
  
  
  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <table
        style={{
          width: "50%",
          margin: "0 auto",
          borderCollapse: "collapse",
          border: "1px solid black",
        }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid black", padding: "10px" }}>Name</th>
            <th style={{ border: "1px solid black", padding: "10px" }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {lcdData.map((item, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid black", padding: "10px" }}>{item.name}</td>
              <td style={{ border: "1px solid black", padding: "10px" }}>
                {item.type === "select" ? (
                  <select
                    value={item.value}
                    onChange={(e) => handleChange(index, e.target.value)}
                    style={{ padding: "5px" }}
                  >
                    {item.options.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => handleChange(index, e.target.value)}
                    style={{ padding: "5px", width: "50px" }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleSave} style={{ marginTop: "20px" }}>
        Save
      </button>
    </div>
  );
};



  





const DisplayParameters = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [parameters, setParameters] = useState(

    [
      { no: 1, name: "Auto display scroll interval", code: "(3,1-0:35.5.0.255)", unit: "s" },
      { no: 2, name: "Manual display interval", code: "(3,1-0:35.5.0.256)", unit: "s" },
    


  ]);
  

  
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
 
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);
  



  // Handle checkbox selection
  const handleCheckboxChange = (no, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, no]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => item !== no));
    }
  };

 

  // Fetch display parameters based on device ID
  const fetchDisplayParameters = async () => {
    if (!deviceId) return;

    try {
      const response = await axios.get(`${BASE_URL}/api/display-parameters/${deviceId}/`);
      setParameters(response.data);
    } catch (error) {
      console.error("Error fetching display parameters:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Display Parameters</h2>

      <div>
       
        <button onClick={fetchDisplayParameters}>Get Values</button>
      </div>

      <table border="1" style={{ margin: "auto", width: "80%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Checked</th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
            <th>Value</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  onChange={(e) => handleCheckboxChange(index + 1, e.target.checked)}
                />
              </td>
              <td>{index + 1}</td>
              <td>{param.name}</td>
              <td>{param.code}</td>
              <td>{param.value}</td>
              <td>{param.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



  



const Display = () => {
  const [view, setView] = useState("manual"); // Default to Manual Display

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <button onClick={() => setView("manual")} style={{ margin: "10px", padding: "10px" }}>
        Manual Display
      </button>
      <button onClick={() => setView("scrollable")} style={{ margin: "10px", padding: "10px" }}>
        Scrollable Display
      </button>
      <button onClick={() => setView("lcd")} style={{ margin: "10px", padding: "10px" }}>
        LCD Display Format
      </button>
      <button onClick={() => setView("parameters")} style={{ margin: "10px", padding: "10px" }}>
        Display Parameters
      </button>

      <div style={{ marginTop: "20px" }}>
        {view === "manual" && <ManualDisplayCaptureObjects />}
        {view === "scrollable" && <ScrollableCaptureObjects />}
        {view === "lcd" && <LcdDisplayFormat />}
        {view === "parameters" && <DisplayParameters />}
      </div>
    </div>
  );
};

export default Display;






