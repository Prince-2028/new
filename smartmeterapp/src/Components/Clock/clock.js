import React, { useState } from 'react';
import DatePicker from 'react-datepicker'; // You need to install 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css';
import './clock.css';
import axios from 'axios';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import { Calendar as CalendarIcon } from 'react-feather';
import { Clock } from 'lucide-react';
import ProgressModal from '../ProgressModal';

import { formatInTimeZone } from 'date-fns-tz';





const OPTIONS = [
  { label: 'Date Only (Time)', index: 2 },
  { label: 'Time Zone (min)', index: 3 },
  { label: 'Status', index: 4 },
  { label: 'Daylight Savings Begin', index: 5 },
  { label: 'Daylight Savings End', index: 6 },
  { label: 'DST Deviation (min)', index: 7 },
  { label: 'DST Enabled', index: 8 },
  { label: 'Clock Base', index: 9 },
];

function TimeSettingsChart1() {
  const [selected, setSelected] = useState(new Set());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [writeDateTime, setWriteDateTime] = useState('');
  const [writeMinutes, setWriteMinutes] = useState('');
  const [writeOffset, setWriteOffset] = useState(''); 


  const serial = 1234; // Replace with dynamic serial if needed

  const toggle = (idx) => {
    const copy = new Set(selected);
    copy.has(idx) ? copy.delete(idx) : copy.add(idx);
    setSelected(copy);
  };

  const handleWriteClick = () => {
    if (selected.size !== 1) {
      setError('Please select exactly one option to write.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setWriteDateTime('');
    setWriteMinutes('');
    setWriteOffset('');  
    setShowWriteModal(true);
  };

 

  const formatValue = (value, idx) => {
    if (value == null) return 'N/A';
    if (idx === '2' && typeof value === 'object') {
    const {
      Date: dateStr,
      Time: timeStr,
      ['Clock Status']: statusStr,
    } = value;
    return `${dateStr} ${timeStr}`;
    }
    if (idx === '5' || idx === '6') return `${value.Date} ${value.Time}`;
    if (idx === '2') return value.toString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const handleRead = async () => {
    if (!serial) {
      setError('No serial number selected');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (selected.size === 0) {
      setError('Please select at least one option');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setShowProgressModal(true);

    const parameters = Array.from(selected).map(i => ({
      obis_code: '0.0.1.0.0.255',
      attribute_index: i.toString(),
    }));

    try {
      const response = await axios.post(
        `${BASE_URL}/api/time-settings/update/`,
        {
          serial_number: serial,
          action: 'read_obis',
          parameters,
        },
        { headers: { 'Content-Type': 'application/json' },  }
      );

      const extracted = response.data.data.map(item => {
        const opt = OPTIONS.find(o => o.index.toString() === item.attribute_index);
        return {
          label: opt ? opt.label : `Parameter ${item.attribute_index}`,
          value: formatValue(item.value, item.attribute_index),
        };
      });

      setResult(extracted);
    } catch (e) {
      console.error('API Error:', e);
      if (e.code === 'ECONNABORTED') setError('Request timed out.');
      else if (e.response) setError(`Server error: ${e.response.status}`);
      else if (e.request) setError('Cannot connect to server.');
      else setError('An unexpected error occurred.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };



  

 const handleWriteSubmit = async () => {
    setShowProgressModal(true);
    const attrIdx = Array.from(selected)[0];
    let payloadValue;
    let dataType;

    if (attrIdx === 2) {
      if (!writeDateTime || !writeOffset) {
        setError('Please enter both Date/Time and Deviation.');
        setTimeout(() => setError(null), 3000);
        setShowProgressModal(false);
        return;
      }
      // Build ISO-like string with user offset
      // e.g. "2025-05-28T14:30:00+05:30"
      payloadValue = `${writeDateTime}:00${writeOffset.trim()}`;
      dataType = 'datetime';

    } else if (attrIdx === 3) {
      if (!writeMinutes) {
        setError('Please enter a minute value.');
        setTimeout(() => setError(null), 3000);
        setShowProgressModal(false);
        return;
      }
      payloadValue = writeMinutes;
      dataType = 'integer';

    } else {
      setError('Writing not supported for this parameter.');
      setTimeout(() => setError(null), 3000);
      setShowProgressModal(false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        serial_number: String(serial),
        action: 'write_obis',
        parameters: {
          obis_code: '0.0.1.0.0.255',
          attribute_index: attrIdx.toString(),
          value_to_write: payloadValue,
          data_type: dataType,
        },
      };

      const response = await axios.post(
        `${BASE_URL}/api/time-settings/update/`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      // Extract and show single write result
      const { attribute_index, written_value } = response.data;
      const idx = Number(attribute_index);
      const opt = OPTIONS.find(o => o.index === idx);
      setResult([{
        label: opt ? opt.label : `Parameter ${idx}`,
        value: formatValue(written_value, idx),
      }]);
      setShowWriteModal(false);

    } catch (e) {
      console.error('Write API Error:', e);
      setError('Failed to write parameter.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };



  const handleWriteSubmit1 = async () => {
    const attrIdx = Array.from(selected)[0];
    let payloadValue;
    let dataType;

    if (attrIdx === 2) {
      if (!writeDateTime) return;
      // Append seconds and fixed IST offset
      payloadValue = `${writeDateTime}:00+05:30`;
      
    } else if (attrIdx === 3) {
      if (!writeMinutes) return;
      payloadValue = writeMinutes;
      
    } else {
      setError('Writing not supported for this parameter.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        serial_number: String(serial),
        action: 'write_obis',
        parameters: {
          obis_code: '0.0.1.0.0.255',
          attribute_index: attrIdx.toString(),
          value_to_write: payloadValue,
          data_type: dataType,
        },
      };
      const response =await axios.post(
        `${BASE_URL}/api/time-settings/update/`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

    console.log("Response",response.data)
      
    // resp.data is the single write-response object
    const { attribute_index, written_value } = response.data;
    const idx = Number(attribute_index);
    const opt = OPTIONS.find(o => o.index === idx);

    const extracted = [
      {
        label: opt ? opt.label : `Parameter ${idx}`,
        value: formatValue(written_value, idx),
      }
    ];

      

      setResult(extracted);
      setShowWriteModal(false);
    } catch (e) {
      setError('Failed to write');
    } finally {
      setLoading(false);
      //setShowWriteModal(false);
    }
  };
  
  

  return (
    <div className="time-settings-container">
      <div> 
      <div className="time-settings-header">
         <Clock  style={{ color: '#f88b3e',margin:'2px' }} />
        <span className="time-settings-title">Time Settings Dashboard</span>
        
      </div>

      <div className="options-container">
        <div className="options-grid">
          {OPTIONS.map(opt => (
            <label key={opt.index} className="option-label">
              <input
                type="checkbox"
                className="option-checkbox"
                checked={selected.has(opt.index)}
                onChange={() => toggle(opt.index)}
              />
              <span className="option-text">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="button-container"> 

      <button
        className={`read-button${loading ? ' loading' : ''}`}
        onClick={handleRead}
        disabled={loading}
      >
        {loading ? 'Reading...' : 'Read'}
      </button>


       <button className={`read-button`}  onClick={handleWriteClick} >Write</button>
       </div>
      </div>

    
    

      {showWriteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {Array.from(selected)[0] === 2 && (


<div className="form-field">
  <label htmlFor="write-datetime" className="form-label">
    Date &amp; Time
  </label>
  <div className="input-with-icon datetime-picker">
    <CalendarIcon className="icon" />
    <input
      id="write-datetime"
      type="datetime-local"
      className="form-input"
      value={writeDateTime}
      onChange={e => setWriteDateTime(e.target.value)}
      aria-label="Choose date and time"
    />
  </div>

  
                  <label htmlFor="write-offset" className="form-label">
                    Deviation (±HH:MM)
                  </label>
                  <div className="input-with-icon datetime-picker">
                  <input
                    id="write-offset"
                    type="text"
                    className="form-input"
                    placeholder="+05:30 or -04:00"
                    value={writeOffset}
                    onChange={e => setWriteOffset(e.target.value)}
                  />
                  </div>
               



</div>

           
     

            )}
            {Array.from(selected)[0] === 3 && (
              <div className="form-field">
                <label className="form-label">Timezone (min):</label>
                 <div className="input-with-icon">
                <Clock className="icon" />
                <input
                id="write-datetime"
             
                  className="form-input"
                  type="number"
                  value={writeMinutes}
                  onChange={e => setWriteMinutes(e.target.value)}
                />
                </div>
              </div>
            )}
            
             {error && <div className="error-message">{error}</div>}

     
            <button disabled={loading} onClick={handleWriteSubmit}>

              {loading ? 'Submitting…' : 'Submit'} 


            </button>
            <button onClick={() => {
    setShowWriteModal(false);
    setError(null);
    // if you also want to clear old results or inputs, do that here too:
    // setResult(null);
    // setWriteDateTime('');
    // setWriteMinutes('');
  }}>Cancel</button>
          </div>
        </div>
      )}

      


    
    
    
      {result && (
        <div className="results-container">
          {result.map((r, i) => (
            <div key={i} className="result-item">
              <span className="result-label">{r.label}</span>
              <span className="result-value">{r.value}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}






export default function TimeSettingsChart() {
  const [selected, setSelected] = useState(new Set());
  const [result, setResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Inputs for writing
  const [writeDateTime, setWriteDateTime] = useState('');
  const [writeOffset, setWriteOffset] = useState('');
  const [writeMinutes, setWriteMinutes] = useState('');

  const serial = localStorage.getItem('selectedSerialNumber');; // Replace with dynamic serial if needed

  const toggle = (idx) => {
    const copy = new Set(selected);
    copy.has(idx) ? copy.delete(idx) : copy.add(idx);
    setSelected(copy);
  };

  const pad = (n) => String(n).padStart(2, '0');

  const handleWriteClick = () => {
    if (selected.size !== 1) {
      setError('Please select exactly one option to write.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Initialize Date-Time with current local datetime including seconds
    const now = new Date();
    const localWithSeconds =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
      `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    setWriteDateTime(localWithSeconds);
    setWriteOffset('');
    setWriteMinutes('');
    setShowWriteModal(true);
  };

  const formatValue = (value, idx) => {
    if (value == null) return 'N/A';
    if (typeof value !== 'string') return String(value);
    return value;
  };

  const formatValue_Datetime = (value) => {
  if (!value || typeof value !== 'object') return 'N/A';

  const date = value.Date || '';
  const time = value.Time || '';

  // Extract time and deviation
  const match = time.match(/^([\d:]+)\s*\(Deviation:\s*([^)]+)\)/);
  if (match) {
    const [_, timeStr, deviation] = match;
    return `${date} - ${timeStr} (${deviation})`;
  }

  // Fallback if format is not as expected
  return `${date} - ${time}`;
};


  const handleRead3 = async () => {
    if (!serial) {
      setError('No serial number selected');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (selected.size === 0) {
      setError('Please select at least one option');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    const parameters = Array.from(selected).map(i => ({
      obis_code: '0.0.1.0.0.255',
      attribute_index: i.toString(),
    }));
    

    


    try {
      const response = await axios.post(
        `${BASE_URL}/stream_obis/`,
        {
          serial_number: serial,
          action: 'read_obis',
          parameters,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const extracted = response.data.data.map(item => {
  const opt = OPTIONS.find(o => o.index.toString() === item.attribute_index);

  const value = item.value;
  const isDateTimeValue = value && typeof value === 'object' && 'Date' in value && 'Time' in value;

  return {
    label: opt ? opt.label : `Parameter ${item.attribute_index}`,
    value: isDateTimeValue
      ? formatValue_Datetime(value)
      : formatValue(value, item.attribute_index),
  };
});

setResult(extracted);

    } catch (e) {
      console.error('API Error:', e);
      if (e.code === 'ECONNABORTED') setError('Request timed out.');
      else if (e.response) setError(`Server error: ${e.response.status}`);
      else if (e.request) setError('Cannot connect to server.');
      else setError('An unexpected error occurred.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteSubmit = async () => {
    setShowProgressModal(true);
    const attrIdx = Array.from(selected)[0];
    let payloadValue;
    let dataType;

    if (attrIdx === 2) {
      if (!writeDateTime || !writeOffset) {
        setError('Please enter both Date/Time and Deviation.');
        setTimeout(() => setError(null), 3000);
        setShowProgressModal(false);
        return;
      }
      // Build ISO-like string with user-entered seconds and offset
      payloadValue = `${writeDateTime}${writeOffset.trim()}`;
      dataType = 'datetime';

    } else if (attrIdx === 3) {
      if (!writeMinutes) {
        setError('Please enter a minute value.');
        setTimeout(() => setError(null), 3000);
        setShowProgressModal(false);
        return;
      }
      payloadValue = writeMinutes;
      dataType = 'integer';

    } else {
      setError('Writing not supported for this parameter.');
      setTimeout(() => setError(null), 3000);
      setShowProgressModal(false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        serial_number: String(serial),
        action: 'write_obis',
        parameters: {
          obis_code: '0.0.1.0.0.255',
          attribute_index: attrIdx.toString(),
          value: payloadValue,
          data_type: dataType,
        },
      };

      const response = await axios.post(
        `${BASE_URL}/api/TimeSettingsAPIView/`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { attribute_index, written_value } = response.data;
      const idx = Number(attribute_index);
      const opt = OPTIONS.find(o => o.index === idx);
      setResult([{
        label: opt ? opt.label : `Parameter ${idx}`,
        value: formatValue(written_value, idx),
      }]);
      setShowWriteModal(false);

    } catch (e) {
      console.error('Write API Error:', e);
      setError('Failed to write parameter.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };


   const handleRead = async () => {
    if (!serial) {
      setError('No serial number selected');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (selected.size === 0) {
      setError('Please select at least one option');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setResult([]);
    setShowProgressModal(true);

    const parameters = Array.from(selected).map(i => ({
      obis_code: '0.0.1.0.0.255',
      attribute_index: i.toString(),
    }));

    console.log("parameters", parameters);

    try {
      const response = await axios.post(`${BASE_URL}/api/TimeSettingsAPIView/`, {
        serial_number: serial,
        action: "read_obis",
        parameters,
      });

      console.log("Response data:", response.data);

      const results = response.data.results || [];
      let successCount = 0;
      let errorCount = 0;

      results.forEach(item => {
        if (item.status === "success") {
          successCount++;
          const opt = OPTIONS.find(o => o.index === parseInt(item.attribute_index));
          const displayValue =
            item.value && typeof item.value === "object" && "Date" in item.value && "Time" in item.value
              ? `${item.value.Date} ${item.value.Time}`
              : String(item.value);

          setResult(prev => [
            ...prev,
            {
              label: opt ? opt.label : `Parameter ${item.attribute_index}`,
              value: displayValue,
            },
          ]);
        } else if (item.status === "error") {
          errorCount++;
          console.error(`Error reading attribute ${item.attribute_index}: ${item.message}`);
        }
      });

      // Show final result
      const totalItems = parameters.length;
      if (errorCount === 0) {
        alert(`Success! Retrieved ${successCount} of ${totalItems} values.`);
      } else if (successCount > 0) {
        alert(`Partial success: ${successCount} succeeded, ${errorCount} failed. Check console for details.`);
      } else {
        alert(`Failed to retrieve data. ${errorCount} errors occurred.`);
      }
    } catch (e) {
      console.error("API Error:", e);
      setError(`Error: ${e.message || 'Failed to read data from server.'}`);
      alert(`Error: ${e.message || 'Failed to read data from server.'}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
    }
  };

  return (
    <div className="time-settings-container">
      <div className="time-settings-header">
        <Clock style={{ color: '#f88b3e', margin: '2px' }} />
        <span className="time-settings-title">Time Settings Dashboard</span>
      </div>

      <div className="options-container">
        <div className="options-grid">
          {OPTIONS.map(opt => (
            <label key={opt.index} className="option-label">
              <input
                type="checkbox"
                className="option-checkbox"
                checked={selected.has(opt.index)}
                onChange={() => toggle(opt.index)}
              />
              <span className="option-text">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="button-container">
        <button
          className={`read-button${loading ? ' loading' : ''}`}
          onClick={handleRead}
          disabled={loading}
        >
          {loading ? 'Reading...' : 'Read'}
        </button>

        <button className="read-button" onClick={handleWriteClick}>
          Write
        </button>
      </div>

      {showWriteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {Array.from(selected)[0] === 2 && (
              <>
                <div className="form-field">
                  <label htmlFor="write-datetime" className="form-label">
                    Date &amp; Time (with Seconds)
                  </label>
                  <div className="input-with-icon datetime-picker">
                    <CalendarIcon className="icon" />
                    <input
                      id="write-datetime"
                      type="datetime-local"
                      step="1"                     // allow seconds
                      className="form-input"
                      value={writeDateTime}
                      onChange={e => setWriteDateTime(e.target.value)}
                      aria-label="Choose date and time"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="write-offset" className="form-label">
                    Deviation (±HH:MM)
                  </label>
                  <input
                    id="write-offset"
                    type="text"
                    className="form-input"
                    placeholder="+05:30 or -04:00"
                    value={writeOffset}
                    onChange={e => setWriteOffset(e.target.value)}
                  />
                </div>
              </>
            )}

            {Array.from(selected)[0] === 3 && (
              <div className="form-field">
                <label className="form-label">Timezone (min):</label>
                <div className="input-with-icon">
                  <Clock className="icon" />
                  <input
                    type="number"
                    className="form-input"
                    value={writeMinutes}
                    onChange={e => setWriteMinutes(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="submit-button"
                disabled={loading}
                onClick={handleWriteSubmit}
              >
                {loading ? 'Submitting…' : 'Submit'}
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setShowWriteModal(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="results-container">
          {result.map((r, i) => (
            <div key={i} className="result-item">
              <span className="result-label">{r.label}</span>
              <span className="result-value">{r.value}</span>
            </div>
          ))}
        </div>
      )}
      
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Clock Operation Progress"
      />
    </div>
  );
}

