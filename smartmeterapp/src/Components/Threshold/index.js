import React, { useState, useRef } from 'react';
import './index.css';
import BASE_URL from '../../apiConfig';

const ThresholdTable = () => {
  const [streamValues, setStreamValues] = useState({});
  const [checkedItems, setCheckedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const controllerRef = useRef(null);
  const serialNumber = localStorage.getItem('selectedSerialNumber');

  const thresholds = [
    { no: 1, name: "Threshold for voltage sag", code: "(3,1-0:12.31.0.255)", unit: "V" },
    { no: 2, name: "Time threshold for voltage sag", code: "(3,1-0:12.43.0.255)", unit: "s" },
    { no: 3, name: "Threshold for voltage swell", code: "(3,1-0:12.35.0.255)", unit: "V" },
    { no: 4, name: "Time Threshold for voltage swell", code: "(3,1-0:12.44.0.255)", unit: "s" },
    { no: 5, name: "Threshold for missing voltage (voltage cut)", code: "(3,1-0:12.39.0.255)", unit: "V" },
    { no: 6, name: "Time Threshold for missing voltage (voltage cut)", code: "(3,1-0:12.45.0.255)", unit: "s" },
    { no: 7, name: "Threshold for current bypass", code: "(3,1-0:11.31.0.255)", unit: "%" },
    { no: 8, name: "Time Threshold for current bypass", code: "(3,1-0:11.43.0.255)", unit: "s" },
    { no: 9, name: "Threshold low power factor", code: "(3,1-0:13.31.0.255)", unit: "" },
    { no: 10, name: "Time Threshold low power factor", code: "(3,1-0:13.43.0.255)", unit: "s" },
    { no: 11, name: "Time threshold for magnetic disturbance", code: "(3,0-0:96.8.10.255)", unit: "s" },
    { no: 12, name: "Time threshold for current reverse", code: "(3,0-0:96.8.13.255)", unit: "s" },
    { no: 13, name: "Clock adjustment event deviation", code: "(3,1-0:0.9.1.255)", unit: "s" },
    { no: 14, name: "Time threshold for long power failure", code: "(3,0-0:96.7.20.255)", unit: "s" },
  ];

  const handleSelectAllChange = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setCheckedItems(thresholds.map((_, index) => index));
    } else {
      setCheckedItems([]);
    }
  };

  const handleCheckboxChange = (index) => {
    const selected = new Set(checkedItems);
    if (selected.has(index)) {
      selected.delete(index);
    } else {
      selected.add(index);
    }
    const newCheckedItems = Array.from(selected);
    setCheckedItems(newCheckedItems);
    setSelectAll(newCheckedItems.length === thresholds.length);
  };

  const handleReadClick = async () => {
    if (controllerRef.current) controllerRef.current.abort();

    const selectedParams = checkedItems.map((index) => {
      const item = thresholds[index];
      // Extract OBIS code from format "(3,1-0:12.31.0.255)" -> "1.0.12.31.0.255"
      // Remove parentheses, remove class ID, replace colons and dashes with dots
      const obisMatch = item.code.match(/\((\d+),(.+)\)/);
      const obisCode = obisMatch ? obisMatch[2].replace(/[:-]/g, '.') : item.code;
      
      return {
        obis_code: obisCode,
        attribute_index: "2"
      };
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

    try {
      controllerRef.current = new AbortController();
      const res = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal
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
            console.log("msg", msg);
            
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
    <div className="threshold-table-container">
      <button onClick={handleReadClick}>Read Values</button>
      <table className="threshold-table">
        <thead>
          <tr>
            <th className="threshold-table-header">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAllChange(e.target.checked)}
              />
            </th>
            <th className="threshold-table-header">No</th>
            <th className="threshold-table-header">Name</th>
            <th className="threshold-table-header">Code</th>
            <th className="threshold-table-header">Value</th>
            <th className="threshold-table-header">Unit</th>
          </tr>
        </thead>
        <tbody>
          {thresholds.map((threshold, index) => {
            // Extract OBIS code from format "(3,1-0:12.31.0.255)" -> "1.0.12.31.0.255"
            // Remove parentheses, remove class ID, replace colons and dashes with dots
            const obisMatch = threshold.code.match(/\((\d+),(.+)\)/);
            const obisCode = obisMatch ? obisMatch[2].replace(/[:-]/g, '.') : threshold.code;
            
            const displayValue = streamValues[obisCode] !== undefined && streamValues[obisCode] !== null
              ? `${streamValues[obisCode]}`
              : '';

            return (
              <tr key={threshold.no} className="threshold-table-row">
                <td className="threshold-table-cell">
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(index)}
                    onChange={() => handleCheckboxChange(index)}
                  />
                </td>
                <td className="threshold-table-cell">{threshold.no}</td>
                <td className="threshold-table-cell">{threshold.name}</td>
                <td className="threshold-table-cell">{threshold.code}</td>
                <td className="threshold-table-cell">{displayValue}</td>
                <td className="threshold-table-cell">{threshold.unit}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ThresholdTable;

