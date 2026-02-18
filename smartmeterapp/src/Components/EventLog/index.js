import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faCloud, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FaBookOpen, FaFileExport } from "react-icons/fa"; // Import icons
import  {  useEffect,useRef, useCallback } from "react";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import axios from "axios";

import {  faShieldAlt, faPlug, faBolt, faComments, faShoppingCart, faPowerOff, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';






const EventLogInformationDashboard = () => {
  const initialTable = [
    { id: 1, checked: false, no: 1, name: "Number of power failures in any phase", code: "(1, 0-0.96.7.21.255)", value: "", unit: "" },
    { id: 2, checked: false, no: 2, name: "Number of long power failures in any phase", code: "(1, 0-0.96.7.9.255)", value: "", unit: "" },
    { id: 3, checked: false, no: 3, name: "Duration of last long power failure in any phase", code: "(3, 0-0.96.7.19.255)", value: "", unit: "s" },
    { id: 4, checked: false, no: 4, name: "Number of voltage sags in phase L1", code: "(1, 1-0.32.32.0.255)", value: "", unit: "" },
    { id: 5, checked: false, no: 5, name: "Duration of last voltage sag in phase L1", code: "(3, 1-0.32.33.0.255)", value: "", unit: "s" },
    { id: 6, checked: false, no: 6, name: "Magnitude of last voltage sag in phase L1", code: "(3, 1-0.32.34.0.255)", value: "", unit: "V" },
    { id: 7, checked: false, no: 7, name: "Number of voltage swells in phase L1", code: "(1, 1-0.32.36.0.255)", value: "", unit: "" },
    { id: 8, checked: false, no: 8, name: "Duration of last voltage swell in phase L1", code: "(3, 1-0.32.37.0.255)", value: "", unit: "s" },
    { id: 9, checked: false, no: 9, name: "Magnitude of last voltage swell in phase L1", code: "(3, 1-0.32.38.0.255)", value: "", unit: "V" },
  ];

  const [tableData, setTableData] = useState(initialTable);
  const [streamValues, setStreamValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);
  const headerCheckboxRef = useRef(null);
  const serialNumber = localStorage.getItem("selectedSerialNumber") || "";

  const allChecked = tableData.length > 0 && tableData.every((row) => row.checked);
  const someChecked = tableData.some((row) => row.checked) && !allChecked;

  useEffect(() => {
    if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = someChecked;
  }, [someChecked]);

  const checkAll = useCallback(() => setTableData((prev) => prev.map((i) => ({ ...i, checked: true }))), []);
  const uncheckAll = useCallback(() => setTableData((prev) => prev.map((i) => ({ ...i, checked: false }))), []);
  const onHeaderChange = (e) => (e.target.checked ? checkAll() : uncheckAll());
  const handleCheckboxChange = (no) =>
    setTableData((prev) => prev.map((it) => (it.no === no ? { ...it, checked: !it.checked } : it)));

  function extractObis(code) {
    if (!code) return "";
    const cleaned = (code + "")
      .replace(/[\[\]\(\)]/g, "")
      .replace(/-/g, ".")
      .replace(/:/g, ".")
      .replace(/\s+/g, "")
      .replace(/\.{2,}/g, ".");
    const parts = cleaned.split(",");
    const candidate = (parts[1] || parts[0] || "").trim();
    return candidate;
  }

  const buildSelectedParams = () => {
    return tableData
      .filter((i) => i.checked)
      .map((item) => ({
        obis_code: extractObis(item.code),
        attribute_index: "2",
      }));
  };

  const handleRead = async () => {
    setError(null);
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
      } catch {}
    }

    const selectedParams = buildSelectedParams();
    if (selectedParams.length === 0) {
      alert("Please select at least one item to read.");
      return;
    }

    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      data_type: "event_log",
      parameters: selectedParams,
      persist: true,
    };

    controllerRef.current = new AbortController();
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/event_log_information/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();

        for (let chunk of chunks) {
          if (!chunk.startsWith("data:")) continue;
          try {
            const msg = JSON.parse(chunk.replace(/^data:\s*/, ""));
            if (msg && msg.obis_code) {
              const obis = msg.obis_code;
              setStreamValues((prev) => ({
                ...prev,
                [obis]: {
                  value: msg.value,
                  timestamp: msg.timestamp || new Date().toISOString(),
                },
              }));
            }
          } catch (e) {
            console.error("Error parsing SSE chunk", e);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Read aborted");
      } else {
        console.error("Streaming error", err);
        setError(err.message || "Error streaming data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        controllerRef.current = null;
      } catch {}
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const checkedRows = tableData.filter((item) => item.checked);
    if (!checkedRows.length) {
      alert("No rows are checked to save.");
      return;
    }

    const payload = checkedRows.map((item) => {
      const obis = extractObis(item.code);
      const streamed = streamValues[obis] || {};
      return {
        device_serial: serialNumber,
        data_type: "event_log",
        obis_code: obis,
        attribute_index: item.attribute_index || "2",
        value: streamed.value ?? item.value,
        unit: item.unit ?? "",
        timestamp: streamed.timestamp ?? new Date().toISOString(),
      };
    });

    try {
      const res = await fetch(`${BASE_URL}/api/event_readings/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server responded ${res.status}`);
      }
      const data = await res.json();
      alert(`Saved ${data.created || payload.length} records.`);
    } catch (e) {
      console.error("Save error", e);
      alert("Save failed: " + (e.message || e));
    }
  };

  const handleRefresh = () => {
    handleStop();
    setStreamValues({});
    alert("Refreshed dashboard data.");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
      <h2>Event Log Information Dashboard</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read Selected"}
        </button>
        <button onClick={handleStop} disabled={!loading} style={{ marginRight: 8 }}>
          Stop
        </button>
        <button onClick={handleSave} style={{ marginRight: 8 }}>
          Save
        </button>
        <button onClick={handleRefresh}>Refresh</button>
      </div>

      <div className="table-section">
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allChecked}
                  onChange={onHeaderChange}
                  aria-label="Select all rows"
                />{" "}
                Check
              </th>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>No.</th>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>Name</th>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>Code (OBIS)</th>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>Value</th>
              <th style={{ border: "1px solid #ddd", padding: 6 }}>Unit</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item) => {
              const obis = extractObis(item.code);
              const streamed = streamValues[obis] || {};
              const displayedValue = streamed.value ?? item.value ?? "";

              return (
                <tr key={item.no}>
                  <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={!!item.checked}
                      onChange={() => handleCheckboxChange(item.no)}
                      aria-label={`Select row ${item.no}`}
                    />
                  </td>
                  <td style={{ border: "1px solid #eee", padding: 6 }}>{item.no}</td>
                  <td style={{ border: "1px solid #eee", padding: 6 }}>{item.name}</td>
                  <td style={{ border: "1px solid #eee", padding: 6 }}>{obis}</td>
                  <td style={{ border: "1px solid #eee", padding: 6 }}>{displayedValue}</td>
                  <td style={{ border: "1px solid #eee", padding: 6 }}>{item.unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};




//export default EventLogSection;





const StandardEventLogDashboard = () => {
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const toISOStringLocal = (localDatetime) => {
    if (!localDatetime) return null;
    return new Date(localDatetime).toISOString();
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    console.log("🟢 Mode changed to:", value);
    setSelectMode(value);
    setFromValue("");
    setToValue("");
  };

  const upsertRow = (incoming) => {
    console.log("⬆️ Upserting incoming row:", incoming);
    setRows((prev) => {
      const idx = prev.findIndex((r) => Number(r.no) === Number(incoming.no));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...incoming };
        return copy;
      } else {
        return [...prev, incoming];
      }
    });
  };

  const validateAndBuildPayload = () => {
    const payload = {
      serial_number: localStorage.getItem("selectedSerialNumber") || "MTR1",
      type_log: "standard",
      mode: selectMode || "all",
      stream: true,
    };

    if (selectMode === "entry") {
      if (!fromValue) {
        alert("Please enter From entry number");
        return null;
      }
      payload.from_entry = Number(fromValue);
      if (toValue) payload.to_entry = Number(toValue);
    } else if (selectMode === "range") {
      if (!fromValue || !toValue) {
        alert("Please provide both From and To date/time for range.");
        return null;
      }
      payload.from_date = toISOStringLocal(fromValue);
      payload.to_date = toISOStringLocal(toValue);
    }

    console.log("📤 Payload to send:", payload);
    return payload;
  };

  const handleRead = async () => {
    console.log("🚀 Starting Read...");
    setError(null);
    const payload = validateAndBuildPayload();
    if (!payload) return;

    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        console.log("🧹 Aborted previous stream");
      } catch (e) {
        console.warn("Abort failed:", e);
      }
    }

    controllerRef.current = new AbortController();
    setLoading(true);

    try {
      console.log(`🌐 Fetching from: ${BASE_URL}/api/event-log/`);
      const res = await fetch(`${BASE_URL}/api/event-log/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      console.log("📥 Response status:", res.status);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      console.log("📡 Stream started...");

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("✅ Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();

        for (let chunk of chunks) {
          if (!chunk.startsWith("data:")) continue;
          try {
            const jsonText = chunk.replace(/^data:\s*/, "");
            console.log("📦 Raw chunk received:", jsonText);

            const msg = JSON.parse(jsonText);
            console.log("🧩 Parsed message:", msg);

            if (msg && typeof msg === "object") {
              const incoming = {
                no: msg.no ?? msg.entry_no ?? msg.id,
                time: msg.time ?? msg.timestamp ?? new Date().toLocaleString(),
                eventCode: msg.event_code ?? msg.eventCode ?? "N/A",
              };
              upsertRow(incoming);
            }
          } catch (e) {
            console.warn("⚠️ Chunk parse error:", e);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("🟥 Stream aborted by user");
      } else {
        console.error("🔥 Read stream error:", err);
        setError(err.message || "Read failed");
      }
    } finally {
      console.log("🧭 Stream closed");
      setLoading(false);
    }
  };

  const handleStop = () => {
    console.log("🛑 Stop clicked");
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        controllerRef.current = null;
      } catch (e) {
        console.warn("Abort error:", e);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setError(null);
    const serial_number = localStorage.getItem("selectedSerialNumber") || "MTR1";
    const payload = {
      serial_number,
      type_log: "standard",
      events: rows.map((r) => ({
        entry_no: r.no,
        event_time: new Date(r.time).toISOString(),
        event_code: r.eventCode,
      })),
    };

    console.log("💾 Saving events:", payload);

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/standard_event_log/save_events/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Save success:", resp.data);
      alert("Saved: " + (resp.data?.message ?? "OK"));
    } catch (e) {
      console.error("❌ Save failed:", e);
      setError(e.response?.data?.error || e.message || "Save failed");
      alert("Save failed: " + (e.response?.data?.error || e.message));
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Refresh clicked — clearing rows");
    setRows([]);
    alert("Refreshed local table. To fetch live data, click Read.");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
      <div style={{ width: "100%", marginBottom: 12 }}>
        <label htmlFor="select-mode">Select Mode Entries:</label>
        <select
          id="select-mode"
          value={selectMode}
          onChange={handleSelectChange}
          style={{ width: "100%", marginTop: 4 }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range (date)</option>
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
         </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {selectMode === "entry" && (
          <>
            <div>
              <label>From (entry no)</label>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (entry no)</label>
              <input
                type="number"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}

        {selectMode === "range" && (
          <>
            <div>
              <label>From (date/time)</label>
              <input
                type="datetime-local"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (date/time)</label>
              <input
                type="datetime-local"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read"}
        </button>
        <button onClick={handleStop} disabled={!loading} style={{ marginRight: 8 }}>
          Stop
        </button>
        <button onClick={handleSave} style={{ marginRight: 8 }}>
          Save
        </button>
        <button onClick={handleRefresh}>Refresh</button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>No</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Time</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Event Code</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 12, textAlign: "center" }}>
                No rows to display
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.no}>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.no}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.time}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.eventCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};




const FraudDetectionLog = () => {
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const toISOStringLocal = (localDatetime) => {
    if (!localDatetime) return null;
    return new Date(localDatetime).toISOString();
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    console.log("🟢 Mode changed to:", value);
    setSelectMode(value);
    setFromValue("");
    setToValue("");
  };

  const upsertRow = (incoming) => {
    console.log("⬆️ Upserting incoming row:", incoming);
    setRows((prev) => {
      const idx = prev.findIndex((r) => Number(r.no) === Number(incoming.no));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...incoming };
        return copy;
      } else {
        return [...prev, incoming];
      }
    });
  };

  const validateAndBuildPayload = () => {
    const payload = {
      serial_number: localStorage.getItem("selectedSerialNumber") || "MTR1",
      type_log: "fraud",
      mode: selectMode || "all",
      stream: true,
    };

    if (selectMode === "entry") {
      if (!fromValue) {
        alert("Please enter From entry number");
        return null;
      }
      payload.from_entry = Number(fromValue);
      if (toValue) payload.to_entry = Number(toValue);
    } else if (selectMode === "range") {
      if (!fromValue || !toValue) {
        alert("Please provide both From and To date/time for range.");
        return null;
      }
      payload.from_date = toISOStringLocal(fromValue);
      payload.to_date = toISOStringLocal(toValue);
    }

    console.log("📤 Payload to send:", payload);
    return payload;
  };

  const handleRead = async () => {
    console.log("🚀 Starting Read...");
    setError(null);
    const payload = validateAndBuildPayload();
    if (!payload) return;

    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        console.log("🧹 Aborted previous stream");
      } catch (e) {
        console.warn("Abort failed:", e);
      }
    }

    controllerRef.current = new AbortController();
    setLoading(true);

    try {
      console.log(`🌐 Fetching from: ${BASE_URL}/api/event-log/`);
      const res = await fetch(`${BASE_URL}/api/event-log/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      console.log("📥 Response status:", res.status);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      console.log("📡 Stream started...");

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("✅ Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();

        for (let chunk of chunks) {
          if (!chunk.startsWith("data:")) continue;
          try {
            const jsonText = chunk.replace(/^data:\s*/, "");
            console.log("📦 Raw chunk received:", jsonText);

            const msg = JSON.parse(jsonText);
            console.log("🧩 Parsed message:", msg);

            if (msg && typeof msg === "object") {
              const incoming = {
                no: msg.no ?? msg.entry_no ?? msg.id,
                time: msg.time ?? msg.timestamp ?? new Date().toLocaleString(),
                eventCode: msg.event_code ?? msg.eventCode ?? "N/A",
              };
              upsertRow(incoming);
            }
          } catch (e) {
            console.warn("⚠️ Chunk parse error:", e);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("🟥 Stream aborted by user");
      } else {
        console.error("🔥 Read stream error:", err);
        setError(err.message || "Read failed");
      }
    } finally {
      console.log("🧭 Stream closed");
      setLoading(false);
    }
  };

  const handleStop = () => {
    console.log("🛑 Stop clicked");
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        controllerRef.current = null;
      } catch (e) {
        console.warn("Abort error:", e);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setError(null);
    const serial_number = localStorage.getItem("selectedSerialNumber") || "MTR1";
    const payload = {
      serial_number,
      type_log: "standard",
      events: rows.map((r) => ({
        entry_no: r.no,
        event_time: new Date(r.time).toISOString(),
        event_code: r.eventCode,
      })),
    };

    console.log("💾 Saving events:", payload);

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/standard_event_log/save_events/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Save success:", resp.data);
      alert("Saved: " + (resp.data?.message ?? "OK"));
    } catch (e) {
      console.error("❌ Save failed:", e);
      setError(e.response?.data?.error || e.message || "Save failed");
      alert("Save failed: " + (e.response?.data?.error || e.message));
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Refresh clicked — clearing rows");
    setRows([]);
    alert("Refreshed local table. To fetch live data, click Read.");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
      <div style={{ width: "100%", marginBottom: 12 }}>
        <label htmlFor="select-mode">Select Mode Entries:</label>
        <select
          id="select-mode"
          value={selectMode}
          onChange={handleSelectChange}
          style={{ width: "100%", marginTop: 4 }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range (date)</option>
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
         </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {selectMode === "entry" && (
          <>
            <div>
              <label>From (entry no)</label>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (entry no)</label>
              <input
                type="number"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}

        {selectMode === "range" && (
          <>
            <div>
              <label>From (date/time)</label>
              <input
                type="datetime-local"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (date/time)</label>
              <input
                type="datetime-local"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read"}
        </button>
        <button onClick={handleStop} disabled={!loading} style={{ marginRight: 8 }}>
          Stop
        </button>
        <button onClick={handleSave} style={{ marginRight: 8 }}>
          Save
        </button>
        <button onClick={handleRefresh}>Refresh</button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>No</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Time</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Event Code</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 12, textAlign: "center" }}>
                No rows to display
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.no}>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.no}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.time}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.eventCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const DisconnectorControlLog = () => {
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const toISOStringLocal = (localDatetime) => {
    if (!localDatetime) return null;
    return new Date(localDatetime).toISOString();
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    console.log("🟢 Mode changed to:", value);
    setSelectMode(value);
    setFromValue("");
    setToValue("");
  };

  const upsertRow = (incoming) => {
    console.log("⬆️ Upserting incoming row:", incoming);
    setRows((prev) => {
      const idx = prev.findIndex((r) => Number(r.no) === Number(incoming.no));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...incoming };
        return copy;
      } else {
        return [...prev, incoming];
      }
    });
  };

  const validateAndBuildPayload = () => {
    const payload = {
      serial_number: localStorage.getItem("selectedSerialNumber") || "MTR1",
      type_log: "disconnector",
      mode: selectMode || "all",
      stream: true,
    };

    if (selectMode === "entry") {
      if (!fromValue) {
        alert("Please enter From entry number");
        return null;
      }
      payload.from_entry = Number(fromValue);
      if (toValue) payload.to_entry = Number(toValue);
    } else if (selectMode === "range") {
      if (!fromValue || !toValue) {
        alert("Please provide both From and To date/time for range.");
        return null;
      }
      payload.from_date = toISOStringLocal(fromValue);
      payload.to_date = toISOStringLocal(toValue);
    }

    console.log("📤 Payload to send:", payload);
    return payload;
  };

  const handleRead = async () => {
    console.log("🚀 Starting Read...");
    setError(null);
    const payload = validateAndBuildPayload();
    if (!payload) return;

    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        console.log("🧹 Aborted previous stream");
      } catch (e) {
        console.warn("Abort failed:", e);
      }
    }

    controllerRef.current = new AbortController();
    setLoading(true);

    try {
      console.log(`🌐 Fetching from: ${BASE_URL}/api/event-log/`);
      const res = await fetch(`${BASE_URL}/api/event-log/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      console.log("📥 Response status:", res.status);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      console.log("📡 Stream started...");

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("✅ Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();

        for (let chunk of chunks) {
          if (!chunk.startsWith("data:")) continue;
          try {
            const jsonText = chunk.replace(/^data:\s*/, "");
            console.log("📦 Raw chunk received:", jsonText);

            const msg = JSON.parse(jsonText);
            console.log("🧩 Parsed message:", msg);

            if (msg && typeof msg === "object") {
              const incoming = {
                no: msg.no ?? msg.entry_no ?? msg.id,
                time: msg.time ?? msg.timestamp ?? new Date().toLocaleString(),
                eventCode: msg.event_code ?? msg.eventCode ?? "N/A",
              };
              upsertRow(incoming);
            }
          } catch (e) {
            console.warn("⚠️ Chunk parse error:", e);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("🟥 Stream aborted by user");
      } else {
        console.error("🔥 Read stream error:", err);
        setError(err.message || "Read failed");
      }
    } finally {
      console.log("🧭 Stream closed");
      setLoading(false);
    }
  };

  const handleStop = () => {
    console.log("🛑 Stop clicked");
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        controllerRef.current = null;
      } catch (e) {
        console.warn("Abort error:", e);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setError(null);
    const serial_number = localStorage.getItem("selectedSerialNumber") || "MTR1";
    const payload = {
      serial_number,
      type_log: "standard",
      events: rows.map((r) => ({
        entry_no: r.no,
        event_time: new Date(r.time).toISOString(),
        event_code: r.eventCode,
      })),
    };

    console.log("💾 Saving events:", payload);

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/standard_event_log/save_events/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Save success:", resp.data);
      alert("Saved: " + (resp.data?.message ?? "OK"));
    } catch (e) {
      console.error("❌ Save failed:", e);
      setError(e.response?.data?.error || e.message || "Save failed");
      alert("Save failed: " + (e.response?.data?.error || e.message));
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Refresh clicked — clearing rows");
    setRows([]);
    alert("Refreshed local table. To fetch live data, click Read.");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
      <div style={{ width: "100%", marginBottom: 12 }}>
        <label htmlFor="select-mode">Select Mode Entries:</label>
        <select
          id="select-mode"
          value={selectMode}
          onChange={handleSelectChange}
          style={{ width: "100%", marginTop: 4 }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range (date)</option>
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
         </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {selectMode === "entry" && (
          <>
            <div>
              <label>From (entry no)</label>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (entry no)</label>
              <input
                type="number"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}

        {selectMode === "range" && (
          <>
            <div>
              <label>From (date/time)</label>
              <input
                type="datetime-local"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (date/time)</label>
              <input
                type="datetime-local"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read"}
        </button>
        <button onClick={handleStop} disabled={!loading} style={{ marginRight: 8 }}>
          Stop
        </button>
        <button onClick={handleSave} style={{ marginRight: 8 }}>
          Save
        </button>
        <button onClick={handleRefresh}>Refresh</button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>No</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Time</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Event Code</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 12, textAlign: "center" }}>
                No rows to display
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.no}>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.no}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.time}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.eventCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



const PowerQualityLog = () => {
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const toISOStringLocal = (localDatetime) => {
    if (!localDatetime) return null;
    return new Date(localDatetime).toISOString();
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    console.log("🟢 Mode changed to:", value);
    setSelectMode(value);
    setFromValue("");
    setToValue("");
  };

  const upsertRow = (incoming) => {
    console.log("⬆️ Upserting incoming row:", incoming);
    setRows((prev) => {
      const idx = prev.findIndex((r) => Number(r.no) === Number(incoming.no));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...incoming };
        return copy;
      } else {
        return [...prev, incoming];
      }
    });
  };

  const validateAndBuildPayload = () => {
    const payload = {
      serial_number: localStorage.getItem("selectedSerialNumber") || "MTR1",
      type_log: "power_quality",
      mode: selectMode || "all",
      stream: true,
    };

    if (selectMode === "entry") {
      if (!fromValue) {
        alert("Please enter From entry number");
        return null;
      }
      payload.from_entry = Number(fromValue);
      if (toValue) payload.to_entry = Number(toValue);
    } else if (selectMode === "range") {
      if (!fromValue || !toValue) {
        alert("Please provide both From and To date/time for range.");
        return null;
      }
      payload.from_date = toISOStringLocal(fromValue);
      payload.to_date = toISOStringLocal(toValue);
    }

    console.log("📤 Payload to send:", payload);
    return payload;
  };

  const handleRead = async () => {
    console.log("🚀 Starting Read...");
    setError(null);
    const payload = validateAndBuildPayload();
    if (!payload) return;

    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        console.log("🧹 Aborted previous stream");
      } catch (e) {
        console.warn("Abort failed:", e);
      }
    }

    controllerRef.current = new AbortController();
    setLoading(true);

    try {
      console.log(`🌐 Fetching from: ${BASE_URL}/api/event-log/`);
      const res = await fetch(`${BASE_URL}/api/event-log/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      console.log("📥 Response status:", res.status);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      console.log("📡 Stream started...");

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("✅ Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();

        for (let chunk of chunks) {
          if (!chunk.startsWith("data:")) continue;
          try {
            const jsonText = chunk.replace(/^data:\s*/, "");
            console.log("📦 Raw chunk received:", jsonText);

            const msg = JSON.parse(jsonText);
            console.log("🧩 Parsed message:", msg);

            if (msg && typeof msg === "object") {
              const incoming = {
                no: msg.no ?? msg.entry_no ?? msg.id,
                time: msg.time ?? msg.timestamp ?? new Date().toLocaleString(),
                eventCode: msg.event_code ?? msg.eventCode ?? "N/A",
              };
              upsertRow(incoming);
            }
          } catch (e) {
            console.warn("⚠️ Chunk parse error:", e);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("🟥 Stream aborted by user");
      } else {
        console.error("🔥 Read stream error:", err);
        setError(err.message || "Read failed");
      }
    } finally {
      console.log("🧭 Stream closed");
      setLoading(false);
    }
  };

  const handleStop = () => {
    console.log("🛑 Stop clicked");
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        controllerRef.current = null;
      } catch (e) {
        console.warn("Abort error:", e);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setError(null);
    const serial_number = localStorage.getItem("selectedSerialNumber") || "MTR1";
    const payload = {
      serial_number,
      type_log: "standard",
      events: rows.map((r) => ({
        entry_no: r.no,
        event_time: new Date(r.time).toISOString(),
        event_code: r.eventCode,
      })),
    };

    console.log("💾 Saving events:", payload);

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/standard_event_log/save_events/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Save success:", resp.data);
      alert("Saved: " + (resp.data?.message ?? "OK"));
    } catch (e) {
      console.error("❌ Save failed:", e);
      setError(e.response?.data?.error || e.message || "Save failed");
      alert("Save failed: " + (e.response?.data?.error || e.message));
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Refresh clicked — clearing rows");
    setRows([]);
    alert("Refreshed local table. To fetch live data, click Read.");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
      <div style={{ width: "100%", marginBottom: 12 }}>
        <label htmlFor="select-mode">Select Mode Entries:</label>
        <select
          id="select-mode"
          value={selectMode}
          onChange={handleSelectChange}
          style={{ width: "100%", marginTop: 4 }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range (date)</option>
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
         </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {selectMode === "entry" && (
          <>
            <div>
              <label>From (entry no)</label>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (entry no)</label>
              <input
                type="number"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}

        {selectMode === "range" && (
          <>
            <div>
              <label>From (date/time)</label>
              <input
                type="datetime-local"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (date/time)</label>
              <input
                type="datetime-local"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read"}
        </button>
        <button onClick={handleStop} disabled={!loading} style={{ marginRight: 8 }}>
          Stop
        </button>
        <button onClick={handleSave} style={{ marginRight: 8 }}>
          Save
        </button>
        <button onClick={handleRefresh}>Refresh</button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>No</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Time</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Event Code</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 12, textAlign: "center" }}>
                No rows to display
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.no}>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.no}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.time}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.eventCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



const CommunicationEventLog = () => {
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const toISOStringLocal = (localDatetime) => {
    if (!localDatetime) return null;
    return new Date(localDatetime).toISOString();
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    console.log("🟢 Mode changed to:", value);
    setSelectMode(value);
    setFromValue("");
    setToValue("");
  };

  const upsertRow = (incoming) => {
    console.log("⬆️ Upserting incoming row:", incoming);
    setRows((prev) => {
      const idx = prev.findIndex((r) => Number(r.no) === Number(incoming.no));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...incoming };
        return copy;
      } else {
        return [...prev, incoming];
      }
    });
  };

  const validateAndBuildPayload = () => {
    const payload = {
      serial_number: localStorage.getItem("selectedSerialNumber") || "MTR1",
      type_log: "communication",
      mode: selectMode || "all",
      stream: true,
    };

    if (selectMode === "entry") {
      if (!fromValue) {
        alert("Please enter From entry number");
        return null;
      }
      payload.from_entry = Number(fromValue);
      if (toValue) payload.to_entry = Number(toValue);
    } else if (selectMode === "range") {
      if (!fromValue || !toValue) {
        alert("Please provide both From and To date/time for range.");
        return null;
      }
      payload.from_date = toISOStringLocal(fromValue);
      payload.to_date = toISOStringLocal(toValue);
    }

    console.log("📤 Payload to send:", payload);
    return payload;
  };

  const handleRead = async () => {
    console.log("🚀 Starting Read...");
    setError(null);
    const payload = validateAndBuildPayload();
    if (!payload) return;

    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        console.log("🧹 Aborted previous stream");
      } catch (e) {
        console.warn("Abort failed:", e);
      }
    }

    controllerRef.current = new AbortController();
    setLoading(true);

    try {
      console.log(`🌐 Fetching from: ${BASE_URL}/api/event-log/`);
      const res = await fetch(`${BASE_URL}/api/event-log/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      console.log("📥 Response status:", res.status);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      console.log("📡 Stream started...");

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("✅ Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();

        for (let chunk of chunks) {
          if (!chunk.startsWith("data:")) continue;
          try {
            const jsonText = chunk.replace(/^data:\s*/, "");
            console.log("📦 Raw chunk received:", jsonText);

            const msg = JSON.parse(jsonText);
            console.log("🧩 Parsed message:", msg);

            if (msg && typeof msg === "object") {
              const incoming = {
                no: msg.no ?? msg.entry_no ?? msg.id,
                time: msg.time ?? msg.timestamp ?? new Date().toLocaleString(),
                eventCode: msg.event_code ?? msg.eventCode ?? "N/A",
              };
              upsertRow(incoming);
            }
          } catch (e) {
            console.warn("⚠️ Chunk parse error:", e);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("🟥 Stream aborted by user");
      } else {
        console.error("🔥 Read stream error:", err);
        setError(err.message || "Read failed");
      }
    } finally {
      console.log("🧭 Stream closed");
      setLoading(false);
    }
  };

  const handleStop = () => {
    console.log("🛑 Stop clicked");
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        controllerRef.current = null;
      } catch (e) {
        console.warn("Abort error:", e);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setError(null);
    const serial_number = localStorage.getItem("selectedSerialNumber") || "MTR1";
    const payload = {
      serial_number,
      type_log: "standard",
      events: rows.map((r) => ({
        entry_no: r.no,
        event_time: new Date(r.time).toISOString(),
        event_code: r.eventCode,
      })),
    };

    console.log("💾 Saving events:", payload);

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/standard_event_log/save_events/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Save success:", resp.data);
      alert("Saved: " + (resp.data?.message ?? "OK"));
    } catch (e) {
      console.error("❌ Save failed:", e);
      setError(e.response?.data?.error || e.message || "Save failed");
      alert("Save failed: " + (e.response?.data?.error || e.message));
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Refresh clicked — clearing rows");
    setRows([]);
    alert("Refreshed local table. To fetch live data, click Read.");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
      <div style={{ width: "100%", marginBottom: 12 }}>
        <label htmlFor="select-mode">Select Mode Entries:</label>
        <select
          id="select-mode"
          value={selectMode}
          onChange={handleSelectChange}
          style={{ width: "100%", marginTop: 4 }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range (date)</option>
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
         </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {selectMode === "entry" && (
          <>
            <div>
              <label>From (entry no)</label>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (entry no)</label>
              <input
                type="number"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}

        {selectMode === "range" && (
          <>
            <div>
              <label>From (date/time)</label>
              <input
                type="datetime-local"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (date/time)</label>
              <input
                type="datetime-local"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read"}
        </button>
        <button onClick={handleStop} disabled={!loading} style={{ marginRight: 8 }}>
          Stop
        </button>
        <button onClick={handleSave} style={{ marginRight: 8 }}>
          Save
        </button>
        <button onClick={handleRefresh}>Refresh</button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>No</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Time</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Event Code</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 12, textAlign: "center" }}>
                No rows to display
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.no}>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.no}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.time}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.eventCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



const OtherEventLog = () => {
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const toISOStringLocal = (localDatetime) => {
    if (!localDatetime) return null;
    return new Date(localDatetime).toISOString();
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    console.log("🟢 Mode changed to:", value);
    setSelectMode(value);
    setFromValue("");
    setToValue("");
  };

  const upsertRow = (incoming) => {
    console.log("⬆️ Upserting incoming row:", incoming);
    setRows((prev) => {
      const idx = prev.findIndex((r) => Number(r.no) === Number(incoming.no));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...incoming };
        return copy;
      } else {
        return [...prev, incoming];
      }
    });
  };

  const validateAndBuildPayload = () => {
    const payload = {
      serial_number: localStorage.getItem("selectedSerialNumber") || "MTR1",
      type_log: "other",
      mode: selectMode || "all",
      stream: true,
    };

    if (selectMode === "entry") {
      if (!fromValue) {
        alert("Please enter From entry number");
        return null;
      }
      payload.from_entry = Number(fromValue);
      if (toValue) payload.to_entry = Number(toValue);
    } else if (selectMode === "range") {
      if (!fromValue || !toValue) {
        alert("Please provide both From and To date/time for range.");
        return null;
      }
      payload.from_date = toISOStringLocal(fromValue);
      payload.to_date = toISOStringLocal(toValue);
    }

    console.log("📤 Payload to send:", payload);
    return payload;
  };

  const handleRead = async () => {
    console.log("🚀 Starting Read...");
    setError(null);
    const payload = validateAndBuildPayload();
    if (!payload) return;

    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        console.log("🧹 Aborted previous stream");
      } catch (e) {
        console.warn("Abort failed:", e);
      }
    }

    controllerRef.current = new AbortController();
    setLoading(true);

    try {
      console.log(`🌐 Fetching from: ${BASE_URL}/api/event-log/`);
      const res = await fetch(`${BASE_URL}/api/event-log/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      console.log("📥 Response status:", res.status);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      console.log("📡 Stream started...");

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("✅ Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();

        for (let chunk of chunks) {
          if (!chunk.startsWith("data:")) continue;
          try {
            const jsonText = chunk.replace(/^data:\s*/, "");
            console.log("📦 Raw chunk received:", jsonText);

            const msg = JSON.parse(jsonText);
            console.log("🧩 Parsed message:", msg);

            if (msg && typeof msg === "object") {
              const incoming = {
                no: msg.no ?? msg.entry_no ?? msg.id,
                time: msg.time ?? msg.timestamp ?? new Date().toLocaleString(),
                eventCode: msg.event_code ?? msg.eventCode ?? "N/A",
              };
              upsertRow(incoming);
            }
          } catch (e) {
            console.warn("⚠️ Chunk parse error:", e);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("🟥 Stream aborted by user");
      } else {
        console.error("🔥 Read stream error:", err);
        setError(err.message || "Read failed");
      }
    } finally {
      console.log("🧭 Stream closed");
      setLoading(false);
    }
  };

  const handleStop = () => {
    console.log("🛑 Stop clicked");
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
        controllerRef.current = null;
      } catch (e) {
        console.warn("Abort error:", e);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setError(null);
    const serial_number = localStorage.getItem("selectedSerialNumber") || "MTR1";
    const payload = {
      serial_number,
      type_log: "standard",
      events: rows.map((r) => ({
        entry_no: r.no,
        event_time: new Date(r.time).toISOString(),
        event_code: r.eventCode,
      })),
    };

    console.log("💾 Saving events:", payload);

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/standard_event_log/save_events/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Save success:", resp.data);
      alert("Saved: " + (resp.data?.message ?? "OK"));
    } catch (e) {
      console.error("❌ Save failed:", e);
      setError(e.response?.data?.error || e.message || "Save failed");
      alert("Save failed: " + (e.response?.data?.error || e.message));
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Refresh clicked — clearing rows");
    setRows([]);
    alert("Refreshed local table. To fetch live data, click Read.");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
     
      <div style={{ width: "100%", marginBottom: 12 }}>
        <label htmlFor="select-mode">Select Mode Entries:</label>
        <select
          id="select-mode"
          value={selectMode}
          onChange={handleSelectChange}
          style={{ width: "100%", marginTop: 4 }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range (date)</option>
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
         </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {selectMode === "entry" && (
          <>
            <div>
              <label>From (entry no)</label>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (entry no)</label>
              <input
                type="number"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}

        {selectMode === "range" && (
          <>
            <div>
              <label>From (date/time)</label>
              <input
                type="datetime-local"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
              />
            </div>
            <div>
              <label>To (date/time)</label>
              <input
                type="datetime-local"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read"}
        </button>
        <button onClick={handleStop} disabled={!loading} style={{ marginRight: 8 }}>
          Stop
        </button>
        <button onClick={handleSave} style={{ marginRight: 8 }}>
          Save
        </button>
        <button onClick={handleRefresh}>Refresh</button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>No</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Time</th>
            <th style={{ border: "1px solid #ddd", padding: 6 }}>Event Code</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 12, textAlign: "center" }}>
                No rows to display
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.no}>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.no}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.time}</td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>{row.eventCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};











const PurchaseLog=()=> {
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // build payload and call API
  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        serial_number: localStorage.getItem("selectedSerialNumber"),
        type_log: "purchase",
        stream: false,
      };

      if (selectMode) payload.mode = selectMode;

      if (selectMode === "entry") {
        if (fromValue) payload.from_entry = Number(fromValue);
        if (toValue) payload.to_entry = Number(toValue);
      } else if (selectMode === "range") {
        // datetime-local -> ISO (keep timezone naive or adapt as needed)
        if (fromValue) payload.from_date = new Date(fromValue).toISOString();
        if (toValue) payload.to_date = new Date(toValue).toISOString();
      }

      const resp = await fetch(`${BASE_URL}/api/event-log2/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Server error ${resp.status}: ${txt}`);
      }

      const json = await resp.json();
      // Expecting { data: [ { no, time, purchaseToken, purchaseCredit, log_type } ... ] }
      const data = Array.isArray(json.data) ? json.data : [];
      setTableData(
        data.map((r) => ({
          no: r.no,
          time: r.time ? new Date(r.time).toLocaleString() : "",
          purchaseToken: r.purchaseToken || "",
          purchaseCredit:
            r.purchaseCredit !== undefined && r.purchaseCredit !== null && r.purchaseCredit !== ""
              ? `${Number(r.purchaseCredit).toFixed(2)} currency`
              : "",
        }))
      );
    } catch (err) {
      console.error("fetchLogs error:", err);
      setErrorMsg(err.message || "Failed to fetch logs");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  

  const handleRead=()=> 
  {
    fetchLogs()
  }

  const handleSelectChange = (event) => {
    const { value } = event.target;
    setSelectMode(value);
    setFromValue("");
    setToValue("");
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleSave = () => {
    // stub: server auto-generates tokens/credits on each call; Save flows not required
    alert("Save not required — server generates tokens/credits on request.");
  };

  const handleCaptureRefresh = () => {
    // not used; kept for parity with your UI
    alert("Capture Object refresh clicked!");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
      <div style={{ width: "100%", marginBottom: 12 }}>
        <label htmlFor="select-mode">Select Mode Entries: </label>
        <select
          id="select-mode"
          value={selectMode}
          onChange={handleSelectChange}
          style={{ width: "100%", padding: 6, marginTop: 6 }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range</option>
          <option value="atleast">Atleast</option>
        </select>
      </div>

      <div className="controls-section" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div className="control-group">
          <label htmlFor="entries-in-use">Entries: in use</label>
          <input type="text" id="entries-in-use" value="13" readOnly style={{ display: "block" }} />
        </div>

        <div className="control-group">
          <label htmlFor="profile-entries">Profile Entries:</label>
          <input type="text" id="profile-entries" value="13" readOnly style={{ display: "block" }} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          
             <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read"}
        </button>
          
          
          <button onClick={handleRefresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCaptureRefresh}>Capture Refresh</button>
        </div>
      </div>

      {selectMode === "entry" && (
        <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
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
        </div>
      )}

      {selectMode === "range" && (
        <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
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
        </div>
      )}

      {errorMsg && <div style={{ color: "red", marginBottom: 12 }}>{errorMsg}</div>}

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>No.</th>
            <th>Time</th>
            <th>Purchase token</th>
            <th>Purchase credit</th>
          </tr>
        </thead>
        <tbody>
          {tableData.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: 12 }}>
                {loading ? "Loading..." : "No records"}
              </td>
            </tr>
          ) : (
            tableData.map((row, index) => (
              <tr key={index}>
                <td>{row.no}</td>
                <td>{row.time}</td>
                <td style={{ fontFamily: "monospace" }}>{row.purchaseToken}</td>
                <td>{row.purchaseCredit}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}





const TokenTransferLog=()=> {
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // build payload and call API
  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        serial_number: localStorage.getItem("selectedSerialNumber"),
        type_log: "token_transfer",
        stream: false,
      };

      if (selectMode) payload.mode = selectMode;

      if (selectMode === "entry") {
        if (fromValue) payload.from_entry = Number(fromValue);
        if (toValue) payload.to_entry = Number(toValue);
      } else if (selectMode === "range") {
        // datetime-local -> ISO (keep timezone naive or adapt as needed)
        if (fromValue) payload.from_date = new Date(fromValue).toISOString();
        if (toValue) payload.to_date = new Date(toValue).toISOString();
      }

      const resp = await fetch(`${BASE_URL}/api/event-log2/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Server error ${resp.status}: ${txt}`);
      }

      const json = await resp.json();
      // Expecting { data: [ { no, time, purchaseToken, purchaseCredit, log_type } ... ] }
      const data = Array.isArray(json.data) ? json.data : [];
      setTableData(
        data.map((r) => ({
          no: r.no,
          time: r.time ? new Date(r.time).toLocaleString() : "",
          purchaseToken: r.purchaseToken || "",
          purchaseCredit:
            r.purchaseCredit !== undefined && r.purchaseCredit !== null && r.purchaseCredit !== ""
              ? `${Number(r.purchaseCredit).toFixed(2)} currency`
              : "",
        }))
      );
    } catch (err) {
      console.error("fetchLogs error:", err);
      setErrorMsg(err.message || "Failed to fetch logs");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  

  const handleRead=()=> 
  {
    fetchLogs()
  }

  const handleSelectChange = (event) => {
    const { value } = event.target;
    setSelectMode(value);
    setFromValue("");
    setToValue("");
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleSave = () => {
    // stub: server auto-generates tokens/credits on each call; Save flows not required
    alert("Save not required — server generates tokens/credits on request.");
  };

  const handleCaptureRefresh = () => {
    // not used; kept for parity with your UI
    alert("Capture Object refresh clicked!");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
      <div style={{ width: "100%", marginBottom: 12 }}>
        <label htmlFor="select-mode">Select Mode Entries: </label>
        <select
          id="select-mode"
          value={selectMode}
          onChange={handleSelectChange}
          style={{ width: "100%", padding: 6, marginTop: 6 }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range</option>
          <option value="atleast">Atleast</option>
        </select>
      </div>

      <div className="controls-section" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div className="control-group">
          <label htmlFor="entries-in-use">Entries: in use</label>
          <input type="text" id="entries-in-use" value="13" readOnly style={{ display: "block" }} />
        </div>

        <div className="control-group">
          <label htmlFor="profile-entries">Profile Entries:</label>
          <input type="text" id="profile-entries" value="13" readOnly style={{ display: "block" }} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          
             <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read"}
        </button>
          
          
          <button onClick={handleRefresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCaptureRefresh}>Capture Refresh</button>
        </div>
      </div>

      {selectMode === "entry" && (
        <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
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
        </div>
      )}

      {selectMode === "range" && (
        <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
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
        </div>
      )}

      {errorMsg && <div style={{ color: "red", marginBottom: 12 }}>{errorMsg}</div>}

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>No.</th>
            <th>Time</th>
            <th>Purchase token</th>
            <th>Purchase credit</th>
          </tr>
        </thead>
        <tbody>
          {tableData.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: 12 }}>
                {loading ? "Loading..." : "No records"}
              </td>
            </tr>
          ) : (
            tableData.map((row, index) => (
              <tr key={index}>
                <td>{row.no}</td>
                <td>{row.time}</td>
                <td style={{ fontFamily: "monospace" }}>{row.purchaseToken}</td>
                <td>{row.purchaseCredit}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


const LongPowerDownLog=()=> {
  const [selectMode, setSelectMode] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // build payload and call API
  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        serial_number: localStorage.getItem("selectedSerialNumber"),
        type_log: "long_power_down",
        stream: false,
      };

      if (selectMode) payload.mode = selectMode;

      if (selectMode === "entry") {
        if (fromValue) payload.from_entry = Number(fromValue);
        if (toValue) payload.to_entry = Number(toValue);
      } else if (selectMode === "range") {
        // datetime-local -> ISO (keep timezone naive or adapt as needed)
        if (fromValue) payload.from_date = new Date(fromValue).toISOString();
        if (toValue) payload.to_date = new Date(toValue).toISOString();
      }

      const resp = await fetch(`${BASE_URL}/api/event-log2/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Server error ${resp.status}: ${txt}`);
      }

      const json = await resp.json();
      // Expecting { data: [ { no, time, purchaseToken, purchaseCredit, log_type } ... ] }
      const data = Array.isArray(json.data) ? json.data : [];
      setTableData(
        data.map((r) => ({
          no: r.no,
          time: r.time ? new Date(r.time).toLocaleString() : "",
          purchaseToken: r.purchaseToken || "",
          purchaseCredit:
            r.purchaseCredit !== undefined && r.purchaseCredit !== null && r.purchaseCredit !== ""
              ? `${Number(r.purchaseCredit).toFixed(2)} currency`
              : "",
        }))
      );
    } catch (err) {
      console.error("fetchLogs error:", err);
      setErrorMsg(err.message || "Failed to fetch logs");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  

  const handleRead=()=> 
  {
    fetchLogs()
  }

  const handleSelectChange = (event) => {
    const { value } = event.target;
    setSelectMode(value);
    setFromValue("");
    setToValue("");
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleSave = () => {
    // stub: server auto-generates tokens/credits on each call; Save flows not required
    alert("Save not required — server generates tokens/credits on request.");
  };

  const handleCaptureRefresh = () => {
    // not used; kept for parity with your UI
    alert("Capture Object refresh clicked!");
  };

  return (
    <div className="dashboard-container" style={{ padding: 12 }}>
      <div style={{ width: "100%", marginBottom: 12 }}>
        <label htmlFor="select-mode">Select Mode Entries: </label>
        <select
          id="select-mode"
          value={selectMode}
          onChange={handleSelectChange}
          style={{ width: "100%", padding: 6, marginTop: 6 }}
        >
          <option value="">-- Select --</option>
          <option value="all">All</option>
          <option value="entry">Entry</option>
          <option value="range">Range</option>
          <option value="atleast">Atleast</option>
        </select>
      </div>

      <div className="controls-section" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div className="control-group">
          <label htmlFor="entries-in-use">Entries: in use</label>
          <input type="text" id="entries-in-use" value="13" readOnly style={{ display: "block" }} />
        </div>

        <div className="control-group">
          <label htmlFor="profile-entries">Profile Entries:</label>
          <input type="text" id="profile-entries" value="13" readOnly style={{ display: "block" }} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          
             <button onClick={handleRead} disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Reading..." : "Read"}
        </button>
          
          
          <button onClick={handleRefresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCaptureRefresh}>Capture Refresh</button>
        </div>
      </div>

      {selectMode === "entry" && (
        <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
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
        </div>
      )}

      {selectMode === "range" && (
        <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
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
        </div>
      )}

      {errorMsg && <div style={{ color: "red", marginBottom: 12 }}>{errorMsg}</div>}

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>No.</th>
            <th>Time</th>
            <th>Purchase token</th>
            <th>Purchase credit</th>
          </tr>
        </thead>
        <tbody>
          {tableData.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: 12 }}>
                {loading ? "Loading..." : "No records"}
              </td>
            </tr>
          ) : (
            tableData.map((row, index) => (
              <tr key={index}>
                <td>{row.no}</td>
                <td>{row.time}</td>
                <td style={{ fontFamily: "monospace" }}>{row.purchaseToken}</td>
                <td>{row.purchaseCredit}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}



const EventTable = ({ rows, onToggleRow }) => (
  <table className="data-table">
    <thead>
      <tr>
        <th>Checked</th>
        <th>No.</th>
        <th>Name</th>
        <th>Code</th>
        <th>Value</th>
        <th>Unit</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.id} className={r.checked ? 'row-selected' : ''}>
          <td>
            <input type="checkbox" checked={!!r.checked} onChange={() => onToggleRow(r.id)} />
          </td>
          <td>{r.no}</td>
          <td>{r.name}</td>
          <td>{r.code}</td>
          <td>{r.value}</td>
          <td>{r.unit}</td>
        </tr>
      ))}
    </tbody>
  </table>
);





const PlaceholderDashboard = ({ title, rows, setRows }) => {
  const handleToggle = (id) => setRows(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  const sendSelected = () => {
    const selected = rows.filter(r => r.checked).map(r => ({ name: r.name, code: r.code }));
    if (!selected.length) return alert('No items selected');
    console.log(`${title} - selected`, selected);
    alert(`${title}: would send ${selected.length} items to backend (console).`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-actions">
        <button className="dashboard-btn"><FaBookOpen style={{ marginRight: 8 }} />Read</button>
        <button className="dashboard-btn"><FaFileExport style={{ marginRight: 8 }} />Export</button>
        <button className="dashboard-btn primary" onClick={sendSelected}>Send selected</button>
      </div>
      <EventTable rows={rows} onToggleRow={handleToggle} />
    </div>
  );
};

const makeRows = (items) => items.map((it, idx) => ({ id: idx + 1, checked: false, no: idx + 1, name: it.name, code: it.code, value: '', unit: it.unit || '' }));

export default function EventSection() {
  const [activeSection, setActiveSection] = useState('eventLogInformation');
  const [openSubmenus, setOpenSubmenus] = useState({ event: false });

  const toggleSubmenu = (key) => setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));

  const sidebarItems = [
    { id: 'standard', label: 'Standard event log', icon: faCloud },
    { id: 'fraud', label: 'Fraud detection log', icon: faShieldAlt },
    { id: 'disconnector', label: 'Disconnector control log', icon: faPlug },
    { id: 'powerQuality', label: 'Power quality log', icon: faBolt },
    { id: 'communication', label: 'Communication event log', icon: faComments },
    { id: 'other', label: 'Other event log', icon: faExclamationTriangle },
    { id: 'purchase', label: 'Purchase log', icon: faShoppingCart },
    { id: 'longPowerDown', label: 'Long power down log', icon: faPowerOff },
    { id: 'tokenTransfer', label: 'Token transfer log', icon: faExchangeAlt },
  ];

  // datasets
  const [standardRows, setStandardRows] = useState(makeRows([
    { name: 'Number of power failures in any phase', code: '(1,0-0.96.7.21.255)' },
    { name: 'Number of long power failures in any phase', code: '(1,0-0.96.7.9.255)' },
    { name: 'Duration of last long power failure in any phase', code: '(3,0-0.96.7.19.255)', unit: 's' },
    { name: 'Number of voltage sags in phase L1', code: '(1,1-0.32.32.0.255)' },
    { name: 'Duration of last voltage sag in phase L1', code: '(3,1-0.32.33.0.255)', unit: 's' },
  ]));

  

 
  const [tokenTransferRows, setTokenTransferRows] = useState(makeRows([
    { name: 'Token transferred', code: '(1,0-0.71.1.0.255)' },
  ]));

  const renderSection = () => {
    switch (activeSection) {
      case 'eventLogInformation':
        return <EventLogInformationDashboard/>
      case 'standard':
        return <StandardEventLogDashboard/>;
      case 'fraud':
        return <FraudDetectionLog/>;
      case 'disconnector':
        return <DisconnectorControlLog/>;
      case 'powerQuality':
        return <PowerQualityLog />;
      case 'communication':
        return <CommunicationEventLog/>;
      case 'other':
        return <OtherEventLog />;
      case 'purchase':
        return <PurchaseLog/>;
      case 'longPowerDown':
        return <LongPowerDownLog />;
      case 'tokenTransfer':
        return <TokenTransferLog/>
      default:
        return <StandardEventLogDashboard data={standardRows} setData={setStandardRows} />;
    }
  };


  // place this with your other hooks (after useState declarations)
const handleItemClick = (sectionId, parentMenu = null) => {
  setActiveSection(sectionId);
  if (parentMenu) {
    setOpenSubmenus(prev => ({ ...prev, [parentMenu]: true }));
  }
};


  return (
    <div className="header-dashboard">
      <div className="header-container border-effect">
      <nav className="sidebar1">
  <div className="billing-section-title">
    <FontAwesomeIcon icon={faExclamationTriangle} className="icon" /> Event Log
  </div>

  <ul>
            <li className={activeSection === 'eventLogInformation' ? 'active' : ''}>
              <button onClick={() => handleItemClick('eventLogInformation')} className="sidebar1-btn">
                <FontAwesomeIcon icon={faCloud} className="icon" />
                Event log information
              </button>
            </li>
          </ul>

  <ul>
    <li className={`subsection-parent ${openSubmenus['event'] ? 'open' : ''}`}>
      {/* <-- toggleSubmenu toggles open/close */}
      <button
        onClick={() => toggleSubmenu('event')}
        className={`sidebar1-btn ${openSubmenus['event'] ? 'open' : ''}`}
      >
        <FontAwesomeIcon icon={faExclamationTriangle} className="icon" />
        Event
      </button>

      {openSubmenus['event'] && (
        <ul className="sub-menu">
          {sidebarItems.map(it => (
            <li key={it.id} className={activeSection === it.id ? 'active' : ''}>
              {/* keep using handleItemClick so parent stays open after selecting a child */}
              <button onClick={() => handleItemClick(it.id, 'event')} className="sidebar1-btn sub-btn">
                <FontAwesomeIcon icon={it.icon} className="sub-icon" />
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  </ul>
</nav>

        <main className="content">
          <div className="read-write-container">
            <button className="dashboard-btn"><FaBookOpen style={{ marginRight: 8, color: '#ff4d00ff' }} />Read</button>
            <button className="dashboard-btn"><FaFileExport style={{ marginRight: 8, color: '#ff4d00ff' }} />Export</button>
          </div>
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
