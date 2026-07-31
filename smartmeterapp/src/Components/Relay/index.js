import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import ProgressModal from '../ProgressModal';
import DisconnectControlNew from './DisconnectControlNew';
import LoadControlNew from './LoadControlNew';
import './index.css'

const monthNames = [
  "Every Month", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const LoadControlComponent = () => {
  const serialNumber = localStorage.getItem('selectedSerialNumber');

  // Checkbox selections
  const [selected, setSelected] = useState(new Set());

  // Form data state
  const [formData, setFormData] = useState({
    monitoredValueText: "Instantaneous active power ( |+A| + |-A| )",
    thresholdActive: 0,
    thresholdNormal: 0,
    thresholdEmergency: 0,
    minOverThresholdDuration: 0,
    minUnderThresholdDuration: 0,
    emergencyProfileId: 0,
    emergencyActivationTime: '',
    emergencyDuration: 0,
    emergencyProfileGroupIds: '',
    emergencyProfileActive: 'Enable',
    actionOverThreshold: 'Set ready for reconnection',
    actionUnderThreshold: 'Set connected'
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Time popup state
  const [showTimePopup, setShowTimePopup] = useState(false);
  const [yearType, setYearType] = useState('Every Year');
  const [specialYear, setSpecialYear] = useState('');
  const [month, setMonth] = useState('January');
  const [day, setDay] = useState('1');
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');
  const [second, setSecond] = useState('00');

  // Toggle checkbox selection
  const toggleCheckbox = (index) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle Emergency Activation Time click
  const handleTimeClick = () => {
    setShowTimePopup(true);
  };

  // Handle save time from popup
  const handleSaveTime = () => {
    const formattedTime = `${yearType === 'Every Year' ? 'Every Year' : specialYear}, ${month} ${day}, ${hour}:${minute}:${second}`;
    setFormData({ ...formData, emergencyActivationTime: formattedTime });
    setShowTimePopup(false);
  };

  // Handle Read button
  const handleRead = async () => {
    if (!serialNumber) {
      setError('No serial number selected');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (selected.size === 0) {
      setError('Please select at least one attribute');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setShowProgressModal(true);

    try {
      // TODO: Implement read logic for Load Control
      alert('Read functionality to be implemented');
    } catch (e) {
      setError(`Read failed: ${e.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };

  // Handle Write button
  const handleWrite = async () => {
    if (!serialNumber) {
      setError('No serial number selected');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (selected.size === 0) {
      setError('Please select at least one attribute');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setShowProgressModal(true);

    try {
      // TODO: Implement write logic for Load Control
      alert('Write functionality to be implemented');
    } catch (e) {
      setError(`Write failed: ${e.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };

  return (
    <>
      <div style={{ padding: '20px' }}>
        {/* Header with Read/Write buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px' }}>
          <button
            onClick={handleRead}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              minWidth: '70px'
            }}
          >
            {loading ? 'Reading...' : 'Read'}
          </button>
          <button
            onClick={handleWrite}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              minWidth: '70px'
            }}
          >
            {loading ? 'Writing...' : 'Write'}
          </button>
        </div>

        {/* Load Control Table */}
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Monitored value */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(1)}
                onChange={() => toggleCheckbox(1)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold',
              backgroundColor: '#f5f5f5'
            }}>
              Monitored value
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <input
                type="text"
                value={formData.monitoredValueText}
                readOnly
                style={{
                  width: '100%',
                  border: 'none',
                  backgroundColor: '#f0f0f0',
                  padding: '4px',
                  color: '#666'
                }}
              />
            </div>
          </div>

          {/* Threshold active */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(2)}
                onChange={() => toggleCheckbox(2)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold'
            }}>
              Threshold active
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <input
                type="number"
                name="thresholdActive"
                value={formData.thresholdActive}
                onChange={handleChange}
                style={{
                  width: '100%',
                  border: 'none',
                  padding: '4px'
                }}
              />
            </div>
          </div>

          {/* Threshold normal */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(3)}
                onChange={() => toggleCheckbox(3)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold'
            }}>
              Threshold normal
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <input
                type="number"
                name="thresholdNormal"
                value={formData.thresholdNormal}
                onChange={handleChange}
                style={{
                  width: '100%',
                  border: 'none',
                  padding: '4px'
                }}
              />
            </div>
          </div>

          {/* Threshold emergency */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(4)}
                onChange={() => toggleCheckbox(4)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold'
            }}>
              Threshold emergency
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <input
                type="number"
                name="thresholdEmergency"
                value={formData.thresholdEmergency}
                onChange={handleChange}
                style={{
                  width: '100%',
                  border: 'none',
                  padding: '4px'
                }}
              />
            </div>
          </div>

          {/* Min over threshold duration */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(5)}
                onChange={() => toggleCheckbox(5)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold'
            }}>
              Min over threshold duration
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <input
                type="number"
                name="minOverThresholdDuration"
                value={formData.minOverThresholdDuration}
                onChange={handleChange}
                style={{
                  width: '100%',
                  border: 'none',
                  padding: '4px'
                }}
              />
            </div>
          </div>

          {/* Min under threshold duration */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(6)}
                onChange={() => toggleCheckbox(6)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold'
            }}>
              Min under threshold duration
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <input
                type="number"
                name="minUnderThresholdDuration"
                value={formData.minUnderThresholdDuration}
                onChange={handleChange}
                style={{
                  width: '100%',
                  border: 'none',
                  padding: '4px'
                }}
              />
            </div>
          </div>

          {/* Emergency profile */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(7)}
                onChange={() => toggleCheckbox(7)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold'
            }}>
              Emergency profile
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ minWidth: '150px', fontSize: '14px' }}>Emergency profile id</span>
                  <input
                    type="number"
                    name="emergencyProfileId"
                    value={formData.emergencyProfileId}
                    onChange={handleChange}
                    style={{
                      flex: '1',
                      border: '1px solid #ccc',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ minWidth: '150px', fontSize: '14px' }}>Emergency activation time</span>
                  <input
                    type="text"
                    name="emergencyActivationTime"
                    value={formData.emergencyActivationTime}
                    onClick={handleTimeClick}
                    readOnly
                    style={{
                      flex: '1',
                      border: '1px solid #ccc',
                      padding: '4px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ minWidth: '150px', fontSize: '14px' }}>Emergency duration</span>
                  <input
                    type="number"
                    name="emergencyDuration"
                    value={formData.emergencyDuration}
                    onChange={handleChange}
                    style={{
                      flex: '1',
                      border: '1px solid #ccc',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency profile group id list */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(8)}
                onChange={() => toggleCheckbox(8)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold'
            }}>
              Emergency profile group id list
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <input
                type="text"
                name="emergencyProfileGroupIds"
                value={formData.emergencyProfileGroupIds}
                onChange={handleChange}
                style={{
                  width: '100%',
                  border: 'none',
                  padding: '4px'
                }}
              />
            </div>
          </div>

          {/* Emergency profile active */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(9)}
                onChange={() => toggleCheckbox(9)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold'
            }}>
              Emergency profile active
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <select
                name="emergencyProfileActive"
                value={formData.emergencyProfileActive}
                onChange={handleChange}
                style={{
                  width: '100%',
                  border: 'none',
                  padding: '4px',
                  backgroundColor: '#f0f0f0'
                }}
              >
                <option value="Enable">Enable</option>
                <option value="Disable">Disable</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex' }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                checked={selected.has(10)}
                onChange={() => toggleCheckbox(10)}
              />
            </div>
            <div style={{
              flex: '0 0 200px',
              padding: '12px',
              borderRight: '1px solid #ccc',
              fontWeight: 'bold'
            }}>
              actions
            </div>
            <div style={{ flex: '1', padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ minWidth: '150px', fontSize: '14px' }}>Action over threshold</span>
                  <select
                    name="actionOverThreshold"
                    value={formData.actionOverThreshold}
                    onChange={handleChange}
                    style={{
                      flex: '1',
                      border: '1px solid #ccc',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="Set ready for reconnection">Set ready for reconnection</option>
                    <option value="No action">No action</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ minWidth: '150px', fontSize: '14px' }}>Action under threshold</span>
                  <select
                    name="actionUnderThreshold"
                    value={formData.actionUnderThreshold}
                    onChange={handleChange}
                    style={{
                      flex: '1',
                      border: '1px solid #ccc',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="Set connected">Set connected</option>
                    <option value="No action">No action</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {error}
          </div>
        )}
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
                  <input type="number" value={specialYear} onChange={(e) => setSpecialYear(e.target.value)}
                    placeholder="Year (e.g. 2026)" className="lc-input" />
                )}
              </div>

              <div className="modal-row">
                <label className="lc-label">Month</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="lc-select">
                  {monthNames.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="modal-row">
                <label className="lc-label">Day</label>
                <select value={day} onChange={(e) => setDay(e.target.value)} className="lc-select">
                  {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="modal-row time-row">
                <label className="lc-label">Time (hh:mm:ss)</label>
                <div className="time-selects">
                  <select value={hour} onChange={(e) => setHour(e.target.value)} className="lc-select small">
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span>:</span>
                  <select value={minute} onChange={(e) => setMinute(e.target.value)} className="lc-select small">
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span>:</span>
                  <select value={second} onChange={(e) => setSecond(e.target.value)} className="lc-select small">
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <button className="btn-primary" onClick={handleSaveTime}>Save</button>
              <button className="btn-ghost" onClick={() => setShowTimePopup(false)}>Cancel</button>
            </footer>
          </div>
        </div>
      )}

      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Load Control Operation"
      />
    </>
  );
}




const DisconnectControl = () => {
  const serialNumber = localStorage.getItem('selectedSerialNumber');

  // Checkbox selections
  const [selected, setSelected] = useState(new Set());

  // Dropdown values
  const [relaySelect, setRelaySelect] = useState("Disconnect control (Main relay)");
  const [outputState, setOutputState] = useState("0");
  const [controlState, setControlState] = useState("0");
  const [controlMode, setControlMode] = useState("0");
  const [method, setMethod] = useState("2");

  // Results display
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const OBIS_CODE = "0.0.96.3.10.255";

  // Attribute definitions
  const ATTRIBUTES = [
    { index: 2, label: "Output State", key: "outputState", writable: false },
    { index: 3, label: "Control State", key: "controlState", writable: false },
    { index: 4, label: "Control Mode", key: "controlMode", writable: true },
    { index: 5, label: "Method", key: "method", writable: true, isMethod: true }
  ];

  // Dropdown options
  const OUTPUT_STATE_OPTIONS = [
    { value: "0", label: "(0) Disconnected" },
    { value: "1", label: "(1) Connected" },
    { value: "2", label: "(2) Ready for reconnection" }
  ];

  const CONTROL_STATE_OPTIONS = [
    { value: "0", label: "(0) Disconnected" },
    { value: "1", label: "(1) Connected" },
    { value: "2", label: "(2) Ready for reconnection" }
  ];

  const CONTROL_MODE_OPTIONS = [
    { value: "0", label: "Mode 0" },
    { value: "1", label: "Mode 1" },
    { value: "2", label: "Mode 2" },
    { value: "3", label: "Mode 3" },
    { value: "4", label: "Mode 4" },
    { value: "5", label: "Mode 5" },
    { value: "6", label: "Mode 6" }
  ];

  const METHOD_OPTIONS = [
    { value: "1", label: "(1) Disconnect" },
    { value: "2", label: "(2) Reconnect" }
  ];

  // Toggle checkbox selection
  const toggleCheckbox = (index) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  // Format value for display
  const formatValue = (attrIndex, value) => {
    if (attrIndex === 2) {
      const opt = OUTPUT_STATE_OPTIONS.find(o => o.value === String(value));
      return opt ? opt.label : String(value);
    }
    if (attrIndex === 3) {
      const opt = CONTROL_STATE_OPTIONS.find(o => o.value === String(value));
      return opt ? opt.label : String(value);
    }
    if (attrIndex === 4) {
      const opt = CONTROL_MODE_OPTIONS.find(o => o.value === String(value));
      return opt ? opt.label : String(value);
    }
    return String(value);
  };

  // Handle Read button
  const handleRead = async () => {
    if (!serialNumber) {
      setError('No serial number selected');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (selected.size === 0) {
      setError('Please select at least one attribute');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setShowProgressModal(true);

    // Build parameters for read (exclude Method since it's not readable)
    const parameters = Array.from(selected)
      .filter(idx => idx !== 5) // Exclude Method
      .map(idx => ({
        obis_code: OBIS_CODE,
        attribute_index: String(idx)
      }));

    if (parameters.length === 0) {
      setError('Method cannot be read. Please select other attributes.');
      setLoading(false);
      setShowProgressModal(false);
      setTimeout(() => setError(null), 3000);
      return;
    }

    console.log("Read parameters:", parameters);

    try {
      const response = await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
        serial_number: serialNumber,
        action: "read_obis",
        parameters
      });

      console.log("Full Read response:", response);
      console.log("Response.data:", response.data);
      console.log("Response.data type:", typeof response.data);

      let actualData = response.data;

      // Check if it's a string (SSE format with multiple "data:" lines)
      if (typeof actualData === 'string') {
        console.log("Response is string (SSE format), parsing multiple data lines");

        // Split by newlines and parse each "data:" line
        const lines = actualData.split('\n');
        const parsedResults = [];

        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            try {
              const jsonStr = line.substring(5).trim(); // Remove "data:" prefix
              const parsed = JSON.parse(jsonStr);
              if (parsed.status === 'success' && parsed.action === 'read') {
                parsedResults.push(parsed);
              }
            } catch (e) {
              console.warn("Failed to parse line:", line, e);
            }
          }
        }

        console.log("Parsed SSE results:", parsedResults);

        if (parsedResults.length > 0) {
          // Process the parsed results - UPDATE DROPDOWNS ONLY, NO RESULTS TABLE
          parsedResults.forEach(item => {
            const attrIdx = parseInt(item.attribute_index);
            // Handle boolean values
            let value = item.value;
            if (typeof value === 'boolean') {
              value = value ? 1 : 0;
            }

            if (attrIdx === 2) setOutputState(String(value));
            if (attrIdx === 3) setControlState(String(value));
            if (attrIdx === 4) setControlMode(String(value));
          });

          console.log("Updated dropdown values from read");
          setLoading(false);
          setShowProgressModal(false);
          return;
        } else {
          throw new Error('No valid results found in SSE response');
        }
      }

      console.log("Parsed actualData:", actualData);

      // Unwrap nested data layers (for non-SSE responses)
      let unwrapCount = 0;
      while (actualData && typeof actualData === 'object' && 'data' in actualData && !('status' in actualData) && !('results' in actualData)) {
        console.log(`Unwrapping layer ${++unwrapCount}`);
        actualData = actualData.data;
      }

      console.log("Final actualData after unwrapping:", actualData);

      if (actualData && actualData.status === "success") {
        console.log("Status is success");

        if (actualData.results && Array.isArray(actualData.results) && actualData.results.length > 0) {
          // Multiple results - UPDATE DROPDOWNS ONLY, NO RESULTS TABLE
          console.log("Processing multiple results:", actualData.results);

          // Update dropdown values
          actualData.results.forEach(item => {
            const attrIdx = parseInt(item.attribute_index);
            // Handle boolean values
            let value = item.value;
            if (typeof value === 'boolean') {
              value = value ? 1 : 0;
            }

            if (attrIdx === 2) setOutputState(String(value));
            if (attrIdx === 3) setControlState(String(value));
            if (attrIdx === 4) setControlMode(String(value));
          });
        } else if (actualData.attribute_index && actualData.value !== undefined) {
          // Single result - UPDATE DROPDOWN ONLY, NO RESULTS TABLE
          console.log("Processing single result");

          // Update dropdown value
          const attrIdx = parseInt(actualData.attribute_index);
          // Handle boolean values
          let value = actualData.value;
          if (typeof value === 'boolean') {
            value = value ? 1 : 0;
          }

          if (attrIdx === 2) setOutputState(String(value));
          if (attrIdx === 3) setControlState(String(value));
          if (attrIdx === 4) setControlMode(String(value));
        } else {
          console.error("Unexpected response structure:", actualData);
          throw new Error('Unexpected response structure');
        }
      } else {
        console.error("Status is not success or actualData is invalid:", actualData);
        throw new Error(actualData?.message || 'Failed to read data');
      }
    } catch (e) {
      console.error("Read error:", e);
      console.error("Error response:", e.response?.data);
      setError(`Error: ${e.message || 'Failed to read data'}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };

  // Handle Write button
  const handleWrite = async () => {
    if (!serialNumber) {
      setError('No serial number selected');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (selected.size === 0) {
      setError('Please select at least one attribute');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setShowProgressModal(true);

    const writeOperations = [];

    // Process selected items
    for (const idx of selected) {
      const attr = ATTRIBUTES.find(a => a.index === idx);

      // Skip read-only attributes (Output State, Control State)
      if (!attr || !attr.writable) {
        continue;
      }

      if (attr.isMethod) {
        // Execute method
        writeOperations.push({
          type: 'method',
          methodIndex: method,
          label: attr.label
        });
      } else if (idx === 4) {
        // Write Control Mode
        writeOperations.push({
          type: 'write',
          attributeIndex: idx,
          value: controlMode,
          label: attr.label
        });
      }
    }

    if (writeOperations.length === 0) {
      setError('No writable attributes selected. Output State and Control State are read-only.');
      setLoading(false);
      setShowProgressModal(false);
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const writeResults = [];

      // Execute write operations sequentially
      for (const op of writeOperations) {
        if (op.type === 'write') {
          // Write attribute
          const response = await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
            serial_number: serialNumber,
            action: "write_obis",
            parameters: {
              obis_code: OBIS_CODE,
              attribute_index: String(op.attributeIndex),
              value: op.value
            }
          });

          console.log("Write response:", response.data);
          writeResults.push({
            label: op.label,
            value: `Written: ${formatValue(op.attributeIndex, op.value)}`
          });
        } else if (op.type === 'method') {
          // Execute method
          const response = await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
            serial_number: serialNumber,
            action: "execute_method",
            parameters: {
              obis_code: OBIS_CODE,
              method_index: op.methodIndex,
              data: 0
            }
          });

          console.log("Method response:", response.data);
          const methodLabel = METHOD_OPTIONS.find(m => m.value === op.methodIndex)?.label || `Method ${op.methodIndex}`;
          writeResults.push({
            label: op.label,
            value: `Executed: ${methodLabel}`
          });
        }
      }

      // Don't set results for write operations - just show alert
      alert(`Successfully completed ${writeResults.length} operation(s)`);
    } catch (e) {
      console.error("Write error:", e);
      setError(`Error: ${e.message || 'Failed to write data'}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };

  return (
    <div className="load-control-container" style={{ paddingTop: '2%' }}>
      {/* Header with Read/Write buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Disconnect Control (Class 70)</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="lc-btn"
            onClick={handleRead}
            disabled={loading}
            style={{ minWidth: '100px' }}
          >
            {loading ? 'Reading...' : 'Read'}
          </button>
          <button
            className="lc-btn"
            onClick={handleWrite}
            disabled={loading}
            style={{ minWidth: '100px' }}
          >
            {loading ? 'Writing...' : 'Write'}
          </button>
        </div>
      </div>

      {/* Relay Select */}
      <div className='lc-row'>
        <label className="lc-label">Relay Select:</label>
        <select
          className="lc-select"
          value={relaySelect}
          onChange={(e) => setRelaySelect(e.target.value)}
        >
          <option value="Disconnect control (Main relay)">
            Disconnect control (Main relay)
          </option>
        </select>
      </div>

      {/* Output State - Read Only */}
      <div className='lc-row' style={{ backgroundColor: '#f5f5f5' }}>
        <label className="lc-label">
          <input
            type="checkbox"
            checked={selected.has(2)}
            onChange={() => toggleCheckbox(2)}
            style={{ marginRight: '10px' }}
          />
          Output State:
        </label>
        <select
          className="lc-select"
          value={outputState}
          onChange={(e) => setOutputState(e.target.value)}
          disabled
        >
          {OUTPUT_STATE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Control State - Read Only */}
      <div className='lc-row' style={{ backgroundColor: '#f5f5f5' }}>
        <label className="lc-label">
          <input
            type="checkbox"
            checked={selected.has(3)}
            onChange={() => toggleCheckbox(3)}
            style={{ marginRight: '10px' }}
          />
          Control State:
        </label>
        <select
          className="lc-select"
          value={controlState}
          onChange={(e) => setControlState(e.target.value)}
          disabled
        >
          {CONTROL_STATE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Control Mode - Writable */}
      <div className='lc-row'>
        <label className="lc-label">
          <input
            type="checkbox"
            checked={selected.has(4)}
            onChange={() => toggleCheckbox(4)}
            style={{ marginRight: '10px' }}
          />
          Control Mode:
        </label>
        <select
          className="lc-select"
          value={controlMode}
          onChange={(e) => setControlMode(e.target.value)}
        >
          {CONTROL_MODE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Method - Executable */}
      <div className='lc-row'>
        <label className="lc-label">
          <input
            type="checkbox"
            checked={selected.has(5)}
            onChange={() => toggleCheckbox(5)}
            style={{ marginRight: '10px' }}
          />
          Method:
        </label>
        <select
          className="lc-select"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {METHOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          {error}
        </div>
      )}

      {/* Results display - Removed completely, only alert messages for write operations */}

      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Disconnect Control Operation"
      />
    </div>
  );
};




const LoadControlRelated1 = () => {
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
      const response = await axios.get(`${BASE_URL}/meter1/api/getmeterinfo/`);
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
    <div className="load-control-container">

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

const LoadControlRelated = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      checked: true,
      name: "Overload Switch Off Count",
      code: "0.0.96.50.12.255",
      codes:"{1,0-0:96.50.12.255}",
      value: "",
    },
  ]);

  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );

  useEffect(() => {
    const storedId = localStorage.getItem("selectedDeviceId");
    setDeviceId(storedId);
  }, []);

  const handleGetData = async () => {
    try {
      const payload = {
        device_id: Number(deviceId),
        action: "read_obis",
        serial_number: "Avc",
        parameters: [
          {
            obis_code: "0.0.96.50.12.255",
            attribute_index: 2,
          },
        ],
      };

      console.log("Payload:", payload);

      const response = await axios.post(
        `${BASE_URL}/api/getmeterinfo/`,
        payload
      );

      let responseData = response.data;

      if (typeof responseData === "string") {
        responseData = responseData.replace("data: ", "");
        responseData = JSON.parse(responseData);
      }

      console.log(responseData);

      const apiValue = responseData.value;

      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          value: apiValue,
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data.");
    }
  };

  return (
    <div className="load-control-container">
      <button onClick={handleGetData}>Get Data</button>

      <table className="meter-info-table" border="1">
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
              <td>{item.codes}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};





const StatusOfRelay1Configuration = ({ deviceId }) => {
   const serialNumber = localStorage.getItem('selectedSerialNumber');
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

    }
  };

  

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

   
     const relayKeyMap = {
  TopCoverOpen: "top_cover_open",
  TerminalCoverOpen: "terminal_cover_open",
  MOduleCoverOpen: "module_cover_open",
  DC_FieldDetected: "dc_field_detected",
  OverVolatge: "over_voltage",
  CurrentReverse: "current_reverse",
  NoCredit: "no_credit",
  UnderVoltage: "under_voltage",
  CT_Bypass: "ct_bypass",
  LowCredit2: "low_credit_2",
  _0_Price: "o_price",
};


const handleCurrentHistoryRelay = (backendResponse) => {
  console.log("data",backendResponse)
  const selectedKeys = backendResponse.map(
    (item) => relayKeyMap[item]
  );



  
setCheckboxes((prev) =>
    prev.map((checkbox) => ({
      ...checkbox,
      checked: selectedKeys.includes(checkbox.key),
    }))
  );
};



const ReadData = async () => {
    
    const payload={
      serial_number:serialNumber,// 
      action:"read_obis",
      parameters:[{obis_code: "0.0.96.4.0.255", attribute_index: "2"}]
    }


    ///api/create-tamper-indicate-status/

    const url=`${BASE_URL}/api/create-tamper-indicate-status/`

    try {

     // const response = await axios.post(url,payload) 
        const response = await fetch(url,
          {
            method:'POST',
            headers: { "Content-Type":'application/json'},
            body:JSON.stringify(payload)
          }, )

        console.log("111")
          
        const reader = response.body.getReader(); 

        console.log("reader",reader)

        console.log("22")
        const decoder = new TextDecoder();
        console.log("decoder",decoder)
        

        while (true) {

          console.log("33")

              const { done, value } = await reader.read(); 
              console.log(done,value)

              if (done) {
                  console.log("Stream Finished");
                  break;
              }

              const chunk = decoder.decode(value, { stream: true });

              console.log("chunk",chunk);
              const jsonString = chunk.replace("data:", "").trim();
              console.log("jsonString",jsonString)
              const data = JSON.parse(jsonString);
              handleCurrentHistoryRelay(data.value)
             
            }

    

     

    }
    catch (error) 
    {
      alert('failed to read the data ')
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
      <table style={{ margin: '0.5%' }} className='meter-info-table' border="1">
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
            <td>{`{1,0-0.96.4.0.255}`}</td>
          </tr>
        </tbody>
      </table>

      {/* Buttons to Get & Send Data */}

      <button onClick={ReadData}>Read </button>

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
  const serialNumber = localStorage.getItem('selectedSerialNumber');
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




  
 const relayKeyMap = {
  TopCoverOpen: "top_cover_open",
  TerminalCoverOpen: "terminal_cover_open",
  MOduleCoverOpen: "module_cover_open",
  DC_FieldDetected: "dc_field_detected",
  OverVolatge: "over_voltage",
  CurrentReverse: "current_reverse",
  NoCredit: "no_credit",
  UnderVoltage: "under_voltage",
  CT_Bypass: "ct_bypass",
  LowCredit2: "low_credit_2",
  _0_Price: "o_price",
};


const handleCurrentHistoryRelay = (backendResponse) => {
  console.log("data",backendResponse)
  const selectedKeys = backendResponse.map(
    (item) => relayKeyMap[item]
  );



  
setCheckboxes((prev) =>
    prev.map((checkbox) => ({
      ...checkbox,
      checked: selectedKeys.includes(checkbox.key),
    }))
  );
};



 


  // Send data to API

  //{serial_number: "avc123", action: "read_obis",…}
//action:"read_obis"
//serial_number: "avc123"
//parameters: 
//[{obis_code: "0.0.96.5.0.255", attribute_index: "2"}]


 


  

  const ReadData = async () => {
    
    const payload={
      serial_number:serialNumber,// 
      action:"read_obis",
      parameters:[{obis_code: "0.0.96.4.1.255", attribute_index: "2"}]
    }

    const url=`${BASE_URL}/api/create-tamper-indicate-status/`

    try {

     // const response = await axios.post(url,payload) 
        const response = await fetch(url,
          {
            method:'POST',
            headers: { "Content-Type":'application/json'},
            body:JSON.stringify(payload)
          }, )

        console.log("111")
          
        const reader = response.body.getReader(); 

        console.log("reader",reader)

        console.log("22")
        const decoder = new TextDecoder();
        console.log("decoder",decoder)
        

        while (true) {

          console.log("33")

              const { done, value } = await reader.read(); 
              console.log(done,value)

              if (done) {
                  console.log("Stream Finished");
                  break;
              }

              const chunk = decoder.decode(value, { stream: true });

              console.log("chunk",chunk);
              const jsonString = chunk.replace("data:", "").trim();
              console.log("jsonString",jsonString)
              const data = JSON.parse(jsonString);
              handleCurrentHistoryRelay(data.value)
             
            }

    

     

    }
    catch (error) 
    {
      alert('failed to read the data ')
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
      <table style={{ margin: '0.5%' }} className='meter-info-table' border="1">
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

      <button onClick={ReadData}>Send Data</button>

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

   const serialNumber = localStorage.getItem('selectedSerialNumber');
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
 

    const deductionKeyMap = {
  Step1_CloseDeductions: "step_1_close",
  Step2_CloseDeductions: "step_2_close",
  Step3_CloseDeductions: "step_3_close",
  Step4_CloseDeductions: "step_4_close",
  Step5_CloseDeductions: "step_5_close",
  Step6_CloseDeductions: "step_6_close",
  Step7_CloseDeductions: "step_7_close",
  Step8_CloseDeductions: "step_8_close",
  Step9_CloseDeductions: "step_9_close",
  Step10_CloseDeductions: "step_10_close",
  Disenable_Buzzer_Alarm: "disable_buzzer",
};


const handleDeductionAlarm = (backendResponse) => {
  console.log("Backend Response:", backendResponse);

  const selectedKeys = backendResponse.map(
    (item) => deductionKeyMap[item]
  );

  setCheckboxes((prev) =>
    prev.map((checkbox) => ({
      ...checkbox,
      checked: selectedKeys.includes(checkbox.key),
    }))
  );
};


const ReadData = async () => {
    
    const payload={
      serial_number:serialNumber,// 
      action:"read_obis",
      parameters:[{obis_code: "0.0.96.4.2.255", attribute_index: "2"}]
    }

    //const url=`${BASE_URL}/api/test-charge-stream/`
    const url=`${BASE_URL}/api/create-tamper-indicate-status/`

    try {

     // const response = await axios.post(url,payload) 
        const response = await fetch(url,
          {
            method:'POST',
            headers: { "Content-Type":'application/json'},
            body:JSON.stringify(payload)
          }, )

        console.log("111")
          
        const reader = response.body.getReader(); 

        console.log("reader",reader)

        console.log("22")
        const decoder = new TextDecoder();
        console.log("decoder",decoder)
        

        while (true) {

          console.log("33")

              const { done, value } = await reader.read(); 
              console.log(done,value)

              if (done) {
                  console.log("Stream Finished");
                  break;
              }

              const chunk = decoder.decode(value, { stream: true });

              console.log("chunk",chunk);
              const jsonString = chunk.replace("data:", "").trim();
              console.log("jsonString",jsonString)
              const data = JSON.parse(jsonString);
              handleDeductionAlarm(data.value)
             
            }

    

     

    }
    catch (error) 
    {
      alert('failed to read the data ')
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
      <table style={{ margin: '0.5%' }} className='meter-info-table' border="1">
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

      <button onClick={ReadData}>Read </button>

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

  const containerRef = useRef(null);
  const underlineRef = useRef(null);
  const buttonRefs = useRef({});


  const relayTabs = [
    { key: "relay1", label: "Status of Relay 1" },
    { key: "relay2", label: "Status of Relay 2" },
    { key: "beep", label: "Beep Control Filter" },
  ];



  const movingTimeout = useRef(null);

  const moveUnderlineTo = (key) => {
    const btn = buttonRefs.current[key];
    const container = containerRef.current;
    const u = underlineRef.current;
    if (!btn || !container || !u) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const left = btnRect.left - containerRect.left;
    const width = btnRect.width;

    u.style.transform = `translateX(${left}px)`;
    u.style.width = `${Math.max(36, width)}px`;

    u.classList.add("moving");
    clearTimeout(movingTimeout.current);
    movingTimeout.current = setTimeout(() => u.classList.remove("moving"), 520);
  };

  useEffect(() => {
    // initial position + move on  change

    setTimeout(() => moveUnderlineTo(activeComponent), 20);

    const onResize = () => moveUnderlineTo(activeComponent);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(movingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeComponent]);
  // Function to toggle between different credit types


  return (
    <div className="load-control-container">


      {/* Buttons to display respective components */}
      <div
        style={{ marginLeft: "2%" }}
        className="controlsGroup_tabs"
        ref={containerRef}
        role="tablist"
        aria-label="Relay Controls"
      >
        {relayTabs.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => (buttonRefs.current[tab.key] = el)}
            className={`tou_button ${activeComponent === tab.key ? "activeButton" : ""
              }`}
            onClick={() => setActiveComponent(tab.key)}
            type="button"
            role="tab"
            aria-pressed={activeComponent === tab.key}
          >
            {tab.label}
          </button>
        ))}

        <div ref={underlineRef} className="underline" aria-hidden="true" />
      </div>

      {/* Conditional Rendering of Components */}

      {activeComponent === "relay1" && <StatusOfRelay1Configuration deviceId={deviceId} />}
      {activeComponent === "relay2" && <StatusOfRelay2Configuration deviceId={deviceId} />}
      {activeComponent === "beep" && <BeepControlFilter deviceId={deviceId} />}

    </div>
  );
};





const Relay = () => {
  const [activeComponent, setActiveComponent] = useState("loadControl");

  return (
    <div className="relay-container">


      {/* Buttons to display respective components */}
      <div
        className="view-toggle"
        role="tablist"
        aria-label="Control sections"
      >
        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "loadControl"}
          className={`view-btn ${activeComponent === "loadControl" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("loadControl")}
        >
          Load Control
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "disconnect"}
          className={`view-btn ${activeComponent === "disconnect" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("disconnect")}
        >
          Disconnect Control
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "loadRelated"}
          className={`view-btn ${activeComponent === "loadRelated" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("loadRelated")}
        >
          Load Control Related
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "controlConfig"}
          className={`view-btn ${activeComponent === "controlConfig" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("controlConfig")}
        >
          Control Configuration
        </button>
      </div>

      {/* Conditional Rendering of Components */}
      <div className="component-display">
        {activeComponent === "loadControl" && <LoadControlNew />}
        {activeComponent === "disconnect" && <DisconnectControlNew />}
        {activeComponent === "loadRelated" && <LoadControlRelated />}
        {activeComponent === "controlConfig" && <ControlConfiguration />}
      </div>
    </div>
  );
};

export default Relay;

