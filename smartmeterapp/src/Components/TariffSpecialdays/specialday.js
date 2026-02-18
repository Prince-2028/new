import './specialday.css'; // Add your styling here
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure



const SpecialDaysForm = () => {
  const [date, setDate] = useState("FFFF-FF-1st day-FF");
  const [dayId, setDayId] = useState("Day1");
  const [yearType, setYearType] = useState("Every year");
  const [month, setMonth] = useState("Every month");
  const [dayOfMonth, setDayOfMonth] = useState("1st day");
  const [dayOfWeek, setDayOfWeek] = useState("Week");
  const [specialDays, setSpecialDays] = useState([]);
  const [specialYear, setSpecialYear] = useState('');
 

  // State for the modal
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null); // State for the selected entry
  console.log(specialDays);
  

  // API base URL
  const apiUrl = `${BASE_URL}/api/tariff-specialdays/`; // Adjust this as needed

  // Function to fetch special days for a specific device (device_id)
  const fetchSpecialDays = async () => {
    const deviceId=1
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
          device_id: 1, // Replace with your actual device ID
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
  
    const device_id = 1;
  
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


export default SpecialDaysForm