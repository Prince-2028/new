import React, { useState,useEffect,useRef} from "react";
import './tariff.css';
import axios from "axios";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import SpecialDaysForm from "../TariffSpecialdays/specialday"; // Importing SpecialDaysForm component




const TariffParameter = () => {
  // Mock data directly in the component
const [data, setData] = useState([
  {
    id: 1,
    name: 'Currently active rate',
    code: '(1,0-0:96.14.0.255)',
    value: '',
    unit: 'kWh',
  },
  {
    id: 2,
    name: 'Active time of passive step tariff',
    code: '(1,0-128:96.2.8.2.255)',
    value: '',
    unit: 'hours',
  },
  {
    id: 3,
    name: 'Currently active price',
    code: '(3,0-0:96.14.1.255)',
    value: '',
    unit: 'Currency',
  },
  {
    id: 4,
    name: 'Currently active step',
    code: '(1,0-1:96.14.0.255)',
    value: '',
    unit: '',
  },
]);


  
 



  const [checkedItems, setCheckedItems] = useState({}); // Keep track of checked items


  const [tariffData , setTariffData]=useState([])

  const fetchTariffParameters = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/tariff-parameters/${deviceId}/`);
      const tariffData = response.data.parameters; // Adjust according to your API response
      setTariffData(tariffData);
    } catch (error) {
      console.error("Error fetching tariff parameters:", error);
    }
  }

  const handleGetValues=()=> 
  {
   
    fetchTariffParameters()

  }

     

  // Function to get the value for display based on the name
  const getValue = (name) => {
    const item = tariffData.find(item => item.name === name);
    return item ? item.value : ''; // Return the value or 'N/A' if not found
  };

  return (
    <div className="tou_container">
     

      <table className="tableTariff1">
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
          {data.map((item, index) => (
            <tr key={item.id}>
              <td>
                <input
                  type="checkbox"
                  checked={checkedItems[item.id] || false}
                 
                />
              </td>
              <td>{index + 1}</td>
              <td>{item.name}</td>
              <td>{item.code}</td>
              <td>{getValue(item.name)}</td> {/* Use getValue to fetch the display value */}
              <td>{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button style={{marginLeft:"40%"}} className="scheduler-add-button" onClick={handleGetValues}>Get Values</button>
    </div>
  );
};











const CalendarManager = () => {
  const [activeView, setActiveView] = useState('Day');
  const [calendarStatus, setCalendarStatus] = useState('Active');
  //const [calendarName, setCalendarName] = useState('');
  //const [calendarTime, setCalendarTime] = useState('');
  const [calendarName, setCalendarName] = useState('00000000'); // Default value for calendar name

  const [isOpenWeek, setIsOpenWeek] = useState(false); 
  const [isOPenSeason , setIsOpenSeason]=useState(false)
  const [weekName, setWeekName] = useState('');

 


// when editing a single profile row inside modal
const [editingProfileIndex, setEditingProfileIndex] = useState(null);

// Edit modal state
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editingCalendarId, setEditingCalendarId] = useState(null);
const [editingDayId, setEditingDayId] = useState(null);
const [editProfiles, setEditProfiles] = useState([]); // [{ start_time: "00:00", script_selector: "T1" }, ...]

// Open the edit modal and load selected row's data
const openEditModal = () => {
  if (!selectItem || selectItem === 'null') {
    alert('Please select a row to edit.');
    return;
  }
  // only allow editing in Day view (you can adapt for Week/Season later)
  if (activeView !== 'Day') {
    alert('Edit is supported currently only for Day view.');
    return;
  }

  const selectedDay = data.days.find((d) => d.calendar_id === selectItem);
  if (!selectedDay) {
    alert('Selected item not found in data.');
    return;
  }

  // Map server start_time -> "HH:MM" for time input
  const mappedProfiles = (selectedDay.profiles || []).map((p) => {
    let t = p.start_time || '00:00';
    // If server returned seconds like "08:30:00", trim
    if (t.length >= 5 && t[2] === ':') t = t.slice(0,5);
    return { ...p, start_time: t, script_selector: p.script_selector || 'T1' };
  });

  setEditingCalendarId(selectedDay.calendar_id);
  setEditingDayId(selectedDay.day_id ?? selectedDay.dayId ?? null);
  setEditProfiles(mappedProfiles.length ? mappedProfiles : [{ start_time: '00:00', script_selector: 'T1' }]);
  setIsEditModalOpen(true);
};

// Edit profile row change
const handleEditProfileChange = (index, field, value) => {
  setEditProfiles((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
};

// Add/Delete edit rows
const addEditProfile = () => {
  if (editProfiles.length >= 12) {
    alert('Max 12 profiles allowed.');
    return;
  }
  setEditProfiles((prev) => [...prev, { start_time: '00:00', script_selector: 'T1' }]);
};

const deleteEditProfile = (index) => {
  setEditProfiles((prev) => prev.filter((_, i) => i !== index));
};



const saveEditedDay = async () => {
  if (!editingCalendarId) {
    alert('No editing calendar selected.');
    return;
  }
  // basic validation: at least one profile
  if (!editProfiles.length) {
    alert('Add at least one profile before saving.');
    return;
  }

  try {
    const payload = {
      device_id: deviceId,
      calendar_name: calendarName,
      entity_type: 'Day',
      status: calendarStatus,
      calendar_datetime: calendarTime,
      profiles: editProfiles.map((p, idx) => ({
        id: idx + 1,
        // ensure start_time format matches backend expectations. Send "HH:MM" or "HH:MM:SS" if needed.
        start_time: p.start_time.length === 5 ? `${p.start_time}:00` : p.start_time,
        script_selector: p.script_selector,
      })),
      day_id: editingDayId,
    };

    const response = await axios.put(
      `${BASE_URL}/api/tou-calendar/update/${editingCalendarId}/`,
      payload
    );

    if (response.status === 200 || response.status === 201) {
      // success
      setIsEditModalOpen(false);
      setEditingCalendarId(null);
      setEditingDayId(null);
      setEditProfiles([]);
      fetchCalendars(); // refresh the table
      alert('Day updated successfully.');
    } else {
      alert('Unexpected response from server. See console for details.');
      console.error('Update response:', response);
    }
  } catch (error) {
    console.error('Error updating day:', error);
    if (error.response && error.response.data) {
      const msg = error.response.data.error || JSON.stringify(error.response.data);
      alert(`Error: ${msg}`);
    } else {
      alert('Error updating data. Check console for details.');
    }
  }
};







  

  const [seasonStart, setSeasonStart] = useState('00:00'); // Store time in "hh:mm" format 

  const [selectItem,setSelectItem]=useState('null')

  const [days, setDays] = useState({
    Monday: 'Day1',
    Tuesday: 'Day1',
    Wednesday: 'Day1',
    Thursday: 'Day1',
    Friday: 'Day1',
    Saturday: 'Day1',
    Sunday: 'Day1',
  }); 

  const [updateItem,setUpdateItem]=useState(false)


  const handleInputChangeWeek = (event) => {
    const { name, value } = event.target;
    setDays((prevDays) => ({
      ...prevDays,
      [name]: value,
    }));
  };

  const dayOptions = ['Day1', 'Day0', 'Day5', 'Day7']; 

  
    const [selectedIndex, setSelectedIndex] = useState(null);

function handleSelectRow(index) {
  console.log("index",index)
  setSelectedIndex(index); // toggle selection
}

function handleDeleteRow(index) {
  setProfiles(prev => prev.filter((_, i) => i !== index));
  // clear or adjust selection
  if (selectedIndex === index) setSelectedIndex(null);
  else if (selectedIndex != null && selectedIndex > index) setSelectedIndex(prev => prev - 1);
}

function handleDeleteSelected() {
  if (selectedIndex == null) { alert("No row selected."); return; }
  handleDeleteRow(selectedIndex);
}

  
  const [calendarTime, setCalendarTime] = useState(() => {
    const now = new Date();
    
    // Convert current time to UTC+5:30 (IST)
    const istOffset = 5.5 * 60; // IST offset in minutes
    const localOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
    const istTime = new Date(now.getTime() + (istOffset + localOffset) * 60 * 1000); // Adjust to IST
    
    const hours = String(istTime.getHours()).padStart(2, '0'); // Get the IST hour and format it
    const minutes = String(istTime.getMinutes()).padStart(2, '0'); // Get the IST minutes and format it
    
    return `${istTime.getFullYear()}-${String(istTime.getMonth() + 1).padStart(2, '0')}-${String(istTime.getDate()).padStart(2, '0')}T${hours}:${minutes}`; // Default to today's date and IST time
  });

 
  
  const [data, setData] = useState({
    days: [],
    weeks: [],
    seasons: [],
  });

  console.log(data)
  const [popupVisible, setPopupVisible] = useState(false);
  const [newProfile, setNewProfile] = useState({
    dayId: '',
    startTime: '00:00',    
    scriptSelector: 'T1',
  });

  


  const [profiles, setProfiles] = useState([]);
  const [isDayIdFixed, setIsDayIdFixed] = useState(false);

  const buttonRefs = {
    active: useRef(null),
    passive: useRef(null),
  };
  const underlineRef = useRef(null);



  useEffect(() => {
    if (calendarStatus === 'Active') {
      moveUnderline(buttonRefs.active.current);
    } else if (calendarStatus === 'Passive') {
      moveUnderline(buttonRefs.passive.current);
    }
  }, [calendarStatus]);



  const moveUnderline = (button) => {
    const underline = underlineRef.current;
    if (underline && button) {
      underline.style.width = `${button.offsetWidth}px`;
      underline.style.left = `${button.offsetLeft}px`;
      underline.classList.add('moving');
    }
  };


  const deviceId = localStorage.getItem('selectedDeviceId');
  

  const fetchCalendars = async () => {
    try {
      
      const response = await axios.get(
        `${BASE_URL}/api/tou-calendar/${deviceId}/${activeView}/${calendarStatus}`
      );
      const fetchedData = response.data.calendars;

      if (activeView === 'Day') {
        setData((prevData) => ({ ...prevData, days: fetchedData }));
      } else if (activeView === 'Week') {
        setData((prevData) => ({ ...prevData, weeks: fetchedData }));
      } else if (activeView === 'Season') {
        setData((prevData) => ({ ...prevData, seasons: fetchedData }));
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, [activeView, calendarStatus]);

  const handleAdd = () => {
    setPopupVisible(true);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dayId') {
      const dayId = parseInt(value, 10);
      if (dayId >= 0 && dayId <= 7) {
        setNewProfile((prev) => ({ ...prev, [name]: value }));
      } else {
        alert('Day ID must be between 0 and 7');
      }
    } else {
      setNewProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddProfile = () => {
    if (profiles.length < 12) {
      setProfiles((prevProfiles) => [...prevProfiles, newProfile]);
      setNewProfile({ ...newProfile, startTime: '00:00', scriptSelector: 'T1' });
      setIsDayIdFixed(true);
    } else {
      alert('You can only add up to 12 profiles.');
    }
  };


  const handleSave = async () => {

    if (profiles.length === 0) {
      alert('Please add at least one profile.');
      return; // Exit the function if there are no profiles
  }
    try {
      
  
      // Build the payload object
      const payload = {
        device_id: deviceId,
        calendar_name: calendarName, // Ensure this is a valid string
        entity_type: 'Day',
        status: calendarStatus, // Ensure this is a valid status
        
        calendar_datetime: calendarTime, // Ensure this is a valid ISO string
        profiles: profiles.map((profile, index) => ({
          id: index + 1,
          start_time: profile.startTime, // Ensure this is a valid time string
          script_selector: profile.scriptSelector, // Ensure this is a valid selector
        })),
        day_id: newProfile.dayId, // Ensure this is a valid number
      };
  
      console.log('Payload to send:', payload); // Log payload for debugging
  
      // Send the POST request to the API endpoint
      const response = await axios.post(
        `${BASE_URL}/api/tou-calendar/`,
        payload
      );

      if (response.status === 201) { // Ensure that the response is successful
        console.log('Data saved successfully:', response.data);
        
        // If successful, apply the following
        setPopupVisible(false); // Close the popup
        setProfiles([]); // Clear profiles
        setIsDayIdFixed(false); // Reset day ID state
        fetchCalendars(); // Fetch the updated calendars
      } 
 
    } 
   
   
    catch (error) {
      // Improved error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        const errorMessage = error.response.data.error || 'Failed to save data.';
        
        // Check if the error is specifically about the day_id already existing
        if (error.response.status === 400 && error.response.data.error) {

          if (error.response.data.error.includes('Day ID')) {

            setIsDayIdFixed(false); // Reset day ID state
            
            alert(`Error: ${error.response.data.error}`);
          } else {
            alert(`Error: ${errorMessage}`);
          }
        } else {
          alert(`Error: ${errorMessage}`);
        }
    
        console.error('Error saving data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        alert('Error: No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request
        console.error('Error in setup:', error.message);
        alert(`Error: ${error.message}`);
      }
    }
  };
  

  const handleSaveWeek = async (e) => {
    e.preventDefault();
    try {
      
  
      // Construct the payload for saving the week
      const payload = {
        device_id: deviceId,
        calendar_name: calendarName, // Ensure this is a valid string
        entity_type: 'Week', // Setting entity type to 'Week'
        status: calendarStatus, // Ensure this is a valid status
        
        days: [
          {
            Monday: days.Monday,
            Tuesday: days.Tuesday,
            Wednesday: days.Wednesday,
            Thursday: days.Thursday,
            Friday: days.Friday,
            Saturday: days.Saturday,
            Sunday: days.Sunday,
          },
        ],
        
        week_name: weekName, // Make sure this is set correctly in your state
        calendar_datetime: calendarTime, // Ensure this is a valid ISO string
      };
  
      console.log('Payload to save week:', payload); // Log payload for debugging
  
      // Send the POST request to the API endpoint
      const response = await axios.post(
        `${BASE_URL}/api/tou-calendar/`,
        payload
      );
  
      console.log('Week data saved successfully:', response.data);
      setIsOpenWeek(false); // Close the week modal
      // Optionally, you can fetch updated week data after saving
      fetchCalendars();
    } catch (error) {
      // Improved error handling
      if (error.response) {
        const errorMessage = error.response.data.error || 'Failed to save week data.';
        alert(`Error: ${errorMessage}`);
        console.error('Error saving week data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Error: No response from server. Please try again later.');
      } else {
        console.error('Error in setup:', error.message);
        alert(`Error: ${error.message}`);
      }
    }
  };
  

  const handleSaveSeason = async (e) => {
    e.preventDefault();

    // Check for required fields
    if (!weekName) {
        alert('Please fill in the Week Name.');
        return; // Exit the function if weekName is missing
    }

    if (!seasonStart) {
        alert('Please fill in the Season Start time.');
        return; // Exit the function if seasonStart is missing
    }

    try {
       

        // Construct the payload for saving the season
        const payload = {
            device_id: deviceId,
            calendar_name: calendarName, // Ensure this is a valid string
            entity_type: 'Season', // Setting entity type to 'Season'
            status: calendarStatus, // Ensure this is a valid status
            season_start: seasonStart, // Make sure this is set correctly in your state
            week_name: weekName, // Make sure this is set correctly in your state
            calendar_datetime: calendarTime, // Ensure this is a valid ISO string
        };

        console.log('Payload to save season:', payload); // Log payload for debugging

        // Send the POST request to the API endpoint
        const response = await axios.post(
            `${BASE_URL}/api/tou-calendar/`, // Ensure the endpoint is correct
            payload
        );

        console.log('Season data saved successfully:', response.data);
        setIsOpenSeason(false); // Close the season modal
        // Optionally, you can fetch updated season data after saving
        fetchCalendars(); // Fetch updated data from the server
    } catch (error) {
        // Improved error handling
        if (error.response) {
            const errorMessage = error.response.data.error || 'Failed to save season data.';
            alert(`Error: ${errorMessage}`);
            console.error('Error saving season data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
            alert('Error: No response from server. Please try again later.');
        } else {
            console.error('Error in setup:', error.message);
            alert(`Error: ${error.message}`);
        }
    }
};


  const closePopupOutside = (e) => {
    if (e.target.className === 'tou_modal') {
     
      setPopupVisible(false)
      setIsOpenWeek(false)
      setIsOpenSeason(false)
    } 
  }


  const selectRow = (id) => {

    console.log("Selected ID:", id);
    setSelectItem(id)

  }; 

  
  const DeleteItem=()=> 
  {

    
   
    // URL for delete method, replacing {id} with the actual id
    const deleteUrl = `${BASE_URL}/api/tou-calendars/${selectItem}/`;
  
    // Send DELETE request to the backend
    axios
      .delete(deleteUrl)
      .then((response) => {
        console.log("Item deleted successfully", response.data);
        // Handle success, maybe refresh the list or give feedback to the user 
        fetchCalendars()
        
      })
      .catch((error) => {
        console.error("There was an error deleting the item:", error);
        // Handle error, show feedback to the user
      });

  }

 

  const updateWeek = () => {
    if (selectItem!=='null') {
      console.log("Updating selected row information:", selectItem);
  
      // Find the selected week data based on the selected calendar ID
      const selectedWeek = data.weeks.find((week) => week.calendar_id === selectItem);
  
      if (selectedWeek) {
        // Set week name and days from selected week
        setWeekName(selectedWeek.week_name);
        setDays(selectedWeek.days[0]); // Assuming days[0] contains the values for the days
  
        // Open the week edit form
        setIsOpenWeek(true);
        setUpdateItem(true)
        
      }
    } else {
      alert("Please select a week before updating.");
    }
  };


  const renderActiveView = () => {
    switch (activeView) {
      case 'Day':
        return (
          <div class="tou_table_wrap" role="region" aria-label="Scrollable table" tabindex="0">
           
            <table className="tableTariff1">
              <thead>
                <tr>
                  <th>Day ID</th>
                  {Array.from({ length: 12 }, (_, index) => (
                    <th key={index}>Profile {index + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.days.map((day) => (
                  <tr onClick={() => selectRow(day.calendar_id)}  
                  style={{ backgroundColor: selectItem === day.calendar_id ? '#ff7e14' : "" }}   key={day.day_id}>
                    <td>{day.day_id}</td>
                    {day.profiles.map((profile, profileIndex) => (
                      <td key={profileIndex}>
                        {profile.start_time}  ({profile.script_selector})
                      </td>
                    ))}
                    {Array.from({ length: 12 - day.profiles.length }).map(
                      (_, index) => (
                        <td key={day.profiles.length + index}></td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

           <div
           
            style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap", 
    marginLeft:'30%'    // will wrap on very small screens
  }}

           > 
            <button className="scheduler-add-button"  onClick={handleAdd}>
              Add Day
            </button> 

            <button className="scheduler-delete-button" onClick={DeleteItem}> 
            Delete Day
            </button>

           <button
  className="scheduler-add-button"
  onClick={(e) => {
    e.stopPropagation();
    openEditModal();
  }}
>
  Edit
</button>
            </div>
          </div>
        );
      


      case 'Week':
  return (
    
  <div>
  <table>
    <thead className="tou_table">
      <tr>
        <th>Name</th>
        <th>Monday</th>
        <th>Tuesday</th>
        <th>Wednesday</th>
        <th>Thursday</th>
        <th>Friday</th>
        <th>Saturday</th>
        <th>Sunday</th>
      </tr>
    </thead>
    <tbody>
      {data.weeks.map((week) => {
        // Access the first element of the days array to get the day's values
        const weekDays = week.days[0];

        return (
          <tr key={week.week_name}    onClick={() => selectRow(week.calendar_id)}  
          style={{ backgroundColor: selectItem === week.calendar_id ? 'pink' : 'transparent' }}>    {/* Use a unique key */}
            <td>{week.week_name}</td>
            <td>{weekDays.Monday}</td>
            <td>{weekDays.Tuesday}</td>
            <td>{weekDays.Wednesday}</td>
            <td>{weekDays.Thursday}</td>
            <td>{weekDays.Friday}</td>
            <td>{weekDays.Saturday}</td>
            <td>{weekDays.Sunday}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
  <div 

  style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap", 
    marginLeft:'10%'    // will wrap on very small screens
  }}
>
  
  
  <button className="scheduler-add-button"  onClick={()=>setIsOpenWeek(true)}>
    Add Week
  </button>

  <button className="scheduler-delete-button" onClick={DeleteItem}> 
            Delete Week
            </button>

            <button className="scheduler-add-button"   onClick={updateWeek}> 
            Update Week
            </button>
            </div>
</div>
  );
 
      case 'Season':
        return (
          
        <div>
        <table className="tou_table">
                <thead>
                    <tr>
                        <th>Index</th>
                        <th>Season Start</th>
                        <th>Week Name</th>
                        
                    </tr>
                </thead>
                <tbody>
                    {data.seasons.map((season,index) => (
                        <tr key={season.calendar_id}   onClick={() => selectRow(season.calendar_id)}  
                        style={{ backgroundColor: selectItem === season.calendar_id ? 'pink' : 'transparent' }}>
                            <td> {index} </td>
                            <td>{season.season_start}</td>
                            <td>{season.week_name}</td>
                           
                        </tr>
                    ))}
                </tbody>  
            </table>
            <div 

            
  style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap", 
    marginLeft:'20%'    // will wrap on very small screens
  }}
            
            > 
        <button  className="scheduler-add-button" onClick={()=>setIsOpenSeason(true)}>
          Add Season
        </button>
        <button  className="scheduler-delete-button" onClick={DeleteItem}> 
            Delete Season
            </button>
            </div>
      </div>
        );
      
      
      default:
        return <div>Select a view to manage (Day, Week, Season)</div>;
    }
  };

  console.log(selectItem)


  const updateCalendar = async() => {
    try {
     
  
      // Build the payload object based on the active view
      let payload;
      if (activeView === 'Day') {
        payload = {
          device_id: deviceId,
          calendar_name: calendarName,
          entity_type: 'Day',
          status: calendarStatus,
          calendar_datetime: calendarTime,
          profiles: profiles.map((profile, index) => ({
            id: index + 1,
            start_time: profile.startTime,
            script_selector: profile.scriptSelector,
          })),
          day_id: newProfile.dayId,
        };
      } else if (activeView === 'Week') {
        payload = {
          device_id: deviceId,
          calendar_name: calendarName,
          entity_type: 'Week',
          status: calendarStatus,
          days: [{
            Monday: days.Monday,
            Tuesday: days.Tuesday,
            Wednesday: days.Wednesday,
            Thursday: days.Thursday,
            Friday: days.Friday,
            Saturday: days.Saturday,
            Sunday: days.Sunday,
          }],
          week_name: weekName,
          calendar_datetime: calendarTime,
        };
      } else if (activeView === 'Season') {
        payload = {
          device_id: deviceId,
          calendar_name: calendarName,
          entity_type: 'Season',
          status: calendarStatus,
          season_start: seasonStart,
          week_name: weekName,
          calendar_datetime: calendarTime,
        };
      }
  
      console.log('Payload to update calendar:', payload.days); // Log payload for debugging
  
      // Send the PUT request to the API endpoint
      const response = await axios.put(
        `${BASE_URL}/api/tou-calendar/update/${selectItem}/`, // Ensure endpoint includes calendarId
        
        payload
      );
  
      if (response.status === 200) {
        console.log('Calendar updated successfully:', response.data);
  
        // Optionally refetch data to reflect the update
        fetchCalendars();
      }
    } catch (error) {
      // Improved error handling
      if (error.response) {
        const errorMessage = error.response.data.error || 'Failed to update calendar.';
        alert(`Error: ${errorMessage}`);
        console.error('Error updating calendar:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Error: No response from server. Please try again later.');
      } else {
        console.error('Error in setup:', error.message);
        alert(`Error: ${error.message}`);
      }
    }
  };


  const Changestatus = () => {
    setCalendarStatus((prev) => (prev === 'Passive' ? 'Active' : 'Passive'));
    setData({
      days: [],
      weeks: [],
      seasons: [],
    });
  };


 
  


  return (
    <div className="tou_container">
     
      <div className="controlsGroup_addDevice">
        <button
          ref={buttonRefs.active}
          className={`tou_button ${
            calendarStatus === 'Active' ? 'activeButton' : ''
          }`}
          onClick={Changestatus}
        >
          Active
        </button>
        <button
          ref={buttonRefs.passive}
          className={`tou_button ${
            calendarStatus === 'Passive' ? 'activeButton' : ''
          }`}
          onClick={Changestatus}
        >
          Passive
        </button>
        <div ref={underlineRef} className="underline"></div>
      </div>

      

      <div className="tou_field">
        <label>
          Calendar Name:
          <input
            type="text"
            value={calendarName}
            onChange={(e) => setCalendarName(e.target.value)}
            placeholder="Enter Calendar Name"
            className="tou_input"
          />
        </label>
      </div>

      <div className="tables_container">

      <div className="tou_view_selection">
        <label>
          <input
            className="tou_radio_input"
            type="radio"
            name="view"
            checked={activeView === 'Day'}
            onChange={() => setActiveView('Day')}
          />
          Day
        </label>
        <label>
          <input
            className="tou_radio_input"
            type="radio"
            name="view"
            checked={activeView === 'Week'}
            onChange={() => setActiveView('Week')}
          />
          Week
        </label>
        <label>
          <input
            className="tou_radio_input"
            type="radio"
            name="view"
            checked={activeView === 'Season'}
            onChange={() => setActiveView('Season')}
          />
          Season
        </label>
      </div>

      


      {renderActiveView()}

       </div>

      <div className="tou_field">
        <label>
          Calendar Time:
          <input
            type="datetime-local"
            value={calendarTime}
            onChange={(e) => setCalendarTime(e.target.value)}
            className="tou_input"
          />
        </label>
      </div>

      {popupVisible && (
        <div className="tou_modal" onClick={closePopupOutside}>
          <div className="tou_modal-content"> 
            <div className='profile_Container1'>
            <h3>Add Day</h3>
            <label>
              Day ID:
              <input
                type="number"
                name="dayId"
                value={newProfile.dayId}
                onChange={handleProfileChange}
                disabled={isDayIdFixed}
                className="tou_input"
                placeholder="Enter Day ID (0-7)"
              />
            </label>
            <label>
              Start Time:
              <input
                type="time"
                name="startTime"
                value={newProfile.startTime}
                onChange={handleProfileChange}
                className="tou_input"
              />
            </label>
            <label>
              Script Selector:
              <select
                name="scriptSelector"
                value={newProfile.scriptSelector}
                onChange={handleProfileChange}
                className="tou_input"
              >
                <option value="T1">T1</option>
                <option value="T2">T2</option>
                <option value="T3">T3</option>
                <option value="T4">T4</option>
                <option value="T5">T5</option>
              </select>
            </label>

            <div className="tou_button_group">
              <button className="tou_button" onClick={handleAddProfile}>
                Add Profile
              </button>
              <button className="tou_button" onClick={handleSave}>
                Save
              </button>

              <button
    className="tou_button"
    onClick={handleDeleteSelected}
    disabled={selectedIndex == null}
  >
    Delete Selected
  </button>
            </div>
            </div>  
            
            <div className="profile_Container2"> 

            <table className="">
              <thead>
                <tr>
                  <th>Day ID</th>
                  <th>Start Time</th>
                  <th>Script Selector</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile, index) => (
                  <tr 

                  onClick={() => handleSelectRow(index)}
          className={selectedIndex === index ? "selected-row" : ""}
                  
                  key={index}>
                    <td>{newProfile.dayId}</td>
                    <td>{profile.startTime}</td>
                    <td>{profile.scriptSelector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>


          </div>
        </div>
      )}


      {isEditModalOpen && (
  <div className="tou_modal" onClick={closePopupOutside}>
    <div className="tou_modal-content" onClick={(e) => e.stopPropagation()}>
      <div style={{ width: '100%' }}>
        <h3>Edit Day — {editingDayId != null ? `Day ID ${editingDayId}` : ''}</h3>

        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table className="tou_table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Start Time</th>
                <th>Script Selector</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {editProfiles.map((p, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>

                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="time"
                      value={p.start_time?.slice(0,5) ?? '00:00'}
                      onChange={(e) => handleEditProfileChange(idx, 'start_time', e.target.value)}
                      className="tou_input"
                    />
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <select
                      value={p.script_selector || 'T1'}
                      onChange={(e) => handleEditProfileChange(idx, 'script_selector', e.target.value)}
                      className="tou_input"
                    >
                      <option value="T1">T1</option>
                      <option value="T2">T2</option>
                      <option value="T3">T3</option>
                      <option value="T4">T4</option>
                      <option value="T5">T5</option>
                    </select>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteEditProfile(idx); }}
                      className="tou_button small"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
          <button className="tou_button" onClick={addEditProfile} disabled={editProfiles.length >= 12}>
            Add Profile
          </button>

          <button className="tou_button" onClick={saveEditedDay}>
            Save
          </button>

          <button
            className="tou_button"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingCalendarId(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
)}



{isOpenWeek && (
   <div className="tou_modal" onClick={closePopupOutside}>
          <div className="tou_modal-content"> 
        <div>

        <label>
        Week name
          
  <input
  type="number"
  placeholder="Week Name"
  value={weekName}
  onChange={(e) => setWeekName(e.target.value)}
  required
/>
</label>
        <div>
          <label>
            Monday
            <select name="Monday" value={days.Monday} onChange={handleInputChangeWeek}>
              {dayOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tuesday
            <select name="Tuesday" value={days.Tuesday} onChange={handleInputChangeWeek}>
              {dayOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Wednesday
            <select name="Wednesday" value={days.Wednesday} onChange={handleInputChangeWeek}>
              {dayOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Thursday
            <select name="Thursday" value={days.Thursday} onChange={handleInputChangeWeek}>
              {dayOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Friday
            <select name="Friday" value={days.Friday} onChange={handleInputChangeWeek}>
              {dayOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Saturday
            <select name="Saturday" value={days.Saturday} onChange={handleInputChangeWeek}>
              {dayOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sunday
            <select name="Sunday" value={days.Sunday} onChange={handleInputChangeWeek}>
              {dayOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        {updateItem ? 
        <button onClick={updateCalendar}>Update</button> : 
         <button onClick={handleSaveWeek}>Save</button> }
        
      </div>
      </div> 
      </div>
    
      )}


      

{isOPenSeason && 
  (
    <> 
    <div className="tou_modal" onClick={closePopupOutside}>
    <div className="tou_modal-content"> 
      <div> 
            <form onSubmit={handleSaveSeason}>
                <div className="form-group">
                    <label htmlFor="seasonStart">Season Start:</label>
                    <input
                        type="time"
                        id="seasonStart"
                        value={seasonStart}
                        onChange={(e) => setSeasonStart(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="weekName">Week Name:</label>
                    <input
                        type="number"
                        id="weekName"
                        value={weekName}
                        onChange={(e) => setWeekName(e.target.value)}
                        min="1" // You can set this based on your requirements
                        required
                    />
                </div>
                <div className="form-buttons">
                    <button type="submit" className="save-button">Save</button>
                    <button type="button" className="cancel-button" >Cancel</button>
                </div>
            </form>
            </div>
            </div> 
            </div>
    
    
    </>
  )

}
      
      </div>

  

  );
};













const deviceId = localStorage.getItem('selectedDeviceId');



const ThresholdActionTable = () => {
  const [thresholds, setThresholds] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedThreshold, setSelectedThreshold] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [openAddThresholds, setOpenAddThresholds] = useState(false);
  const [openAddAction, setOpenAddAction] = useState(false);
  const [actionUp, setActionUp] = useState('step1');
  const [actionDown, setActionDown] = useState('step1');
  const [threshold, setThreshold] = useState(0.0);
  const maxCount = 9;


  const deviceId = localStorage.getItem('selectedDeviceId');

  

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/tariff-threshold-action/${deviceId}/`);

      const activeThresholds = response.data.thresholds.filter(threshold => threshold.threshold_type === 'active');
      const activeActions = response.data.actions.filter(action => action.action_type === 'active');

      setThresholds(activeThresholds || []);
      setActions(activeActions || []);
    } catch (error) {
      console.error('Error fetching threshold and action data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addThreshold = async () => {
    if (thresholds.length < maxCount) {
      const newThreshold = {
        device_id: deviceId,
        thresholds: [{ threshold_type: "active", value: parseFloat(threshold) }]
      };

      

      try {
        const response = await axios.post(`${BASE_URL}/api/tariff/threshold-actions/`, newThreshold);
        setThresholds([...thresholds, { id: response.data.id, value: parseFloat(threshold) }]);
        setThreshold(0); // Reset threshold input after adding
        setOpenAddThresholds(false);
      } catch (error) {
        console.error('Error adding threshold:', error);
      }
    }
  };

  const addAction = async () => {
    if (actions.length < maxCount) {
      const newAction = {
        device_id: deviceId,
        actions: [{ action_type: "active", action_up: actionUp, action_down: actionDown }]
      };

      try {
        const response = await axios.post(`${BASE_URL}/api/tariff/threshold-actions/`, newAction);
        setActions([...actions, { id: response.data.id, action_up: actionUp, action_down: actionDown }]);
        setActionUp('step1'); // Reset action input after adding
        setActionDown('step1');
        setOpenAddAction(false);
      } catch (error) {
        console.error('Error adding action:', error);
      }
    }
  };

  const handleDelete = async (type) => {
    try {
      if (type === 'threshold' && selectedThreshold) {
        await axios.delete(`${BASE_URL}/api/tariff-threshold-action/${deviceId}/threshold/${selectedThreshold.id}/`);
        setSelectedThreshold(null);
        fetchData();
      }

      if (type === 'action' && selectedAction) {
        await axios.delete(`${BASE_URL}/api/tariff-threshold-action/${deviceId}/action/${selectedAction.id}/`);
        setSelectedAction(null);
        fetchData();
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

    const  Closepopup= (e) => {
      if (e.target.className === 'modal') {
        
        setOpenAddThresholds(false)
        setOpenAddAction(false)
      }
    };







  return (
    <>
    <div className="tou_container"> 
     

      <div  className='security-form'>
        <label>
          <input type="checkbox" />
          <span> Monitored value: </span>
          <input type="text" value="increase active energy (|+A| + |-A|)"/> 
         
        </label>
      </div>
      <div style={{ display: 'flex' }}>
        {/* Thresholds Table */}
        <div style={{ width: '50%', paddingLeft: '10px', paddingRight: '20px' }}>
          <h4 style={{ textAlign: 'start' }}>
            <input type="checkbox" /> Thresholds
          </h4>
           <div className="table-container-tou"> 
          <table className="tableTariff1" border="1" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Index</th>
                <th>Thresholds (kWh)</th>
               
              </tr>
            </thead>
            <tbody>
              {thresholds.map((threshold, index) => (
                <tr
                  key={index}
                  

                  style={{
                   
                    cursor: 'pointer'
                  }}
                  id={selectedThreshold === threshold ? 'selected' : ''}


                  onClick={() => setSelectedThreshold(threshold)}
                >
                  <td>{index + 1}</td>
                  <td>{threshold.value}</td>
                 
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div
          style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",     // will wrap on very small screens
  }}> 
           <button className="scheduler-add-button" onClick={() => setOpenAddThresholds(true)}>Add Threshold</button>
          <button  
            onClick={() => handleDelete('threshold')}
            disabled={!selectedThreshold}
            className="scheduler-delete-button"
          >
            Delete  Threshold
          </button>
          </div>
         
        </div>

        {/* Actions Table */}
        <div  style={{ width: '50%', paddingRight: '10px' }}>
          <h4>
            <input type="checkbox" /> Actions
          </h4>
          <div className="table-container-tou"> 
          <table className="tableTariff1" border="1" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Index</th>
                <th>Action-up</th>
                <th>Action-down</th>
                
              </tr>
            </thead>
            <tbody>
              {actions.map((action, index) => (
                <tr
                  key={index}
                  style={{
                    cursor: 'pointer'
                  }}
                  
                  id={ selectedAction === action ? 'selected' : ''}
                  onClick={() => setSelectedAction(action)}
                >
                  <td>{index + 1}</td>
                  <td>{action.action_up}</td>
                  <td>{action.action_down}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div
          style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",     // will wrap on very small screens
  }}> 

           <button  className="scheduler-add-button"  onClick={() => setOpenAddAction(true)}>Add Actions</button>
          <button  
             onClick={() => handleDelete('action')}
            disabled={!selectedAction}
             className="scheduler-delete-button"
          >
            Delete  Action
          </button>
         </div>
        </div>
      </div>

      {/* Add Threshold Modal */}
      {openAddThresholds && (
        <div className="modal" onClick={Closepopup}>
          <div className="modal-content">
            <h2>THRESHOLD</h2>
            <div>
              <label>Threshold: </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <span style={{ marginLeft: '10px' }}>kWh</span>
            </div>
            <div>
              <button onClick={addThreshold}>OK</button>
              <button onClick={() => setOpenAddThresholds(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}



      {/* Add Action Modal */}
      {openAddAction && (
        <div className="modal" onClick={Closepopup}>
         
         
          <div className="modal-content">
            <h2>ACTIONS</h2>
            <div>
              <label>Action up:</label>
              <select value={actionUp} onChange={(e) => setActionUp(e.target.value)}>
                <option value="step1">Step 1</option>
                <option value="step2">Step 2</option>
              </select>
            </div>
            <div>
              <label>Action down:</label>
              <select value={actionDown} onChange={(e) => setActionDown(e.target.value)}>
                <option value="step1">Step 1</option>
                <option value="step2">Step 2</option>
              </select>
            </div>
            <div>
              <button onClick={addAction}>OK</button>
              <button onClick={() => setOpenAddAction(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};






const PassiveThresholdActionTable = () => {
  const [thresholds, setThresholds] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedThreshold, setSelectedThreshold] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [openAddThresholds, setOpenAddThresholds] = useState(false);
  const [openAddAction, setOpenAddAction] = useState(false);
  const [actionUp, setActionUp] = useState('step1');
  const [actionDown, setActionDown] = useState('step1');
  const [threshold, setThreshold] = useState(0.0);
  const maxCount = 9;
 

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/tariff-threshold-action/${deviceId}/`);

      const passiveThresholds = response.data.thresholds.filter(threshold => threshold.threshold_type === 'passive');
      const passiveActions = response.data.actions.filter(action => action.action_type === 'passive');

      setThresholds(passiveThresholds || []);
      setActions(passiveActions || []);
    } catch (error) {
      console.error('Error fetching threshold and action data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addThreshold = async () => {
    if (thresholds.length < maxCount) {
      const newThreshold = {
        device_id: deviceId,
        thresholds: [{ threshold_type: "passive", value: parseFloat(threshold) }]
      };

      try {
        const response = await axios.post(`${BASE_URL}/api/tariff/threshold-actions/`, newThreshold);
        setThresholds([...thresholds, { id: response.data.id, value: parseFloat(threshold) }]);
        setThreshold(0); // Reset threshold input after adding
        setOpenAddThresholds(false);
      } catch (error) {
        console.error('Error adding threshold:', error);
      }
    }
  };

  const addAction = async () => {
    if (actions.length < maxCount) {
      const newAction = {
        device_id: deviceId,
        actions: [{ action_type: "passive", action_up: actionUp, action_down: actionDown }]
      };

      try {
        const response = await axios.post(`${BASE_URL}/api/tariff/threshold-actions/`, newAction);
        setActions([...actions, { id: response.data.id, action_up: actionUp, action_down: actionDown }]);
        setActionUp('step1'); // Reset action input after adding
        setActionDown('step1');
        setOpenAddAction(false);
      } catch (error) {
        console.error('Error adding action:', error);
      }
    }
  };

  const handleDelete = async (type) => {
    try {
      if (type === 'threshold' && selectedThreshold) {
        await axios.delete(`${BASE_URL}/api/tariff-threshold-action/${deviceId}/threshold/${selectedThreshold.id}/`);
        setSelectedThreshold(null);
        fetchData();
      }

      if (type === 'action' && selectedAction) {
        await axios.delete(`${BASE_URL}/api/tariff-threshold-action/${deviceId}/action/${selectedAction.id}/`);
        setSelectedAction(null);
        fetchData();
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  const Closepopup = (e) => {
    if (e.target.className === 'modal') {
      setOpenAddThresholds(false);
      setOpenAddAction(false);
    }
  };

  return (
    <>
    <div className="tou_container">
      <div  className='security-form'>
        <label>
          <input type="checkbox" />
          <span> Monitored value: </span>
          <input type="text" value="increase passive energy (|+A| + |-A|)"/> 
         
        </label>
      </div>
     
      <div style={{ display: 'flex' }}>
        {/* Thresholds Table */}
        <div style={{ width: '50%', paddingLeft: '10px', paddingRight: '20px' }}>
          <h4 style={{ textAlign: 'start' }}>
            <input type="checkbox" /> Thresholds
          </h4>
           <div className="table-container-tou" > 
          
          <table className="tableTariff1" border="1" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Index</th>
                <th>Thresholds (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map((threshold, index) => (
                <tr
                  key={index}
                  style={{
                   
                    cursor: 'pointer'
                  }}
                  
                  id={ selectedThreshold === threshold ? 'selected' : ''}
                  
                  onClick={() => setSelectedThreshold(threshold)}
                >
                  <td>{index + 1}</td>
                  <td>{threshold.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
           </div>
           <div 
            style={{
    display: "flex",
    gap: 5,
    alignItems: "center",
    flexWrap: "wrap", 
      // will wrap on very small screens
  }}> 
         
           <button className="scheduler-add-button" onClick={() => setOpenAddThresholds(true)}>Add Threshold</button>
          <button
            onClick={() => handleDelete('threshold')}
            disabled={!selectedThreshold}
            className="scheduler-delete-button"
          >
            Delete  Threshold
          </button>
        
          </div>
        </div>
       

        {/* Actions Table */}
        <div style={{ width: '50%', paddingRight: '10px' }}>
          <h4>
            <input type="checkbox" /> Actions
          </h4>
          <div className="table-container-tou" > 
          <table className="tableTariff1">
            <thead>
              <tr>
                <th>Index</th>
                <th>Action-up</th>
                <th>Action-down</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action, index) => (
                <tr
                  key={index}
                  style={{
                   
                    cursor: 'pointer'
                  }}
                  id={  selectedAction === action ? 'selected' : ''}
                  onClick={() => setSelectedAction(action)}
                >
                  <td>{index + 1}</td>
                  <td>{action.action_up}</td>
                  <td>{action.action_down}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div
          style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",     // will wrap on very small screens
  }}
          
          > 

           <button className="scheduler-add-button"  onClick={() => setOpenAddAction(true)}>Add Actions</button>
          <button
            onClick={() => handleDelete('action')}
            disabled={!selectedAction}
            className="scheduler-delete-button" 
          >
            Delete  Action
          </button>
         
        </div>
        </div>
      </div>

      {/* Add Threshold Modal */}
      {openAddThresholds && (
        <div className="modal" onClick={Closepopup}>
          <div className="modal-content">
            <h2>THRESHOLD</h2>
            <div>
              <label>Threshold: </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <span style={{ marginLeft: '10px' }}>kWh</span>
            </div>
            <div>
              <button onClick={addThreshold}>OK</button>
              <button onClick={() => setOpenAddThresholds(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Action Modal */}
      {openAddAction && (
        <div className="modal" onClick={Closepopup}>
          <div className="modal-content">
            <h2>ACTIONS</h2>
            <div>
              <label>Action up:</label>
              <select value={actionUp} onChange={(e) => setActionUp(e.target.value)}>
                <option value="step1">Step 1</option>
                <option value="step2">Step 2</option>
              </select>
            </div>
            <div>
              <label>Action down:</label>
              <select value={actionDown} onChange={(e) => setActionDown(e.target.value)}>
                <option value="step1">Step 1</option>
                <option value="step2">Step 2</option>
              </select>
            </div>
            <div>
              <button onClick={addAction}>OK</button>
              <button onClick={() => setOpenAddAction(false)}>Cancel</button>
            </div>
          </div>
        </div>
        
        
      )}
       </div>
    </>
  );
};








const Tariff = () => {
  const [selectedSubDashboard, setSelectedSubDashboard] = useState("TOU");
  const [apiData, setApiData] = useState(null);

  const handleSubDashboardChange = (subDashboardName) => {
    setSelectedSubDashboard(subDashboardName);
  };


  const getValue = (name) => {
    if (!apiData) return "";
    const parameter = apiData[name];
    return parameter ? parameter.value : "";
  };

  const renderSubDashboard = () => {
    switch (selectedSubDashboard) {
      case "TOU":
        return (
          <CalendarManager/>
        );
      case "Special Days":
        // Render the SpecialDaysForm component for the "Special Days" case
        return <SpecialDaysForm />;
      case "Active Step":
        return (
          <ThresholdActionTable/>
        );
      case "Passive Step":
       return (
        <PassiveThresholdActionTable/>
      );
      case "Tariff Parameters":
        return (
            <TariffParameter/>
        );
      default:
        return null;
    }
  };

  return (
    <div className="tariff_Container">
    <div
  className="view-toggle"
  role="tablist"
  aria-label="Sub dashboard selection"
>
  {["TOU", "Special Days", "Active Step", "Passive Step", "Tariff Parameters"].map((subItem) => (
    <button
      key={subItem}
      type="button"
      role="tab"
      aria-pressed={selectedSubDashboard === subItem}
      className={`view-btn ${
        selectedSubDashboard === subItem ? "active" : ""
      }`}
      onClick={() => {
        setSelectedSubDashboard(subItem);
        handleSubDashboardChange(subItem);
      }}
    >
      {subItem}
    </button>
  ))}
</div>
     
     
        {renderSubDashboard()}
      
    </div>
  );
};





export default Tariff;

