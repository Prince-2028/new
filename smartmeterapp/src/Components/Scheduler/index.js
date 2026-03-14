
import axios from 'axios';
import './index.css';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

import React, { useEffect, useState, useRef } from "react";


function Scheduler() {
  const [executedScript, setExecutedScript] = useState("Edit value is null");
  const [type, setType] = useState("Not defined");
  const [executionTimes, setExecutionTimes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [yearType, setYearType] = useState("Every Year");
  const [specialYear, setSpecialYear] = useState("");
  const [month, setMonth] = useState("Every Month");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [selectedButton, setSelectedButton] = useState("monthly");
  const [selectedDateTime, setSelectedDateTime] = useState(""); // "HH:MM"
  const [selectedRowId, setSelectedRowId] = useState(null);

  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );

  // Ensure deviceId is loaded
  useEffect(() => {
    const storedId = localStorage.getItem("selectedDeviceId");
    setDeviceId(storedId);
  }, []);

  // Fetch execution times from backend
  const fetchExecutionTimes = async (btn = selectedButton) => {
    if (!deviceId) return;
    try {
      const response = await axios.get(
        `${BASE_URL}/api/get-scheduler/${deviceId}/${btn}/`
      );
      if (response.data && response.data.data) {
        setExecutionTimes(response.data.data);
        console.log("Fetched execution times:", response.data.data);
      } else {
        setExecutionTimes([]);
      }
    } catch (error) {
      console.error("Error fetching execution times:", error);
    }
  };

  // Run fetch when selectedButton or deviceId changes
  useEffect(() => {
    fetchExecutionTimes(selectedButton);
  }, [selectedButton, deviceId]);

  const handleButtonClick = (buttonType) => {
    setSelectedButton(buttonType);
    // fetchExecutionTimes(buttonType); // not necessary, useEffect will handle
  };

  const handleAddExecutionTime = () => {
    // Reset/prepare modal fields based on selectedButton and open
    if (selectedButton === "daily") {
      setYearType("Every Year");
      setSpecialYear("");
      setMonth("Every Month");
      setDayOfMonth("01"); // placeholder internally; will be sent as "01"
      setSelectedDateTime("00:00");
    } else if (selectedButton === "monthly") {
      setYearType("Every Year");
      setSpecialYear("");
      setMonth("Every Month");
      setDayOfMonth(1); // fixed day for monthly
      setSelectedDateTime("00:00");
    } else {
      // relay / full edit
      setYearType("Every Year");
      setSpecialYear("");
      setMonth("January");
      setDayOfMonth(1);
      setSelectedDateTime("00:00");
    }
    setShowModal(true);
  };

  const handleRowClick = (id) => {
    setSelectedRowId(id);
  };

  const handleDeleteExecutionTime = async () => {
    if (!selectedRowId) {
      alert("Please select a row to delete.");
      return;
    }

    try {
      const response = await axios.delete(
        `${BASE_URL}/api/delete-scheduler/${selectedRowId}/`
      );
      console.log("Scheduler deleted successfully:", response.data);

      // Update table
      setExecutionTimes((prev) => prev.filter((entry) => entry.id !== selectedRowId));
      setSelectedRowId(null);
    } catch (error) {
      console.error("Error deleting scheduler:", error);
    }
  };

  const closePopup = () => {
    setShowModal(false);
  };

  // helper: convert month name -> number string "01".."12"
  const monthToNumber = (m) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const idx = months.indexOf(m);
    return idx === -1 ? null : String(idx + 1).padStart(2, "0");
  };

  // Build backend datetime string based on current modal values
  const buildExecutionTimeString = () => {
    let yy;
    if (yearType === "Special Year" && specialYear) {
      yy = String(specialYear).padStart(4, "0");
    } else if (yearType === "Every Year") {
      yy = "ffff";
    } else {
      // fallback
      yy = String(new Date().getFullYear());
    }

    let mm;
    if (selectedButton === "daily" || selectedButton === "monthly") {
      // placeholders for these modes
      mm = "ff";
    } else {
      if (month === "Every Month") mm = "ff";
      else mm = monthToNumber(month) || "01";
    }

    let dd;
    if (selectedButton === "daily") {
      // daily -> placeholder day
      dd = "01";
    } else if (selectedButton === "monthly") {
      // monthly -> fixed day 1
      dd = String(1).padStart(2, "0");
    } else {
      // relay / full edit
      dd = String(dayOfMonth).padStart(2, "0");
    }

    // Time must be provided
    if (!selectedDateTime || !selectedDateTime.includes(":")) {
      return null;
    }
    const hhmm = selectedDateTime.split(":");
    const hh = String(hhmm[0]).padStart(2, "0");
    const min = String(hhmm[1]).padStart(2, "0");

    // Using ISO-like 'T' separator to match earlier code (server should accept)
    return `${yy}-${mm}-${dd}T${hh}:${min}:00`;
  };

  const handleSave = async () => {
    const executionTime = buildExecutionTimeString();
    if (!executionTime) {
      alert("Please select a valid time before saving.");
      return;
    }

    console.log("Formatted Execution Time:", executionTime);

    let recurrence_type = "once";
    if (yearType === "Every Year") {
      recurrence_type = "every_year";
    } else if (month === "Every Month" || selectedButton === "monthly" || selectedButton === "daily") {
      // monthly/daily treat as recurring monthly/every_month placeholder
      recurrence_type = "every_month";
    } else if (yearType === "Special Year") {
      recurrence_type = "once";
    }

    const schedulerData = {
      device_id: deviceId,
      scheduler_type: selectedButton,
      executed_script: executedScript,
      type: type,
      execution_time: executionTime,
      recurrence_type: recurrence_type,
    };

    try {
      const response = await axios.post(
        `${BASE_URL}/api/create-scheduler/`,
        schedulerData
      );
      console.log("Scheduler created successfully:", response.data);

      // Append new entry to UI if response includes the created entry
      if (response.data) {
        // If API returns new object inside response.data (common), use that; otherwise refetch
        const newEntry = response.data.data || response.data;
        if (newEntry && newEntry.id) {
          setExecutionTimes((prev) => [...prev, newEntry]);
        } else {
          // fallback: refetch to get server canonical list
          fetchExecutionTimes(selectedButton);
        }
      } else {
        fetchExecutionTimes(selectedButton);
      }
    } catch (error) {
      console.error("Error creating scheduler:", error);
      alert("Failed to create scheduler. See console for details.");
    } finally {
      setShowModal(false);
    }
  };

  // small UI helpers
  const isSelectedRow = (id) => selectedRowId === id;

  return (
    <div>
      <div
        className="view-toggle"
        role="tablist"
        aria-label="Scheduler selection"
      >
        <button
          type="button"
          role="tab"
          aria-pressed={selectedButton === "monthly"}
          className={`view-btn ${selectedButton === "monthly" ? "active" : ""}`}
          onClick={() => handleButtonClick("monthly") || setSelectedButton("monthly")}
        >
          End of Monthly Billing Period Scheduler
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={selectedButton === "daily"}
          className={`view-btn ${selectedButton === "daily" ? "active" : ""}`}
          onClick={() => handleButtonClick("daily") || setSelectedButton("daily")}
        >
          End of Daily Billing Period Scheduler
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={selectedButton === "relay"}
          className={`view-btn ${selectedButton === "relay" ? "active" : ""}`}
          onClick={() => handleButtonClick("relay") || setSelectedButton("relay")}
        >
          Main Relay Control
        </button>
      </div>

      <div className="load-control-container">
        <div className="security-form">
          <label>
            <input type="checkbox" />
            <span>Executed Script:</span>
            <input
              type="text"
              className="fixed-input"
              value={executedScript}
              onChange={(e) => setExecutedScript(e.target.value)}
              readOnly
            />
          </label>
        </div>

        <div className="security-form">
          <label>
            <input type="checkbox" />
            <span>Type:</span>
            <input
              type="text"
              className="fixed-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              readOnly
            />
          </label>
        </div>

        <div style={{ width: "80%", paddingRight: "10px" }}>
          <div className="security-form">
            <label>
              <input type="checkbox" />
              <span>Execution Time Table: </span>
            </label>
          </div>

          <div className="scheduler-table-container">
            <table className="tableTariff1">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Execution Time</th>
                </tr>
              </thead>
              <tbody>
                {executionTimes.length === 0 ? (
                  <tr>
                    <td colSpan={2}>No execution times</td>
                  </tr>
                ) : (
                  executionTimes.map((entry, index) => (
                    <tr
  key={entry.id}
  onClick={() => handleRowClick(entry.id)}
  style={{
    backgroundColor: selectedRowId === entry.id ? "#ff801e" : "",
    cursor: "pointer",
  }}
>
                      <td>{index + 1}</td>
                      <td>{entry.execution_time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="scheduler-button-container">
          <button className="scheduler-add-button" onClick={handleAddExecutionTime}>
            Add
          </button>
          <button
            className="scheduler-delete-button"
            onClick={handleDeleteExecutionTime}
          >
            Delete
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal" onClick={closePopup}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Edit Daylight Savings End</h3>

              {/* Show year/month/day controls only for 'relay' (full edit mode) */}
              {selectedButton === "relay" && (
                <>
                  <div className="modal-row">
                    <label>Year Type:</label>
                    <select
                      value={yearType}
                      onChange={(e) => setYearType(e.target.value)}
                    >
                      <option value="Every Year">Every Year</option>
                      <option value="Special Year">Special Year</option>
                    </select>

                    {yearType === "Special Year" && (
                      <input
                        type="number"
                        placeholder="Enter Year"
                        value={specialYear}
                        onChange={(e) => setSpecialYear(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="modal-row">
                    <label>Month:</label>
                    <select value={month} onChange={(e) => setMonth(e.target.value)}>
                      <option value="Every Month">Every Month</option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m, idx) => (
                        <option key={idx} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modal-row">
                    <label>Day of the Month:</label>
                    <select
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* For monthly/daily: we hide the full pickers and show a small read-only indicator if needed */}
              {selectedButton === "monthly" && (
                <div className="modal-row">
                  <label>Monthly schedule — Day fixed to 1</label>
                </div>
              )}

              {selectedButton === "daily" && (
                <div className="modal-row">
                  <label>Daily schedule — every day</label>
                </div>
              )}

              <div className="modal-row">
                <label>Select Time:</label>
                <input
                  type="time"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                />
              </div>

              <div className="modal-row">
                <button onClick={closePopup}>Cancel</button>
                <button onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scheduler;

