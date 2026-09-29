import React, { useState, useEffect, useMemo } from 'react';
import './index.css';
import axios from 'axios';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import { PERMISSIONS } from '../../permissions.js';

const OtherParameters1 = () => {



  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);

  const [formData, setFormData] = useState({
    device_id: deviceId, // Assuming device_id is 1; change as needed
    send_destination: false,
    transport_service: '',
    destination: '',
    message_type: '',
    randomisation_start_interval: false,
    start_interval_value: 0,
    retries_enabled: false,
    retries: 0,
    repetition_delay_enabled: false,
    repetition_delay: 0,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const { transport_service, destination, message_type } = formData;

    // Check required fields
    if (!transport_service || !destination || !message_type) {
      alert('Please fill in Transport Service, Destination, and Message Type.');
      return;
    }

    try {
      console.log(formData); // Display data for debugging
      await axios.post(`${BASE_URL}/api/add-other-parameters/`, formData);
      alert('Data saved successfully');
    } catch (error) {
      console.error('Error sending data:', error);
      alert('Error saving data. Please try again.');
    }
  };

  return (
    <div className="load-control-container">
      <div className="pushsetup-form-container">

        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="send_destination"
              checked={formData.send_destination}
              onChange={handleChange}
            />
            <span>Send Destination and Method</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Transport Service</span>
            <input
              type="text"
              name="transport_service"
              placeholder="Transport Service"
              value={formData.transport_service}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Destination (IP:Port)</span>
            <input
              type="text"
              name="destination"
              placeholder="IP:Port"
              value={formData.destination}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Message Type</span>
            <input
              type="text"
              name="message_type"
              placeholder="Message Type"
              value={formData.message_type}
              onChange={handleChange}
            />
          </label>
        </div>

        {/* Randomisation Start Interval */}
        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="randomisation_start_interval"
              checked={formData.randomisation_start_interval}
              onChange={handleChange}
            />
            <span>Randomisation Start Interval (s)</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Start Interval Value</span>
            <input
              type="number"
              name="start_interval_value"
              placeholder="0"
              value={formData.start_interval_value}
              onChange={handleChange}
              disabled={!formData.randomisation_start_interval}
            />
          </label>
        </div>

        {/* Retries */}
        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="retries_enabled"
              checked={formData.retries_enabled}
              onChange={handleChange}
            />
            <span>Number of Retries</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Retries</span>
            <input
              type="number"
              name="retries"
              placeholder="0"
              value={formData.retries}
              onChange={handleChange}
              disabled={!formData.retries_enabled}
            />
          </label>
        </div>

        {/* Repetition Delay */}
        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="repetition_delay_enabled"
              checked={formData.repetition_delay_enabled}
              onChange={handleChange}
            />
            <span>Repetition Delay (s)</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Repetition Delay Value</span>
            <input
              type="number"
              name="repetition_delay"
              placeholder="0"
              value={formData.repetition_delay}
              onChange={handleChange}
              disabled={!formData.repetition_delay_enabled}
            />
          </label>
        </div>

        <div className="security-form">
          <button
            type="button"
            onClick={handleSubmit}
            style={{ marginLeft: "42%" }} className='scheduler-add-button'
          >
            Submit
          </button>
        </div>

      </div>
    </div>
  );
};
const role = localStorage.getItem('userRole');

const perms = PERMISSIONS[role] || {};

const OtherParameters12 = () => {

  const [formData, setFormData] = useState({
    send_destination: false,
    transport_service: "",
    destination: "",
    message_type: "",
    randomisation_start_interval: false,
    start_interval_value: 0,
    retries_enabled: false,
    retries: 0,
    repetition_delay_enabled: false,
    repetition_delay: 0,
  });


  const handleChange = (e) => {
    const { name, checked } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: checked,
      };

      if (name === "send_destination" && !checked) {
        updated.transport_service = "";
        updated.destination = "";
        updated.message_type = "";
      }

      if (name === "randomisation_start_interval" && !checked) {
        updated.start_interval_value = "";
      }

      if (name === "retries_enabled" && !checked) {
        updated.retries = "";
      }

      if (name === "repetition_delay_enabled" && !checked) {
        updated.repetition_delay = "";
      }

      return updated;
    });
  };

  const handleGetData = async () => {

    try {



      const parameters = [];


      if (formData.send_destination) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 3,
        });
      }

      if (formData.randomisation_start_interval) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 5,
        });
      }

      if (formData.retries_enabled) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 6,
        });
      }

      if (formData.repetition_delay_enabled) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 7,
        });
      }
      if (parameters.length === 0) {
        alert("Please select at least one parameter.");
        return;
      }

      const payload = {
        action: "read_obis",
        serial_number: "Avc",
        parameters,
      };
      const response = await axios.post(
        `${BASE_URL}/api/getmeterinfo/`,
        payload
      );
      const rawData = response.data;

      const events = rawData
        .split("\n\n")
        .filter(item => item.trim() !== "");

      const updatedData = {};

      events.forEach((event) => {
        const json = JSON.parse(event.replace("data:", "").trim());

        switch (json.attribute_index) {
          case 3:

            updatedData.transport_service = String(json.value[0]);

            updatedData.destination = json.value[1]
              .split(" ")
              .map((v) => parseInt(v, 16))
              .join(".");

            updatedData.message_type = String(json.value[2]);
            break;

          case 5:
            updatedData.start_interval_value = json.value;
            break;

          case 6:
            updatedData.retries = json.value;
            break;

          case 7:
            updatedData.repetition_delay = json.value;
            break;

          default:
            break;
        }
      });

      setFormData((prev) => ({
        ...prev,
        ...updatedData,
      }));
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="load-control-container">
      <div className="pushsetup-form-container">

        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="send_destination"
              checked={formData.send_destination}
              onChange={handleChange}
            />
            <span>Send Destination and Method</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Transport Service</span>
            <select
              name="transport_service"
              value={formData.transport_service}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="0">TCP</option>
              <option value="1">UDP</option>
              <option value="2">reserved_for_FTP</option>
              <option value="3">reserved_for_SMTP</option>
              <option value="4">SMS</option>
              <option value="5">HDLC</option>
              <option value="6">reserved_for_MBus</option>
            </select>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Destination (IP:Port)</span>
            <input
              type="text"
              name="destination"
              placeholder="IP:Port"
              value={formData.destination}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Message Type</span>
            <select
              name="message_type"
              value={formData.message_type}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="0">AXDR_encoded_xDLMS_APDU</option>
              <option value="1">XML_encoded_xDLMS_APDU</option>
            </select>
          </label>
        </div>

        {/* Randomisation Start Interval */}
        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="randomisation_start_interval"
              checked={formData.randomisation_start_interval}
              onChange={handleChange}
            />
            <span>Randomisation Start Interval (s)</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Start Interval Value</span>
            <input
              type="number"
              name="start_interval_value"
              placeholder="0"
              value={formData.start_interval_value}
              onChange={handleChange}
              disabled={!formData.randomisation_start_interval}
            />
          </label>
        </div>

        {/* Retries */}
        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="retries_enabled"
              checked={formData.retries_enabled}
              onChange={handleChange}
            />
            <span>Number of Retries</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Retries</span>
            <input
              type="number"
              name="retries"
              placeholder="0"
              value={formData.retries}
              onChange={handleChange}
              disabled={!formData.retries_enabled}
            />
          </label>
        </div>

        {/* Repetition Delay */}
        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="repetition_delay_enabled"
              checked={formData.repetition_delay_enabled}
              onChange={handleChange}
            />
            <span>Repetition Delay (s)</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Repetition Delay Value</span>
            <input
              type="number"
              name="repetition_delay"
              placeholder="0"
              value={formData.repetition_delay}
              onChange={handleChange}
              disabled={!formData.repetition_delay_enabled}
            />
          </label>
        </div>

        <div className="security-form">
          <button
            type="button"
            onClick={handleGetData}
            style={{ marginLeft: "42%" }} className='scheduler-add-button'
          >
            READ
          </button>
        </div>

      </div>
    </div>
  );


}

const OtherParameters = () => {
  const role = localStorage.getItem('userRole');

  const perms = PERMISSIONS[role] || {};

  const [formData, setFormData] = useState({
    send_destination: false,
    transport_service: "",
    destination: "",
    message_type: "",

    randomisation_start_interval: false,
    start_interval_value: 0,

    retries_enabled: false,
    retries: 0,

    repetition_delay_enabled: false,
    repetition_delay: 0,
  });


  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "send_destination" && !checked) {
        updated.transport_service = "";
        updated.destination = "";
        updated.message_type = "";
      }

      if (name === "randomisation_start_interval" && !checked) {
        updated.start_interval_value = "";
      }

      if (name === "retries_enabled" && !checked) {
        updated.retries = "";
      }

      if (name === "repetition_delay_enabled" && !checked) {
        updated.repetition_delay = "";
      }

      return updated;
    });
  };

  const handleGetData = async () => {

    try {

      const parameters = [];


      if (formData.send_destination) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 3,
        });
      }

      if (formData.randomisation_start_interval) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 5,
        });
      }

      if (formData.retries_enabled) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 6,
        });
      }

      if (formData.repetition_delay_enabled) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 7,
        });
      }
      if (parameters.length === 0) {
        alert("Please select at least one parameter.");
        return;
      }

      const payload = {
        action: "read_obis",
        serial_number: "Avc",
        parameters,
      };
      const response = await axios.post(
        `${BASE_URL}/api/getmeterinfo/`,
        payload
      );
      const rawData = response.data;

      const events = rawData
        .split("\n\n")
        .filter(item => item.trim() !== "");

      const updatedData = {};

      events.forEach((event) => {
        const json = JSON.parse(event.replace("data:", "").trim());

        switch (json.attribute_index) {
          case 3:

            updatedData.transport_service = String(json.value[0]);

            updatedData.destination = json.value[1]
              .split(" ")
              .map((v) => parseInt(v, 16))
              .join(".");

            updatedData.message_type = String(json.value[2]);
            break;

          case 5:
            updatedData.start_interval_value = json.value;
            break;

          case 6:
            updatedData.retries = json.value;
            break;

          case 7:
            updatedData.repetition_delay = json.value;
            break;

          default:
            break;
        }
      });

      setFormData((prev) => ({
        ...prev,
        ...updatedData,
      }));
    } catch (error) {
      console.error(error);
    }
  };




  const handleSetData = async () => {
    try {
      let parameters = [];

      // Attribute 3
      if (formData.send_destination) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 3,
          value: [
            Number(formData.transport_service),
            formData.destination,
            Number(formData.message_type),
          ],
        });
      }

      // Attribute 5
      if (formData.randomisation_start_interval) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 5,
          value: Number(formData.start_interval_value),
        });
      }

      // Attribute 6
      if (formData.retries_enabled) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 6,
          value: Number(formData.retries),
        });
      }

      // Attribute 7
      if (formData.repetition_delay_enabled) {
        parameters.push({
          obis_code: "0.4.25.9.0.255",
          attribute_index: 7,
          value: Number(formData.repetition_delay),
        });
      }

      // Nothing selected
      if (parameters.length === 0) {
        alert("Please select at least one parameter to write.");
        return;
      }

      const payload = {
        action: "write_obis",
        serial_number: "Avc",
        parameters,
      };

      console.log(payload);

      const response = await axios.post(
        `${BASE_URL}/api/TimeSettingsAPIView/`,
        payload
      );

      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="load-control-container">
      <div className="pushsetup-form-container">

        <div className="security-form">
          <label>
            <input

              type="checkbox"
              name="send_destination"
              checked={formData.send_destination}
              onChange={handleChange}
            />
            <span>Send Destination and Method</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Transport Service</span>
            <select
              name="transport_service"
              value={formData.transport_service}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="0">TCP</option>
              <option value="1">UDP</option>
              <option value="2">reserved_for_FTP</option>
              <option value="3">reserved_for_SMTP</option>
              <option value="4">SMS</option>
              <option value="5">HDLC</option>
              <option value="6">reserved_for_MBus</option>
            </select>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Destination (IP:Port)</span>
            <input
              type="text"
              name="destination"
              placeholder="IP:Port"
              value={formData.destination}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Message Type</span>
            <select
              name="message_type"
              value={formData.message_type}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="0">AXDR_encoded_xDLMS_APDU</option>
              <option value="1">XML_encoded_xDLMS_APDU</option>
            </select>
          </label>
        </div>

        {/* Randomisation Start Interval */}
        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="randomisation_start_interval"
              checked={formData.randomisation_start_interval}
              onChange={handleChange}
            />
            <span>Randomisation Start Interval (s)</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Start Interval Value</span>
            <input
              type="number"
              name="start_interval_value"
              placeholder="0"
              value={formData.start_interval_value}
              onChange={handleChange}
              disabled={!formData.randomisation_start_interval}
            />
          </label>
        </div>

        {/* Retries */}
        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="retries_enabled"
              checked={formData.retries_enabled}
              onChange={handleChange}
            />
            <span>Number of Retries</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Retries</span>
            <input
              type="number"
              name="retries"
              placeholder="0"
              value={formData.retries}
              onChange={handleChange}
              disabled={!formData.retries_enabled}
            />
          </label>
        </div>

        {/* Repetition Delay */}
        <div className="security-form">
          <label>
            <input
              type="checkbox"
              name="repetition_delay_enabled"
              checked={formData.repetition_delay_enabled}
              onChange={handleChange}
            />
            <span>Repetition Delay (s)</span>
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>Repetition Delay Value</span>
            <input
              type="number"
              name="repetition_delay"
              placeholder="0"
              value={formData.repetition_delay}
              onChange={handleChange}
              disabled={!formData.repetition_delay_enabled}
            />
          </label>
        </div>

        <div className="security-form">
          <button
            type="button"
            onClick={handleGetData}
            style={{ marginLeft: "42%" }} className='scheduler-add-button'
          >
            READ
          </button>
        </div>
        {perms.writeMeter && (
          <div className="security-form">
            <button
              type="button"
              onClick={handleSetData}
              style={{ marginLeft: "42%" }} className='scheduler-add-button'
            >
              WRITE
            </button>
          </div>
        )}

      </div>
    </div>
  );


}









function PushSetup() {
  const [selectedRowId, setSelectedRowId] = useState(null); // To track selected row
  const [activeView, setActiveView] = useState('pushObjectList');
  const [activeSections, setActiveSections] = useState({
    basicInfo: false,
    pushSetup: false,
    alarms: false,
    timeOfUse: false,
  });
  const [activeItems, setActiveItems] = useState({
    cosemLogicalDeviceName: false,
    pushNameForAlarm: false,
    alarmDescriptor1: false,
    alarmDescriptor2: false,
    clock: false,
  });
  const [activeViewButton, setActiveViewButton] = useState({
    basicInfo: false,
    pushSetup: false,
    alarms: false,
    timeOfUse: false,
  });

  const [pushSetupItems, setPushSetupItems] = useState([]);

  // Button state helpers


  // add near top of component (after state declarations)
  // we use useMemo so import it if not already: import React, { ..., useMemo } from 'react';

  ///// derived/utility values /////
  const selectedRow = useMemo(
    () => pushSetupItems.findIndex((it) => it.id === selectedRowId),
    [pushSetupItems, selectedRowId]
  );

  // safe-length for disabling navigation buttons
  const itemsCount = pushSetupItems.length;

  ///// small wrapper functions so JSX toolbar names exist (prevent eslint no-undef) /////

  // Add (append) -> reuse your existing handleAddItem
  const handleAdd = () => {
    // call your existing function that posts the selected items (or adds a single item)
    // if you want different behaviour, update handleAddItem accordingly
    handleAddItem();
  };

  // Insert after selected row -> fallback to handleAddItem (server ordering may differ)
  // If you want a true "insert" you can implement ordering on server; this is a safe default.
  const handleInsertAfter = () => {
    if (selectedRow === -1) return alert("Select a row to insert after");
    // simplest: call handleAddItem to create new item then client UI will show it
    handleAddItem();
  };

  // Delete selected -> reuse handleDeleteClick (which deletes item by id)
  const handleDelete = () => {
    if (!selectedRowId) return alert("Select a row to delete");
    handleDeleteClick();
  };

  // Clear all for this device -> delete each item (uses same delete endpoint your delete handler uses)
  const handleClear = async () => {
    if (!deviceId) return alert("Select a device");
    if (!pushSetupItems.length) return alert("No items to clear");
    const ok = window.confirm("Clear all items for this device?");
    if (!ok) return;

    try {
      // delete each item (your backend uses /api/delete-setup-items/{id}/)
      await Promise.all(
        pushSetupItems.map((it) => axios.delete(`${BASE_URL}/api/delete-setup-items/${it.id}/`))
      );
      await fetchData();
      setSelectedRowId(null);
    } catch (err) {
      console.error("Clear failed:", err);
      alert("Failed to clear items. See console.");
    }
  };



  const hasSelected = selectedRow !== -1;
  const atFirst = hasSelected && selectedRow === 0;
  const atLast = hasSelected && selectedRow === pushSetupItems.length - 1;

  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === -1) return;

    setPushSetupItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);

      const insertIndex = Math.max(0, Math.min(toIndex, next.length));
      next.splice(insertIndex, 0, item);

      setSelectedRowId(item.id);
      return next;
    });
  };

  // Navigation helpers that use selectedRow index and pushSetupItems
  const handleFirst = () => {
    if (!hasSelected || atFirst) return;
    moveItem(selectedRow, 0);
  };

  const handlePrevious = () => {
    if (!hasSelected || atFirst) return;
    moveItem(selectedRow, selectedRow - 1);
  };

  const handleNext = () => {
    if (!hasSelected || atLast) return;
    moveItem(selectedRow, selectedRow + 1);
  };

  const handleLast = () => {
    if (!hasSelected || atLast) return;
    moveItem(selectedRow, pushSetupItems.length - 1);
  };



  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);










  const toggleSection = (section) => {
    setActiveSections((prevState) => {
      const newState = { ...prevState, [section]: !prevState[section] };

      if (newState[section]) {
        setActiveItems((prevItems) => {
          switch (section) {
            case 'basicInfo':
              return { ...prevItems, cosemLogicalDeviceName: true };
            case 'pushSetup':
              return { ...prevItems, pushNameForAlarm: true };
            case 'alarms':
              return { ...prevItems, alarmDescriptor1: true, alarmDescriptor2: true };
            case 'timeOfUse':
              return { ...prevItems, clock: true };
            default:
              return prevItems;
          }
        });
      } else {
        setActiveItems((prevItems) => {
          switch (section) {
            case 'basicInfo':
              return { ...prevItems, cosemLogicalDeviceName: false };
            case 'pushSetup':
              return { ...prevItems, pushNameForAlarm: false };
            case 'alarms':
              return { ...prevItems, alarmDescriptor1: false, alarmDescriptor2: false };
            case 'timeOfUse':
              return { ...prevItems, clock: false };
            default:
              return prevItems;
          }
        });
      }

      return newState;
    });
  };

  const toggleSection1 = (section) => {
    setActiveViewButton((prevState) => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  const toggleItem = (item) => {
    setActiveItems((prevItems) => {
      return { ...prevItems, [item]: !prevItems[item] };
    });
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };


  const fetchData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/get-push-setup-item/${deviceId}/`);
      setPushSetupItems(response.data.data); // Store the "data" array from response
      console.log("Data fetched successfully:", response.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  useEffect(() => {


    fetchData();
  }, []);




  const handleAddItem = async () => {
    // Fetch existing items from the backend
    let existingItems = [];
    try {
      const response = await axios.get(`${BASE_URL}/api/get-push-setup-item/${deviceId}/`);
      existingItems = response.data.data;
    } catch (error) {
      console.error("Error fetching existing items:", error);
    }

    // Helper function to check if the item already exists
    const isItemExists = (itemName) => {
      return existingItems.some((existingItem) => existingItem.name === itemName);
    };

    // Initialize a new item object
    let item = null;
    let allItemsAdded = true; // Flag to track if all items are already added

    // Add active items to the item object, checking each item one at a time
    if (activeItems.cosemLogicalDeviceName && !isItemExists('COSEM Logical Device Name')) {
      item = {
        name: 'COSEM Logical Device Name',
        code: '{1, 0-0:42.0.0.255}',
        data_index: '00001',
      };
      allItemsAdded = false;
    } else if (activeItems.pushNameForAlarm && !isItemExists('Push Name (for Alarm)')) {
      item = {
        name: 'Push Name (for Alarm)',
        code: '{40, 0-4:25.9.0.255}',
        data_index: '00002',
      };
      allItemsAdded = false;
    } else if (activeItems.alarmDescriptor1 && !isItemExists('Alarm Descriptor 1')) {
      item = {
        name: 'Alarm Descriptor 1',
        code: '{1, 0-0:97.98.20.255}',
        data_index: '00003',
      };
      allItemsAdded = false;
    } else if (activeItems.alarmDescriptor2 && !isItemExists('Alarm Descriptor 2')) {
      item = {
        name: 'Alarm Descriptor 2',
        code: '{1, 0-0:97.98.21.255}',
        data_index: '00004',
      };
      allItemsAdded = false;
    } else if (activeItems.clock && !isItemExists('Clock')) {
      item = {
        name: 'Clock',
        code: '{8, 0-0:1.0.0.255}',
        data_index: '00005',
      };
      allItemsAdded = false;
    }

    if (item) {
      // Add device_id to the item
      // Replace with the correct device ID dynamically if necessary
      item.device_id = deviceId;

      // Send the item to the backend
      try {
        const formattedData = {
          device_id: item.device_id,
          name: item.name,
          code: item.code,
          data_index: item.data_index,
        };

        console.log("Sending data:", formattedData); // Debugging

        // Send data to the backend (only one item)
        await axios.post(`${BASE_URL}/api/add-push-setup-item/`, formattedData);
        console.log("Data sent successfully");
        fetchData(); // Refresh data after adding the item
      } catch (error) {
        console.error("Error sending data:", error);
      }
    } else {
      // No new active items to send
      if (allItemsAdded) {
        alert("All items have already been added.");
      } else {
        alert("All active items are added. Please select new items to add.");
      }
    }
  };



  const handleRowClick = (id) => {
    setSelectedRowId(id);
    console.log('Row clicked with ID:', id); // Logs the selected row's ID
  };



  const handleDeleteClick = () => {
    if (!selectedRowId) {
      console.log('No row selected');
      return;
    }

    const url = `${BASE_URL}/api/delete-setup-items/${selectedRowId}/`;

    axios
      .delete(url)
      .then((response) => {
        console.log('Delete successful', response.data);
        fetchData()
        // Optionally update your state to remove the deleted item from the table
      })
      .catch((error) => {
        console.error('Error deleting item:', error);
        // You can handle error (e.g., show a message or alert)
      });
  };




  return (
    <div>
      <div className="view-toggle" role="tablist" aria-label="Push setup view toggle">
        <button
          type="button"
          role="tab"
          aria-pressed={activeView === "pushObjectList"}
          className={`view-btn ${activeView === "pushObjectList" ? "active" : ""}`}
          onClick={() => handleViewChange("pushObjectList")}
        >
          Push Object List
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeView === "otherParameters"}
          className={`view-btn ${activeView === "otherParameters" ? "active" : ""}`}
          onClick={() => handleViewChange("otherParameters")}
        >
          Other Parameters
        </button>
      </div>
      <div>

        {activeView === 'pushObjectList' && (


          <div className="display-root">



            <div className="sub_container_display">
              {/* Basic Information Section */}
              <div className="pushsetup-section">
                <div className="label_and_icon">
                  <button
                    className={`triangle-button ${activeSections.basicInfo ? 'open' : ''}`}
                    onClick={() => toggleSection1('basicInfo')}
                  >
                    {activeViewButton.basicInfo ? '▼' : '▶'}
                  </button>
                  <label
                    className="pushsetup-label basicInfo-label"
                    onClick={() => toggleSection('basicInfo')}
                  >
                    <input
                      type="checkbox"
                      checked={activeSections.basicInfo}
                      readOnly
                    /> Basic Information
                  </label>
                </div>
                {activeViewButton.basicInfo && (
                  <div className="sub-items">
                    <label className="pushsetup-label basicInfo-label">
                      <input
                        type="checkbox"
                        checked={activeItems.cosemLogicalDeviceName}
                        onChange={() => toggleItem('cosemLogicalDeviceName')}
                      />
                      COSEM Logical Device Name
                      <span className="pushsetup-text">{`{1, 0-0:42.0.0.255}`}</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Push Setup Section */}
              <div className="pushsetup-section">
                <div className="label_and_icon">
                  <button
                    className={`triangle-button ${activeSections.pushSetup ? 'open' : ''}`}
                    onClick={() => toggleSection1('pushSetup')}
                  >
                    {activeViewButton.pushSetup ? '▼' : '▶'}
                  </button>
                  <label
                    className="pushsetup-label basicInfo-label"
                    onClick={() => toggleSection('pushSetup')}
                  >
                    <input
                      type="checkbox"
                      checked={activeSections.pushSetup}
                      readOnly
                    /> Push Setup
                  </label>
                </div>
                {activeViewButton.pushSetup && (
                  <div className="sub-items">
                    <label className="pushsetup-label basicInfo-label">
                      <input
                        type="checkbox"
                        checked={activeItems.pushNameForAlarm}
                        onChange={() => toggleItem('pushNameForAlarm')}
                      />
                      Push Name (for Alarm)
                      <span className="pushsetup-text">{`{40, 0-4:25.9.0.255}`}</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Alarms Section */}
              <div className="pushsetup-section">
                <div className="label_and_icon">
                  <button
                    className={`triangle-button ${activeSections.alarms ? 'open' : ''}`}
                    onClick={() => toggleSection1('alarms')}
                  >
                    {activeViewButton.alarms ? '▼' : '▶'}
                  </button>
                  <label
                    className="pushsetup-label basicInfo-label"
                    onClick={() => toggleSection('alarms')}
                  >
                    <input
                      type="checkbox"
                      checked={activeSections.alarms}
                      readOnly
                    /> Alarms
                  </label>
                </div>
                {activeViewButton.alarms && (
                  <div className="sub-items">
                    <label className="pushsetup-label basicInfo-label">
                      <input
                        type="checkbox"
                        checked={activeItems.alarmDescriptor1}
                        onChange={() => toggleItem('alarmDescriptor1')}
                      />
                      Alarm Descriptor 1
                      <span className="pushsetup-text">{`{1, 0-0:97.98.20.255}`}</span>
                    </label>
                    <label className="pushsetup-label basicInfo-label">
                      <input
                        type="checkbox"
                        checked={activeItems.alarmDescriptor2}
                        onChange={() => toggleItem('alarmDescriptor2')}
                      />
                      Alarm Descriptor 2
                      <span className="pushsetup-text">{`{1, 0-0:97.98.21.255}`}</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Time of Use Section */}
              <div className="pushsetup-section">
                <div className="label_and_icon">
                  <button
                    className={`triangle-button ${activeSections.timeOfUse ? 'open' : ''}`}
                    onClick={() => toggleSection1('timeOfUse')}
                  >
                    {activeViewButton.timeOfUse ? '▼' : '▶'}
                  </button>
                  <label
                    className="pushsetup-label basicInfo-label"
                    onClick={() => toggleSection('timeOfUse')}
                  >
                    <input
                      type="checkbox"
                      checked={activeSections.timeOfUse}
                      readOnly
                    /> Time of Use
                  </label>
                </div>
                {activeViewButton.timeOfUse && (
                  <div className="sub-items">
                    <label className="pushsetup-label basicInfo-label">
                      <input
                        type="checkbox"
                        checked={activeItems.clock}
                        onChange={() => toggleItem('clock')}
                      />
                      Clock
                      <span className="pushsetup-text">{`{8, 0-0:1.0.0.255}`}</span>
                    </label>
                  </div>
                )}
              </div>





            </div>


            <div className="vertical-toolbar">

              {/* ADD (Append at End) */}
              <button
                type="button"
                className="tool-btn"
                onClick={handleAdd}
                title="Add to end"
              >
                <span className="tool-icon">+</span>
                <span className="tool-text">Add</span>
              </button>

              {/* INSERT After Selected */}
              <button
                type="button"
                className="tool-btn"
                onClick={handleInsertAfter}
                title="Insert after selected row"
              >
                <span className="tool-icon">●</span>
                <span className="tool-text">Insert</span>
              </button>

              {/* DELETE Selected */}
              <button
                type="button"
                className="tool-btn"
                onClick={handleDelete}
                title="Delete selected row"
              >
                <span className="tool-icon">−</span>
                <span className="tool-text">Delete</span>
              </button>

              {/* CLEAR ALL */}
              <button
                type="button"
                className="tool-btn"
                onClick={handleClear}
                title="Clear all"
              >
                <span className="tool-icon">×</span>
                <span className="tool-text">Clear</span>
              </button>

              <div className="tool-separator" />

              {/* NAVIGATION */}
              <button
                type="button"
                className="tool-btn"
                onClick={handleFirst}
                title="First"
                disabled={!hasSelected || atFirst}
              >
                <span className="tool-icon">|◀</span>
                <span className="tool-text">First</span>
              </button>

              <button
                type="button"
                className="tool-btn"
                onClick={handlePrevious}
                title="Previous"
                disabled={!hasSelected || atFirst}
              >
                <span className="tool-icon">◀</span>
                <span className="tool-text">Previous</span>
              </button>

              <button
                type="button"
                className="tool-btn"
                onClick={handleNext}
                title="Next"
                disabled={!hasSelected || atLast}
              >
                <span className="tool-icon">▶</span>
                <span className="tool-text">Next</span>
              </button>

              <button
                type="button"
                className="tool-btn"
                onClick={handleLast}
                title="Last"
                disabled={!hasSelected || atLast}
              >
                <span className="tool-icon">▶|</span>
                <span className="tool-text">Last</span>
              </button>

            </div>




            <div className="sub_container_display_2">

              <table className="tableTariff1">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Data Index</th>

                  </tr>
                </thead>
                <tbody>
                  {pushSetupItems.map((item, index) => (
                    <tr
                      key={index}
                      onClick={() => handleRowClick(item.id)}  // Handle row click
                      onDoubleClick={() => handleRowClick(item.id)} // Handle double-click
                      style={{
                        backgroundColor: item.id === selectedRowId ? 'lightblue' : '',
                      }} // Optional: Highlight selected row
                    >
                      <td>{item.name}</td>
                      <td>{item.code}</td>
                      <td>{item.data_index}</td>


                    </tr>
                  ))}
                </tbody>
              </table>





            </div>
          </div>


        )}

        {activeView === 'otherParameters' && <OtherParameters />}

      </div>
    </div>
  );
}

export default PushSetup;

