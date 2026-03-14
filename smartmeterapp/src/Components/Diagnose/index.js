import React, { useState, useEffect } from "react";
import "./index.css";
import axios from "axios"; 
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import ProgressModal from '../ProgressModal';




const Diagnose1 = () => {
  const [selectedPage, setSelectedPage] = useState("");

    const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
    useEffect(() => {
      const storedId = localStorage.getItem('selectedDeviceId');
      setDeviceId(storedId);
    }, []);


  const [pageStates, setPageStates] = useState({
    stateOfInternalControl: {
      factory_mode: false,
      non_business_mode: false,
      main_relay_open: false,
      high_temperature: false,
      punish_measure: false,
      prepay_mode: false,
      low_credit: false,
      friendly_in_use: false,
      no_credit: false,
      top_cover_open: false,
      terminal_cover_open: false,
      module_cover_open: false,
      strong_magnetic_disturbance: false,
      external_battery_low: false,
    },
    internalOperatingStatus: {
      uncalibration: false,
      measure_error: false,
      program_store_error: false,
      nvm_error: false,
      ram_error: false,
      abnormal_reset: false,
      module_fault: false,
      rtc_osc_fault: false,
      mcu_osc_fault: false,
      main_relay_fault: false,
      clock_invalid: false,
      ppm_fault: false,
    },
    powerQualityStatus: {
      a_phase_miss_voltage: false,
      a_phase_low_voltage: false,
      a_phase_high_voltage: false,
      a_phase_abnormal: false,
      low_frequency: false,
      high_frequency: false,
    },
    tamperIndicateStatus: {
      top_cover_open: false,
      terminal_cover_open: false,
      module_cover_open: false,
      strong_magnetic_disturbance: false,
      sim_card_removed_exception: false,
    },
  });

  // Function for sending data for stateOfInternalControl
  const sendDataStateOfInternalControl = async () => {
    const { stateOfInternalControl } = pageStates;
    const data = {
      device_id: deviceId,
      factory_mode: stateOfInternalControl.factory_mode,
      non_business_mode: stateOfInternalControl.non_business_mode,
      main_relay_open: stateOfInternalControl.main_relay_open,
      high_temperature: stateOfInternalControl.high_temperature,
      punish_measure: stateOfInternalControl.punish_measure,
      prepay_mode: stateOfInternalControl.prepay_mode,
      low_credit: stateOfInternalControl.low_credit,
      friendly_in_use: stateOfInternalControl.friendly_in_use,
      no_credit: stateOfInternalControl.no_credit,
      top_cover_open: stateOfInternalControl.top_cover_open,
      terminal_cover_open: stateOfInternalControl.terminal_cover_open,
      module_cover_open: stateOfInternalControl.module_cover_open,
      strong_magnetic_disturbance: stateOfInternalControl.strong_magnetic_disturbance,
      external_battery_low: stateOfInternalControl.external_battery_low,
      code: "{1, 0-0:96.5.0.255}",
    };
    try {
      const response = await axios.post(
        `${BASE_URL}/api/create-state-of-internal-control/`,
        data
      );
      console.log('Success:', response.data);
      alert('Data sent successfully!');
    } catch (error) {
      console.error('Error:', error.response?.data || 'Unknown error');
      alert('Failed to send data.');
    }
  };

  // Function for sending data for internalOperatingStatus
  const sendDataInternalOperatingStatus = async () => {
    const { internalOperatingStatus } = pageStates;
    const data = {
      device_id: deviceId,
      uncalibration: internalOperatingStatus.uncalibration,
      measure_error: internalOperatingStatus.measure_error,
      program_store_error: internalOperatingStatus.program_store_error,
      nvm_error: internalOperatingStatus.nvm_error,
      ram_error: internalOperatingStatus.ram_error,
      abnormal_reset: internalOperatingStatus.abnormal_reset,
      module_fault: internalOperatingStatus.module_fault,
      rtc_osc_fault: internalOperatingStatus.rtc_osc_fault,
      mcu_osc_fault: internalOperatingStatus.mcu_osc_fault,
      main_relay_fault: internalOperatingStatus.main_relay_fault,
      clock_invalid: internalOperatingStatus.clock_invalid,
      ppm_fault: internalOperatingStatus.ppm_fault,
      code: "{1, 0-0:96.5.1.255}",
    };
    try {
      const response = await axios.post(
        `${BASE_URL}/api/create-internal-operating-status/`,
        data
      );
      console.log('Success:', response.data);
      alert('Data sent successfully!');
    } catch (error) {
      console.error('Error:', error.response?.data || 'Unknown error');
      alert('Failed to send data.');
    }
  };

  // Function for sending data for powerQualityStatus
  const sendDataPowerQualityStatus = async () => {
    const { powerQualityStatus } = pageStates;
    const data = {
      device_id: deviceId,
      a_phase_miss_voltage: powerQualityStatus.a_phase_miss_voltage,
      a_phase_low_voltage: powerQualityStatus.a_phase_low_voltage,
      a_phase_high_voltage: powerQualityStatus.a_phase_high_voltage,
      a_phase_abnormal: powerQualityStatus.a_phase_abnormal,
      low_frequency: powerQualityStatus.low_frequency,
      high_frequency: powerQualityStatus.high_frequency,
      code: "{1, 0-0:96.5.2.255}",
    };
    try {
      const response = await axios.post(
        `${BASE_URL}/api/create-power-quality-status/`,
        data
      );
      console.log('Success:', response.data);
      alert('Data sent successfully!');
    } catch (error) {
      console.error('Error:', error.response?.data || 'Unknown error');
      alert('Failed to send data.');
    }
  };

  // Function for sending data for tamperIndicateStatus
  const sendDataTamperIndicateStatus = async () => {
    const { tamperIndicateStatus } = pageStates;
    const data = {
      device_id: deviceId,
      top_cover_open: tamperIndicateStatus.top_cover_open,
      terminal_cover_open: tamperIndicateStatus.terminal_cover_open,
      module_cover_open: tamperIndicateStatus.module_cover_open,
      strong_magnetic_disturbance: tamperIndicateStatus.strong_magnetic_disturbance,
      sim_card_removed_exception: tamperIndicateStatus.sim_card_removed_exception,
      code: "{1, 0-0:96.5.3.255}",
    };
    try {
      const response = await axios.post(
        `${BASE_URL}/api/create-tamper-indicate-status/`,
        data
      );
      console.log('Success:', response.data);
      alert('Data sent successfully!');
    } catch (error) {
      console.error('Error:', error.response?.data || 'Unknown error');
      alert('Failed to send data.');
    }
  };

  // Generic function to call the respective function based on the selected page
  const sendData = () => {
    switch (selectedPage) {
      case "stateOfInternalControl":
        sendDataStateOfInternalControl();
        break;
      case "internalOperatingStatus":
        sendDataInternalOperatingStatus();
        break;
      case "powerQualityStatus":
        sendDataPowerQualityStatus();
        break;
      case "tamperIndicateStatus":
        sendDataTamperIndicateStatus();
        break;
      default:
        alert('No page selected');
    }
  };

  const handleCheckboxChange = (pageKey, itemKey) => {
    setPageStates((prevStates) => ({
      ...prevStates,
      [pageKey]: {
        ...prevStates[pageKey],
        [itemKey]: !prevStates[pageKey][itemKey],
      },
    }));
  };

  const renderTable = (title, pageKey, data) => (
    <div>
      <h2>{title}</h2>
      <table className="diagnose_class">
        <thead>
          <tr>
            <th>Checked</th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input
                type="checkbox"
                checked={Object.values(pageStates[pageKey]).every((value) => value === true)} 
                onChange={() => {
                  const allChecked = Object.values(pageStates[pageKey]).every((value) => value === true);
                  const updatedItems = Object.keys(pageStates[pageKey]).reduce((acc, key) => {
                    acc[key] = !allChecked; 
                    return acc;
                  }, {});
                  setPageStates((prevStates) => ({
                    ...prevStates,
                    [pageKey]: updatedItems,
                  }));
                }}
              />
            </td>
            <td>1</td>
            <td>{title}</td>
            <td>{data.code}</td>
          </tr>
        </tbody>
      </table>

      <ul>
        {Object.keys(data.items).map((itemKey, index) => (
          <li key={index}>
            <input
              type="checkbox"
              checked={pageStates[pageKey][itemKey]} 
              onChange={() => handleCheckboxChange(pageKey, itemKey)}
            />
            {data.items[itemKey]}
          </li>
        ))}
      </ul>
      <button onClick={sendData}>Send Data</button>
    </div>
  );

  const pages = {
    stateOfInternalControl: {
      title: "State of the Internal Control",
      code: "{1, 0-0:96.5.0.255}",
      items: {
        factory_mode: "Factory mode",
        non_business_mode: "Non-business mode",
        main_relay_open: "Main relay open",
        high_temperature: "High temperature",
        punish_measure: "Punish measure",
        prepay_mode: "Prepay mode",
        low_credit: "Low credit",
        friendly_in_use: "Friendly in use",
        no_credit: "No credit",
        top_cover_open: "Top cover open",
        terminal_cover_open: "Terminal cover open",
        module_cover_open: "Module cover open",
        strong_magnetic_disturbance: "Strong magnetic disturbance",
        external_battery_low: "External battery low",
      },
    },
    internalOperatingStatus: {
      title: "Internal Operating Status",
      code: "{1, 0-0:96.5.1.255}",
      items: {
        uncalibration: "Uncalibration",
        measure_error: "Measure error",
        program_store_error: "Program store error",
        nvm_error: "NVM Error",
        ram_error: "RAM error",
        abnormal_reset: "Abnormal reset",
        module_fault: "Module fault",
        rtc_osc_fault: "RTC OSC fault",
        mcu_osc_fault: "MCU OSC fault",
        main_relay_fault: "Main relay fault",
        clock_invalid: "Clock invalid",
        ppm_fault: "PPM fault",
      },
    },
    powerQualityStatus: {
      title: "Power Quality Status",
      code: "{1, 0-0:96.5.2.255}",
      items: {
        a_phase_miss_voltage: "A phase miss voltage",
        a_phase_low_voltage: "A phase low voltage",
        a_phase_high_voltage: "A phase high voltage",
        a_phase_abnormal: "A phase abnormal",
        low_frequency: "Low frequency",
        high_frequency: "High frequency",
      },
    },
    tamperIndicateStatus: {
      title: "Tamper Indicate Status",
      code: "{1, 0-0:96.5.3.255}",
      items: {
        top_cover_open: "Top cover open",
        terminal_cover_open: "Terminal cover open",
        module_cover_open: "Module cover open",
        strong_magnetic_disturbance: "Strong magnetic disturbance",
        sim_card_removed_exception: "SIM card removed/exception",
      },
    },
  };

  return (
    <div className="diagnose_dashboard">
      <div className="diagnose_buttons">
        {Object.keys(pages).map((key) => (
          <button
            key={key}
            className={selectedPage === key ? 'active' : ''}
            onClick={() => setSelectedPage(key)}
          >
            {pages[key].title}
          </button>
        ))}
      </div>
      <div className="diagnose_content">
        {selectedPage
          ? renderTable(pages[selectedPage].title, selectedPage, pages[selectedPage])
          : <p>Select a category to view details</p>}
      </div>
    </div>
  );
};


function Diagnose2() {
  const [selectedPage, setSelectedPage] = useState("");

  // serialNumber from localStorage
  const [serialNumber, setSerialNumber] = useState(() =>
    localStorage.getItem("selectedSerialNumber")
  );

  useEffect(() => {
    const stored = localStorage.getItem("selectedSerialNumber");
    setSerialNumber(stored);
  }, []);

  // State for each page’s sub-checkboxes
  const [pageStates, setPageStates] = useState({
    stateOfInternalControl: {
      factory_mode: false,
      non_business_mode: false,
      main_relay_open: false,
      high_temperature: false,
      punish_measure: false,
      prepay_mode: false,
      low_credit: false,
      friendly_in_use: false,
      no_credit: false,
      top_cover_open: false,
      terminal_cover_open: false,
      module_cover_open: false,
      strong_magnetic_disturbance: false,
      external_battery_low: false,
    },
    internalOperatingStatus: {
      uncalibration: false,
      measure_error: false,
      program_store_error: false,
      nvm_error: false,
      ram_error: false,
      abnormal_reset: false,
      module_fault: false,
      rtc_osc_fault: false,
      mcu_osc_fault: false,
      main_relay_fault: false,
      clock_invalid: false,
      ppm_fault: false,
    },
    powerQualityStatus: {
      a_phase_miss_voltage: false,
      a_phase_low_voltage: false,
      a_phase_high_voltage: false,
      a_phase_abnormal: false,
      low_frequency: false,
      high_frequency: false,
    },
    tamperIndicateStatus: {
      top_cover_open: false,
      terminal_cover_open: false,
      module_cover_open: false,
      strong_magnetic_disturbance: false,
      sim_card_removed_exception: false,
    },
  });

  // State for header checkbox per page (toggle it manually)
  const [headerChecked, setHeaderChecked] = useState({
    stateOfInternalControl: false,
    internalOperatingStatus: false,
    powerQualityStatus: false,
    tamperIndicateStatus: false,
  });

  // Toggle header checkbox for a page
  const toggleHeader = (pageKey) => {
    setHeaderChecked((prev) => ({
      ...prev,
      [pageKey]: !prev[pageKey],
    }));
  };

  // ─────────────────────────────────────────────────────────────────────
  // Read “State Of Internal Control”
  // ─────────────────────────────────────────────────────────────────────
  const readStateOfInternalControl = async () => {
    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: [
        {
          obis_code: "0.0.96.5.0.255",
          attribute_index: "2",
        },
      ],
    };

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/create-state-of-internal-control/`,
        payload
      );
      const returnedValues = resp.data.results?.[0]?.value || [];
      const mapping = {
        factory_mode: "FactoryMode",
        non_business_mode: "NonBusinessMode",
        main_relay_open: "MainRelayOpen",
        high_temperature: "HighTemperature",
        punish_measure: "PunishMeasure",
        prepay_mode: "PrepayMode",
        low_credit: "LowCredit",
        friendly_in_use: "FriendlyInUse",
        no_credit: "NoCredit",
        top_cover_open: "TopCoverOpen",
        terminal_cover_open: "TerminalCoverOpen",
        module_cover_open: "ModuleCoverOpen",
        strong_magnetic_disturbance: "StrongMagneticDisturbance",
        external_battery_low: "ExternalBatteryLow",
      };

      const newState = Object.keys(
        pageStates.stateOfInternalControl
      ).reduce((acc, key) => {
        acc[key] = mapping[key]
          ? returnedValues.includes(mapping[key])
          : false;
        return acc;
      }, {});

      setPageStates((prev) => ({
        ...prev,
        stateOfInternalControl: newState,
      }));
    } catch (err) {
      console.error(
        "Read Error (StateOfInternalControl):",
        err.response?.data || err.message
      );
      alert("Failed to read State Of Internal Control.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Read “Internal Operating Status”
  // ─────────────────────────────────────────────────────────────────────
  const readInternalOperatingStatus = async () => {
    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: [
        {
          obis_code: "0.0.96.5.1.255",
          attribute_index: "2",
        },
      ],
    };

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/create-internal-operating-status/`,
        payload
      );
      const returnedValues = resp.data.results?.[0]?.value || [];
      const mapping = {
        uncalibration: "Uncalibration",
        measure_error: "MeasureError",
        program_store_error: "ProgramStoreError",
        nvm_error: "NVM_Error",
        ram_error: "RAM_Error",
        abnormal_reset: "AbnormalReset",
        module_fault: "ModuleFault",
        rtc_osc_fault: "RTC_OSC_Fault",
        mcu_osc_fault: "MCU_OSC_Fault",
        main_relay_fault: "MainRelayFault",
        clock_invalid: "ClockInvalid",
        ppm_fault: "PPM_Fault",
      };

      const newState = Object.keys(
        pageStates.internalOperatingStatus
      ).reduce((acc, key) => {
        acc[key] = mapping[key]
          ? returnedValues.includes(mapping[key])
          : false;
        return acc;
      }, {});

      setPageStates((prev) => ({
        ...prev,
        internalOperatingStatus: newState,
      }));
    } catch (err) {
      console.error(
        "Read Error (InternalOperatingStatus):",
        err.response?.data || err.message
      );
      alert("Failed to read Internal Operating Status.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Read “Power Quality Status”
  // ─────────────────────────────────────────────────────────────────────
  const readPowerQualityStatus = async () => {
    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: [
        {
          obis_code: "0.0.96.5.2.255",
          attribute_index: "2",
        },
      ],
    };

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/create-power-quality-status/`,
        payload
      );
      const returnedValues = resp.data.results?.[0]?.value || [];
      const mapping = {
        a_phase_miss_voltage: "A_phase_miss_voltage",
        a_phase_low_voltage: "A_phase_low_voltage",
        a_phase_high_voltage: "A_phase_high_voltage",
        a_phase_abnormal: "A_phase_abnormal",
        low_frequency: "LowFrequency",
        high_frequency: "HighFrequency",
      };

      const newState = Object.keys(pageStates.powerQualityStatus).reduce(
        (acc, key) => {
          acc[key] = mapping[key]
            ? returnedValues.includes(mapping[key])
            : false;
          return acc;
        },
        {}
      );

      setPageStates((prev) => ({
        ...prev,
        powerQualityStatus: newState,
      }));
    } catch (err) {
      console.error(
        "Read Error (PowerQualityStatus):",
        err.response?.data || err.message
      );
      alert("Failed to read Power Quality Status.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Read “Tamper Indicate Status”
  // ─────────────────────────────────────────────────────────────────────
  const readTamperIndicateStatus = async () => {
    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: [
        {
          obis_code: "0.0.96.5.3.255",
          attribute_index: "2",
        },
      ],
    };

    try {
      const resp = await axios.post(
        `${BASE_URL}/api/create-tamper-indicate-status/`,
        payload
      );
      const returnedValues = resp.data.results?.[0]?.value || [];
      const mapping = {
        top_cover_open: "TopCoverOpen",
        terminal_cover_open: "TerminalCoverOpen",
        module_cover_open: "ModuleCoverOpen",
        strong_magnetic_disturbance: "StrongMagneticDisturbance",
        sim_card_removed_exception: "SimCardRemovedException",
      };

      const newState = Object.keys(pageStates.tamperIndicateStatus).reduce(
        (acc, key) => {
          acc[key] = mapping[key]
            ? returnedValues.includes(mapping[key])
            : false;
          return acc;
        },
        {}
      );

      setPageStates((prev) => ({
        ...prev,
        tamperIndicateStatus: newState,
      }));
    } catch (err) {
      console.error(
        "Read Error (TamperIndicateStatus):",
        err.response?.data || err.message
      );
      alert("Failed to read Tamper Indicate Status.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Render the table, list of sub-checkboxes, and a Read button
  // ─────────────────────────────────────────────────────────────────────
  const renderTable = (title, pageKey, data) => (
    <div>
      <h2>{title}</h2>

      <table className="diagnose_class">
        <thead>
          <tr>
            <th>Checked</th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {/* Header checkbox: toggle it, then Read will be triggered separately */}
              <input
                type="checkbox"
                checked={headerChecked[pageKey]}
                onChange={() => toggleHeader(pageKey)}
              />
            </td>
            <td>1</td>
            <td>{title}</td>
            <td>{data.code}</td>
          </tr>
        </tbody>
      </table>

      <ul>
        {Object.keys(data.items).map((itemKey, index) => (
          <li key={index}>
            <input
              type="checkbox"
              checked={pageStates[pageKey][itemKey]}
              readOnly
            />
            {data.items[itemKey]}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "8px" }}>
        <button
          onClick={() => {
            // Only call Read if header is checked
            if (!headerChecked[pageKey]) {
              alert("Please check the header checkbox first.");
              return;
            }
            switch (pageKey) {
              case "stateOfInternalControl":
                readStateOfInternalControl();
                break;
              case "internalOperatingStatus":
                readInternalOperatingStatus();
                break;
              case "powerQualityStatus":
                readPowerQualityStatus();
                break;
              case "tamperIndicateStatus":
                readTamperIndicateStatus();
                break;
              default:
                break;
            }
          }}
        >
          Read
        </button>
      </div>
    </div>
  );

  // Definitions for each page
  const pages = {
    stateOfInternalControl: {
      title: "State of the Internal Control",
      code: "{1, 0-0:96.5.0.255}",
      items: {
        factory_mode: "Factory mode",
        non_business_mode: "Non-business mode",
        main_relay_open: "Main relay open",
        high_temperature: "High temperature",
        punish_measure: "Punish measure",
        prepay_mode: "Prepay mode",
        low_credit: "Low credit",
        friendly_in_use: "Friendly in use",
        no_credit: "No credit",
        top_cover_open: "Top cover open",
        terminal_cover_open: "Terminal cover open",
        module_cover_open: "Module cover open",
        strong_magnetic_disturbance: "Strong magnetic disturbance",
        external_battery_low: "External battery low",
      },
    },
    internalOperatingStatus: {
      title: "Internal Operating Status",
      code: "{1, 0-0:96.5.1.255}",
      items: {
        uncalibration: "Uncalibration",
        measure_error: "Measure error",
        program_store_error: "Program store error",
        nvm_error: "NVM Error",
        ram_error: "RAM error",
        abnormal_reset: "Abnormal reset",
        module_fault: "Module fault",
        rtc_osc_fault: "RTC OSC fault",
        mcu_osc_fault: "MCU OSC fault",
        main_relay_fault: "Main relay fault",
        clock_invalid: "Clock invalid",
        ppm_fault: "PPM fault",
      },
    },
    powerQualityStatus: {
      title: "Power Quality Status",
      code: "{1, 0-0:96.5.2.255}",
      items: {
        a_phase_miss_voltage: "A phase miss voltage",
        a_phase_low_voltage: "A phase low voltage",
        a_phase_high_voltage: "A phase high voltage",
        a_phase_abnormal: "A phase abnormal",
        low_frequency: "Low frequency",
        high_frequency: "High frequency",
      },
    },
    tamperIndicateStatus: {
      title: "Tamper Indicate Status",
      code: "{1, 0-0:96.5.3.255}",
      items: {
        top_cover_open: "Top cover open",
        terminal_cover_open: "Terminal cover open",
        module_cover_open: "Module cover open",
        strong_magnetic_disturbance: "Strong magnetic disturbance",
        sim_card_removed_exception: "SIM card removed/exception",
      },
    },
  };

  return (
    <div className="diagnose_dashboard">
      <div className="diagnose_buttons">
        {Object.keys(pages).map((key) => (
          <button
            key={key}
            className={selectedPage === key ? "active" : ""}
            onClick={() => setSelectedPage(key)}
          >
            {pages[key].title}
          </button>
        ))}
      </div>

      <div className="diagnose_content">
        {selectedPage ? (
          renderTable(
            pages[selectedPage].title,
            selectedPage,
            pages[selectedPage]
          )
        ) : (
          <p>Select a category to view details</p>
        )}
      </div>
    </div>
  );
}



function Diagnose() {
  const [selectedPage, setSelectedPage] = useState("stateOfInternalControl");
  const [serialNumber, setSerialNumber] = useState(() =>
    localStorage.getItem("selectedSerialNumber")
  );

  useEffect(() => {
    const stored = localStorage.getItem("selectedSerialNumber");
    setSerialNumber(stored);
  }, []);

  // State for sub-checkboxes
  const [pageStates, setPageStates] = useState({
    stateOfInternalControl: {
      factory_mode: false,
      non_business_mode: false,
      main_relay_open: false,
      high_temperature: false,
      punish_measure: false,
      prepay_mode: false,
      low_credit: false,
      friendly_in_use: false,
      no_credit: false,
      top_cover_open: false,
      terminal_cover_open: false,
      module_cover_open: false,
      strong_magnetic_disturbance: false,
      external_battery_low: false,
    },
    internalOperatingStatus: {
      uncalibration: false,
      measure_error: false,
      program_store_error: false,
      nvm_error: false,
      ram_error: false,
      abnormal_reset: false,
      module_fault: false,
      rtc_osc_fault: false,
      mcu_osc_fault: false,
      main_relay_fault: false,
      clock_invalid: false,
      ppm_fault: false,
    },
    powerQualityStatus: {
      a_phase_miss_voltage: false,
      a_phase_low_voltage: false,
      a_phase_high_voltage: false,
      a_phase_abnormal: false,
      low_frequency: false,
      high_frequency: false,
    },
    tamperIndicateStatus: {
      top_cover_open: false,
      terminal_cover_open: false,
      module_cover_open: false,
      strong_magnetic_disturbance: false,
      sim_card_removed_exception: false,
    },
  });

  // Header checkbox state (to allow clicking before “Read”)
  const [headerChecked, setHeaderChecked] = useState({
    stateOfInternalControl: false,
    internalOperatingStatus: false,
    powerQualityStatus: false,
    tamperIndicateStatus: false,
  });

  const toggleHeader = (pageKey) => {
    setHeaderChecked((prev) => ({
      ...prev,
      [pageKey]: !prev[pageKey],
    }));
  };

  // Read handlers (populate sub-checkboxes)
  const readStateOfInternalControl = async () => {
    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: [{ obis_code: "0.0.96.5.0.255", attribute_index: "2" }],
    };
    try {
      const resp = await axios.post(
        `${BASE_URL}/api/create-state-of-internal-control/`,
        payload
      );
      const returned = resp.data.data?.[0]?.value || [];
      const mapping = {
        factory_mode: "FactoryMode",
        non_business_mode: "NonBusinessMode",
        main_relay_open: "MainRelayOpen",
        high_temperature: "HighTemperature",
        punish_measure: "PunishMeasure",
        prepay_mode: "PrepayMode",
        low_credit: "LowCredit",
        friendly_in_use: "FriendlyInUse",
        no_credit: "NoCredit",
        top_cover_open: "TopCoverOpen",
        terminal_cover_open: "TerminalCoverOpen",
        module_cover_open: "ModuleCoverOpen",
        strong_magnetic_disturbance: "StrongMagneticDisturbance",
        external_battery_low: "ExternalBatteryLow",
      };
      const newState = Object.keys(pageStates.stateOfInternalControl).reduce(
        (acc, key) => {
          acc[key] = returned.includes(mapping[key]);
          return acc;
        },
        {}
      );
      setPageStates((prev) => ({
        ...prev,
        stateOfInternalControl: newState,
      }));
    } catch {
      alert("Failed to read State Of Internal Control.");
    }
  };

  const readInternalOperatingStatus = async () => {
    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: [{ obis_code: "0.0.96.5.1.255", attribute_index: "2" }],
    };
    try {
      const resp = await axios.post(
        `${BASE_URL}/api/create-internal-operating-status/`,
        payload
      );
      const returned = resp.data.data?.[0]?.value || [];
      const mapping = {
        uncalibration: "Uncalibration",
        measure_error: "MeasureError",
        program_store_error: "ProgramStoreError",
        nvm_error: "NVM_Error",
        ram_error: "RAM_Error",
        abnormal_reset: "AbnormalReset",
        module_fault: "ModuleFault",
        rtc_osc_fault: "RTC_OSC_Fault",
        mcu_osc_fault: "MCU_OSC_Fault",
        main_relay_fault: "MainRelayFault",
        clock_invalid: "ClockInvalid",
        ppm_fault: "PPM_Fault",
      };
      const newState = Object.keys(pageStates.internalOperatingStatus).reduce(
        (acc, key) => {
          acc[key] = returned.includes(mapping[key]);
          return acc;
        },
        {}
      );
      setPageStates((prev) => ({
        ...prev,
        internalOperatingStatus: newState,
      }));
    } catch {
      alert("Failed to read Internal Operating Status.");
    }
  };

  const readPowerQualityStatus = async () => {
    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: [{ obis_code: "0.0.96.5.2.255", attribute_index: "2" }],
    };
    try {
      const resp = await axios.post(
        `${BASE_URL}/api/create-power-quality-status/`,
        payload
      );
      const returned = resp.data.data?.[0]?.value || [];
      const mapping = {
        a_phase_miss_voltage: "A_phase_miss_voltage",
        a_phase_low_voltage: "A_phase_low_voltage",
        a_phase_high_voltage: "A_phase_high_voltage",
        a_phase_abnormal: "A_phase_abnormal",
        low_frequency: "LowFrequency",
        high_frequency: "HighFrequency",
      };
      const newState = Object.keys(pageStates.powerQualityStatus).reduce(
        (acc, key) => {
          acc[key] = returned.includes(mapping[key]);
          return acc;
        },
        {}
      );
      setPageStates((prev) => ({
        ...prev,
        powerQualityStatus: newState,
      }));
    } catch {
      alert("Failed to read Power Quality Status.");
    }
  };

  const readTamperIndicateStatus = async () => {
    const payload = {
      serial_number: serialNumber,
      action: "read_obis",
      parameters: [{ obis_code: "0.0.96.5.3.255", attribute_index: "2" }],
    };
    try {
      const resp = await axios.post(
        `${BASE_URL}/api/create-tamper-indicate-status/`,
        payload
      );
      const returned = resp.data.data?.[0]?.value || [];
      const mapping = {
        top_cover_open: "TopCoverOpen",
        terminal_cover_open: "TerminalCoverOpen",
        module_cover_open: "ModuleCoverOpen",
        strong_magnetic_disturbance: "StrongMagneticDisturbance",
        sim_card_removed_exception: "SimCardRemovedException",
      };
      const newState = Object.keys(pageStates.tamperIndicateStatus).reduce(
        (acc, key) => {
          acc[key] = returned.includes(mapping[key]);
          return acc;
        },
        {}
      );
      setPageStates((prev) => ({
        ...prev,
        tamperIndicateStatus: newState,
      }));
    } catch {
      alert("Failed to read Tamper Indicate Status.");
    }
  };

  // Renders checkboxes & “Read” button for the selected page
  const renderPage = (pageKey, config) => {
    const { title, code, items } = config;

    // Determine which read function to call
    const handleRead = () => {
      if (!headerChecked[pageKey]) {
        alert("Please check the header checkbox first.");
        return;
      }
      switch (pageKey) {
        case "stateOfInternalControl":
          readStateOfInternalControl();
          break;
        case "internalOperatingStatus":
          readInternalOperatingStatus();
          break;
        case "powerQualityStatus":
          readPowerQualityStatus();
          break;
        case "tamperIndicateStatus":
          readTamperIndicateStatus();
          break;
        default:
          break;
      }
    };

    return (
      <div>
        {/* Header */}
       
        
         
        

        {/* Header Checkbox + Code Display */}
       
         
         <table>
  <thead>
    <tr>
      <th scope="col">Checkbox</th>
      <th> No</th>

      <th scope="col">Name</th>
      <th scope="col">Code</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <input
          type="checkbox"
          className="option-checkbox"
          checked={!!headerChecked[pageKey]}
          onChange={() => toggleHeader(pageKey)}
          aria-label={`Select ${selectedPage}`}
        />
      </td>
       <td className="option-text">1</td>
      <td className="option-text">{selectedPage}</td>
      <td className="option-text">{code}</td>
    </tr>
  </tbody>
</table>

       

        {/* Sub-checkboxes */}
        
          
          <div className="options-grid1">
            {Object.keys(items).map((itemKey) => (
              <label key={itemKey} className="option-label">
                <input
                  type="checkbox"
                  className="option-checkbox"
                  checked={pageStates[pageKey][itemKey]}
                  readOnly
                />
                <span className="option-text">{items[itemKey]}</span>
              </label>
            ))}
          </div>
        

        <button style={{marginLeft:'40%'}}
          className={`scheduler-add-button ${
            headerChecked[pageKey] ? "" : "disabled"
          }`}
          onClick={handleRead}
        >
          Read
        </button>
      </div>
    );
  };

  // Page definitions
  const pages = {
    stateOfInternalControl: {
      title: "State of Internal Control",
      code: "{1, 0-0:96.5.0.255}",
      items: {
        factory_mode: "Factory mode",
        non_business_mode: "Non-business mode",
        main_relay_open: "Main relay open",
        high_temperature: "High temperature",
        punish_measure: "Punish measure",
        prepay_mode: "Prepay mode",
        low_credit: "Low credit",
        friendly_in_use: "Friendly in use",
        no_credit: "No credit",
        top_cover_open: "Top cover open",
        terminal_cover_open: "Terminal cover open",
        module_cover_open: "Module cover open",
        strong_magnetic_disturbance: "Strong magnetic disturbance",
        external_battery_low: "External battery low",
      },
    },
    internalOperatingStatus: {
      title: "Internal Operating Status",
      code: "{1, 0-0:96.5.1.255}",
      items: {
        uncalibration: "Uncalibration",
        measure_error: "Measure error",
        program_store_error: "Program store error",
        nvm_error: "NVM Error",
        ram_error: "RAM error",
        abnormal_reset: "Abnormal reset",
        module_fault: "Module fault",
        rtc_osc_fault: "RTC OSC fault",
        mcu_osc_fault: "MCU OSC fault",
        main_relay_fault: "Main relay fault",
        clock_invalid: "Clock invalid",
        ppm_fault: "PPM fault",
      },
    },
    powerQualityStatus: {
      title: "Power Quality Status",
      code: "{1, 0-0:96.5.2.255}",
      items: {
        a_phase_miss_voltage: "A phase miss voltage",
        a_phase_low_voltage: "A phase low voltage",
        a_phase_high_voltage: "A phase high voltage",
        a_phase_abnormal: "A phase abnormal",
        low_frequency: "Low frequency",
        high_frequency: "High frequency",
      },
    },
    tamperIndicateStatus: {
      title: "Tamper Indicate Status",
      code: "{1, 0-0:96.5.3.255}",
      items: {
        top_cover_open: "Top cover open",
        terminal_cover_open: "Terminal cover open",
        module_cover_open: "Module cover open",
        strong_magnetic_disturbance: "Strong magnetic disturbance",
        sim_card_removed_exception: "SIM card removed/exception",
      },
    },
  };

  return (
    <div className="time-settings-container1">
     

     
      
       <div
  className="view-toggle"
  role="tablist"
  aria-label="Page selection"
>
  {Object.keys(pages).map((key) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-pressed={selectedPage === key}
      className={`view-btn ${
        selectedPage === key ? "active" : ""
      }`}
      onClick={() => setSelectedPage(key)}
    >
      {pages[key].title}
    </button>
  ))}
</div>

      {selectedPage && renderPage(selectedPage, pages[selectedPage])}
    </div>
  );
}


export default Diagnose;
