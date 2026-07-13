import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faChartBar, faClock, faCloud, faEye } from '@fortawesome/free-solid-svg-icons';
import './index.css'; // Assuming you have a CSS file for styling
import { FaBookOpen, FaFileExport } from "react-icons/fa"; // Import icons
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
// Dummy components for the dashboards




/**
 * LoadProfileWithPeriod1Dashboard
 * - Sends POST to /api/loadprofile-period/ (see your Django view)
 * - Supports streaming SSE-like responses and non-streaming JSON
 */



const LoadProfileWithPeriod1Dashboard = () => {
  const API_URL = `${BASE_URL}/api/loadprofile-period/`; // adjust if needed

  const serial = localStorage.getItem("selectedSerialNumber") || "sai1";
  const period = useState(1);

  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const stream = true; // use streaming by default
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const readerCancelRef = useRef(null); // to cancel streaming if needed

  const resetRecords = () => {
    setRecords([]);
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    setSelectMode(value);
    setFromValue("");
    setToValue("");
    resetRecords();
  };

  const toISO = (datetimeLocal) => {
    // datetime-local input gives "YYYY-MM-DDTHH:mm" (no timezone).
    // Convert to an ISO string (with timezone offset) using local timezone.
    if (!datetimeLocal) return "";
    const d = new Date(datetimeLocal);
    // If invalid date, return original string
    if (Number.isNaN(d.getTime())) return datetimeLocal;
    return d.toISOString(); // uses UTC 'Z' — backend can parse ISO Z
  };

  const buildPayload = () => {
    const payload = {
      serial_number: serial,
      period: Number(period) || 1,
      mode: selectMode || "all",
      stream: !!stream,
    };

    if (selectMode === "entry") {
      if (fromValue) payload.from_entry = Number(fromValue);
      if (toValue) payload.to_entry = Number(toValue);
    } else if (selectMode === "range") {
      if (fromValue) payload.from_date = toISO(fromValue);
      if (toValue) payload.to_date = toISO(toValue);
    } else if (selectMode === "atleast") {
      // use fromValue as count for atleast
      if (fromValue) payload.from_entry = Number(fromValue);
    }
    return payload;
  };

  const handleRead = async () => {
    setError(null);
    resetRecords();
    setLoading(true);

    const payload = buildPayload();

    try {
      if (stream) {
        // streaming fetch with SSE-like "data: {json}\n\n" chunks
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const txt = await response.text();
          throw new Error(`Server error ${response.status}: ${txt}`);
        }

        // Grab the reader and decode chunks
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buf = "";
        readerCancelRef.current = () => reader.cancel();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          // split on double newline which separates SSE events
          let parts = buf.split("\n\n");
          // Keep last partial segment in buffer
          buf = parts.pop();

          for (const part of parts) {
            // Each part may contain "data: {...}" possibly with multiple lines.
            const lines = part.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            for (const line of lines) {
              if (line.startsWith("data:")) {
                const payloadText = line.replace(/^data:\s*/, "");
                try {
                  const obj = JSON.parse(payloadText);
                  // append to records in order received
                  setRecords((prev) => [...prev, obj]);
                } catch (e) {
                  // ignore parse errors for individual chunks
                  console.warn("Failed to parse chunk JSON", e, payloadText);
                }
              } else if (line.startsWith("{") && line.endsWith("}")) {
                // sometimes stream may send raw json chunk
                try {
                  const obj = JSON.parse(line);
                  setRecords((prev) => [...prev, obj]);
                } catch (e) {
                  console.warn("Failed to parse raw JSON line", e, line);
                }
              }
            }
          }
        }

        // process any leftover buffer (final chunk)
        if (buf.trim()) {
          const leftover = buf.trim();
          // extract data: prefix if present
          const m = leftover.match(/data:\s*(\{.*\})/s);
          const jsonText = m ? m[1] : leftover;
          try {
            const obj = JSON.parse(jsonText);
            setRecords((prev) => [...prev, obj]);
          } catch (e) {
            // ignore
          }
        }

        readerCancelRef.current = null;
      } else {
        // non-streaming: backend returns { data: [...] }
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Server error ${res.status}: ${txt}`);
        }
        const json = await res.json();
        const arr = json.data || [];
        setRecords(arr);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelStream = () => {
    if (readerCancelRef.current) {
      readerCancelRef.current();
      readerCancelRef.current = null;
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // placeholder: Save could send modified records back to server or export CSV.
    // For now just alert count
    alert(`Save clicked — ${records.length} records currently displayed.`);
  };

  // Table renderer
  const renderTable = () => {
    if (!records || records.length === 0) {
      return <div>No records to show</div>;
    }

    return (
      <table className="profile-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Timestamp</th>
            <th style={thStyle}>Active Import (kWh)</th>
            <th style={thStyle}>Active Export (kWh)</th>
            <th style={thStyle}>Reactive Import (kVArh)</th>
            <th style={thStyle}>Reactive Export (kVArh)</th>

          </tr>
        </thead>
        <tbody>
          {records.map((r, idx) => (
            <tr key={`${r.entry_no}-${idx}`} style={rowStyle}>
              <td style={tdStyle}>{r.entry_no ?? idx + 1}</td>
              <td style={tdStyle}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : "-"}</td>
              <td style={tdStyle}>{r.active_import ?? "-"}</td>
              <td style={tdStyle}>{r.active_export ?? "-"}</td>
              <td style={tdStyle}>{r.reactive_import ?? "-"}</td>
              <td style={tdStyle}>{r.reactive_export ?? "-"}</td>

            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="dashboard-container" style={{ padding: 12, fontFamily: "Arial, sans-serif" }}>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>




        <div style={{ flex: 1 }}>
          <label htmlFor="select-mode">Select Mode Entries</label>
          <select id="select-mode" value={selectMode} onChange={handleSelectChange} style={{ width: "100%" }}>
            <option value="">-- Select --</option>
            <option value="all">All</option>
            <option value="entry">Entry</option>
            <option value="range">Range</option>
            <option value="atleast">Atleast</option>

          </select>
        </div>
      </div>

      <div className="controls-section" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 200 }}>
          <label>Entries: in use</label>
          <input type="text" value="13" readOnly style={{ width: "100%" }} />
        </div>

        <div style={{ minWidth: 200 }}>
          <label>Profile Entries</label>
          <input type="text" value="13" readOnly style={{ width: "100%" }} />
        </div>


      </div>

      {/* conditional inputs */}
      {selectMode === "entry" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div>
            <label>From Entry</label>
            <input type="number" value={fromValue} onChange={(e) => setFromValue(e.target.value)} />
          </div>
          <div>
            <label>To Entry</label>
            <input type="number" value={toValue} onChange={(e) => setToValue(e.target.value)} />
          </div>
        </div>
      )}

      {selectMode === "range" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div>
            <label>From (local)</label>
            <input type="datetime-local" value={fromValue} onChange={(e) => setFromValue(e.target.value)} />
          </div>
          <div>
            <label>To (local)</label>
            <input type="datetime-local" value={toValue} onChange={(e) => setToValue(e.target.value)} />
          </div>
        </div>
      )}



      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={primaryBtnStyle}>
          {loading ? "Reading..." : "Read"}
        </button>
        <button onClick={handleCancelStream} disabled={!loading || !stream} style={secBtnStyle}>
          Cancel Stream
        </button>
        <button onClick={handleSave} style={secBtnStyle}>
          Save
        </button>
        <button
          onClick={() => {
            setRecords([]);
            setError(null);
          }}
          style={secBtnStyle}
        >
          Clear
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ maxHeight: 420, overflow: "auto", border: "1px solid #eee", padding: 8 }}>
        {renderTable()}
      </div>
    </div>
  );
};

/* small inline styles */
const thStyle = { border: "1px solid #ddd", padding: "6px 8px", background: "#f7f7f7", textAlign: "left" };
const tdStyle = { border: "1px solid #eee", padding: "6px 8px" };
const rowStyle = { background: "#fff" };
const primaryBtnStyle = { padding: "8px 12px", background: "#007bff", color: "#fff", border: "none", cursor: "pointer" };
const secBtnStyle = { padding: "8px 12px", background: "#eee", border: "none", cursor: "pointer" };











const LoadProfileWithPeriod2Dashboard = () => {
  const API_URL = `${BASE_URL}/api/loadprofile-period/`; // adjust if needed

  const serial = localStorage.getItem("selectedSerialNumber") || "sai1";
  const period = 2;

  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const stream = true; // use streaming by default
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const readerCancelRef = useRef(null); // to cancel streaming if needed

  const resetRecords = () => {
    setRecords([]);
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    setSelectMode(value);
    setFromValue("");
    setToValue("");
    resetRecords();
  };

  const toISO = (datetimeLocal) => {
    // datetime-local input gives "YYYY-MM-DDTHH:mm" (no timezone).
    // Convert to an ISO string (with timezone offset) using local timezone.
    if (!datetimeLocal) return "";
    const d = new Date(datetimeLocal);
    // If invalid date, return original string
    if (Number.isNaN(d.getTime())) return datetimeLocal;
    return d.toISOString(); // uses UTC 'Z' — backend can parse ISO Z
  };

  const buildPayload = () => {
    const payload = {
      serial_number: serial,
      period: Number(period) || 2,
      mode: selectMode || "all",
      stream: !!stream,
    };

    if (selectMode === "entry") {
      if (fromValue) payload.from_entry = Number(fromValue);
      if (toValue) payload.to_entry = Number(toValue);
    } else if (selectMode === "range") {
      if (fromValue) payload.from_date = toISO(fromValue);
      if (toValue) payload.to_date = toISO(toValue);
    } else if (selectMode === "atleast") {
      // use fromValue as count for atleast
      if (fromValue) payload.from_entry = Number(fromValue);
    }
    return payload;
  };

  const handleRead = async () => {
    setError(null);
    resetRecords();
    setLoading(true);

    const payload = buildPayload();

    try {
      if (stream) {
        // streaming fetch with SSE-like "data: {json}\n\n" chunks
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const txt = await response.text();
          throw new Error(`Server error ${response.status}: ${txt}`);
        }

        // Grab the reader and decode chunks
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buf = "";
        readerCancelRef.current = () => reader.cancel();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          // split on double newline which separates SSE events
          let parts = buf.split("\n\n");
          // Keep last partial segment in buffer
          buf = parts.pop();

          for (const part of parts) {
            // Each part may contain "data: {...}" possibly with multiple lines.
            const lines = part.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            for (const line of lines) {
              if (line.startsWith("data:")) {
                const payloadText = line.replace(/^data:\s*/, "");
                try {
                  const obj = JSON.parse(payloadText);
                  // append to records in order received
                  setRecords((prev) => [...prev, obj]);
                } catch (e) {
                  // ignore parse errors for individual chunks
                  console.warn("Failed to parse chunk JSON", e, payloadText);
                }
              } else if (line.startsWith("{") && line.endsWith("}")) {
                // sometimes stream may send raw json chunk
                try {
                  const obj = JSON.parse(line);
                  setRecords((prev) => [...prev, obj]);
                } catch (e) {
                  console.warn("Failed to parse raw JSON line", e, line);
                }
              }
            }
          }
        }

        // process any leftover buffer (final chunk)
        if (buf.trim()) {
          const leftover = buf.trim();
          // extract data: prefix if present
          const m = leftover.match(/data:\s*(\{.*\})/s);
          const jsonText = m ? m[1] : leftover;
          try {
            const obj = JSON.parse(jsonText);
            setRecords((prev) => [...prev, obj]);
          } catch (e) {
            // ignore
          }
        }

        readerCancelRef.current = null;
      } else {
        // non-streaming: backend returns { data: [...] }
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Server error ${res.status}: ${txt}`);
        }
        const json = await res.json();
        const arr = json.data || [];
        setRecords(arr);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelStream = () => {
    if (readerCancelRef.current) {
      readerCancelRef.current();
      readerCancelRef.current = null;
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // placeholder: Save could send modified records back to server or export CSV.
    // For now just alert count
    alert(`Save clicked — ${records.length} records currently displayed.`);
  };

  // Table renderer
  const renderTable = () => {
    if (!records || records.length === 0) {
      return <div>No records to show</div>;
    }

    return (
      <table className="profile-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Timestamp</th>
            <th style={thStyle}>Active Import (kWh)</th>
            <th style={thStyle}>Active Export (kWh)</th>
            <th style={thStyle}>Reactive Import (kVArh)</th>
            <th style={thStyle}>Reactive Export (kVArh)</th>

          </tr>
        </thead>
        <tbody>
          {records.map((r, idx) => (
            <tr key={`${r.entry_no}-${idx}`} style={rowStyle}>
              <td style={tdStyle}>{r.entry_no ?? idx + 1}</td>
              <td style={tdStyle}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : "-"}</td>
              <td style={tdStyle}>{r.active_import ?? "-"}</td>
              <td style={tdStyle}>{r.active_export ?? "-"}</td>
              <td style={tdStyle}>{r.reactive_import ?? "-"}</td>
              <td style={tdStyle}>{r.reactive_export ?? "-"}</td>

            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="dashboard-container" style={{ padding: 12, fontFamily: "Arial, sans-serif" }}>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>




        <div style={{ flex: 1 }}>
          <label htmlFor="select-mode">Select Mode Entries</label>
          <select id="select-mode" value={selectMode} onChange={handleSelectChange} style={{ width: "100%" }}>
            <option value="">-- Select --</option>
            <option value="all">All</option>
            <option value="entry">Entry</option>
            <option value="range">Range</option>
            <option value="atleast">Atleast</option>

          </select>
        </div>
      </div>

      <div className="controls-section" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 200 }}>
          <label>Entries: in use</label>
          <input type="text" value="13" readOnly style={{ width: "100%" }} />
        </div>

        <div style={{ minWidth: 200 }}>
          <label>Profile Entries</label>
          <input type="text" value="13" readOnly style={{ width: "100%" }} />
        </div>


      </div>

      {/* conditional inputs */}
      {selectMode === "entry" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div>
            <label>From Entry</label>
            <input type="number" value={fromValue} onChange={(e) => setFromValue(e.target.value)} />
          </div>
          <div>
            <label>To Entry</label>
            <input type="number" value={toValue} onChange={(e) => setToValue(e.target.value)} />
          </div>
        </div>
      )}

      {selectMode === "range" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div>
            <label>From (local)</label>
            <input type="datetime-local" value={fromValue} onChange={(e) => setFromValue(e.target.value)} />
          </div>
          <div>
            <label>To (local)</label>
            <input type="datetime-local" value={toValue} onChange={(e) => setToValue(e.target.value)} />
          </div>
        </div>
      )}



      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={primaryBtnStyle}>
          {loading ? "Reading..." : "Read"}
        </button>
        <button onClick={handleCancelStream} disabled={!loading || !stream} style={secBtnStyle}>
          Cancel Stream
        </button>
        <button onClick={handleSave} style={secBtnStyle}>
          Save
        </button>
        <button
          onClick={() => {
            setRecords([]);
            setError(null);
          }}
          style={secBtnStyle}
        >
          Clear
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ maxHeight: 420, overflow: "auto", border: "1px solid #eee", padding: 8 }}>
        {renderTable()}
      </div>
    </div>
  );
};








const PowerQualityProfileDashboard = () => {
  const API_URL = `${BASE_URL}/api/power-quality/`;

  const serial = localStorage.getItem("selectedSerialNumber") || "sai1";

  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const stream = true; // enable SSE streaming by default
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const readerCancelRef = useRef(null); // handle stream cancellation

  const resetRecords = () => setRecords([]);

  const handleSelectChange = (event) => {
    const { value } = event.target;
    setSelectMode(value);
    setFromValue("");
    setToValue("");
    resetRecords();
  };

  const toISO = (datetimeLocal) => {
    if (!datetimeLocal) return "";
    const d = new Date(datetimeLocal);
    return isNaN(d.getTime()) ? datetimeLocal : d.toISOString();
  };

  const buildPayload = () => {
    const payload = {
      serial_number: serial,
      mode: selectMode || "all",
      stream: !!stream,
    };

    if (selectMode === "entry") {
      if (fromValue) payload.from_entry = Number(fromValue);
      if (toValue) payload.to_entry = Number(toValue);
    } else if (selectMode === "range") {
      if (fromValue) payload.from_date = toISO(fromValue);
      if (toValue) payload.to_date = toISO(toValue);
    } else if (selectMode === "atleast") {
      if (fromValue) payload.from_entry = Number(fromValue);
    }

    return payload;
  };

  const handleRead = async () => {
    setError(null);
    resetRecords();
    setLoading(true);
    const payload = buildPayload();

    try {
      if (stream) {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const txt = await response.text();
          throw new Error(`Server error ${response.status}: ${txt}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buf = "";
        readerCancelRef.current = () => reader.cancel();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let parts = buf.split("\n\n");
          buf = parts.pop();

          for (const part of parts) {
            const lines = part.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            for (const line of lines) {
              if (line.startsWith("data:")) {
                const payloadText = line.replace(/^data:\s*/, "");
                try {
                  const obj = JSON.parse(payloadText);
                  setRecords((prev) => [...prev, obj]);
                } catch (e) {
                  console.warn("Failed to parse chunk JSON", e);
                }
              }
            }
          }
        }

        if (buf.trim()) {
          try {
            const m = buf.match(/data:\s*(\{.*\})/s);
            const jsonText = m ? m[1] : buf.trim();
            const obj = JSON.parse(jsonText);
            setRecords((prev) => [...prev, obj]);
          } catch { }
        }

        readerCancelRef.current = null;
      } else {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Server error ${res.status}: ${txt}`);
        }
        const json = await res.json();
        setRecords(json.data || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelStream = () => {
    if (readerCancelRef.current) {
      readerCancelRef.current();
      readerCancelRef.current = null;
      setLoading(false);
    }
  };

  const handleSave = () => {
    alert(`Save clicked — ${records.length} records displayed.`);
  };

  const renderTable = () => {
    if (!records.length) return <div>No records to show</div>;





    return (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>No</th>
            <th style={thStyle}>Timestamp</th>
            <th style={thStyle}>Disconnect Control State</th>
            <th style={thStyle}>Instantaneous Voltage L1 (V)</th>
            <th style={thStyle}>Instantaneous Current L1 (A)</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={`${r.entry_no}-${i}`} style={rowStyle}>
              <td style={tdStyle}>{r.entry_no ?? i + 1}</td>
              <td style={tdStyle}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : "-"}</td>
              <td style={tdStyle}>{r.disconnect_control_state ?? "-"}</td>
              <td style={tdStyle}>{r.instantaneous_voltage_l1 ?? "-"}</td>
              <td style={tdStyle}>{r.instantaneous_current_l1 ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };





  return (
    <div className="dashboard-container" style={{ padding: 12, fontFamily: "Arial, sans-serif" }}>


      {/* Mode Selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="select-mode">Select Mode Entries</label>
          <select id="select-mode" value={selectMode} onChange={handleSelectChange} style={{ width: "100%" }}>
            <option value="">-- Select --</option>
            <option value="all">All</option>
            <option value="entry">Entry</option>
            <option value="range">Range</option>
            <option value="atleast">Atleast</option>

          </select>
        </div>
      </div>

      <div className="controls-section" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 200 }}>
          <label>Entries: in use</label>
          <input type="text" value="13" readOnly style={{ width: "100%" }} />
        </div>

        <div style={{ minWidth: 200 }}>
          <label>Profile Entries</label>
          <input type="text" value="13" readOnly style={{ width: "100%" }} />
        </div>


      </div>

      {/* Control Inputs */}
      {selectMode === "entry" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div>
            <label>From Entry</label>
            <input type="number" value={fromValue} onChange={(e) => setFromValue(e.target.value)} />
          </div>
          <div>
            <label>To Entry</label>
            <input type="number" value={toValue} onChange={(e) => setToValue(e.target.value)} />
          </div>
        </div>
      )}

      {selectMode === "range" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div>
            <label>From (local)</label>
            <input type="datetime-local" value={fromValue} onChange={(e) => setFromValue(e.target.value)} />
          </div>
          <div>
            <label>To (local)</label>
            <input type="datetime-local" value={toValue} onChange={(e) => setToValue(e.target.value)} />
          </div>
        </div>
      )}


      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={primaryBtnStyle}>
          {loading ? "Reading..." : "Read"}
        </button>
        <button onClick={handleCancelStream} disabled={!loading || !stream} style={secBtnStyle}>
          Cancel Stream
        </button>
        <button onClick={handleSave} style={secBtnStyle}>
          Save
        </button>
        <button
          onClick={() => {
            setRecords([]);
            setError(null);
          }}
          style={secBtnStyle}
        >
          Clear
        </button>
      </div>

      {error && <div style={{ color: "red", marginBottom: 12 }}>Error: {error}</div>}

      {/* Data Table */}
      <div style={{ maxHeight: 420, overflow: "auto", border: "1px solid #ddd", padding: 8 }}>
        {renderTable()}
      </div>
    </div>
  );
};













const InstantaneousReadSnapshotDashboard = () => {
  
  const API_URL = `${BASE_URL}/api/instantaneous-read-snapshot/`;
  const [selectedMode, setSelectedMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [inputData, setInputData] = useState({
    entriesInUse: "0",
    profileEntries: "13",
  });

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
    const { value } = event.target;
    setSelectedMode(value);
    setFromValue("");
    setToValue("");
  };



  const [records, setRecords] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const readerCancelRef = useRef(null);

  const resetRecords = () => setRecords([]);

  const handleRead = async () => {
    setError(null);
    resetRecords();
    setLoading(true);

    const payload = {
      serial_number: localStorage.getItem("selectedSerialNumber"),
      mode: selectedMode || "all",
    };

    if (selectedMode === "entry") {
      payload.from_entry = Number(fromValue);
      payload.to_entry = Number(toValue);
    } else if (selectedMode === "range") {
      payload.from_date = fromValue;
      payload.to_date = toValue;
    } else if (selectedMode === "atleast") {
      payload.from_entry = Number(fromValue);
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });


      if (!response.ok) {
        console.log("Error response:-------------", response);
        const txt = await response.text();
        throw new Error(`Server Error ${response.status}: ${txt}`);
      }

      const txt = await response.text();

      const records = txt
        .split("\n\n") // har SSE event alag karo
        .filter(line => line.trim())
        .map(line => line.replace(/^data:\s*/, ""))
        .map(line => JSON.parse(line));

      console.log(records);

      setRecords(records);


    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown Error");
    } finally {
      setLoading(false);
    }
  };

  const renderTable = ({ records }) => {
    if (!records.length) return <div>No records to show</div>;

    return (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>No</th>
            <th style={thStyle}>Timestamp</th>
            <th style={thStyle}>Disconnect Control State</th>
            <th style={thStyle}>Instantaneous Voltage L1 (V)</th>
            <th style={thStyle}>Instantaneous Current L1 (A)</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            console.log("Record:----------------@#$-------------", r),
            <tr key={`${r.entry_no}-${i}`}>
              <td>{r.entry_no ?? i + 1}</td>
              <td>{r.timestamp ? new Date(r.timestamp).toLocaleString() : "-"}</td>
              <td>{r.disconnect_control_state ?? "-"}</td>
              <td>{r.instantaneous_voltage_l1 ?? "-"}</td>
              <td>{r.instantaneous_current_l1 ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };


  return (
    <div className="dashboard-container">
      {/* Full width dropdown */}
      <div style={{ width: "100%" }}>
        <label htmlFor="select-mode">Select Mode Entries:</label>
        <select
          id="select-mode"
          value={selectedMode}
          onChange={handleSelectChange}
          style={{ width: "100%" }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range</option>
          <option value="atleast">Atleast</option>
        </select>
      </div>

      <div className="controls-section">
        {/* Always visible */}
        <div className="control-group">
          <label htmlFor="entries-in-use">Entries in use</label>
          <input
            type="text"
            id="entries-in-use"
            value={inputData.entriesInUse}
            readOnly
          />
        </div>

        <div className="control-group">
          <label htmlFor="profile-entries">Profile entries</label>
          <input
            type="text"
            id="profile-entries"
            value={inputData.profileEntries}
            readOnly
          />
        </div>

        {/* ENTRY mode */}
        {selectedMode === "entry" && (
          <>
            <div className="control-group">
              <label htmlFor="from-number">From Entry:</label>
              <input
                type="number"
                id="from-number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div className="control-group">
              <label htmlFor="to-number">To Entry:</label>
              <input
                type="number"
                id="to-number"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}

        {/* RANGE mode */}
        {selectedMode === "range" && (
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

            {/* Capture Object */}
            <div className="control-group capture-object">
              <label htmlFor="capture-object-range">Capture Ob9ject:</label>
              <input type="text" id="capture-object-range" value="" readOnly />
              <button onClick={handleCaptureRefresh} disabled>
                Refresh
              </button>
            </div>
          </>
        )}

      </div>


      {/* Data Table */}
      <div style={{ maxHeight: 420, overflow: "auto", border: "1px solid #ddd", padding: 8 }}>
        {renderTable({ records })}
      </div>


      {/* Buttons */}

      <div className="button-group">
        <button className='read' onClick={handleRead}>
          Read
        </button>
        <button className="save" onClick={handleSave}>
          Save
        </button>
        <button className="refresh" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
    </div>
  );
};




function LoadProfileSection() {
  const [activeSection, setActiveSection] = useState('loadProfile');

  const renderSection = () => {
    switch (activeSection) {

      case 'loadProfileWithPeriod1':
        return <LoadProfileWithPeriod1Dashboard />;
      case 'loadProfileWithPeriod2':
        return <LoadProfileWithPeriod2Dashboard />;
      case 'powerQualityProfile':
        return <PowerQualityProfileDashboard />;
      case 'instantaneousReadSnapshot':
        return <InstantaneousReadSnapshotDashboard />;
      default:
        return <LoadProfileWithPeriod1Dashboard />;
    }
  };

  const handleItemClick = (section) => {
    setActiveSection(section);
  };

  return (

    <div className="header-dashboard">
      <div className='header-container border-effect'>

        <nav className="sidebar1">

          <div className="billing-section-title">
            <FontAwesomeIcon icon={faChartBar} className="icon" />
            Load profile</div>
          <ul>

            <li className={activeSection === 'loadProfileWithPeriod1' ? 'active' : ''}>
              <button onClick={() => handleItemClick('loadProfileWithPeriod1')} className="sidebar1-btn">
                <FontAwesomeIcon icon={faClock} className="icon" />
                Load profile with period 1
              </button>
            </li>
            <li className={activeSection === 'loadProfileWithPeriod2' ? 'active' : ''}>
              <button onClick={() => handleItemClick('loadProfileWithPeriod2')} className="sidebar1-btn">
                <FontAwesomeIcon icon={faCloud} className="icon" />
                Load profile with period 2
              </button>
            </li>
            <li className={activeSection === 'powerQualityProfile' ? 'active' : ''}>
              <button onClick={() => handleItemClick('powerQualityProfile')} className="sidebar1-btn">
                <FontAwesomeIcon icon={faEye} className="icon" />
                Power quality profile
              </button>
            </li>
            <li className={activeSection === 'instantaneousReadSnapshot' ? 'active' : ''}>
              <button onClick={() => handleItemClick('instantaneousReadSnapshot')} className="sidebar1-btn">
                <FontAwesomeIcon icon={faBolt} className="icon" />
                Instantaneous read snapshot
              </button>
            </li>
          </ul>
        </nav>
        <main className="content">
          <div className="read-write-container">
            <button className="dashboard-btn">
              <FaBookOpen style={{ marginRight: "8px", color: "#ff4d00ff" }} />
              Read
            </button>

            <button className="dashboard-btn">
              <FaFileExport style={{ marginRight: "8px", color: "#ff4d00ff" }} />
              Export
            </button>
          </div>
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

export default LoadProfileSection;