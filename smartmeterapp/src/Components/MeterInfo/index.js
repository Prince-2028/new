import React, { useState, useEffect, useRef } from 'react';

import './Meterinfo.css';
import axios from "axios";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import { PERMISSIONS } from '../../permissions';
import WriteModal from '../WriteModal';





 // Replace with your actual base URL




const MeterInfo = () => {
  const [selectedSubDashboard, setSelectedSubDashboard] = useState("Meter Identifier");
  const role = localStorage.getItem('userRole');
  const perms = PERMISSIONS[role] || {};

  

  const [apiData, setApiData] = useState(null);
  const [checkedItems, setCheckedItems] = useState({
    "Meter Identifier": [],
    "Meter Version": [],
    "Meter Logical Parameters": []
  });

  const [selectAllChecked, setSelectAllChecked] = useState({
    "Meter Identifier": false,
    "Meter Version": false,
    "Meter Logical Parameters": false
  });

  // Write modal state
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [writeModalData, setWriteModalData] = useState({ name: '', code: '', row: null });

   // stores streamed values by obis_code  #11111111111111
  const [streamValues, setStreamValues] = useState({});
  console.log("streamValues",streamValues)
  const controllerRef = useRef(null);

  //const deviceId = localStorage.getItem('selectedDeviceId');
  const serialNumber = localStorage.getItem('selectedSerialNumber');

  const handleSubDashboardChange = (subDashboardName) => {
    setSelectedSubDashboard(subDashboardName);
  };

  

  const handleGetClick = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/getmeterinfo/`, { 'serial_number': serialNumber });
      
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching meter info:", error);
    }
  };

  const handleSelectAllChange = (subItem, checked) => {
    const itemCount = getRowCount(subItem);
    const allIndexes = checked ? Array.from({ length: itemCount }, (_, i) => i) : [];
    setCheckedItems(prev => ({ ...prev, [subItem]: allIndexes }));
    setSelectAllChecked(prev => ({ ...prev, [subItem]: checked }));
  };

  const handleRowCheckboxChange = (subItem, index) => {
    const selected = new Set(checkedItems[subItem]);
    if (selected.has(index)) {
      selected.delete(index);
    } else {
      selected.add(index);
    }
    setCheckedItems(prev => ({
      ...prev,
      [subItem]: Array.from(selected)
    }));
    setSelectAllChecked(prev => ({
      ...prev,
      [subItem]: selected.size === getRowCount(subItem)
    }));
  };

  const getRowCount = (subItem) => {
    if (subItem === "Meter Identifier") return 5;
    if (subItem === "Meter Version") return 4;
    if (subItem === "Meter Logical Parameters") return 6;
    return 0;
  };

  


  

  const getValueByObis = (obisCode) => {
    
    if (!apiData) return "";
    
    const match = apiData.data.find(item => item.obis_code === obisCode);
    return match?.value != null ? match.value : "";
    

  };
  
  
  


  const getTableRowData= (subDashboardName, index) => {
    const rows = {
      "Meter Identifier": [                               
        { name: "COSEM logical device name", code: "(1,0.0.42.0.0.255)", value: getValueByObis("0.0.42.0.0.255") },
        { name: "Meter serial number", code: "(1,0.0.96.1.0.255)", value: getValueByObis("0.0.96.1.0.255") },
        { name: "Customer meter equipment identifier", code: "(1,0.0.96.1.1.255)", value: getValueByObis("0.0.96.1.1.255") },
        { name: "Receive frame counter - unicast key", code: "(1,0.0.43.1.2.255)", value: getValueByObis("0.0.42.0.0.255") },
        { name: "Receive frame counter - broadcast counter", code: "(1,0.0.43.1.3.255)", value: getValueByObis("0.0.42.0.0.255") }
      ],
      "Meter Version": [
        { name: "MID firmware identifier (version)", code: "(1,1-0-0.2.0.255)", value: getValueByObis("1.0.0.2.0.255") },
        { name: "MID firmware signature", code: "(1,1-0:0.2.8.255)", value: getValueByObis("1.0.0.2.8.255") },
        { name: "APP firmware identifier (version)", code: "(1,1-1:0.2.0.255)", value: getValueByObis("1.1.0.2.0.255") },
        { name: "APP firmware signature", code: "(1,1-1:0.2.8.255)", value: getValueByObis("1.1.0.2.8.255") }
      ],
     
      "Meter Logical Parameters": [
        
  { name: "Nominal voltage (V)", code: "(3,1-0-0.6.0.255)", value: getValueByObis("1.0.0.6.0.255") },
        { name: "Basic/Nominal Current (A)", code: "(3,1-0-0.6.1.255)", value: getValueByObis("1.0.0.6.1.255") },
        { name: "Nominal frequency (Hz)", code: "(3,1-0-0.6.2.255)", value: getValueByObis("1.0.0.6.2.255") },
        { name: "Maximum Current (A)", code: "(3,1-0-0.6.3.255)", value: getValueByObis("1.0.0.6.3.255") },
        { name: "Active energy constant (kWh)", code: "(3,1-0-0.3.0.255)", value: getValueByObis("1.0.0.3.0.255") },
        { name: "Reactive energy constant (kVArh)", code: "(3,1-0-0.3.1.255)", value: getValueByObis("1.0.0.3.1.255")},
    
  { name: "Voltage RMS",   code: "(3,1.0.32.7.0.255)", value: getValueByObis("1.0.32.7.0.255") },
      { name: "Frequency",     code: "(3,1.0.14.7.0.255)", value: getValueByObis("1.0.14.7.0.255") },
      { name: "Current RMS",   code: "(3,1.0.31.7.0.255)", value: getValueByObis("1.0.31.7.0.255") },
      { name: "Power Factor",  code: "(3,1.0.13.7.0.255)", value: getValueByObis("1.0.13.7.0.255") },
      { name: "Active Power",  code: "(3,1.0.15.7.0.255)", value: getValueByObis("1.0.15.7.0.255") }
]

    };
  
    return rows[subDashboardName][index];
  };
  


  const renderTableRows1 = (subDashboardName, rows) => (
    rows.map((row, index) => (
      <tr key={index}>
        <td>
          <input
            type="checkbox"
            checked={checkedItems[subDashboardName].includes(index)}
            onChange={() => handleRowCheckboxChange(subDashboardName, index)}
          />
        </td>
        <td>{index + 1}</td>
        <td>{row.name}</td>
        <td>{row.code}</td>
        <td>{row.value}</td>
      </tr>
    ))
  );

  const handleWriteClick = () => {
    let selectedRow = null;
   

    let selectedCount = 0;

    // Iterate over each subItem in checkedItems
    Object.keys(checkedItems).forEach((subItem) => {
        checkedItems[subItem].forEach((rowIndex) => {
            const row = getTableRowData(subItem, rowIndex);
            if (row) {
                selectedRow = row;
                selectedCount++;
            }
        });
    });

    if (!selectedRow) {
      alert("Please select one item to write.");
      return;
    }

    // Check if more than one item is selected
    if (selectedCount !== 1) {
      alert("Please select exactly one item to write.");
      return;
  }

  
    // Open write modal instead of prompt
    setWriteModalData({ name: selectedRow.name, code: selectedRow.code, row: selectedRow });
    setIsWriteModalOpen(true);
  };

  const handleWriteSubmit = async (enteredValue) => {
    const selectedRow = writeModalData.row;
    if (!selectedRow) return;

    // Close modal immediately
    setIsWriteModalOpen(false);

    const cleanCode = selectedRow.code
      .replace(/[()]/g, "")
      .replace(/-/g, ".")
      .replace(/:/g, ".")
      .replace(/\.\.+/g, ".");
    const codeParts = cleanCode.split(",");
    const obisCode = codeParts[1].trim();

    const payload = {
      serial_number: serialNumber,
      action: "write_obis",
      parameters: {
        obis_code: obisCode,
        attribute_index: "2",
        value: enteredValue
      }
    };

    console.log("Write Payload:", payload);

    // Perform write operation after modal is closed
    axios.post(`${BASE_URL}/api/getmeterinfo/`, payload)
      .then(response => {
        console.log("Response:", response.data);
        alert("Write OBIS success");
      })
      .catch(error => {
        console.error("Error:", error);
        alert("Failed to write OBIS");
      });
  };



  const handleReadClick1 = () => {
    const selectedParams = [];
    Object.keys(checkedItems).forEach((subItem) => {
      checkedItems[subItem].forEach((rowIndex) => {
        const row = getTableRowData(subItem, rowIndex);
        if (row && row.code) {
          const cleanCode = row.code
            .replace(/[()]/g, "")
            .replace(/-/g, ".")
            .replace(/:/g, ".")
            .replace(/\.\.+/g, ".");
          const codeParts = cleanCode.split(",");
          const obisCode = codeParts[1].trim();
          selectedParams.push({
            obis_code: obisCode,
            attribute_index: "2"
          });
        }
      });
    });

    if (selectedParams.length === 0) {
      alert("Please select at least one item to read.");
      return;
    }

    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: selectedParams
    };

    console.log("Read Payload:", payload);

    axios.post(`${BASE_URL}/api/getmeterinfo/`, payload)
      .then(response => {
        console.log("Read OBIS success:", response.data);
        setApiData(response.data)
        alert("Read OBIS success");
      })
      .catch(error => {
        console.error("Error:", error);
        alert("Failed to read OBIS");
      });
  };

  //2222222222
  const handleReadClick = async () => {
   
      if (controllerRef.current) controllerRef.current.abort();

      const params = checkedItems[selectedSubDashboard].map((i) => {
      const { code } = getTableRowData(selectedSubDashboard, i);
      return { obis_code: code, attribute_index: "2" };
    });
     const selectedParams = [];
    Object.keys(checkedItems).forEach((subItem) => {
      checkedItems[subItem].forEach((rowIndex) => {
        const row = getTableRowData(subItem, rowIndex);
        if (row && row.code) {
          const cleanCode = row.code
            .replace(/[()]/g, "")
            .replace(/-/g, ".")
            .replace(/:/g, ".")
            .replace(/\.\.+/g, ".");
          const codeParts = cleanCode.split(",");
          const obisCode = codeParts[1].trim();
          selectedParams.push({
            obis_code: obisCode,
            attribute_index: "2"
          });
        }
      });
    });

    if (selectedParams.length === 0) {
      alert("Please select at least one item to read.");
      return;
    }

    

    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: selectedParams
    };

   
    console.log("payload",payload)

    try {
      controllerRef.current = new AbortController();
      const res = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controllerRef.current.signal
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalItems = selectedParams.length;
      let successCount = 0;
      let errorCount = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop();
        for (let chunk of chunks) {
          if (!chunk.startsWith('data:')) continue;
          try {
            const msg = JSON.parse(chunk.replace(/^data:\s*/, ''));
            console.log("msg",msg)
            
            if (msg.status === "success") {
              successCount++;
              setStreamValues(prev => ({ ...prev, [msg.obis_code]: msg.value }));
            } else if (msg.status === "error") {
              errorCount++;
              console.error(`Error reading ${msg.obis_code}: ${msg.message}`);
            }
          } catch { }
        }
      }

      // Show final result
      if (errorCount === 0) {
        alert(`Success! Retrieved ${successCount} of ${totalItems} values.`);
      } else if (successCount > 0) {
        alert(`Partial success: ${successCount} succeeded, ${errorCount} failed. Check console for details.`);
      } else {
        alert(`Failed to retrieve data. ${errorCount} errors occurred.`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Error fetching data:', error);
        alert(`Error: ${error.message || 'Failed to retrieve data. Please try again.'}`);
      }
    }
  };


  const renderTable = (subDashboardName) => {
    const rows = [];
    for (let i = 0; i < getRowCount(subDashboardName); i++) {
      rows.push(getTableRowData(subDashboardName, i));
    }

    return (
      <table className="meter-info-table" >
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectAllChecked[subDashboardName]}
                onChange={(e) => handleSelectAllChange(subDashboardName, e.target.checked)}
              />
            </th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {renderTableRows(subDashboardName, rows)}
        </tbody>
      </table>
    );
  };



  ////////////3333333333333 

  const renderTableRows333 = (sub) =>
  Array.from({ length: getRowCount(sub) }).map((_, idx) => {
    const { name, code } = getTableRowData(sub, idx);
    
    // Normalize code to match SSE data
    const normalizedCode = code
      .replace(/[()]/g, "")
      .split(",")[1]
      ?.trim() || code;

    // Display object or string
    const displayValue = typeof streamValues[normalizedCode] === 'object'
      ? JSON.stringify(streamValues[normalizedCode])
      : streamValues[normalizedCode] || '';

    return (
      <tr key={idx}>
        <td>
          <input
            type="checkbox"
            checked={checkedItems[sub].includes(idx)}
            onChange={() => handleRowCheckboxChange(sub, idx)}
          />
        </td>
        <td>{idx + 1}</td>
        <td>{name}</td>
        <td>{code}</td>
        <td>{displayValue}</td>
      </tr>
    );
  });


const renderTableRows = (sub) =>
  Array.from({ length: getRowCount(sub) }).map((_, idx) => {
    const { name, code } = getTableRowData(sub, idx);

    // Normalize code to match SSE keys
    const normalizedCode = code
      .replace(/[()]/g, "")
      .replace(/-/g, ".")
      .replace(/:/g, ".")
      .replace(/\.\.+/g, ".")
      .split(",")[1]
      ?.trim() || code;

    // Display object or string
    const displayValue = typeof streamValues[normalizedCode] === "object"
      ? JSON.stringify(streamValues[normalizedCode])
      : streamValues[normalizedCode] || "";

    return (
      <tr key={idx}>
        <td>
          <input
            type="checkbox"
            checked={checkedItems[sub].includes(idx)}
            onChange={() => handleRowCheckboxChange(sub, idx)}
          />
        </td>
        <td>{idx + 1}</td>
        <td>{name}</td>
        <td>{code}</td>
        <td>{displayValue}</td>
      </tr>
    );
  });

    
  return (
    <div className="meter-info-container">

   
      <ul  className="meter-info-list">
        <li
          className={`meter-info-item ${selectedSubDashboard === 'Meter Identifier' ? 'selected' : ''}`}
          onClick={() => handleSubDashboardChange('Meter Identifier')}
        >
           <input
          type="checkbox"
          checked={selectAllChecked["Meter Identifier"]}
          onChange={(e) => handleSelectAllChange("Meter Identifier", e.target.checked)}
        />
          Meter Identifier
        </li>
        <li
          className={`meter-info-item ${selectedSubDashboard === 'Meter Version' ? 'selected' : ''}`}
          onClick={() => handleSubDashboardChange('Meter Version')}
        >

<input
          type="checkbox"
          checked={selectAllChecked["Meter Version"]}
          onChange={(e) => handleSelectAllChange("Meter Version", e.target.checked)}
        />

          Meter Version
        </li>
        <li
          className={`meter-info-item ${selectedSubDashboard === 'Meter Logical Parameters' ? 'selected' : ''}`}
          onClick={() => handleSubDashboardChange('Meter Logical Parameters')}
        >
          
<input
          type="checkbox"
          checked={selectAllChecked["Meter Logical Parameters"]}
          onChange={(e) => handleSelectAllChange("Meter Logical Parameters", e.target.checked)}
        />
          Meter Logical Parameters
        </li>
      </ul>
      {/* You can conditionally render the content of the selected dashboard */}
    

     
      

      <div>
     
       {perms.readMeter && (
        <button onClick={handleReadClick}>Read OBIS</button>
      )}
      {perms.writeMeter && (
        <button onClick={handleWriteClick}>Write OBIS</button>
      )}
      
         <button> Import</button>
         <button> Export </button>
      
       
      </div>

      {renderTable(selectedSubDashboard)}
      
      <WriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        itemName={writeModalData.name}
        itemCode={writeModalData.code}
        onSubmit={handleWriteSubmit}
      />
    </div>
    
  );
};


const MeterInfo1 = () => {
  const [selectedSubDashboard, setSelectedSubDashboard] = useState("Meter Identifier");
  const role = localStorage.getItem('userRole');
  const perms = PERMISSIONS[role] || {};

  const [checkedItems, setCheckedItems] = useState({
    "Meter Identifier": [],
    "Meter Version": [],
    "Meter Logical Parameters": []
  });
  const [selectAllChecked, setSelectAllChecked] = useState({
    "Meter Identifier": false,
    "Meter Version": false,
    "Meter Logical Parameters": false
  });

  // stores streamed values by obis_code
  const [streamValues, setStreamValues] = useState({});
  const controllerRef = useRef(null);

  const serialNumber = localStorage.getItem('selectedSerialNumber');

  const getRowCount = (sub) => {
    if (sub === "Meter Identifier") return 5;
    if (sub === "Meter Version") return 4;
    if (sub === "Meter Logical Parameters") return 11;
    return 0;
  };

  const getTableRowData = (sub, idx) => {
    const rows = {
      "Meter Identifier": [
        { name: "COSEM logical device name", code: "0.0.42.0.0.255" },
        { name: "Meter serial number", code: "0.0.96.1.0.255" },
        { name: "Customer meter equipment identifier", code: "0.0.96.1.1.255" },
        { name: "Receive frame counter - unicast key", code: "0.0.42.0.1.255" },
        { name: "Receive frame counter - broadcast counter", code: "0.0.42.0.2.255" }
      ],
      "Meter Version": [
        { name: "MID firmware identifier (version)", code: "1.0.0.2.0.255" },
        { name: "MID firmware signature", code: "1.0.0.2.8.255" },
        { name: "APP firmware identifier (version)", code: "1.1.0.2.0.255" },
        { name: "APP firmware signature", code: "1.1.0.2.8.255" }
      ],
      "Meter Logical Parameters": [
        { name: "Nominal voltage", code: "1.0.0.6.0.255" },
        { name: "Basic/Nominal Current", code: "1.0.0.6.1.255" },
        { name: "Nominal frequency", code: "1.0.0.6.2.255" },
        { name: "Maximum Current", code: "1.0.0.6.3.255" },
        { name: "Active energy constant", code: "1.0.0.3.1.255" },
        { name: "Reactive energy constant", code: "1.0.0.3.2.255" },
        { name: "Voltage RMS", code: "1.0.32.7.0.255" },
        { name: "Frequency", code: "1.0.14.7.0.255" },
        { name: "Current RMS", code: "1.0.31.7.0.255" },
        { name: "Power Factor", code: "1.0.13.7.0.255" },
        { name: "Active Power", code: "1.0.15.7.0.255" }
      ]
    };
    return rows[sub][idx];
  };

  const handleSelectAllChange = (sub, checked) => {
    const count = getRowCount(sub);
    setCheckedItems(prev => ({
      ...prev,
      [sub]: checked ? Array.from({ length: count }, (_, i) => i) : []
    }));
    setSelectAllChecked(prev => ({ ...prev, [sub]: checked }));
  };

  const handleRowCheckboxChange = (sub, idx) => {
    const setIdx = new Set(checkedItems[sub]);
    if (setIdx.has(idx)) setIdx.delete(idx);
    else setIdx.add(idx);
    setCheckedItems(prev => ({ ...prev, [sub]: Array.from(setIdx) }));
    setSelectAllChecked(prev => ({ ...prev, [sub]: setIdx.size === getRowCount(sub) }));
  };

  const renderTableRows = (sub) =>
    Array.from({ length: getRowCount(sub) }).map((_, idx) => {
      const { name, code } = getTableRowData(sub, idx);
      // display object or string
      const displayValue = typeof streamValues[code] === 'object'
        ? JSON.stringify(streamValues[code])
        : streamValues[code] || '';
      return (
        <tr key={idx}>
          <td>
            <input
              type="checkbox"
              checked={checkedItems[sub].includes(idx)}
              onChange={() => handleRowCheckboxChange(sub, idx)}
            />
          </td>
          <td>{idx + 1}</td>
          <td>{name}</td>
          <td>{code}</td>
          <td>{displayValue}</td>
        </tr>
      );
    });

  const handleReadClick = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const params = checkedItems[selectedSubDashboard].map(i => {
      const { code } = getTableRowData(selectedSubDashboard, i);
      return { obis_code: code, attribute_index: '2' };
    });
    if (!params.length) return alert('Select at least one item to read.');

    const payload = { serial_number: serialNumber, action: 'read_obis', parameters: params };
    
    try {
      controllerRef.current = new AbortController();
      const res = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controllerRef.current.signal
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalItems = params.length;
      let successCount = 0;
      let errorCount = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop();
        for (let chunk of chunks) {
          if (!chunk.startsWith('data:')) continue;
          try {
            const msg = JSON.parse(chunk.replace(/^data:\s*/, ''));
            console.log("msg",msg)
            
            if (msg.status === "success") {
              successCount++;
              setStreamValues(prev => ({ ...prev, [msg.obis_code]: msg.value }));
            } else if (msg.status === "error") {
              errorCount++;
              console.error(`Error reading ${msg.obis_code}: ${msg.message}`);
            }
          } catch { }
        }
      }

      // Show final result
      if (errorCount === 0) {
        alert(`Success! Retrieved ${successCount} of ${totalItems} values.`);
      } else if (successCount > 0) {
        alert(`Partial success: ${successCount} succeeded, ${errorCount} failed. Check console for details.`);
      } else {
        alert(`Failed to retrieve data. ${errorCount} errors occurred.`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Error fetching data:', error);
        alert(`Error: ${error.message || 'Failed to retrieve data. Please try again.'}`);
      }
    }
  };

  return (
    <div className="meter-info-container">
      <ul className="meter-info-list">
        {["Meter Identifier","Meter Version","Meter Logical Parameters"].map(sub => (
          <li key={sub} className={selectedSubDashboard === sub ? 'selected' : ''}
              onClick={() => setSelectedSubDashboard(sub)}>
            <input type="checkbox" checked={selectAllChecked[sub]}
              onChange={e => handleSelectAllChange(sub, e.target.checked)} />
            {sub}
          </li>
        ))}
      </ul>

      <div className="actions">
        {perms.readMeter && <button onClick={handleReadClick}>Read OBIS</button>}
      </div>

      <table className="meter-info-table">
        <thead><tr><th></th><th>No</th><th>Name</th><th>Code</th><th>Value</th></tr></thead>
        <tbody>{renderTableRows(selectedSubDashboard)}</tbody>
      </table>
    </div>
  );
};

export default MeterInfo;






