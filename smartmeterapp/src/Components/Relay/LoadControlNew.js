import React, { useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../apiConfig';
import ProgressModal from '../ProgressModal';
import './index.css'
const monthNames = [
  "Every Month", "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const LoadControlNew = () => {
  const serialNumber = localStorage.getItem('selectedSerialNumber');
  
  // OBIS Code for Class 71 Limiter
  const OBIS_CODE = "0.0.17.0.0.255";
  
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
    actionOverThreshold: 'No action',
    actionUnderThreshold: 'No action'
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

  // Helper functions
  const extractObisCode = (monitoredValue) => {
    // Match any OBIS pattern with mixed separators
    const obisMatch = monitoredValue.match(/(\d+[.\-:]\d+[.\-:]\d+[.\-:]\d+[.\-:]\d+[.\-:]\d+)/);
    if (obisMatch) {
      // Normalize to dots for lookup
      return obisMatch[1].replace(/[-:]/g, '.');
    }
    return null;
  };

  // OBIS mapping from BillingSection - comprehensive mapping including all sections
  const OBIS_MAPPING = {
    // Active Energy
    '1.0.1.8.0.255': 'Active energy import (+A)',
    '1.0.1.8.1.255': 'Active energy import (+A) rate 1',
    '1.0.1.8.2.255': 'Active energy import (+A) rate 2',
    '1.0.1.8.3.255': 'Active energy import (+A) rate 3',
    '1.0.1.8.4.255': 'Active energy import (+A) rate 4',
    '1.0.2.8.0.255': 'Active energy export (-A)',
    '1.0.2.8.1.255': 'Active energy export (-A) rate 1',
    '1.0.2.8.2.255': 'Active energy export (-A) rate 2',
    '1.0.2.8.3.255': 'Active energy export (-A) rate 3',
    '1.0.2.8.4.255': 'Active energy export (-A) rate 4',
    '1.0.15.8.0.255': 'Active energy combined total (+A)+(-A)',
    '1.0.15.8.1.255': 'Active energy combined total (+A)+(-A) rate 1',
    '1.0.15.8.2.255': 'Active energy combined total (+A)+(-A) rate 2',
    '1.0.15.8.3.255': 'Active energy combined total (+A)+(-A) rate 3',
    '1.0.15.8.4.255': 'Active energy combined total (+A)+(-A) rate 4',
    '1.0.16.8.0.255': 'Active energy combined total (+A)-(-A)',
    '1.0.16.8.1.255': 'Active energy combined total (+A)-(-A) rate 1',
    '1.0.16.8.2.255': 'Active energy combined total (+A)-(-A) rate 2',
    '1.0.16.8.3.255': 'Active energy combined total (+A)-(-A) rate 3',
    '1.0.16.8.4.255': 'Active energy combined total (+A)-(-A) rate 4',
    '1.0.96.5.7.255': 'Active energy combined total (Prepay mode)',
    '1.0.96.5.1.255': 'Active energy combined total (Postpay mode)',

    // Reactive Energy
    '1.0.3.8.0.255': 'Reactive energy import (+R)',
    '1.0.3.8.1.255': 'Reactive energy import (+R) rate 1',
    '1.0.3.8.2.255': 'Reactive energy import (+R) rate 2',
    '1.0.3.8.3.255': 'Reactive energy import (+R) rate 3',
    '1.0.3.8.4.255': 'Reactive energy import (+R) rate 4',
    '1.0.4.8.0.255': 'Reactive energy export (-R)',
    '1.0.4.8.1.255': 'Reactive energy export (-R) rate 1',
    '1.0.4.8.2.255': 'Reactive energy export (-R) rate 2',
    '1.0.4.8.3.255': 'Reactive energy export (-R) rate 3',
    '1.0.4.8.4.255': 'Reactive energy export (-R) rate 4',
    '1.0.5.8.0.255': 'Reactive energy QI (+Ri)',
    '1.0.5.8.1.255': 'Reactive energy QI (+Ri) rate 1',
    '1.0.5.8.2.255': 'Reactive energy QI (+Ri) rate 2',
    '1.0.5.8.3.255': 'Reactive energy QI (+Ri) rate 3',
    '1.0.5.8.4.255': 'Reactive energy QI (+Ri) rate 4',
    '1.0.6.8.0.255': 'Reactive energy QII (+Rc)',
    '1.0.6.8.1.255': 'Reactive energy QII (+Rc) rate 1',
    '1.0.6.8.2.255': 'Reactive energy QII (+Rc) rate 2',
    '1.0.6.8.3.255': 'Reactive energy QII (+Rc) rate 3',
    '1.0.6.8.4.255': 'Reactive energy QII (+Rc) rate 4',
    '1.0.7.8.0.255': 'Reactive energy QIII (-Ri)',
    '1.0.7.8.1.255': 'Reactive energy QIII (-Ri) rate 1',
    '1.0.7.8.2.255': 'Reactive energy QIII (-Ri) rate 2',
    '1.0.7.8.3.255': 'Reactive energy QIII (-Ri) rate 3',
    '1.0.7.8.4.255': 'Reactive energy QIII (-Ri) rate 4',
    '1.0.8.8.0.255': 'Reactive energy QIV (-Rc)',
    '1.0.8.8.1.255': 'Reactive energy QIV (-Rc) rate 1',
    '1.0.8.8.2.255': 'Reactive energy QIV (-Rc) rate 2',
    '1.0.8.8.3.255': 'Reactive energy QIV (-Rc) rate 3',
    '1.0.8.8.4.255': 'Reactive energy QIV (-Rc) rate 4',

    // Apparent Energy
    '1.0.9.8.0.255': 'Apparent energy import (+VA)',
    '1.0.9.8.1.255': 'Apparent energy import (+VA) rate 1',
    '1.0.9.8.2.255': 'Apparent energy import (+VA) rate 2',
    '1.0.9.8.3.255': 'Apparent energy import (+VA) rate 3',
    '1.0.9.8.4.255': 'Apparent energy import (+VA) rate 4',
    '1.0.10.8.0.255': 'Apparent energy export (-VA)',
    '1.0.10.8.1.255': 'Apparent energy export (-VA) rate 1',
    '1.0.10.8.2.255': 'Apparent energy export (-VA) rate 2',
    '1.0.10.8.3.255': 'Apparent energy export (-VA) rate 3',
    '1.0.10.8.4.255': 'Apparent energy export (-VA) rate 4',

    // Instantaneous Values
    '1.0.32.7.0.255': 'Instantaneous voltage L1',
    '1.0.32.24.0.255': 'Average voltage L1',
    '1.0.31.7.0.255': 'Instantaneous current L1',
    '1.0.91.7.0.255': 'Instantaneous current L0',
    '1.0.31.24.0.255': 'Average current L1',
    '1.0.31.40.0.250': 'Sliding average current L1',
    '1.0.1.7.0.255': 'Instantaneous import active power (+A)',
    '1.0.2.7.0.255': 'Instantaneous export active power (-A)',
    '1.0.15.7.0.255': 'Instantaneous active power (+A/-A)',
    '1.0.3.7.0.255': 'Instantaneous import reactive power (+R)',
    '1.0.4.7.0.255': 'Instantaneous export reactive power (-R)',
    '1.0.9.7.0.255': 'Instantaneous import apparent power (+VA)',
    '1.0.10.7.0.255': 'Instantaneous export apparent power (-VA)',
    '1.0.13.7.0.255': 'Instantaneous power factor (+A/+VA)',
    '1.0.14.7.0.255': 'Instantaneous supply frequency',
    '1.0.96.8.0.255': 'External battery voltage',

  
};

  const getObisDisplayName = (obisCode) => {
    if (!obisCode) return "Unknown OBIS";
    
    // Normalize the OBIS code (handle different separators)
    const normalizedObis = obisCode.replace(/[-:]/g, '.');
    
    // Try direct lookup first
    if (OBIS_MAPPING[normalizedObis]) {
      return OBIS_MAPPING[normalizedObis];
    }
    
    // Try removing leading zeros from each part
    const parts = normalizedObis.split('.');
    const cleanParts = parts.map(part => part.replace(/^0+/, '') || '0');
    const cleanObis = cleanParts.join('.');
    
    if (OBIS_MAPPING[cleanObis]) {
      return OBIS_MAPPING[cleanObis];
    }
    
    // Try with leading zeros added back to match standard format
    const paddedParts = parts.map(part => part.padStart(3, '0'));
    const paddedObis = paddedParts.join('.');
    
    if (OBIS_MAPPING[paddedObis]) {
      return OBIS_MAPPING[paddedObis];
    }
    
    // Return the original OBIS code if no mapping found
    return obisCode;
  };

  const parseActions = (actionsArray) => {
    if (!actionsArray || actionsArray.length < 2) {
      return {
        actionOverThreshold: '-',
        actionUnderThreshold: '-'
      };
    }
    
    // Extract method numbers from "0.0.10.0.107.255 1" format
    const overThresholdMethod = actionsArray[0].split(' ')[1]; // "1"
    const underThresholdMethod = actionsArray[1].split(' ')[1]; // "1"
    
    return {
      actionOverThreshold: getOverThresholdActionName(overThresholdMethod),
      actionUnderThreshold: getUnderThresholdActionName(underThresholdMethod)
    };
  };

  const getOverThresholdActionName = (method) => {
    switch(method) {
      case "0": return "No action";
      case "1": return "Set ready for reconnection";
      default: return "-";
    }
  };

  const getUnderThresholdActionName = (method) => {
    switch(method) {
      case "0": return "No action";
      case "2": return "Set connected";
      default: return "-";
    }
  };

  const getOverThresholdMethodNumber = (actionName) => {
    switch(actionName) {
      case "No action": return "0";
      case "Set ready for reconnection": return "1";
      default: return "0";
    }
  };

  const getUnderThresholdMethodNumber = (actionName) => {
    switch(actionName) {
      case "No action": return "0";
      case "Set connected": return "2";
      default: return "0";
    }
  };

  const parseEmergencyProfile = (profileString) => {
    // Parse "0 04/26/18 08:14:03 0" format
    if (!profileString) return { id: 0, time: '', duration: 0 };
    
    const parts = profileString.trim().split(' ');
    if (parts.length >= 3) {
      return {
        id: parseInt(parts[0]) || 0,
        time: parts.length >= 3 ? `${parts[1]} ${parts[2]}` : '',
        duration: parseInt(parts[3]) || 0
      };
    }
    return { id: 0, time: '', duration: 0 };
  };

  const formatEmergencyProfile = () => {
    // Format as "id time duration"
    return `${formData.emergencyProfileId} ${formData.emergencyActivationTime} ${formData.emergencyDuration}`;
  };

  const formatActions = () => {
    const overMethod = getOverThresholdMethodNumber(formData.actionOverThreshold);
    const underMethod = getUnderThresholdMethodNumber(formData.actionUnderThreshold);
    
    return [
      `0.0.10.0.107.255 ${overMethod}`,
      `0.0.10.0.107.255 ${underMethod}`
    ];
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    
    // Handle action dropdowns - prevent setting "-" as value, default to "No action"
    if ((name === 'actionOverThreshold' || name === 'actionUnderThreshold') && value === '-') {
      setFormData({
        ...formData,
        [name]: 'No action'
      });
      return;
    }
    
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
      // Build parameters for selected attributes (2-11)
      const parameters = Array.from(selected).map(idx => ({
        obis_code: OBIS_CODE,
        attribute_index: String(idx + 1) // Convert 1-10 to 2-11
      }));

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
        
        // Update form data based on parsed results
        const newFormData = { ...formData };
        
        parsedResults.forEach(item => {
          const attrIdx = parseInt(item.attribute_index);
          const value = item.value;
          
          switch(attrIdx) {
            case 2: // Monitored value
              const obisCode = extractObisCode(value);
              newFormData.monitoredValueText = getObisDisplayName(obisCode) || value;
              break;
            case 3: // Threshold active
              newFormData.thresholdActive = parseFloat(value) || 0;
              break;
            case 4: // Threshold normal
              newFormData.thresholdNormal = parseFloat(value) || 0;
              break;
            case 5: // Threshold emergency
              newFormData.thresholdEmergency = parseFloat(value) || 0;
              break;
            case 6: // Min over threshold duration
              newFormData.minOverThresholdDuration = parseInt(value) || 0;
              break;
            case 7: // Min under threshold duration
              newFormData.minUnderThresholdDuration = parseInt(value) || 0;
              break;
            case 8: // Emergency profile
              const profile = parseEmergencyProfile(value);
              newFormData.emergencyProfileId = profile.id;
              newFormData.emergencyActivationTime = profile.time;
              newFormData.emergencyDuration = profile.duration;
              break;
            case 9: // Emergency profile group id list
              if (Array.isArray(value)) {
                newFormData.emergencyProfileGroupIds = value.join(',');
              } else {
                newFormData.emergencyProfileGroupIds = String(value);
              }
              break;
            case 10: // Emergency profile active
              newFormData.emergencyProfileActive = value ? 'Enable' : 'Disable';
              break;
            case 11: // Actions
              if (Array.isArray(value)) {
                const actions = parseActions(value);
                // If actions return "-", keep them as "-" for display but don't allow selection
                newFormData.actionOverThreshold = actions.actionOverThreshold;
                newFormData.actionUnderThreshold = actions.actionUnderThreshold;
              }
              break;
          }
        });
        
        setFormData(newFormData);
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

    try {
      const writeOperations = [];

      // Process selected items (skip locked attributes 2, 3, 10)
      for (const idx of selected) {
        const attrIdx = idx + 1; // Convert 1-10 to 2-11
        
        // Skip locked attributes
        if (attrIdx === 2 || attrIdx === 3 || attrIdx === 10) {
          continue;
        }

        let value;
        switch(attrIdx) {
          case 4: // Threshold normal
            value = formData.thresholdNormal;
            break;
          case 5: // Threshold emergency
            value = formData.thresholdEmergency;
            break;
          case 6: // Min over threshold duration
            value = formData.minOverThresholdDuration;
            break;
          case 7: // Min under threshold duration
            value = formData.minUnderThresholdDuration;
            break;
          case 8: // Emergency profile
            value = formatEmergencyProfile();
            break;
          case 9: // Emergency profile group id list
            value = formData.emergencyProfileGroupIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            break;
          case 11: // Actions
            // Only write if actions are not "-" (unmapped)
            if (formData.actionOverThreshold !== '-' && formData.actionUnderThreshold !== '-') {
              value = formatActions();
            } else {
              continue; // Skip writing if actions are unmapped
            }
            break;
          default:
            continue;
        }

        writeOperations.push({
          obis_code: OBIS_CODE,
          attribute_index: String(attrIdx),
          value: value
        });
      }

      if (writeOperations.length === 0) {
        setError('No writable attributes selected. Monitored value, Threshold active, and Emergency profile active are read-only.');
        setLoading(false);
        setShowProgressModal(false);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Use batch write with SSE streaming
      const response = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: serialNumber,
          action: "write_obis",
          parameters: writeOperations // Send as array for batch processing
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle SSE streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
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
            console.log("Write progress:", msg);
            
            if (msg.status === "success") {
              successCount++;
            } else if (msg.status === "error") {
              errorCount++;
              console.error(`Error writing ${msg.obis_code}: ${msg.message}`);
            }
          } catch (e) {
            console.warn("Failed to parse SSE message:", chunk, e);
          }
        }
      }

      if (errorCount === 0) {
        alert(`Successfully wrote ${successCount} attribute(s)`);
      } else if (successCount > 0) {
        alert(`Partial success: ${successCount} succeeded, ${errorCount} failed. Check console for details.`);
      } else {
        alert(`Failed to write attributes. ${errorCount} errors occurred.`);
      }

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
     <div className="lc-container"> 


<div>

  {/* Header */}
  <div className="lc-header">
    <button
      onClick={handleRead}
      disabled={loading}
      className="lc-btn lc-btn-read"
    >
      {loading ? "Reading..." : "Read"}
    </button>

    <button
      onClick={handleWrite}
      disabled={loading}
      className="lc-btn lc-btn-write"
    >
      {loading ? "Writing..." : "Write"}
    </button>
  </div>


  {/* Table */}
  <div className="lc-table">

    {/* Monitored value */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(1)}
          onChange={() => toggleCheckbox(1)}
        />
      </div>

      <div className="lc-label locked">
        Monitored value
      </div>

      <div className="lc-input-area">
        <input
          type="text"
          value={formData.monitoredValueText}
          readOnly
          className="lc-input readonly"
        />
      </div>
    </div>


    {/* Threshold active */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(2)}
          onChange={() => toggleCheckbox(2)}
        />
      </div>

      <div className="lc-label locked">
        Threshold active
      </div>

      <div className="lc-input-area">
        <input
          type="number"
          value={formData.thresholdActive}
          readOnly
          className="lc-input readonly"
        />
      </div>
    </div>


    {/* Threshold normal */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(3)}
          onChange={() => toggleCheckbox(3)}
        />
      </div>

      <div className="lc-label">
        Threshold normal
      </div>

      <div className="lc-input-area">
        <input
          type="number"
          name="thresholdNormal"
          value={formData.thresholdNormal}
          onChange={handleChange}
          className="lc-input"
        />
      </div>
    </div>


    {/* Threshold emergency */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(4)}
          onChange={() => toggleCheckbox(4)}
        />
      </div>

      <div className="lc-label">
        Threshold emergency
      </div>

      <div className="lc-input-area">
        <input
          type="number"
          name="thresholdEmergency"
          value={formData.thresholdEmergency}
          onChange={handleChange}
          className="lc-input"
        />
      </div>
    </div>


    {/* Min over threshold */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(5)}
          onChange={() => toggleCheckbox(5)}
        />
      </div>

      <div className="lc-label">
        Min over threshold duration
      </div>

      <div className="lc-input-area">
        <input
          type="number"
          name="minOverThresholdDuration"
          value={formData.minOverThresholdDuration}
          onChange={handleChange}
          className="lc-input"
        />
      </div>
    </div>


    {/* Min under threshold */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(6)}
          onChange={() => toggleCheckbox(6)}
        />
      </div>

      <div className="lc-label">
        Min under threshold duration
      </div>

      <div className="lc-input-area">
        <input
          type="number"
          name="minUnderThresholdDuration"
          value={formData.minUnderThresholdDuration}
          onChange={handleChange}
          className="lc-input"
        />
      </div>
    </div>


    {/* Emergency profile */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(7)}
          onChange={() => toggleCheckbox(7)}
        />
      </div>

      <div className="lc-label">
        Emergency profile
      </div>

      <div className="lc-input-area">

        <div className="lc-group">

          <div className="lc-sub-row">
            <span className="lc-sub-label">
              Emergency profile id
            </span>

            <input
              type="number"
              name="emergencyProfileId"
              value={formData.emergencyProfileId}
              onChange={handleChange}
              className="lc-input bordered"
            />
          </div>


          <div className="lc-sub-row">
            <span className="lc-sub-label">
              Emergency activation time
            </span>

            <input
              type="text"
              name="emergencyActivationTime"
              value={formData.emergencyActivationTime}
              readOnly
              onClick={handleTimeClick}
              className="lc-input bordered clickable"
            />
          </div>


          <div className="lc-sub-row">
            <span className="lc-sub-label">
              Emergency duration
            </span>

            <input
              type="number"
              name="emergencyDuration"
              value={formData.emergencyDuration}
              onChange={handleChange}
              className="lc-input bordered"
            />
          </div>

        </div>
      </div>
    </div>


    {/* Emergency profile group id list */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(8)}
          onChange={() => toggleCheckbox(8)}
        />
      </div>

      <div className="lc-label">
        Emergency profile group id list
      </div>

      <div className="lc-input-area">
        <input
          type="text"
          name="emergencyProfileGroupIds"
          value={formData.emergencyProfileGroupIds}
          onChange={handleChange}
          className="lc-input"
        />
      </div>
    </div>


    {/* Emergency profile active */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(9)}
          onChange={() => toggleCheckbox(9)}
        />
      </div>

      <div className="lc-label locked">
        Emergency profile active
      </div>

      <div className="lc-input-area">
        <select
          value={formData.emergencyProfileActive}
          disabled
          className="lc-input readonly"
        >
          <option>Enable</option>
          <option>Disable</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
    </div>


    {/* Actions */}
    <div className="lc-row">
      <div className="lc-checkbox">
        <input
          type="checkbox"
          checked={selected.has(10)}
          onChange={() => toggleCheckbox(10)}
        />
      </div>

      <div className="lc-label">
        Actions
      </div>

      <div className="lc-input-area">

        <div className="lc-group">

          <div className="lc-sub-row">
            <span className="lc-sub-label">
              Action over threshold
            </span>

            <select
              name="actionOverThreshold"
              value={formData.actionOverThreshold}
              onChange={handleChange}
              className="lc-input bordered"
            >
              <option>No action</option>
              <option>Set ready for reconnection</option>
            </select>
          </div>


          <div className="lc-sub-row">
            <span className="lc-sub-label">
              Action under threshold
            </span>

            <select
              name="actionUnderThreshold"
              value={formData.actionUnderThreshold}
              onChange={handleChange}
              className="lc-input bordered"
            >
              <option>No action</option>
              <option>Set connected</option>
            </select>
          </div>

        </div>
      </div>
    </div>

  </div>


  {/* Error */}
  {error && (
    <div className="lc-error">
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
                  <input type="number" value={specialYear} onChange={(e)=>setSpecialYear(e.target.value)}
                    placeholder="Year (e.g. 2026)" className="lc-input" />
                )}
              </div>

              <div className="modal-row">
                <label className="lc-label">Month</label>
                <select value={month} onChange={(e)=>setMonth(e.target.value)} className="lc-select">
                  {monthNames.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="modal-row">
                <label className="lc-label">Day</label>
                <select value={day} onChange={(e)=>setDay(e.target.value)} className="lc-select">
                  {Array.from({length:31}, (_,i)=>String(i+1)).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="modal-row time-row">
                <label className="lc-label">Time (hh:mm:ss)</label>
                <div className="time-selects">
                  <select value={hour} onChange={(e)=>setHour(e.target.value)} className="lc-select small">
                    {Array.from({length:24}, (_,i)=>String(i).padStart(2,"0")).map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                  <span>:</span>
                  <select value={minute} onChange={(e)=>setMinute(e.target.value)} className="lc-select small">
                    {Array.from({length:60}, (_,i)=>String(i).padStart(2,"0")).map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                  <span>:</span>
                  <select value={second} onChange={(e)=>setSecond(e.target.value)} className="lc-select small">
                    {Array.from({length:60}, (_,i)=>String(i).padStart(2,"0")).map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <button className="btn-primary" onClick={handleSaveTime}>Save</button>
              <button className="btn-ghost" onClick={()=>setShowTimePopup(false)}>Cancel</button>
            </footer>
          </div>
        </div>
      )}

      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Load Control Operation"
      />
      </div>
    </>

  );
};

export default LoadControlNew;