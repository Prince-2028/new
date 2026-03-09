// App.js (Main Application File)
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import './index.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faFileInvoiceDollar, faChartLine, faCheckSquare, faPowerOff } from '@fortawesome/free-solid-svg-icons';
import { FaBookOpen, FaFileExport } from "react-icons/fa"; // Import icons
import BASE_URL from '../../apiConfig';
import ProgressModal from '../ProgressModal';


const InstantaneousReadings = forwardRef((props, ref) => {
  // Helper function to get unit based on item name
  const getUnit = (name) => {
    if (name.includes('voltage')) return ' V';
    if (name.includes('current')) return ' A';
    if (name.includes('active power')) return ' kW';
    if (name.includes('reactive power')) return ' kvar';
    if (name.includes('apparent power')) return ' kVA';
    if (name.includes('frequency')) return ' Hz';
    if (name.includes('power factor')) return '';
    return '';
  };

  const data = [
    { name: 'Instantaneous voltage L1', code: '(3,1-0:32.7.0.255)', value: '' },
    { name: 'Average voltage L1', code: '(3,1-0:32.24.0.255)', value: '' },
    { name: 'Instantaneous current L1', code: '(3,1-0:31.7.0.255)', value: '' },
    { name: 'Instantaneous current L0', code: '(3,1-0:91.7.0.255)', value: '' },
    { name: 'Average current L1', code: '(3,1-0:31.24.0.255)', value: '' },
    { name: 'Sliding average current L1', code: '(3,1-0:31.40.0.250)', value: '' },
    { name: 'Instantaneous import active power (+A)', code: '(3,1-0:1.7.0.255)', value: '' },
    { name: 'Instantaneous export active power (-A)', code: '(3,1-0:2.7.0.255)', value: '' },
    { name: 'Instantaneous active power (+A/-A)', code: '(3,1-0:15.7.0.255)', value: '' },
    { name: 'Instantaneous import reactive power (+R)', code: '(3,1-0:3.7.0.255)', value: '' },
    { name: 'Instantaneous export reactive power (-R)', code: '(3,1-0:4.7.0.255)', value: '' },
    { name: 'Instantaneous import apparent power (+VA)', code: '(3,1-0:9.7.0.255)', value: '' },
    { name: 'Instantaneous export apparent power (-VA)', code: '(3,1-0:10.7.0.255)', value: '' },
    { name: 'Instantaneous power factor (+A/+VA)', code: '(3,1-0:13.7.0.255)', value: '' },
    { name: 'Instantaneous supply frequency', code: '(3,1-0:14.7.0.255)', value: '' },
    { name: 'External battery voltage', code: '(3,0-1:96.8.0.255)', value: '' },
  ];

  const [checkedItems, setCheckedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [streamValues, setStreamValues] = useState({});
  const [showProgressModal, setShowProgressModal] = useState(false);
  const controllerRef = useRef(null);
  const serialNumber = localStorage.getItem('selectedSerialNumber');

  const handleSelectAllChange = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setCheckedItems(data.map((_, index) => index));
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
    setSelectAll(newCheckedItems.length === data.length);
  };

  const handleReadClick = async () => {
    if (controllerRef.current) controllerRef.current.abort();

    const selectedParams = checkedItems.map((index) => {
      const item = data[index];
      const cleanCode = item.code
        .replace(/[()]/g, "")
        .replace(/-/g, ".")
        .replace(/:/g, ".")
        .replace(/\.\.+/g, ".");
      const codeParts = cleanCode.split(",");
      const obisCode = codeParts[1].trim();
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

    setShowProgressModal(true);

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
    } finally {
      setShowProgressModal(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleRead: handleReadClick
  }));

  return (
    <div className="section-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAllChange(e.target.checked)}
              />
            </th>
            <th>No.</th>
            <th>Name</th>
            <th>Code</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const normalizedCode = item.code
              .replace(/[()]/g, "")
              .replace(/-/g, ".")
              .replace(/:/g, ".")
              .replace(/\.\.+/g, ".")
              .split(",")[1]
              ?.trim() || item.code;

            const displayValue =
              typeof streamValues[normalizedCode] === "object"
                ? JSON.stringify(streamValues[normalizedCode])
                : streamValues[normalizedCode] !== undefined && streamValues[normalizedCode] !== null
                  ? `${streamValues[normalizedCode]}${getUnit(item.name)}`
                  : "";

            return (
              <tr key={index}>
                <td>
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(index)}
                    onChange={() => handleCheckboxChange(index)}
                  />
                </td>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.code}</td>
                <td>{displayValue}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Reading Instantaneous Values"
      />
    </div>
  );
});



function MonthlyBillingDashboard() {
  const [billingProfile, setBillingProfile] = useState('');
  const [selectMode, setSelectMode] = useState('');
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  const tableData = [
    { no: 1, date: '2024-03-19 Tuesday 14:28:00', activeImport: '13.044 kWh', activeExport: '0.000 kWh', reactiveImport: '0.174 kvarh', reactiveExport: '0.000 kvar', residual: '102.79 currency', energyUsed: '0.013 kWh' },
    { no: 2, date: '2024-06-23 Sunday 10:31:20', activeImport: '13.044 kWh', activeExport: '0.000 kWh', reactiveImport: '0.174 kvarh', reactiveExport: '0.000 kvar', residual: '82.70 currency', energyUsed: '0.000 kW' },
    { no: 3, date: '2024-07-23 Tuesday 18:38:01', activeImport: '13.044 kWh', activeExport: '0.000 kWh', reactiveImport: '0.174 kvarh', reactiveExport: '0.000 kvarh', residual: '82.70 currency', energyUsed: '0.000 kWh' },
    { no: 4, date: '2024-08-10 Tuesday 15:35:22', activeImport: '13.044 kWh', activeExport: '0.000 kWh', reactiveImport: '0.174 kvarh', reactiveExport: '0.000 kvar', residual: '82.70 currency', energyUsed: '0.000 kWh' },
    { no: 5, date: '2024-10-01 Tuesday 17:58:32', activeImport: '13.120 kWh', activeExport: '0.000 kWh', reactiveImport: '0.193 kvarh', reactiveExport: '0.007 kvar', residual: '96.00 currency', energyUsed: '0.079 kWh' },
    { no: 6, date: '2024-12-11 Wednesday 18:03:00', activeImport: '13.133 kWh', activeExport: '0.007 kWh', reactiveImport: '0.302 kvarh', reactiveExport: '0.007 kvar', residual: '23.59 currency', energyUsed: '0.217 kWh' },
    { no: 7, date: '2025-02-18 Tuesday 11:36:50', activeImport: '13.133 kWh', activeExport: '0.000 kWh', reactiveImport: '0.302 kvarh', reactiveExport: '0.007 kvarh', residual: '23.59 currency', energyUsed: '0.000 kWh' },
    { no: 8, date: '2025-02-18 Tuesday 10:54:20', activeImport: '12.134 kWh', activeExport: '0.271 kWh', reactiveImport: '0.303 kvarh', reactiveExport: '0.072 kvarh', residual: '10.00 currency', energyUsed: '0.065 kWh' },
    { no: 9, date: '2025-04-01 Saturday 10:00:00', activeImport: '13.135 kWh', activeExport: '0.323 kWh', reactiveImport: '0.303 kvarh', reactiveExport: '0.072 kvar', residual: '10.00 currency', energyUsed: '0.053 kW' },
    { no: 10, date: '2025-04-12 Saturday 15:12:10', activeImport: '13.135 kWh', activeExport: '0.323 kWh', reactiveImport: '0.300 kvarh', reactiveExport: '0.072 kvar', residual: '0.00 currency', energyUsed: '0.000 kWh' },
    { no: 11, date: '2025-05-01 Thursday 00:00:00', activeImport: '13.135 kWh', activeExport: '0.323 kWh', reactiveImport: '0.300 kvarh', reactiveExport: '0.072 kvar', residual: '0.00 currency', energyUsed: '0.000 kWh' },
    { no: 12, date: '2025-06-01 Sunday 12:45:30', activeImport: '13.136 kWh', activeExport: '0.325 kWh', reactiveImport: '0.300 kvarh', reactiveExport: '0.072 kvar', residual: '0.00 currency', energyUsed: '0.000 kWh' },
    { no: 13, date: '2025-06-22 Sunday 14:54:32', activeImport: '13.135 kWh', activeExport: '0.323 kWh', reactiveImport: '0.302 kvarh', reactiveExport: '0.072 kvar', residual: '0.00 currency', energyUsed: '0.000 kWh' },
  ];

  const handleSave = () => {
    alert("Data has been saved!");
  };

  const handleRefresh = () => {
    alert("Refreshing dashboard data...");
  };

  const handleCaptureRefresh = () => {
    alert("Capture Object refresh clicked!");
  };

  const handleSelectChange = (event) => {
    const { id, value } = event.target;
    if (id === 'billing-profile') {
      setBillingProfile(value);
    } else if (id === 'select-mode') {
      setSelectMode(value);
      setFromValue('');
      setToValue('');
    }
  };

  return (
    <div className="dashboard-container">

        <div style={{ width: "100%" }}>
  <label htmlFor="select-mode">Select Mode Entries:</label>
  <select
    id="select-mode"
    value={selectMode}
    onChange={handleSelectChange}
    style={{ width: "100%" }}
  >
    <option value="">-- Select --</option>
    <option value="all">All</option>
    <option value="entry">Entry</option>
    <option value="range">Range</option>
    <option value="latest">Latest</option>
  </select>
</div>

      <div className="controls-section">
       

        <div className="control-group">
          <label htmlFor="entries-in-use">Entries: in use</label>
          <input type="text" id="entries-in-use" value="13" readOnly />
        </div>

        <div className="control-group">
          <label htmlFor="profile-entries">Profile Entries:</label>
          <input type="text" id="profile-entries" value="13" readOnly />
        </div>

       

        {/* Conditional extra fields */}
        {selectMode === "entry" && (
          <>
            <div className="control-group">
              <label htmlFor="from-number">From:</label>
              <input
                type="number"
                id="from-number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div className="control-group">
              <label htmlFor="to-number">To:</label>
              <input
                type="number"
                id="to-number"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}

        {selectMode === "range" && (
          <>
            <div className="control-group">
              <label htmlFor="from-date">From:</label>
              <input
                type="datetime-local"
                id="from-date"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div className="control-group">
              <label htmlFor="to-date">To:</label>
              <input
                type="datetime-local"
                id="to-date"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>

            {/* Capture Object also inside Range */}
            <div className="control-group capture-object">
              <label htmlFor="capture-object-range">Capture Object:</label>
              <input type="text" id="capture-object-range" value="" readOnly />
              <button disabled>Refresh</button>
            </div>
          </>
        )}
      </div>

      <div className="table-section1">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Date</th>
              <th>Active energy import (+A)</th>
              <th>Active energy export (-A)</th>
              <th>Reactive energy import (+R)</th>
              <th>Reactive energy export (-R)</th>
              <th>Residual</th>
              <th>Energy used</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item) => (
              <tr key={item.no}>
                <td>{item.no}</td>
                <td>{item.date}</td>
                <td>{item.activeImport}</td>
                <td>{item.activeExport}</td>
                <td>{item.reactiveImport}</td>
                <td>{item.reactiveExport}</td>
                <td>{item.residual}</td>
                <td>{item.energyUsed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="button-group">
        <button className="save" onClick={handleSave}>Save</button>
        <button className="refresh" onClick={handleRefresh}>Refresh</button>
      </div>
    </div>
  );
}


function DailyBillingDashboard() {
  const [billingProfile, setBillingProfile] = useState("");
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const handleSave = () => {
    alert("Data has been saved!");
  };

  const handleRefresh = () => {
    alert("Refreshing dashboard data...");
  };

  const handleCaptureRefresh = () => {
    alert("Capture Object refresh clicked!");
  };

  const handleSelectChange = (event) => {
    const { id, value } = event.target;
    if (id === "billing-profile") {
      setBillingProfile(value);
    } else if (id === "select-mode") {
      setSelectMode(value);
      setFromValue("");
      setToValue("");
    }
  };

  return (
    <div className="dashboard-container">
        <div style={{ width: "100%" }}>
  <label htmlFor="select-mode">Select Mode Entries:</label>
  <select
    id="select-mode"
    value={selectMode}
    onChange={handleSelectChange}
    style={{ width: "100%" }}
  >
    <option value="">-- Select --</option>
    <option value="all">All</option>
    <option value="entry">Entry</option>
    <option value="range">Range</option>
    <option value="latest">Latest</option>
  </select>
</div>
      <div className="controls-section">
     

        <div className="control-group">
          <label htmlFor="entries-in-use">Entries: in use</label>
          <input type="text" id="entries-in-use" value="13" readOnly />
        </div>

        <div className="control-group">
          <label htmlFor="profile-entries">Profile Entries:</label>
          <input type="text" id="profile-entries" value="13" readOnly />
        </div>

        

        {/* Conditional extra fields */}
        {selectMode === "entry" && (
          <>
            <div className="control-group">
              <label htmlFor="from-number">From:</label>
              <input
                type="number"
                id="from-number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div className="control-group">
              <label htmlFor="to-number">To:</label>
              <input
                type="number"
                id="to-number"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}

        {selectMode === "range" && (
          <>
            <div className="control-group">
              <label htmlFor="from-date">From:</label>
              <input
                type="datetime-local"
                id="from-date"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div className="control-group">
              <label htmlFor="to-date">To:</label>
              <input
                type="datetime-local"
                id="to-date"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>

            {/* Capture Object also inside Range */}
            <div className="control-group capture-object">
              <label htmlFor="capture-object-range">Capture Object:</label>
              <input type="text" id="capture-object-range" value="" readOnly />
              <button disabled>Refresh</button>
            </div>
          </>
        )}
      </div>

      <div className="button-group">
        <button className="save" onClick={handleSave}>
          Save
        </button>
        <button className="refresh" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
    </div>
  );
}







const ActiveEnergyDashboard = forwardRef((props, ref) => {
    // Helper function to format value with unit
    const formatValue = (value) => {
        if (typeof value === "object") return JSON.stringify(value);
        if (value !== undefined && value !== null) return `${value} kWh`;
        return "";
    };

    const [tableData, setTableData] = useState([
        { checked: false, no: 1, name: 'Active energy import (+A)', code: '(3,1-0:1.8.0.255)', value: '' },
        { checked: false, no: 2, name: 'Active energy import (+A) rate 1', code: '(3,1-0:1.8.1.255)', value: '' },
        { checked: false, no: 3, name: 'Active energy import (+A) rate 2', code: '(3,1-0:1.8.2.255)', value: '' },
        { checked: false, no: 4, name: 'Active energy import (+A) rate 3', code: '(3,1-0:1.8.3.255)', value: '' },
        { checked: false, no: 5, name: 'Active energy import (+A) rate 4', code: '(3,1-0:1.8.4.255)', value: '' },
        { checked: false, no: 6, name: 'Active energy export (-A)', code: '(3,1-0:2.8.0.255)', value: '' },
        { checked: false, no: 7, name: 'Active energy export (-A) rate 1', code: '(3,1-0:2.8.1.255)', value: '' },
        { checked: false, no: 8, name: 'Active energy export (-A) rate 2', code: '(3,1-0:2.8.2.255)', value: '' },
        { checked: false, no: 9, name: 'Active energy export (-A) rate 3', code: '(3,1-0:2.8.3.255)', value: '' },
        { checked: false, no: 10, name: 'Active energy export (-A) rate 4', code: '(3,1-0:2.8.4.255)', value: '' },
        { checked: false, no: 11, name: 'Active energy combined total (+A)+(-A)', code: '(3,1-0:15.8.0.255)', value: '' },
        { checked: false, no: 12, name: 'Active energy combined total (+A)+(-A) rate 1', code: '(3,1-0:15.8.1.255)', value: '' },
        { checked: false, no: 13, name: 'Active energy combined total (+A)+(-A) rate 2', code: '(3,1-0:15.8.2.255)', value: '' },
        { checked: false, no: 14, name: 'Active energy combined total (+A)+(-A) rate 3', code: '(3,1-0:15.8.3.255)', value: '' },
        { checked: false, no: 15, name: 'Active energy combined total (+A)+(-A) rate 4', code: '(3,1-0:15.8.4.255)', value: '' },
        { checked: false, no: 16, name: 'Active energy combined total (+A)-(-A)', code: '(3,1-0:16.8.0.255)', value: '' },
        { checked: false, no: 17, name: 'Active energy combined total (+A)-(-A) rate 1', code: '(3,1-0:16.8.1.255)', value: '' },
        { checked: false, no: 18, name: 'Active energy combined total (+A)-(-A) rate 2', code: '(3,1-0:16.8.2.255)', value: '' },
        { checked: false, no: 19, name: 'Active energy combined total (+A)-(-A) rate 3', code: '(3,1-0:16.8.3.255)', value: '' },
        { checked: false, no: 20, name: 'Active energy combined total (+A)-(-A) rate 4', code: '(3,1-0:16.8.4.255)', value: '' },
        { checked: false, no: 21, name: 'Active energy combined total (Prepay mode)', code: '(3,1-0:96.5.7.255)', value: '' },
        { checked: false, no: 22, name: 'Active energy combined total (Postpay mode)', code: '(3,1-0:96.5.1.255)', value: '' },
    ]);

    const [streamValues, setStreamValues] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const controllerRef = useRef(null);
    const serialNumber = localStorage.getItem('selectedSerialNumber');

    const handleSelectAllChange = (checked) => {
        setSelectAll(checked);
        setTableData(prevData =>
            prevData.map(item => ({ ...item, checked: checked }))
        );
    };

    const handleCheckboxChange = (no) => {
        setTableData(prevData => {
            const newData = prevData.map(item =>
                item.no === no ? { ...item, checked: !item.checked } : item
            );
            setSelectAll(newData.every(item => item.checked));
            return newData;
        });
    };

    const handleReadClick = async () => {
        if (controllerRef.current) controllerRef.current.abort();

        const selectedParams = tableData
            .filter(item => item.checked)
            .map((item) => {
                const cleanCode = item.code
                    .replace(/[()]/g, "")
                    .replace(/-/g, ".")
                    .replace(/:/g, ".")
                    .replace(/\.\.+/g, ".");
                const codeParts = cleanCode.split(",");
                const obisCode = codeParts[1].trim();
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

        setShowProgressModal(true);

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
        } finally {
            setShowProgressModal(false);
        }
    };

    useImperativeHandle(ref, () => ({
        handleRead: handleReadClick
    }));

    return (
        <div className="dashboard-container">
            <div className="table-section">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={(e) => handleSelectAllChange(e.target.checked)}
                                />
                            </th>
                            <th>No.</th>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((item) => {
                            const normalizedCode = item.code
                                .replace(/[()]/g, "")
                                .replace(/-/g, ".")
                                .replace(/:/g, ".")
                                .replace(/\.\.+/g, ".")
                                .split(",")[1]
                                ?.trim() || item.code;

                            const displayValue =
                                typeof streamValues[normalizedCode] === "object"
                                    ? JSON.stringify(streamValues[normalizedCode])
                                    : streamValues[normalizedCode] !== undefined && streamValues[normalizedCode] !== null
                                        ? `${streamValues[normalizedCode]} kWh`
                                        : "";

                            return (
                                <tr key={item.no}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => handleCheckboxChange(item.no)}
                                        />
                                    </td>
                                    <td>{item.no}</td>
                                    <td>{item.name}</td>
                                    <td>{item.code}</td>
                                    <td>{displayValue}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <ProgressModal
                isOpen={showProgressModal}
                onClose={() => setShowProgressModal(false)}
                title="Reading Active Energy Values"
            />
        </div>
    );
});






const ReActiveEnergyDashboard = forwardRef((props, ref) => {
    const [tableData, setTableData] = useState([
        { checked: false, no: 1, name: 'Reactive energy import (+R)', code: '(3,1-0:3.8.0.255)', value: '' },
        { checked: false, no: 2, name: 'Reactive energy import (+R) rate 1', code: '(3,1-0:3.8.1.255)', value: '' },
        { checked: false, no: 3, name: 'Reactive energy import (+R) rate 2', code: '(3,1-0:3.8.2.255)', value: '' },
        { checked: false, no: 4, name: 'Reactive energy import (+R) rate 3', code: '(3,1-0:3.8.3.255)', value: '' },
        { checked: false, no: 5, name: 'Reactive energy import (+R) rate 4', code: '(3,1-0:3.8.4.255)', value: '' },
        { checked: false, no: 6, name: 'Reactive energy export (-R)', code: '(3,1-0:4.8.0.255)', value: '' },
        { checked: false, no: 7, name: 'Reactive energy export (-R) rate 1', code: '(3,1-0:4.8.1.255)', value: '' },
        { checked: false, no: 8, name: 'Reactive energy export (-R) rate 2', code: '(3,1-0:4.8.2.255)', value: '' },
        { checked: false, no: 9, name: 'Reactive energy export (-R) rate 3', code: '(3,1-0:4.8.3.255)', value: '' },
        { checked: false, no: 10, name: 'Reactive energy export (-R) rate 4', code: '(3,1-0:4.8.4.255)', value: '' },
        { checked: false, no: 11, name: 'Reactive energy QI (+Ri)', code: '(3,1-0:5.8.0.255)', value: '' },
        { checked: false, no: 12, name: 'Reactive energy QI (+Ri) rate 1', code: '(3,1-0:5.8.1.255)', value: '' },
        { checked: false, no: 13, name: 'Reactive energy QI (+Ri) rate 2', code: '(3,1-0:5.8.2.255)', value: '' },
        { checked: false, no: 14, name: 'Reactive energy QI (+Ri) rate 3', code: '(3,1-0:5.8.3.255)', value: '' },
        { checked: false, no: 15, name: 'Reactive energy QI (+Ri) rate 4', code: '(3,1-0:5.8.4.255)', value: '' },
        { checked: false, no: 16, name: 'Reactive energy QII (+Rc)', code: '(3,1-0:6.8.0.255)', value: '' },
        { checked: false, no: 17, name: 'Reactive energy QII (+Rc) rate 1', code: '(3,1-0:6.8.1.255)', value: '' },
        { checked: false, no: 18, name: 'Reactive energy QII (+Rc) rate 2', code: '(3,1-0:6.8.2.255)', value: '' },
        { checked: false, no: 19, name: 'Reactive energy QII (+Rc) rate 3', code: '(3,1-0:6.8.3.255)', value: '' },
        { checked: false, no: 20, name: 'Reactive energy QII (+Rc) rate 4', code: '(3,1-0:6.8.4.255)', value: '' },
        { checked: false, no: 21, name: 'Reactive energy QIII (-Ri)', code: '(3,1-0:7.8.0.255)', value: '' },
        { checked: false, no: 22, name: 'Reactive energy QIII (-Ri) rate 1', code: '(3,1-0:7.8.1.255)', value: '' },
        { checked: false, no: 23, name: 'Reactive energy QIII (-Ri) rate 2', code: '(3,1-0:7.8.2.255)', value: '' },
        { checked: false, no: 24, name: 'Reactive energy QIII (-Ri) rate 3', code: '(3,1-0:7.8.3.255)', value: '' },
        { checked: false, no: 25, name: 'Reactive energy QIII (-Ri) rate 4', code: '(3,1-0:7.8.4.255)', value: '' },
        { checked: false, no: 26, name: 'Reactive energy QIV (-Rc)', code: '(3,1-0:8.8.0.255)', value: '' },
        { checked: false, no: 27, name: 'Reactive energy QIV (-Rc) rate 1', code: '(3,1-0:8.8.1.255)', value: '' },
        { checked: false, no: 28, name: 'Reactive energy QIV (-Rc) rate 2', code: '(3,1-0:8.8.2.255)', value: '' },
        { checked: false, no: 29, name: 'Reactive energy QIV (-Rc) rate 3', code: '(3,1-0:8.8.3.255)', value: '' },
        { checked: false, no: 30, name: 'Reactive energy QIV (-Rc) rate 4', code: '(3,1-0:8.8.4.255)', value: '' },
    ]);

    const [streamValues, setStreamValues] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const controllerRef = useRef(null);
    const serialNumber = localStorage.getItem('selectedSerialNumber');

    const handleSelectAllChange = (checked) => {
        setSelectAll(checked);
        setTableData(prevData =>
            prevData.map(item => ({ ...item, checked: checked }))
        );
    };

    const handleCheckboxChange = (no) => {
        setTableData(prevData => {
            const newData = prevData.map(item =>
                item.no === no ? { ...item, checked: !item.checked } : item
            );
            setSelectAll(newData.every(item => item.checked));
            return newData;
        });
    };

    const handleReadClick = async () => {
        if (controllerRef.current) controllerRef.current.abort();

        const selectedParams = tableData
            .filter(item => item.checked)
            .map((item) => {
                const cleanCode = item.code
                    .replace(/[()]/g, "")
                    .replace(/-/g, ".")
                    .replace(/:/g, ".")
                    .replace(/\.\.+/g, ".");
                const codeParts = cleanCode.split(",");
                const obisCode = codeParts[1].trim();
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

        setShowProgressModal(true);

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
        } finally {
            setShowProgressModal(false);
        }
    };

    useImperativeHandle(ref, () => ({
        handleRead: handleReadClick
    }));

    return (
        <div className="dashboard-container">
            <div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={(e) => handleSelectAllChange(e.target.checked)}
                                />
                            </th>
                            <th>No.</th>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((item) => {
                            const normalizedCode = item.code
                                .replace(/[()]/g, "")
                                .replace(/-/g, ".")
                                .replace(/:/g, ".")
                                .replace(/\.\.+/g, ".")
                                .split(",")[1]
                                ?.trim() || item.code;

                            const displayValue =
                                typeof streamValues[normalizedCode] === "object"
                                    ? JSON.stringify(streamValues[normalizedCode])
                                    : streamValues[normalizedCode] !== undefined && streamValues[normalizedCode] !== null
                                        ? `${streamValues[normalizedCode]} kvarh`  

                                        : "";

                            return (
                                <tr key={item.no}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => handleCheckboxChange(item.no)}
                                        />
                                    </td>
                                    <td>{item.no}</td>
                                    <td>{item.name}</td>
                                    <td>{item.code}</td>
                                    <td>{displayValue}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <ProgressModal
                isOpen={showProgressModal}
                onClose={() => setShowProgressModal(false)}
                title="Reading Reactive Energy Values"
            />
        </div>
    );
});





const ApparentEnergyDashboard = forwardRef((props, ref) => {
    const [tableData, setTableData] = useState([
        { checked: false, no: 1, name: 'Apparent energy import (+VA)', code: '(3,1-0:9.8.0.255)', value: '' },
        { checked: false, no: 2, name: 'Apparent energy import (+VA) rate 1', code: '(3,1-0:9.8.1.255)', value: '' },
        { checked: false, no: 3, name: 'Apparent energy import (+VA) rate 2', code: '(3,1-0:9.8.2.255)', value: '' },
        { checked: false, no: 4, name: 'Apparent energy import (+VA) rate 3', code: '(3,1-0:9.8.3.255)', value: '' },
        { checked: false, no: 5, name: 'Apparent energy import (+VA) rate 4', code: '(3,1-0:9.8.4.255)', value: '' },
        { checked: false, no: 6, name: 'Apparent energy export (-VA)', code: '(3,1-0:10.8.0.255)', value: '' },
        { checked: false, no: 7, name: 'Apparent energy export (-VA) rate 1', code: '(3,1-0:10.8.1.255)', value: '' },
        { checked: false, no: 8, name: 'Apparent energy export (-VA) rate 2', code: '(3,1-0:10.8.2.255)', value: '' },
        { checked: false, no: 9, name: 'Apparent energy export (-VA) rate 3', code: '(3,1-0:10.8.3.255)', value: '' },
        { checked: false, no: 10, name: 'Apparent energy export (-VA) rate 4', code: '(3,1-0:10.8.4.255)', value: '' },
    ]);

    const [streamValues, setStreamValues] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const controllerRef = useRef(null);
    const serialNumber = localStorage.getItem('selectedSerialNumber');

    const handleSelectAllChange = (checked) => {
        setSelectAll(checked);
        setTableData(prevData =>
            prevData.map(item => ({ ...item, checked: checked }))
        );
    };

    const handleCheckboxChange = (no) => {
        setTableData(prevData => {
            const newData = prevData.map(item =>
                item.no === no ? { ...item, checked: !item.checked } : item
            );
            setSelectAll(newData.every(item => item.checked));
            return newData;
        });
    };

    const handleReadClick = async () => {
        if (controllerRef.current) controllerRef.current.abort();

        const selectedParams = tableData
            .filter(item => item.checked)
            .map((item) => {
                const cleanCode = item.code
                    .replace(/[()]/g, "")
                    .replace(/-/g, ".")
                    .replace(/:/g, ".")
                    .replace(/\.\.+/g, ".");
                const codeParts = cleanCode.split(",");
                const obisCode = codeParts[1].trim();
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
        setShowProgressModal(true);
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
        } finally {
            setShowProgressModal(false);
        }
    };

    useImperativeHandle(ref, () => ({
        handleRead: handleReadClick
    }));

    return (
        <div className="dashboard-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={(e) => handleSelectAllChange(e.target.checked)}
                            />
                        </th>
                        <th>No.</th>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((item) => {
                        const normalizedCode = item.code
                            .replace(/[()]/g, "")
                            .replace(/-/g, ".")
                            .replace(/:/g, ".")
                            .replace(/\.\.+/g, ".")
                            .split(",")[1]
                            ?.trim() || item.code;

                        const displayValue =
                            typeof streamValues[normalizedCode] === "object"
                                ? JSON.stringify(streamValues[normalizedCode])
                                : streamValues[normalizedCode] !== undefined && streamValues[normalizedCode] !== null
                                    ? `${streamValues[normalizedCode]} kVAh` 
                                    : "";

                        return (
                            <tr key={item.no}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleCheckboxChange(item.no)}
                                    />
                                </td>
                                <td>{item.no}</td>
                                <td>{item.name}</td>
                                <td>{item.code}</td>
                                <td>{displayValue}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            <ProgressModal
                isOpen={showProgressModal}
                onClose={() => setShowProgressModal(false)}
                title="Reading Reactive Energy Values"
            />
        </div>
    );
});




const ActiveMaximumDemandDashboard = forwardRef((props, ref) => {
    const [tableData, setTableData] = useState([
        { checked: false, no: 1, name: 'Maximum Demand Register - Active import (+A)', code: '(4,1-0:1.6.0.255)', value: '', captureTime: '' },
        { checked: false, no: 2, name: 'Maximum Demand Register - Active import (+A) - rate 1', code: '(4,1-0:1.6.1.255)', value: '', captureTime: '' },
        { checked: false, no: 3, name: 'Maximum Demand Register - Active import (+A) - rate 2', code: '(4,1-0:1.6.2.255)', value: '', captureTime: '' },
        { checked: false, no: 4, name: 'Maximum Demand Register - Active import (+A) - rate 3', code: '(4,1-0:1.6.3.255)', value: '', captureTime: '' },
        { checked: false, no: 5, name: 'Maximum Demand Register - Active import (+A) - rate 4', code: '(4,1-0:1.6.4.255)', value: '', captureTime: '' },
        { checked: false, no: 6, name: 'Maximum Demand Register - Active export (-A)', code: '(4,1-0:2.6.0.255)', value: '', captureTime: '' },
        { checked: false, no: 7, name: 'Maximum Demand Register - Active export (-A) - rate 1', code: '(4,1-0:2.6.1.255)', value: '', captureTime: '' },
        { checked: false, no: 8, name: 'Maximum Demand Register - Active export (-A) - rate 2', code: '(4,1-0:2.6.2.255)', value: '', captureTime: '' },
        { checked: false, no: 9, name: 'Maximum Demand Register - Active export (-A) - rate 3', code: '(4,1-0:2.6.3.255)', value: '', captureTime: '' },
        { checked: false, no: 10, name: 'Maximum Demand Register - Active export (-A) - rate 4', code: '(4,1-0:2.6.4.255)', value: '', captureTime: '' },
        { checked: false, no: 11, name: 'Maximum Demand Register - Active (+A)+(-A)', code: '(4,1-0:15.6.0.255)', value: '', captureTime: '' },
        { checked: false, no: 12, name: 'Maximum Demand Register - Active (+A)+(-A) - rate 1', code: '(4,1-0:15.6.1.255)', value: '', captureTime: '' },
        { checked: false, no: 13, name: 'Maximum Demand Register - Active (+A)+(-A) - rate 2', code: '(4,1-0:15.6.2.255)', value: '', captureTime: '' },
        { checked: false, no: 14, name: 'Maximum Demand Register - Active (+A)+(-A) - rate 3', code: '(4,1-0:15.6.3.255)', value: '', captureTime: '' },
        { checked: false, no: 15, name: 'Maximum Demand Register - Active (+A)+(-A) - rate 4', code: '(4,1-0:15.6.4.255)', value: '', captureTime: '' },
        { checked: false, no: 16, name: 'Cumulative Maximum Demand Register - Active import (+A)', code: '(4,1-0:1.2.0.255)', value: '', captureTime: '' },
        { checked: false, no: 17, name: 'Cumulative Maximum Demand Register - Active import (+A) - rate 1', code: '(4,1-0:1.2.1.255)', value: '', captureTime: '' },
        { checked: false, no: 18, name: 'Cumulative Maximum Demand Register - Active import (+A) - rate 2', code: '(4,1-0:1.2.2.255)', value: '', captureTime: '' },
        { checked: false, no: 19, name: 'Cumulative Maximum Demand Register - Active import (+A) - rate 3', code: '(4,1-0:1.2.3.255)', value: '', captureTime: '' },
        { checked: false, no: 20, name: 'Cumulative Maximum Demand Register - Active import (+A) - rate 4', code: '(4,1-0:1.2.4.255)', value: '', captureTime: '' },
        { checked: false, no: 21, name: 'Cumulative Maximum Demand Register - Active export (-A)', code: '(4,1-0:2.2.0.255)', value: '', captureTime: '' },
        { checked: false, no: 22, name: 'Cumulative Maximum Demand Register - Active export (-A) - rate 1', code: '(4,1-0:2.2.1.255)', value: '', captureTime: '' },
        { checked: false, no: 23, name: 'Cumulative Maximum Demand Register - Active export (-A) - rate 2', code: '(4,1-0:2.2.2.255)', value: '', captureTime: '' },
        { checked: false, no: 24, name: 'Cumulative Maximum Demand Register - Active export (-A) - rate 3', code: '(4,1-0:2.2.3.255)', value: '', captureTime: '' },
        { checked: false, no: 25, name: 'Cumulative Maximum Demand Register - Active export (-A) - rate 4', code: '(4,1-0:2.2.4.255)', value: '', captureTime: '' },
        { checked: false, no: 26, name: 'Demand Register - Active (+A)+(-A)', code: '(5,1-0:15.4.0.255)', value: '', captureTime: '' },
        { checked: false, no: 27, name: 'Demand Register - Active (+A)+(-A) - rate 1', code: '(5,1-0:15.4.1.255)', value: '', captureTime: '' },
        { checked: false, no: 28, name: 'Demand Register - Active (+A)+(-A) - rate 2', code: '(5,1-0:15.4.2.255)', value: '', captureTime: '' },
        { checked: false, no: 29, name: 'Demand Register - Active (+A)+(-A) - rate 3', code: '(5,1-0:15.4.3.255)', value: '', captureTime: '' },
        { checked: false, no: 30, name: 'Demand Register - Active (+A)+(-A) - rate 4', code: '(5,1-0:15.4.4.255)', value: '', captureTime: '' },
        { checked: false, no: 31, name: 'Average Demand Register - Active (+A)+(-A)', code: '(5,1-0:15.24.0.255)', value: '', captureTime: '' },
    ]);

    const [streamValues, setStreamValues] = useState({});
    const [showProgressModal, setShowProgressModal] = useState(false);
    const controllerRef = useRef(null);
    const serialNumber = localStorage.getItem('selectedSerialNumber');

    const handleCheckboxChange = (no) => {
        setTableData(prevData =>
            prevData.map(item =>
                item.no === no ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const handleReadClick = async () => {
        if (controllerRef.current) controllerRef.current.abort();

        const selectedParams = tableData
            .filter(item => item.checked)
            .map((item) => {
                const cleanCode = item.code
                    .replace(/[()]/g, "")
                    .replace(/-/g, ".")
                    .replace(/:/g, ".")
                    .replace(/\.\.+/g, ".");
                const codeParts = cleanCode.split(",");
                const obisCode = codeParts[1].trim();
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

        controllerRef.current = new AbortController();
        const res = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controllerRef.current.signal
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
                    setStreamValues(prev => ({ ...prev, [msg.obis_code]: msg.value }));
                } catch { }
            }
        }
    };

    useImperativeHandle(ref, () => ({
        handleRead: handleReadClick
    }));

    return (
        <div className="dashboard-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Check</th>
                        <th>No.</th>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Value</th>
                        <th>Capture time</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((item) => {
                        const normalizedCode = item.code
                            .replace(/[()]/g, "")
                            .replace(/-/g, ".")
                            .replace(/:/g, ".")
                            .replace(/\.\.+/g, ".")
                            .split(",")[1]
                            ?.trim() || item.code;

                        const displayValue =
                            typeof streamValues[normalizedCode] === "object"
                                ? JSON.stringify(streamValues[normalizedCode])
                                : streamValues[normalizedCode] !== undefined && streamValues[normalizedCode] !== null
                                    ? streamValues[normalizedCode]
                                    : "";

                        return (
                            <tr key={item.no}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleCheckboxChange(item.no)}
                                    />
                                </td>
                                <td>{item.no}</td>
                                <td>{item.name}</td>
                                <td>{item.code}</td>
                                <td>{displayValue}</td>
                                <td>{item.captureTime}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
});




const ReActiveMaximumDemandDashboard = forwardRef((props, ref) => {
    const [tableData, setTableData] = useState([
        { checked: false, no: 1, name: 'Maximum Demand Register - Reactive import (+R)', code: '(4,1-0:3.6.0.255)', value: '', captureTime: '' },
        { checked: false, no: 2, name: 'Maximum Demand Register - Reactive import (+R) - rate 1', code: '(4,1-0:3.6.1.255)', value: '', captureTime: '' },
        { checked: false, no: 3, name: 'Maximum Demand Register - Reactive import (+R) - rate 2', code: '(4,1-0:3.6.2.255)', value: '', captureTime: '' },
        { checked: false, no: 4, name: 'Maximum Demand Register - Reactive import (+R) - rate 3', code: '(4,1-0:3.6.3.255)', value: '', captureTime: '' },
        { checked: false, no: 5, name: 'Maximum Demand Register - Reactive import (+R) - rate 4', code: '(4,1-0:3.6.4.255)', value: '', captureTime: '' },
        { checked: false, no: 6, name: 'Maximum Demand Register - Reactive export (-R)', code: '(4,1-0:4.6.0.255)', value: '', captureTime: '' },
        { checked: false, no: 7, name: 'Maximum Demand Register - Reactive export (-R) - rate 1', code: '(4,1-0:4.6.1.255)', value: '', captureTime: '' },
        { checked: false, no: 8, name: 'Maximum Demand Register - Reactive export (-R) - rate 2', code: '(4,1-0:4.6.2.255)', value: '', captureTime: '' },
        { checked: false, no: 9, name: 'Maximum Demand Register - Reactive export (-R) - rate 3', code: '(4,1-0:4.6.3.255)', value: '', captureTime: '' },
        { checked: false, no: 10, name: 'Maximum Demand Register - Reactive export (-R) - rate 4', code: '(4,1-0:4.6.4.255)', value: '', captureTime: '' },
    ]);

    const [streamValues, setStreamValues] = useState({});
    const [showProgressModal, setShowProgressModal] = useState(false);
    const controllerRef = useRef(null);
    const serialNumber = localStorage.getItem('selectedSerialNumber');

    const handleCheckboxChange = (no) => {
        setTableData(prevData =>
            prevData.map(item =>
                item.no === no ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const handleReadClick = async () => {
        if (controllerRef.current) controllerRef.current.abort();

        const selectedParams = tableData
            .filter(item => item.checked)
            .map((item) => {
                const cleanCode = item.code
                    .replace(/[()]/g, "")
                    .replace(/-/g, ".")
                    .replace(/:/g, ".")
                    .replace(/\.\.+/g, ".");
                const codeParts = cleanCode.split(",");
                const obisCode = codeParts[1].trim();
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

        controllerRef.current = new AbortController();
        const res = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controllerRef.current.signal
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
                    setStreamValues(prev => ({ ...prev, [msg.obis_code]: msg.value }));
                } catch { }
            }
        }
    };

    useImperativeHandle(ref, () => ({
        handleRead: handleReadClick
    }));

    return (
        <div className="dashboard-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Check</th>
                        <th>No.</th>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Value</th>
                        <th>Capture time</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((item) => {
                        const normalizedCode = item.code
                            .replace(/[()]/g, "")
                            .replace(/-/g, ".")
                            .replace(/:/g, ".")
                            .replace(/\.\.+/g, ".")
                            .split(",")[1]
                            ?.trim() || item.code;

                        const displayValue =
                            typeof streamValues[normalizedCode] === "object"
                                ? JSON.stringify(streamValues[normalizedCode])
                                : streamValues[normalizedCode] !== undefined && streamValues[normalizedCode] !== null
                                    ? streamValues[normalizedCode]
                                    : "";

                        return (
                            <tr key={item.no}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleCheckboxChange(item.no)}
                                    />
                                </td>
                                <td>{item.no}</td>
                                <td>{item.name}</td>
                                <td>{item.code}</td>
                                <td>{displayValue}</td>
                                <td>{item.captureTime}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
});






const ApparentMaximumDemandDashboard = forwardRef((props, ref) => {
    const [tableData, setTableData] = useState([
        { checked: false, no: 1, name: 'Maximum Demand Register - Apparent import (+VA)', code: '(4,1-0:9.6.0.255)', value: '', captureTime: '' },
        { checked: false, no: 2, name: 'Maximum Demand Register - Apparent import (+VA) - rate 1', code: '(4,1-0:9.6.1.255)', value: '', captureTime: '' },
        { checked: false, no: 3, name: 'Maximum Demand Register - Apparent import (+VA) - rate 2', code: '(4,1-0:9.6.2.255)', value: '', captureTime: '' },
        { checked: false, no: 4, name: 'Maximum Demand Register - Apparent import (+VA) - rate 3', code: '(4,1-0:9.6.3.255)', value: '', captureTime: '' },
        { checked: false, no: 5, name: 'Maximum Demand Register - Apparent import (+VA) - rate 4', code: '(4,1-0:9.6.4.255)', value: '', captureTime: '' },
        { checked: false, no: 6, name: 'Maximum Demand Register - Apparent export (-VA)', code: '(4,1-0:10.6.0.255)', value: '', captureTime: '' },
        { checked: false, no: 7, name: 'Maximum Demand Register - Apparent export (-VA) - rate 1', code: '(4,1-0:10.6.1.255)', value: '', captureTime: '' },
        { checked: false, no: 8, name: 'Maximum Demand Register - Apparent export (-VA) - rate 2', code: '(4,1-0:10.6.2.255)', value: '', captureTime: '' },
        { checked: false, no: 9, name: 'Maximum Demand Register - Apparent export (-VA) - rate 3', code: '(4,1-0:10.6.3.255)', value: '', captureTime: '' },
        { checked: false, no: 10, name: 'Maximum Demand Register - Apparent export (-VA) - rate 4', code: '(4,1-0:10.6.4.255)', value: '', captureTime: '' },
    ]);

    const [streamValues, setStreamValues] = useState({});
    const [showProgressModal, setShowProgressModal] = useState(false);
    const controllerRef = useRef(null);
    const serialNumber = localStorage.getItem('selectedSerialNumber');

    const handleCheckboxChange = (no) => {
        setTableData(prevData =>
            prevData.map(item =>
                item.no === no ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const handleReadClick = async () => {
        if (controllerRef.current) controllerRef.current.abort();

        const selectedParams = tableData
            .filter(item => item.checked)
            .map((item) => {
                const cleanCode = item.code
                    .replace(/[()]/g, "")
                    .replace(/-/g, ".")
                    .replace(/:/g, ".")
                    .replace(/\.\.+/g, ".");
                const codeParts = cleanCode.split(",");
                const obisCode = codeParts[1].trim();
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

        controllerRef.current = new AbortController();
        const res = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controllerRef.current.signal
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
                    setStreamValues(prev => ({ ...prev, [msg.obis_code]: msg.value }));
                } catch { }
            }
        }
    };

    useImperativeHandle(ref, () => ({
        handleRead: handleReadClick
    }));

    return (
        <div className="dashboard-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Check</th>
                        <th>No.</th>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Value</th>
                        <th>Capture time</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((item) => {
                        const normalizedCode = item.code
                            .replace(/[()]/g, "")
                            .replace(/-/g, ".")
                            .replace(/:/g, ".")
                            .replace(/\.\.+/g, ".")
                            .split(",")[1]
                            ?.trim() || item.code;

                        const displayValue =
                            typeof streamValues[normalizedCode] === "object"
                                ? JSON.stringify(streamValues[normalizedCode])
                                : streamValues[normalizedCode] !== undefined && streamValues[normalizedCode] !== null
                                    ? streamValues[normalizedCode]
                                    : "";

                        return (
                            <tr key={item.no}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleCheckboxChange(item.no)}
                                    />
                                </td>
                                <td>{item.no}</td>
                                <td>{item.name}</td>
                                <td>{item.code}</td>
                                <td>{displayValue}</td>
                                <td>{item.captureTime}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
});








function MonthlyBillingProfile() {
  // Data extracted from bill_1 (1).pdf, Page 1 (Monthly billing profile table)
  const data = [
    {
      no: 1,
      date: '2024-03-19 Tuesday 14:28:00',
      activeEnergyImport: '13.044 kWh',
      activeEnergyExport: '0.000 kWh',
      reactiveEnergyImport: '0.174 kvarh',
      reactiveEnergyExport: '0.000 kvarh',
      energyUsed: '82.79 currency 0.013 kWh',
    },
    {
      no: 2,
      date: '2024-06-23 Sunday 10:31:20',
      activeEnergyImport: '13.044 kWh',
      activeEnergyExport: '0.000 kWh',
      reactiveEnergyImport: '0.174 kvarh',
      reactiveEnergyExport: '0.000 kvarh',
      energyUsed: '82.70 currency 0.000 kWh',
    },
    {
      no: 3,
      date: '2024-07-23 Tuesday 18:38:01',
      activeEnergyImport: '13.044 kWh',
      activeEnergyExport: '0.000 kWh',
      reactiveEnergyImport: '0.174 kvarh',
      reactiveEnergyExport: '0.000 kvarh',
      energyUsed: '82.70 currency 0.000 kWh',
    },
    {
      no: 4,
      date: '2024-09-10 Tuesday 15:35:22',
      activeEnergyImport: '13.044 kWh',
      activeEnergyExport: '0.000 kWh',
      reactiveEnergyImport: '0.174 kvarh',
      reactiveEnergyExport: '0.000 kvarh',
      energyUsed: '82.70 currency 0.000 kWh',
    },
    {
      no: 5,
      date: '2024-10-01 Tuesday 17:58:32',
      activeEnergyImport: '13.120 kWh',
      activeEnergyExport: '0.003 kWh',
      reactiveEnergyImport: '0.007 kvarh',
      reactiveEnergyExport: '0.000 kvarh',
      energyUsed: '65.88 currency 0.079 kWh',
    },
    {
      no: 6,
      date: '2024-12-11 Wednesday 18:03:00',
      activeEnergyImport: '13.155 kWh',
      activeEnergyExport: '0.207 kWh',
      reactiveEnergyImport: '0.007 kvarh',
      reactiveEnergyExport: '0.000 kvarh',
      energyUsed: '23.50 currency 0.217 kWh',
    },
    {
      no: 7,
      date: '2025-02-18 Tuesday 11:36:50',
      activeEnergyImport: '13.133 kWh',
      activeEnergyExport: '0.302 kWh',
      reactiveEnergyImport: '0.007 kvarh',
      reactiveEnergyExport: '0.000 kvarh',
      energyUsed: '23.50 currency 0.000 kWh',
    },
    {
      no: 8,
      date: '2025-02-18 Tuesday 10:54:20',
      activeEnergyImport: '13.134 kWh',
      activeEnergyExport: '0.271 kWh',
      reactiveEnergyImport: '0.303 kvarh',
      reactiveEnergyExport: '0.1772 kvarh',
      energyUsed: '10.50 currency 0.065 kWh',
    },
    {
      no: 9,
      date: '2025-03-01 Saturday 10:00:00',
      activeEnergyImport: '13.135 kWh',
      activeEnergyExport: '0.321 kWh',
      reactiveEnergyImport: '0.203 kvarh',
      reactiveEnergyExport: '0.072 kvarh',
      energyUsed: '10.00 currency 0.053 kWh',
    },
    {
      no: 10,
      date: '2025-04-12 Saturday 15:12:10',
      activeEnergyImport: '13.136 kWh',
      activeEnergyExport: '0.323 kWh',
      reactiveEnergyImport: '0.072 kvarh',
      reactiveEnergyExport: '0.022 kvarh',
      energyUsed: '11.00 currency 0.000 kWh',
    },
    {
      no: 11,
      date: '2025-05-01 Thursday 00:00:00',
      activeEnergyImport: '13.135 kWh',
      activeEnergyExport: '0.325 kWh',
      reactiveEnergyImport: '0.300 kvarh',
      reactiveEnergyExport: '0.072 kvarh',
      energyUsed: '0.00 currency 0.000 kWh',
    },
    {
      no: 12,
      date: '2025-06-01 Sunday 12:45:20',
      activeEnergyImport: '13.135 kWh',
      activeEnergyExport: '0.323 kWh',
      reactiveEnergyImport: '0.300 kvarh',
      reactiveEnergyExport: '0.072 kvarh',
      energyUsed: '0.00 currency 0.000 kWh',
    },
    {
      no: 13,
      date: '2025-06-22 Sunday 14:54:32',
      activeEnergyImport: '13.135 kWh',
      activeEnergyExport: '0.32 kWh',
      reactiveEnergyImport: '0.072 kvarh',
      reactiveEnergyExport: '0.022 kvarh',
      energyUsed: '0.00 currency 0.000 kWh',
    },
  ];

  return (
    <div className="section-container">
      <h2>Monthly Billing Profile</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Date</th>
            <th>Active Energy Import (+A)</th>
            <th>Active Energy Export (-A)</th>
            <th>Reactive Energy Import (+R)</th>
            <th>Reactive Energy Export (-R)</th>
            <th>Energy Used</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.no}>
              <td>{item.no}</td>
              <td>{item.date}</td>
              <td>{item.activeEnergyImport}</td>
              <td>{item.activeEnergyExport}</td>
              <td>{item.reactiveEnergyImport}</td>
              <td>{item.reactiveEnergyExport}</td>
              <td>{item.energyUsed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function BillingSection() {
  const [activeSection, setActiveSection] = useState('instantaneous');
  const instantaneousRef = useRef(null);
  const activeEnergyRef = useRef(null);
  const reactiveEnergyRef = useRef(null);
  const apparentEnergyRef = useRef(null);
  const activeMaxDemandRef = useRef(null);
  const reactiveMaxDemandRef = useRef(null);
  const apparentMaxDemandRef = useRef(null);

  const handleReadClick = () => {
    switch (activeSection) {
      case 'instantaneous':
        instantaneousRef.current?.handleRead();
        break;
      case 'activeEnergy':
        activeEnergyRef.current?.handleRead();
        break;
      case 'reactiveEnergy':
        reactiveEnergyRef.current?.handleRead();
        break;
      case 'apparentEnergy':
        apparentEnergyRef.current?.handleRead();
        break;
      case 'activeMaximumDemand':
        activeMaxDemandRef.current?.handleRead();
        break;
      case 'reactiveMaximumDemand':
        reactiveMaxDemandRef.current?.handleRead();
        break;
      case 'apparentMaximumDemand':
        apparentMaxDemandRef.current?.handleRead();
        break;
      default:
        break;
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'instantaneous':
        return <InstantaneousReadings ref={instantaneousRef} />;
      case 'monthlyBilling':
        return <MonthlyBillingDashboard />;
      case 'dailyBilling':
        return <DailyBillingDashboard/>
        
      case 'activeEnergy': 
        return <ActiveEnergyDashboard ref={activeEnergyRef} />;
      case 'reactiveEnergy':
        return <ReActiveEnergyDashboard ref={reactiveEnergyRef} />
      case 'apparentEnergy':
        return <ApparentEnergyDashboard ref={apparentEnergyRef} />
      case 'activeMaximumDemand':
        return <ActiveMaximumDemandDashboard ref={activeMaxDemandRef} />

      case 'reactiveMaximumDemand':
        return <ReActiveMaximumDemandDashboard ref={reactiveMaxDemandRef} />
      case "apparentMaximumDemand":
        return <ApparentMaximumDemandDashboard ref={apparentMaxDemandRef} />
      
     
      default:
        return <InstantaneousReadings ref={instantaneousRef} />;
    }
  };



   
    
    const [openSubmenus, setOpenSubmenus] = useState({});

    const toggleSubmenu = (menuName) => {
        setOpenSubmenus(prevState => ({
            ...prevState,
            [menuName]: !prevState[menuName]
        }));
    };

    const handleItemClick = (section, menuName = null) => {
        setActiveSection(section);
        if (menuName) {
            setOpenSubmenus(prevState => ({
                ...prevState,
                [menuName]: true
            }));
        }
      }
    



  return (
      <div className="header-dashboard">
    <div className='header-container border-effect'>
      
       <nav className="sidebar1">
            
           
            <ul>
                <li className={activeSection === 'instantaneous' ? 'active' : ''}>
                    <button onClick={() => handleItemClick('instantaneous')} className="sidebar1-btn">
                        <FontAwesomeIcon icon={faBolt} className="icon" />
                        Instantaneous
                    </button>
                </li>
                <li className="subsection-parent">
                    <button onClick={() => toggleSubmenu('billingProfile')} className={`sidebar1-btn ${openSubmenus['billingProfile'] ? 'open' : ''}`}>
                        <FontAwesomeIcon icon={faFileInvoiceDollar} className="icon" />
                        Billing profile
                    </button>
                    {openSubmenus['billingProfile'] && (
                        <ul className="sub-menu">
                            <li className={activeSection === 'monthlyBilling' ? 'active' : ''}>
                                <button onClick={() => handleItemClick('monthlyBilling', 'billingProfile')} className="sidebar1-btn sub-btn">
                                    <FontAwesomeIcon icon={faCheckSquare} className="sub-icon" />
                                    Monthly Billing profile
                                </button>
                            </li>
                            <li className={activeSection === 'dailyBilling' ? 'active' : ''}>
                                <button onClick={() => handleItemClick('dailyBilling', 'billingProfile')} className="sidebar1-btn sub-btn">
                                    <FontAwesomeIcon icon={faCheckSquare} className="sub-icon" />
                                    Daily Billing profile
                                </button>
                            </li>
                        </ul>
                    )}
                </li>
                <li className="subsection-parent">
                    <button onClick={() => toggleSubmenu('energy')} className={`sidebar1-btn ${openSubmenus['energy'] ? 'open' : ''}`}>
                        <FontAwesomeIcon icon={faPowerOff} className="icon" />
                        Energy
                    </button>
                    {openSubmenus['energy'] && (
                        <ul className="sub-menu">
                            <li className={activeSection === 'activeEnergy' ? 'active' : ''}>
                                <button onClick={() => handleItemClick('activeEnergy', 'energy')} className="sidebar1-btn sub-btn">
                                    <FontAwesomeIcon icon={faCheckSquare} className="sub-icon" />
                                    Active energy
                                </button>
                            </li>
                            <li className={activeSection === 'reactiveEnergy' ? 'active' : ''}>
                                <button onClick={() => handleItemClick('reactiveEnergy', 'energy')} className="sidebar1-btn sub-btn">
                                    <FontAwesomeIcon icon={faCheckSquare} className="sub-icon" />
                                    Reactive energy
                                </button>
                            </li>
                            <li className={activeSection === 'apparentEnergy' ? 'active' : ''}>
                                <button onClick={() => handleItemClick('apparentEnergy', 'energy')} className="sidebar1-btn sub-btn">
                                    <FontAwesomeIcon icon={faCheckSquare} className="sub-icon" />
                                    Apparent energy
                                </button>
                            </li>
                        </ul>
                    )}
                </li>
                <li className="subsection-parent">
                    <button onClick={() => toggleSubmenu('demand')} className={`sidebar1-btn ${openSubmenus['demand'] ? 'open' : ''}`}>
                        <FontAwesomeIcon icon={faChartLine} className="icon" />
                        Demand
                    </button>
                    {openSubmenus['demand'] && (
                        <ul className="sub-menu">
                           
                            <li className={activeSection === 'activeMaximumDemand' ? 'active' : ''}>
                                <button onClick={() => handleItemClick('activeMaximumDemand', 'demand')} className="sidebar1-btn sub-btn">
                                    <FontAwesomeIcon icon={faCheckSquare} className="sub-icon" />
                                    Active maximum demand
                                </button>
                            </li>
                            <li className={activeSection === 'reactiveMaximumDemand' ? 'active' : ''}>
                                <button onClick={() => handleItemClick('reactiveMaximumDemand', 'demand')} className="sidebar1-btn sub-btn">
                                    <FontAwesomeIcon icon={faCheckSquare} className="sub-icon" />
                                    Reactive maximum demand
                                </button>
                            </li>
                            <li className={activeSection === 'apparentMaximumDemand' ? 'active' : ''}>
                                <button onClick={() => handleItemClick('apparentMaximumDemand', 'demand')} className="sidebar1-btn sub-btn">
                                    <FontAwesomeIcon icon={faCheckSquare} className="sub-icon" />
                                    Apparent maximum demand
                                </button>
                            </li>
                        </ul>
                    )}
                </li>
            </ul>
        </nav>






      <main className="content">
    <div className="read-write-container">
  <button className="dashboard-btn" onClick={handleReadClick}>
    <FaBookOpen style={{ marginRight: "8px",color:"#ff4d00ff"}} />
    Read
  </button>

  <button className="dashboard-btn">
    <FaFileExport style={{ marginRight: "8px",color:"#ff4d00ff" }} />
    Export
  </button>
</div>
        {renderSection()}
      </main>
    </div>
    </div>
  );
}

export default BillingSection;