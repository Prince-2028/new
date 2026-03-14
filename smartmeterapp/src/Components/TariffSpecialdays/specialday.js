import './specialday.css'; // Add your styling here
import React, { useState, useEffect,useRef } from 'react';
import axios from 'axios';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure



const SpecialDaysForm1 = () => {
  const [date, setDate] = useState("FFFF-FF-1st day-FF");
  const [dayId, setDayId] = useState("Day1");
  const [yearType, setYearType] = useState("Every year");
  const [month, setMonth] = useState("Every month");
  const [dayOfMonth, setDayOfMonth] = useState("1st day");
  const [dayOfWeek, setDayOfWeek] = useState("Week");
  const [specialDays, setSpecialDays] = useState([]);
  const [specialYear, setSpecialYear] = useState('');

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
 

  // State for the modal
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null); // State for the selected entry
  console.log(specialDays);
  

  // API base URL
  const apiUrl = `${BASE_URL}/api/tariff-specialdays/`; // Adjust this as needed

  // Function to fetch special days for a specific device (device_id)
  const fetchSpecialDays = async () => {
    
    try {
      const response = await axios.get(`${apiUrl}${deviceId}/`);
      setSpecialDays(response.data.special_days);
    } catch (error) {
      console.error("Error fetching special days:", error);
    }
  };

  // Fetch special days when the component mounts
  useEffect(() => {
    
    fetchSpecialDays();
  }, []);


  const handleAdd = async () => {


   



    if (date && dayId) {
      const newEntry = {
        day_id: dayId,
        formatted_date: date
      };
  
      try {
        const response = await axios.post(apiUrl, {
          device_id: deviceId, // Replace with your actual device ID
          special_days: [newEntry]
        });
  
        // Check for successful response status
        if (response.status === 201) {
          
          console.log("Special day successfully added!");
          alert("Special day added successfully!");
          fetchSpecialDays()
        } else {
          console.error(`Unexpected response status: ${response.status}`);
          alert(`Failed to add special day. Status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error adding special day:", error);
        alert("Error adding special day. Please try again.");
      }
    } else {
      alert("Please fill out both Date and Day ID fields.");
    }
  };
  



  console.log("selectedEntry",selectedEntry)

  const handleDelete = async () => {
    // Check if an entry is selected
    if (selectedEntry === null) {
      alert("Please select a special day to delete.");
      return; // Exit if no entry is selected
    }
  
    const confirmDelete = window.confirm("Are you sure you want to delete this special day?");
    if (!confirmDelete) return; // Exit if the user cancels
    
    const special_day_id = specialDays[selectedEntry].id;
  
    console.log(specialDays[selectedEntry]);
    console.log("special_day_id", special_day_id);
  
    const device_id = deviceId;
  
    try {
      const response = await axios.delete(`${apiUrl}${device_id}/${special_day_id}/`);
      
      // Check if the status is 204 for a successful deletion
      if (response.status === 204) {
        console.log("Successfully deleted special day.");
        fetchSpecialDays(); // Refresh the list of special days
      }
    } catch (error) {
      console.error("Error deleting special day:", error);
    }
  };
  

  const handleClear = async () => {



    const confirmDelete = window.confirm("Are you sure you want to delete this total special days?");
    if (!confirmDelete) return; // Exit if the user cancels


    const deviceId=1
    try {
      const response = await axios.delete(`${apiUrl}${deviceId}/clear/`);  // Custom endpoint for clearing all data
      if (response.status === 204) {
        setSpecialDays([]); // Clear the frontend data
      }
    } catch (error) {
      console.error("Error clearing special days:", error);
    }
  };

  const handleFirst = () => {
  if (specialDays.length === 0) return;
  setSelectedEntry(0);
};

const handlePrevious = () => {
  if (selectedEntry === null || selectedEntry === 0) return;
  setSelectedEntry(selectedEntry - 1);
};

const handleNext = () => {
  if (
    selectedEntry === null ||
    selectedEntry >= specialDays.length - 1
  )
    return;

  setSelectedEntry(selectedEntry + 1);
};

const handleLast = () => {
  if (specialDays.length === 0) return;
  setSelectedEntry(specialDays.length - 1);
};

  const handleSave = (type) => {
    const year = yearType === "Every year" ? "FFFF" : specialYear;
    const formattedMonth = month === "Every month" ? "FF" : month;
    const week = dayOfWeek === "Week" ? "FF" : dayOfWeek;

    const formatteddata = `${year}-${formattedMonth}-${dayOfMonth}-${week}`;
    setDate(formatteddata);
  };

  const closePopup = (e) => {
    if (e.target.className === 'modal') {
      setShowModal(false);
    }
  };

  const changeYear = (e) => {
    setYearType(e.target.value);
  };

  return (
    <div className="special-days-form-container">
      <div className="form-section" style={{ width: "40%" }}>
        <div className="form-group">
          <label>Date:</label>
          <input
            type="text"
            value={date}
            placeholder="Enter date (FFFF-FF-01-FF)"
            onChange={(e) => setDate(e.target.value)} 
            onClick={() => setShowModal(true)}
          />
        </div>

        <div className="form-group">
          <label>Day ID:</label>
          <select value={dayId} onChange={(e) => setDayId(e.target.value)}>
            {[...Array(7)].map((_, i) => (
              <option key={i} value={`Day${i + 1}`}>
                {`Day${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Other fields (yearType, month, dayOfMonth, dayOfWeek) */}

        
      </div>

      

      <div className="vertical-toolbar">
  {/* Action buttons */}
  <button className="tool-btn" onClick={handleAdd}>
    <span className="tool-icon">+</span>
    <span className="tool-text">Add</span>
  </button>

  <button className="tool-btn" onClick={handleAdd} >
    <span className="tool-icon red-dot"></span>
    <span className="tool-text">Insert</span>
  </button>

  <button className="tool-btn" onClick={handleDelete}>
    <span className="tool-icon">−</span>
    <span className="tool-text">Delete</span>
  </button>

  <button className="tool-btn" onClick={handleClear}>
    <span className="tool-icon">×</span>
    <span className="tool-text">Clear</span>
  </button> 

 

  {/* Navigation buttons */}
  <button className="tool-btn" onClick={handleFirst}>
    <span className="tool-icon">|◀</span>
    <span className="tool-text">First</span>
  </button>

  <button className="tool-btn" onClick={handlePrevious}>
    <span className="tool-icon">◀</span>
    <span className="tool-text">Previous</span>
  </button>

  <button className="tool-btn" onClick={handleNext}>
    <span className="tool-icon">▶</span>
    <span className="tool-text">Next</span>
  </button>

  <button className="tool-btn" onClick={handleLast}>
    <span className="tool-icon">▶|</span>
    <span className="tool-text">Last</span>
  </button>
</div>


      {/* Display added entries */}
      <div className="table-section-specialday" style={{ width: "45%" }}>
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Date Time</th>
              <th>Day ID</th>
            </tr>
          </thead>
          <tbody>
            {specialDays.map((entry, index) => (
              <tr 
                key={index} 
                onClick={() => setSelectedEntry(index)} // Select entry on row click

                id={selectedEntry === index ?  'selected' : ''}
              >
                <td>{index + 1}</td>
                <td>
                  <span style={{ cursor: "pointer", color: "blue" }}>
                    {entry.formatted_date}
                  </span> 
                </td>
                <td>{entry.day_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for editing date */}
      {showModal && (
        <div className="modal" onClick={closePopup}>
          <div className="modal-content">
            <h3>Edit Daylight Savings End</h3>
            <div className="modal-row">
              <label>Year Type:</label>
              <select value={yearType} onChange={changeYear}>
                <option value="Every year">Every Year</option>
                <option value="Special Year">Special Year</option>
              </select>
              {yearType === 'Special Year' && (
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
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                  <option key={idx} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-row">
              <label>Day of the Month:</label>
              <select value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-row">
              <label> Day of Week</label>
              <input value={dayOfWeek} />
            </div>
            <button onClick={() => handleSave('end')}>Save</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};




// Ensure BASE_URL is defined in scope

const SpecialDaysForm = () => {
  const [date, setDate] = useState("FFFF-FF-1st day-FF");
  const [dayId, setDayId] = useState("Day1");
  const [yearType, setYearType] = useState("Every year");
  const [month, setMonth] = useState("Every month");
  const [dayOfMonth, setDayOfMonth] = useState("1st day");
  const [dayOfWeek, setDayOfWeek] = useState("Week");
  const [specialDays, setSpecialDays] = useState([]);
  const [specialYear, setSpecialYear] = useState("");

  const [deviceId] = useState(() => localStorage.getItem("selectedDeviceId"));

  // State for the modal
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null); // index of selected row

  const rowRefs = useRef([]);

  // API base URL
  const apiUrl = `${BASE_URL}/api/tariff-specialdays/`;

  /* -------------------------
     Fetch special days
  -------------------------- */
  const fetchSpecialDays = async () => {
    try {
      const response = await axios.get(`${apiUrl}${deviceId}/`);
      const list = (response.data && response.data.special_days) || [];
      setSpecialDays(list);
      setSelectedEntry(null);
    } catch (error) {
      console.error("Error fetching special days:", error);
      setSpecialDays([]);
      setSelectedEntry(null);
    }
  };

  useEffect(() => {
    fetchSpecialDays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  /* -------------------------
     Add (POST)
  -------------------------- */
  const handleAdd = async () => {
    if (!date || !dayId) {
      alert("Please fill Date and Day ID");
      return;
    }

    const newEntry = { day_id: dayId, formatted_date: date };

    try {
      const response = await axios.post(apiUrl, {
        device_id: deviceId,
        special_days: [newEntry],
      });

      if (response.status === 201) {
        alert("Special day added successfully");
        // reload from server to keep server authoritative
        await fetchSpecialDays();
      } else {
        console.error("Unexpected response status:", response.status);
        alert("Failed to add special day");
      }
    } catch (err) {
      console.error("Error adding special day:", err);
      alert("Error adding special day");
    }
  };

  /* -------------------------
     Delete selected entry (server)
  -------------------------- */
  const handleDelete = async () => {
    if (selectedEntry === null) {
      alert("Please select a special day to delete.");
      return;
    }

    const ok = window.confirm("Are you sure you want to delete this special day?");
    if (!ok) return;

    const entry = specialDays[selectedEntry];
    if (!entry || !entry.id) {
      alert("Selected entry has no id to delete on server.");
      return;
    }

    try {
      const resp = await axios.delete(`${apiUrl}${deviceId}/${entry.id}/`);
      if (resp.status === 204) {
        await fetchSpecialDays();
      } else {
        console.error("Unexpected delete response:", resp.status);
      }
    } catch (err) {
      console.error("Error deleting special day:", err);
      alert("Error deleting special day");
    }
  };

  /* -------------------------
     Clear all
  -------------------------- */
  const handleClear = async () => {
    const ok = window.confirm("Are you sure you want to delete all special days?");
    if (!ok) return;

    try {
      const resp = await axios.delete(`${apiUrl}${deviceId}/clear/`);
      if (resp.status === 204) {
        setSpecialDays([]);
        setSelectedEntry(null);
      } else {
        console.error("Unexpected clear response:", resp.status);
      }
    } catch (err) {
      console.error("Error clearing special days:", err);
      alert("Error clearing special days");
    }
  };

  /* -------------------------
     moveItem: reorder local array and update selectedEntry
     (keeps UI consistent like Loadprofile components)
  -------------------------- */
  const moveItem = (fromIndex, toIndex) => {
    const prev = specialDays;
    if (!Array.isArray(prev) || fromIndex == null) return;
    if (fromIndex < 0 || fromIndex >= prev.length) return;

    // copy & remove
    const next = [...prev];
    const [item] = next.splice(fromIndex, 1);

    // clamp insert index into [0 .. next.length]
    const insertIndex = Math.max(0, Math.min(toIndex, next.length));
    next.splice(insertIndex, 0, item);

    setSpecialDays(next);
    setSelectedEntry(insertIndex);
  };

  /* -------------------------
     Navigation handlers that REORDER rows
  -------------------------- */
  const handleFirst = () => {
    if (selectedEntry === null) {
      alert("Select a row");
      return;
    }
    if (selectedEntry === 0) return;
    moveItem(selectedEntry, 0);
  };

  const handlePrevious = () => {
    if (selectedEntry === null) {
      alert("Select a row");
      return;
    }
    if (selectedEntry <= 0) return;
    moveItem(selectedEntry, selectedEntry - 1);
  };

  const handleNext = () => {
    if (selectedEntry === null) {
      alert("Select a row");
      return;
    }
    const lastIndex = specialDays.length - 1;
    if (selectedEntry >= lastIndex) return;
    moveItem(selectedEntry, selectedEntry + 1);
  };

  const handleLast = () => {
    if (selectedEntry === null) {
      alert("Select a row");
      return;
    }
    const lastIndex = specialDays.length - 1;
    if (selectedEntry === lastIndex) return;
    moveItem(selectedEntry, lastIndex);
  };

  /* -------------------------
     auto-scroll selected row into view
  -------------------------- */
  useEffect(() => {
    if (selectedEntry !== null && rowRefs.current[selectedEntry]) {
      rowRefs.current[selectedEntry].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedEntry]);

  /* -------------------------
     Save date formatting from modal
  -------------------------- */
  const handleSave = () => {
    const year = yearType === "Every year" ? "FFFF" : specialYear || "FFFF";
    const formattedMonth = month === "Every month" ? "FF" : month;
    const week = dayOfWeek === "Week" ? "FF" : dayOfWeek;
    const formatteddata = `${year}-${formattedMonth}-${dayOfMonth}-${week}`;
    setDate(formatteddata);
    setShowModal(false);
  };

  const closePopup = (e) => {
    if (e.target.className === "modal") setShowModal(false);
  };

  const changeYear = (e) => setYearType(e.target.value);

  /* -------------------------
     UI
  -------------------------- */
  const hasSelected = selectedEntry !== null;
  const lastIndex = specialDays.length - 1;
  const atFirst = hasSelected && selectedEntry === 0;
  const atLast = hasSelected && selectedEntry === lastIndex;

  return (
    <div className="special-days-form-container" style={{ display: "flex", gap: 12 }}>
      {/* Form column */}
      <div className="form-section" style={{ width: "40%" }}>
        <div className="form-group">
          <label>Date:</label>
          <input
            type="text"
            value={date}
            placeholder="Enter date (FFFF-FF-01-FF)"
            onChange={(e) => setDate(e.target.value)}
            onClick={() => setShowModal(true)}
          />
        </div>

        <div className="form-group">
          <label>Day ID:</label>
          <select value={dayId} onChange={(e) => setDayId(e.target.value)}>
            {[...Array(7)].map((_, i) => (
              <option key={i} value={`Day${i + 1}`}>
                {`Day${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* You can add yearType/month/dayOfMonth/dayOfWeek UI here if desired */}
      </div>

      {/* Toolbar */}
      <div className="vertical-toolbar">
        <button className="tool-btn" onClick={handleAdd}>
          <span className="tool-icon">+</span> <span className="tool-text">Add</span>
        </button>

        <button className="tool-btn" onClick={handleAdd}>
          <span className="tool-icon red-dot"></span> <span className="tool-text">Insert</span>
        </button>

        <button className="tool-btn" onClick={handleDelete} disabled={!hasSelected}>
          <span className="tool-icon">−</span> <span className="tool-text">Delete</span>
        </button>

        <button className="tool-btn" onClick={handleClear} disabled={!specialDays.length}>
          <span className="tool-icon">×</span> <span className="tool-text">Clear</span>
        </button>

        <div className="tool-separator" style={{ height: 1, background: "#eee", margin: "8px 0" }} />

        <button className="tool-btn" onClick={handleFirst} disabled={!hasSelected || atFirst}>
          <span className="tool-icon">|◀</span> <span className="tool-text">First</span>
        </button>

        <button className="tool-btn" onClick={handlePrevious} disabled={!hasSelected || atFirst}>
          <span className="tool-icon">◀</span> <span className="tool-text">Previous</span>
        </button>

        <button className="tool-btn" onClick={handleNext} disabled={!hasSelected || atLast}>
          <span className="tool-icon">▶</span> <span className="tool-text">Next</span>
        </button>

        <button className="tool-btn" onClick={handleLast} disabled={!hasSelected || atLast}>
          <span className="tool-icon">▶|</span> <span className="tool-text">Last</span>
        </button>
      </div>

      {/* Table column */}
      <div className="table-section-specialday" style={{ width: "45%", overflowY: "auto", maxHeight: 420 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 2, borderBottom: "1px solid #ddd" }}>No.</th>
              <th style={{ textAlign: "left", padding: 2, borderBottom: "1px solid #ddd" }}>Date Time</th>
              <th style={{ textAlign: "left", padding: 2, borderBottom: "1px solid #ddd" }}>Day ID</th>
            </tr>
          </thead>
          <tbody>
            {specialDays.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 1 }}>No special days</td>
              </tr>
            ) : (
              specialDays.map((entry, index) => (
                <tr
                  key={entry.id ?? index}
                  ref={(el) => (rowRefs.current[index] = el)}
                  onClick={() => setSelectedEntry(index)}
                  style={{
                    background: selectedEntry === index ? "#eef" : "",
                    cursor: "pointer",
                  }}
                >
                  <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{index + 1}</td>
                  <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>
                    <span style={{ cursor: "pointer", color: "blue" }}>{entry.formatted_date}</span>
                  </td>
                  <td style={{ padding: 1, borderBottom: "1px solid #f0f0f0" }}>{entry.day_id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal" onClick={closePopup} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="modal-content" style={{ background: "#fff", padding: 16, borderRadius: 6, width: 480 }}>
            <h3>Edit Special Day</h3>

            <div className="modal-row" style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Year Type:</label>
              <select value={yearType} onChange={changeYear}>
                <option value="Every year">Every Year</option>
                <option value="Special Year">Special Year</option>
              </select>

              {yearType === "Special Year" && (
                <input
                  type="number"
                  placeholder="Enter Year"
                  value={specialYear}
                  onChange={(e) => setSpecialYear(e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              )}
            </div>

            <div className="modal-row" style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Month:</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="Every month">Every Month</option>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                  <option key={i} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="modal-row" style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Day of the Month:</label>
              <select value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="modal-row" style={{ marginBottom: 8 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Day of Week:</label>
              <input value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};




export default SpecialDaysForm