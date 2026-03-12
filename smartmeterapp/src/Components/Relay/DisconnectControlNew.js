import React, { useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../apiConfig';
import ProgressModal from '../ProgressModal';

const DisconnectControlNew = () => {
  const serialNumber = localStorage.getItem('selectedSerialNumber');
  
  // Checkbox selections
  const [selected, setSelected] = useState(new Set());
  
  // Dropdown values
  const [relaySelect, setRelaySelect] = useState("Disconnect control (Main relay)");
  const [outputState, setOutputState] = useState("0");
  const [controlState, setControlState] = useState("0");
  const [controlMode, setControlMode] = useState("0");
  const [method, setMethod] = useState("2");
  
  // Relay test values
  const [testTimes, setTestTimes] = useState(1);
  const [holdConnection, setHoldConnection] = useState(5000);
  const [holdDisconnection, setHoldDisconnection] = useState(5000);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const OBIS_CODE = "0.0.96.3.10.255";

  // Dropdown options
  const OUTPUT_STATE_OPTIONS = [
    { value: "0", label: "Disconnected" },
    { value: "1", label: "Connected" },
    { value: "2", label: "Ready for reconnection" }
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
    { value: "0", label: "(0) Reconnected" },
    { value: "1", label: "(1) Disconnected" }
  ];

  // Image mapping for control modes (you can add actual image paths here)
  const CONTROL_MODE_IMAGES = {
    "0": require("../../assets/mode0.png"),
    "1": require("../../assets/mode1.png"),
    "2": require("../../assets/mode2.png"),
    "3": require("../../assets/mode3.png"),
    "4": require("../../assets/mode4.png"),
    "5": require("../../assets/mode5.png"),
    "6": require("../../assets/mode6.png")
  };

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

  // Handle Remote Connect (Method 2)
  const handleRemoteConnect = async () => {
    setLoading(true);
    setShowProgressModal(true);
    try {
      await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
        serial_number: serialNumber,
        action: "execute_method",
        parameters: {
          obis_code: OBIS_CODE,
          method_index: "2",
          data: 0
        }
      });
      alert('Remote Connect executed successfully');
    } catch (e) {
      alert(`Remote Connect failed: ${e.message}`);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };

  // Handle Remote Disconnect (Method 1)
  const handleRemoteDisconnect = async () => {
    setLoading(true);
    setShowProgressModal(true);
    try {
      await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
        serial_number: serialNumber,
        action: "execute_method",
        parameters: {
          obis_code: OBIS_CODE,
          method_index: "1",
          data: 0
        }
      });
      alert('Remote Disconnect executed successfully');
    } catch (e) {
      alert(`Remote Disconnect failed: ${e.message}`);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };

  // Handle Refresh (Simple relay refresh)
  const handleRefresh = async () => {
    setLoading(true);
    setShowProgressModal(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
        serial_number: serialNumber,
        action: "refresh_relay"
      });

      alert('Refresh completed successfully');
    } catch (e) {
      alert(`Refresh failed: ${e.message}`);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };

  // State for relay test results
  const [relayTestResults, setRelayTestResults] = useState({ total: 0, failed: 0, successful: 0 });
  const [relayTestLog, setRelayTestLog] = useState([]);

  // Handle Relay Test
  const handleRelayTest = async () => {
    if (!serialNumber) {
      setError('No serial number selected');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setShowProgressModal(true);
    setRelayTestLog([]); // Clear previous log
    
    let totalTests = 0;
    let failedTests = 0;
    let successfulTests = 0;
    const logEntries = [];

    try {
      // First, read the current Control State (attribute 3)
      const stateResponse = await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
        serial_number: serialNumber,
        action: "read_obis",
        parameters: [{ obis_code: OBIS_CODE, attribute_index: "3" }]
      });

      // Parse the Control State response
      let currentControlState = null;
      if (typeof stateResponse.data === 'string') {
        const lines = stateResponse.data.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            try {
              const jsonStr = line.substring(5).trim();
              const parsed = JSON.parse(jsonStr);
              if (parsed.status === 'success' && parsed.action === 'read') {
                currentControlState = parseInt(parsed.value);
                break;
              }
            } catch (e) {
              console.warn("Failed to parse line:", line, e);
            }
          }
        }
      }

      if (currentControlState === null) {
        throw new Error('Failed to read current Control State');
      }

      // Determine the starting action based on current state
      let startingAction;
      if (currentControlState === 0) { // Disconnected
        startingAction = "2"; // Start with Reconnect
      } else if (currentControlState === 1) { // Connected
        startingAction = "1"; // Start with Disconnect
      } else if (currentControlState === 2) { // Ready for reconnection
        startingAction = "2"; // Start with Reconnect
      } else {
        throw new Error(`Unknown Control State: ${currentControlState}`);
      }

      // Perform the relay test cycles
      for (let i = 0; i < testTimes; i++) {
        totalTests++;
        
        // Determine current action (alternate between disconnect and reconnect)
        let currentAction;
        if (i === 0) {
          currentAction = startingAction;
        } else {
          // Alternate actions
          currentAction = (i % 2 === 0) ? startingAction : (startingAction === "1" ? "2" : "1");
        }

        const actionName = currentAction === "1" ? "Remote Disconnect" : "Remote Reconnect";
        
        try {
          // Execute the method
          await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
            serial_number: serialNumber,
            action: "execute_method",
            parameters: {
              obis_code: OBIS_CODE,
              method_index: currentAction,
              data: 0
            }
          });

          // Wait for the appropriate hold time
          const holdTime = currentAction === "1" ? holdDisconnection : holdConnection;
          await new Promise(resolve => setTimeout(resolve, holdTime));

          successfulTests++;
          logEntries.push({ action: actionName, success: true });
          setRelayTestLog([...logEntries]);
        } catch (e) {
          console.error(`Test ${i + 1} failed:`, e);
          failedTests++;
          logEntries.push({ action: actionName, success: false });
          setRelayTestLog([...logEntries]);
        }
      }

      // Update results state
      const results = { total: totalTests, failed: failedTests, successful: successfulTests };
      setRelayTestResults(results);

      alert(`Relay test completed: ${results.total}/${results.failed}/${results.successful} (Total/Failed/Successful)`);
    } catch (e) {
      setError(`Relay test failed: ${e.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
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

    try {
      const response = await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
        serial_number: serialNumber,
        action: "read_obis",
        parameters
      });

      // Parse SSE response
      let actualData = response.data;
      if (typeof actualData === 'string') {
        const lines = actualData.split('\n');
        const parsedResults = [];
        
        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            try {
              const jsonStr = line.substring(5).trim();
              const parsed = JSON.parse(jsonStr);
              if (parsed.status === 'success' && parsed.action === 'read') {
                parsedResults.push(parsed);
              }
            } catch (e) {
              console.warn("Failed to parse line:", line, e);
            }
          }
        }
        
        // Update dropdown values
        parsedResults.forEach(item => {
          const attrIdx = parseInt(item.attribute_index);
          let value = item.value;
          if (typeof value === 'boolean') {
            value = value ? 1 : 0;
          }
          
          if (attrIdx === 2) setOutputState(String(value));
          if (attrIdx === 3) setControlState(String(value));
          if (attrIdx === 4) setControlMode(String(value));
        });
      }
      
      alert('Read completed successfully');
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

    const writeOperations = [];

    // Process selected items
    for (const idx of selected) {
      // Skip read-only attributes (Output State, Control State)
      if (idx === 2 || idx === 3) {
        continue;
      }

      if (idx === 5) {
        // Execute method
        writeOperations.push({
          type: 'method',
          methodIndex: method === "0" ? "2" : "1", // Convert to actual method numbers
          label: 'Method'
        });
      } else if (idx === 4) {
        // Write Control Mode
        writeOperations.push({
          type: 'write',
          attributeIndex: idx,
          value: controlMode,
          label: 'Control Mode'
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
      let successCount = 0;

      // Execute write operations sequentially
      for (const op of writeOperations) {
        if (op.type === 'write') {
          // Write attribute
          await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
            serial_number: serialNumber,
            action: "write_obis",
            parameters: {
              obis_code: OBIS_CODE,
              attribute_index: String(op.attributeIndex),
              value: op.value
            }
          });
          successCount++;
        } else if (op.type === 'method') {
          // Execute method
          await axios.post(`${BASE_URL}/api/getmeterinfo/`, {
            serial_number: serialNumber,
            action: "execute_method",
            parameters: {
              obis_code: OBIS_CODE,
              method_index: op.methodIndex,
              data: 0
            }
          });
          successCount++;
        }
      }

      alert(`Successfully completed ${successCount} operation(s)`);
    } catch (e) {
      setError(`Write failed: ${e.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', padding: '20px', gap: '20px' }}>
      {/* Left Panel - Image Display */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        {/* Top Icons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={handleRemoteConnect}
            disabled={loading}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
            title="Remote Connect"
          >
            🔗
          </button>
          <button
            onClick={handleRemoteDisconnect}
            disabled={loading}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              backgroundColor: '#f44336',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
            title="Remote Disconnect"
          >
            ⚡
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              backgroundColor: '#2196F3',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
            title="Refresh"
          >
            🔄
          </button>
        </div>

        {/* Image Display Area */}
        <div style={{
          flex: '1',
          border: '2px solid #ccc',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9f9f9',
          minHeight: '400px'
        }}>
          {CONTROL_MODE_IMAGES[controlMode] ? (
            <img
              src={CONTROL_MODE_IMAGES[controlMode]}
              alt={`Control Mode ${controlMode}`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <div style={{ 
            display: CONTROL_MODE_IMAGES[controlMode] ? 'none' : 'block',
            textAlign: 'center',
            color: '#666',
            fontSize: '18px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚡</div>
            <div>Control Mode {controlMode}</div>
            <div style={{ fontSize: '14px', marginTop: '10px' }}>
              Image placeholder - Add image path to CONTROL_MODE_IMAGES
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Controls */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        {/* Top Section with Relay Select and Read/Write Buttons */}
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '15px', gap: '10px' }}>
          {/* Relay Select */}
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Relay select
            </label>
            <select
              value={relaySelect}
              onChange={(e) => setRelaySelect(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="Disconnect control (Main relay)">
                Disconnect control(main relay)
              </option>
            </select>
          </div>
          
          {/* Read and Write Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
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
        </div>

        {/* Output State */}
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={selected.has(2)}
            onChange={() => toggleCheckbox(2)}
            style={{ marginRight: '10px' }}
          />
          <label style={{ marginRight: '10px', minWidth: '120px', fontWeight: 'bold' }}>
            Output state
          </label>
          <select
            value={outputState}
            onChange={(e) => setOutputState(e.target.value)}
            disabled
            style={{ 
              flex: '1', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              backgroundColor: '#f5f5f5'
            }}
          >
            {OUTPUT_STATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Control State */}
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={selected.has(3)}
            onChange={() => toggleCheckbox(3)}
            style={{ marginRight: '10px' }}
          />
          <label style={{ marginRight: '10px', minWidth: '120px', fontWeight: 'bold' }}>
            Control state
          </label>
          <select
            value={controlState}
            onChange={(e) => setControlState(e.target.value)}
            disabled
            style={{ 
              flex: '1', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              backgroundColor: '#f5f5f5'
            }}
          >
            {CONTROL_STATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Control Mode */}
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={selected.has(4)}
            onChange={() => toggleCheckbox(4)}
            style={{ marginRight: '10px' }}
          />
          <label style={{ marginRight: '10px', minWidth: '120px', fontWeight: 'bold' }}>
            Control mode
          </label>
          <select
            value={controlMode}
            onChange={(e) => setControlMode(e.target.value)}
            style={{ flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {CONTROL_MODE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Method */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={selected.has(5)}
            onChange={() => toggleCheckbox(5)}
            style={{ marginRight: '10px' }}
          />
          <label style={{ marginRight: '10px', minWidth: '120px', fontWeight: 'bold' }}>
            Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{ flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {METHOD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Test Times */}
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px', minWidth: '120px', fontWeight: 'bold' }}>
            Test Times:
          </label>
          <input
            type="number"
            value={testTimes}
            onChange={(e) => setTestTimes(parseInt(e.target.value) || 1)}
            min="1"
            style={{ flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Hold Connection */}
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px', minWidth: '120px', fontWeight: 'bold' }}>
            Hold Connection(ms):
          </label>
          <input
            type="number"
            value={holdConnection}
            onChange={(e) => setHoldConnection(parseInt(e.target.value) || 5000)}
            min="1"
            style={{ flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Hold Disconnection */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '10px', minWidth: '120px', fontWeight: 'bold' }}>
            Hold Disconnection(ms):
          </label>
          <input
            type="number"
            value={holdDisconnection}
            onChange={(e) => setHoldDisconnection(parseInt(e.target.value) || 5000)}
            min="1"
            style={{ flex: '1', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Relay Test Log - Scrollable Area */}
        <div style={{
          marginBottom: '20px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          minHeight: '150px',
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: '#f9f9f9'
        }}>
          {relayTestLog.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', paddingTop: '50px' }}>
              No test results yet
            </div>
          ) : (
            relayTestLog.map((entry, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px',
                  marginBottom: '5px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}
              >
                <span style={{ fontSize: '18px' }}>
                  {entry.success ? '✅' : '❌'}
                </span>
                <span style={{ color: entry.success ? '#4CAF50' : '#f44336' }}>
                  {entry.action}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Status Display */}
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
          {relayTestResults.total > 0 
            ? `${relayTestResults.total}/${relayTestResults.failed}/${relayTestResults.successful}`
            : '0/0/0'
          }
        </div>

        {/* Relay Test Button */}
        <button
          onClick={handleRelayTest}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Relay Test'}
        </button>

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
      
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Disconnect Control Operation"
      />
    </div>
  );
};

export default DisconnectControlNew;