import React, { useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../apiConfig';
import ProgressModal from '../ProgressModal';
import './index.css'
import { PERMISSIONS } from '../../permissions';

const DisconnectControlNew = () => {
  const serialNumber = localStorage.getItem('selectedSerialNumber');

  const role = localStorage.getItem('userRole');
  const perms = PERMISSIONS[role] || {};

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
  const [isReading, setIsReading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
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

    //setLoading(true);
    setIsReading(true);
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
      //setLoading(false);
      setIsReading(false);
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
      //setLoading(false);
      setIsReading(false);
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

    //setLoading(true);
    setIsWriting(true);
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
      //setLoading(false);
      setIsWriting(false);
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
      //setLoading(false);
      setIsWriting(false);
      setShowProgressModal(false);
    }
  };

  return (
    <div className="relay-container1">

      {/* LEFT PANEL */}
  <div  className="relay-left">

        {/* Top Icons */}
        <div className="relay-icons">

          <button
            onClick={handleRemoteConnect}
            disabled={loading}
            className="relay-icon-btn connect"
            title="Remote Connect"
          >
            🔗
          </button>

          <button
            onClick={handleRemoteDisconnect}
            disabled={loading}
            className="relay-icon-btn disconnect"
            title="Remote Disconnect"
          >
            ⚡
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="relay-icon-btn refresh"
            title="Refresh"
          >
            🔄
          </button>

        </div>


        {/* Image Area */}
        <div className="relay-image-area">

          {CONTROL_MODE_IMAGES[controlMode] ? (
            <img
              src={CONTROL_MODE_IMAGES[controlMode]}
              alt={`Control Mode ${controlMode}`}
              className="relay-image"
            />
          ) : (
            <div className="relay-placeholder">

              <div className="relay-placeholder-icon">⚡</div>

              <div>Control Mode {controlMode}</div>

              <div className="relay-placeholder-text">
                Image placeholder - Add image path to CONTROL_MODE_IMAGES
              </div>

            </div>
          )}

        </div>

      </div>



      {/* RIGHT PANEL */}
  <div  className="relay-right">


        <div className="relay-btn-group">




          <button className="lc-btn lc-btn-read" onClick={handleRead} disabled={isReading || isWriting}>
            {isReading ? "Reading..." : "Read"}
          </button>

          {perms.writeMeter && (
            <button className="lc-btn lc-btn-write" onClick={handleWrite} disabled={isReading || isWriting}>
              {isWriting ? "Writing..." : "Write"}
            </button>
          )}

        </div>


        {/* Relay Select */}
        <div className="relay-top">


          <div className="relay-select-box">

            <label className="relay-label">
              Relay select
            </label>

            <select
              value={relaySelect}
              onChange={(e) => setRelaySelect(e.target.value)}
              className="relay-select"
            >
              <option value="Disconnect control (Main relay)">
                Disconnect control(main relay)
              </option>
            </select>

          </div>





        </div>



        {/* Output state */}
        <div className="relay-row">

          <input
            type="checkbox"
            checked={selected.has(2)}
            onChange={() => toggleCheckbox(2)}
          />

          <label className="relay-field-label">
            Output state
          </label>

          <select
            value={outputState}
            disabled
            className="relay-select disabled"
          >
            {OUTPUT_STATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

        </div>



        {/* Control state */}
        <div className="relay-row">

          <input
            type="checkbox"
            checked={selected.has(3)}
            onChange={() => toggleCheckbox(3)}
          />

          <label className="relay-field-label">
            Control state
          </label>

          <select
            value={controlState}
            disabled
            className="relay-select disabled"
          >
            {CONTROL_STATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

        </div>



        {/* Control mode */}
        <div className="relay-row">

          <input
            type="checkbox"
            checked={selected.has(4)}
            onChange={() => toggleCheckbox(4)}
          />

          <label className="relay-field-label">
            Control mode
          </label>

          <select
            value={controlMode}
            onChange={(e) => setControlMode(e.target.value)}
            className="relay-select"
          >
            {CONTROL_MODE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

        </div>



        {/* Method */}
        <div className="relay-row">

          <input
            type="checkbox"
            checked={selected.has(5)}
            onChange={() => toggleCheckbox(5)}
          />

          <label className="relay-field-label">
            Method
          </label>

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="relay-select"
          >
            {METHOD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

        </div>



        {/* Test Times */}
        <div className="relay-row">
          <label className="relay-field-label">
            Test Times
          </label>

          <input
            type="number"
            value={testTimes}
            onChange={(e) => setTestTimes(parseInt(e.target.value) || 1)}
            className="relay-input"
          />
        </div>



        {/* Hold Connection */}
        <div className="relay-row">
          <label className="relay-field-label">
            Hold Connection(ms)
          </label>

          <input
            type="number"
            value={holdConnection}
            onChange={(e) => setHoldConnection(parseInt(e.target.value) || 5000)}
            className="relay-input"
          />
        </div>



        {/* Hold Disconnection */}
        <div className="relay-row">
          <label className="relay-field-label">
            Hold Disconnection(ms)
          </label>

          <input
            type="number"
            value={holdDisconnection}
            onChange={(e) => setHoldDisconnection(parseInt(e.target.value) || 5000)}
            className="relay-input"
          />
        </div>



        {/* Log Area */}
        <div className="relay-log">

          {relayTestLog.length === 0 ? (

            <div className="relay-log-empty">
              No test results yet
            </div>

          ) : (

            relayTestLog.map((entry, index) => (

              <div key={index} className="relay-log-item">

                <span className="relay-log-icon">
                  {entry.success ? "✅" : "❌"}
                </span>

                <span className={entry.success ? "success" : "fail"}>
                  {entry.action}
                </span>

              </div>

            ))

          )}

        </div>



        {/* Status */}
        <div className="relay-status">

          {relayTestResults.total > 0
            ? `${relayTestResults.total}/${relayTestResults.failed}/${relayTestResults.successful}`
            : "0/0/0"}

        </div>


        <div>
          {/* Relay Test */}
          <button
            onClick={handleRelayTest}
            disabled={loading}
            className="relay-test-btn"
          >
            {loading ? "Testing..." : "Relay Test"}
          </button>
        </div>



        {error && (
          <div className="lc-error">
            {error}
          </div>
        )}



      </div>



    </div>
  );
};

export default DisconnectControlNew;