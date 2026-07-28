import React, { useState, useEffect } from "react";
import BASE_URL from "../../apiConfig";
import "./index.css";

const filters = [
  { id: 1, name: "Standard Event Log Report Filter", key: "standard" },
  { id: 2, name: "Fraud Event Log Report Filter", key: "fraud" },
  { id: 3, name: "Relay Control Log Report Filter", key: "relay" },
  { id: 4, name: "Power Quality Log Report Filter", key: "power" },
  { id: 5, name: "Communication Log Report Filter", key: "communication" },
  { id: 6, name: "Self Define Log Report Filter", key: "custom" },
];

// TODO: replace placeholder OBIS codes with the correct ones for your meter.
const filterConfig = {
  standard: { obis_code: "0.0.96.4.146.255", attribute_index: 2 },
  fraud: { obis_code: "TODO_OBIS_CODE", attribute_index: 2 },
  relay: { obis_code: "TODO_OBIS_CODE", attribute_index: 2 },
  power: { obis_code: "TODO_OBIS_CODE", attribute_index: 2 },
  communication: { obis_code: "TODO_OBIS_CODE", attribute_index: 2 },
  custom: { obis_code: "TODO_OBIS_CODE", attribute_index: 2 },
};

const bitDefinitionsMap = {
  standard: [
    { bit: 0, name: "Power down (1)" },
    { bit: 1, name: "Power up (2)" },
    { bit: 2, name: "Daylight saving time enabled or disabled (3)" },
    { bit: 3, name: "Clock adjusted(old date/time) (4)" },
    { bit: 4, name: "Clock adjusted(new date/time) (5)" },
    { bit: 5, name: "Clock invalid (6)" },
    { bit: 6, name: "Replace battery (7)" },
    { bit: 7, name: "Battery voltage low (8)" },
    { bit: 8, name: "TOU activated (9)" },
    { bit: 9, name: "Error register cleared (10)" },
    { bit: 10, name: "Alarm register cleared (11)" },
    { bit: 11, name: "Program memory error (12)" },
    { bit: 12, name: "RAM error (13)" },
    { bit: 13, name: "NV memory error (14)" },
    { bit: 14, name: "Watchdog error (15)" },
    { bit: 15, name: "Measurement system error (16)" },
    { bit: 16, name: "Firmware ready for activation (17)" },
    { bit: 17, name: "Firmware activated (18)" },
    { bit: 18, name: "One or more parameters changed (47)" },
    { bit: 19, name: "Global key(s) changed (48)" },
    { bit: 20, name: "FW verification failed (51)" },
    { bit: 21, name: "Unexpected consumption (52)" },
    { bit: 22, name: "Phase sequence reversal (88)" },
    { bit: 23, name: "Missing neutral (89)" },
    { bit: 24, name: "Demand cleared (253)" },
    { bit: 25, name: "Load profile cleared (254)" },
    { bit: 26, name: "Event log cleared (255)" },
    { bit: 27, name: "Event log cleared (All) (256)" },
  ],
  fraud: [
    { bit: 0, name: "Terminal cover removed (40)" },
    { bit: 1, name: "Terminal cover closed (41)" },
    { bit: 2, name: "Strong DC field detected (42)" },
    { bit: 3, name: "No strong DC field anymore (43)" },
    { bit: 4, name: "Meter cover removed (44)" },
    { bit: 5, name: "Meter cover closed (45)" },
    { bit: 6, name: "Association authentication failure (n time failed authentication) (48)" },
    { bit: 7, name: "Decryption or authentication failure (n times failure) (49)" },
    { bit: 8, name: "Replay attack (50)" },
    { bit: 9, name: "Current reversal (91)" },
    { bit: 10, name: "Current reversal end (107)" },
    { bit: 11, name: "Event log cleared (255)" },
    { bit: 12, name: "Neutral disturbe (314)" },
    { bit: 13, name: "Neutral disturbe end (315)" },
    { bit: 14, name: "CT bypass start (302)" },
    { bit: 15, name: "CT bypass end (303)" },
  ],
  relay: [
    { bit: 0, name: "Disconnector ready for manual reconnection (59)" },
    { bit: 1, name: "Manual connection (61)" },
    { bit: 2, name: "Remote disconnection (62)" },
    { bit: 3, name: "Remote connection (63)" },
    { bit: 4, name: "Local disconnection (64)" },
    { bit: 5, name: "Local connection (66)" },
    { bit: 6, name: "Over limit start (65)" },
    { bit: 7, name: "Limiter threshold changed (67)" },
    { bit: 8, name: "Disconnect/Reconnect failure (68)" },
    { bit: 9, name: "Local reconnection (69)" },
    { bit: 10, name: "Fuse Supervision monitor 1 threshold exceeded L1 (70)" },
    { bit: 11, name: "Fuse Supervision monitor 1 threshold ok L1 (71)" },
    { bit: 12, name: "Fuse Supervision monitor 2 threshold exceeded L2 (72)" },
    { bit: 13, name: "Fuse Supervision monitor 2 threshold ok L2 (73)" },
    { bit: 14, name: "Fuse Supervision monitor 3 threshold exceeded L3 (74)" },
    { bit: 15, name: "Fuse Supervision monitor 3 threshold ok L3 (75)" },
    { bit: 16, name: "Over limit start L1 (321)" },
    { bit: 17, name: "Over limit end L1 (322)" },
    { bit: 18, name: "Over limit start L2 (323)" },
    { bit: 19, name: "Over limit end L2 (324)" },
    { bit: 20, name: "Over limit start L3 (325)" },
    { bit: 21, name: "Over limit end L3 (326)" },
    { bit: 22, name: "Event log cleared (255)" },
  ],
  power: [
    { bit: 0, name: "Under voltage L1 (76)" },
    { bit: 1, name: "Under voltage L2 (77)" },
    { bit: 2, name: "Under voltage L3 (78)" },
    { bit: 3, name: "Over voltage L1 (79)" },
    { bit: 4, name: "Over voltage L2 (80)" },
    { bit: 5, name: "Over voltage L3 (81)" },
    { bit: 6, name: "Missing voltage L1 (82)" },
    { bit: 7, name: "Missing voltage L2 (83)" },
    { bit: 8, name: "Missing voltage L3 (84)" },
    { bit: 9, name: "Under voltage end L1 (200)" },
    { bit: 10, name: "Under voltage end L2 (201)" },
    { bit: 11, name: "Under voltage end L3 (202)" },
    { bit: 12, name: "Over voltage end L1 (203)" },
    { bit: 13, name: "Over voltage end L2 (204)" },
    { bit: 14, name: "Over voltage end L3 (205)" },
    { bit: 15, name: "Missing voltage end L1 (206)" },
    { bit: 16, name: "Missing voltage end L2 (207)" },
    { bit: 17, name: "Missing voltage end L3 (208)" },
    { bit: 18, name: "Loss current L1 (215)" },
    { bit: 19, name: "Loss current L2 (217)" },
    { bit: 20, name: "Loss current L3 (219)" },
    { bit: 21, name: "Loss current end L1 (216)" },
    { bit: 22, name: "Loss current end L2 (218)" },
    { bit: 23, name: "Loss current end L3 (220)" },
    { bit: 24, name: "Active power reverse L1 (221)" },
    { bit: 25, name: "Active power reverse end L1 (222)" },
    { bit: 26, name: "Active power reverse L2 (223)" },
    { bit: 27, name: "Active power reverse end L2 (224)" },
    { bit: 28, name: "Active power reverse L3 (225)" },
    { bit: 29, name: "Active power reverse end L3 (226)" },
    { bit: 30, name: "Voltage normal L1 (85)" },
    { bit: 31, name: "Voltage normal L2 (86)" },
    { bit: 32, name: "Voltage normal L3 (87)" },
    { bit: 33, name: "Phase asymmetry start (90)" },
    { bit: 34, name: "Phase asymmetry end (331)" },
    { bit: 35, name: "Bad voltage quality L1 (92)" },
    { bit: 36, name: "Bad voltage quality L2 (93)" },
    { bit: 37, name: "Bad voltage quality L3 (94)" },
    { bit: 38, name: "Low power factor start (298)" },
    { bit: 39, name: "Low power factor end (299)" },
    { bit: 40, name: "Low frequency start (304)" },
    { bit: 41, name: "Low frequency end (305)" },
    { bit: 42, name: "High frequency start (306)" },
    { bit: 43, name: "High frequency end (307)" },
    { bit: 44, name: "Phase failure start L1 (237)" },
    { bit: 45, name: "Phase failure end L1 (238)" },
    { bit: 46, name: "Phase failure start L2 (239)" },
    { bit: 47, name: "Phase failure end L2 (240)" },
    { bit: 48, name: "Phase failure start L3 (241)" },
    { bit: 49, name: "Phase failure end L3 (242)" },
    { bit: 50, name: "Event log cleared (255)" },
  ],
  communication: [
    { bit: 0, name: "Modem initialization failure (141)" },
    { bit: 1, name: "SIM Card failure (SIM Card removal) (142)" },
    { bit: 2, name: "SIM Card ok (SIM Card insert) (143)" },
    { bit: 3, name: "GSM registration failure (144)" },
    { bit: 4, name: "GPRS registration failure (145)" },
    { bit: 5, name: "PDP context established (146)" },
    { bit: 6, name: "PDP context destroyed (147)" },
    { bit: 7, name: "PDP context failure (148)" },
    { bit: 8, name: "Modem SW reset (149)" },
    { bit: 9, name: "Modem HW reset (150)" },
    { bit: 10, name: "GSM outgoing connection (151)" },
    { bit: 11, name: "GSM incoming connection (152)" },
    { bit: 12, name: "GSM hang-up (153)" },
    { bit: 13, name: "Module removed (319)" },
    { bit: 14, name: "Module insert (320)" },
    { bit: 15, name: "Local communication attempt (158)" },
    { bit: 16, name: "Event log cleared (255)" },
    { bit: 17, name: "Module cover removed (300)" },
    { bit: 18, name: "Module cover closed (301)" },
  ],
  custom: [
    { bit: 0, name: "Event log cleared (255)" },
    { bit: 1, name: "Billing by command (316)" },
    { bit: 2, name: "Billing by push button (317)" },
    { bit: 3, name: "Payment mode changed (330)" },
  ],
};

const EventReportFilter = () => {
  const [activeFilter, setActiveFilter] = useState(1);
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [deviceId, setDeviceId] = useState(
    localStorage.getItem("selectedDeviceId")
  );

  useEffect(() => {
    setDeviceId(localStorage.getItem("selectedDeviceId"));
  }, []);

  const createBitData = (value, definitions) => {
    return definitions.map((item) => ({
      ...item,
      checked: ((value >> item.bit) & 1) === 1,
    }));
  };

  const parseValue = (raw) => {
    let value = raw;
    if (typeof value === "string") {
      value = value.trim();
      if (value.startsWith("0x") || /[A-Fa-f]/.test(value)) {
        value = parseInt(value.replace(/^0x/i, ""), 16);
      } else {
        value = parseInt(value, 10);
      }
    }
    return isNaN(value) ? 0 : value;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const activeFilterKey = filters.find((f) => f.id === activeFilter)?.key;
        const { obis_code, attribute_index } = filterConfig[activeFilterKey];

        // const url = `${BASE_URL}/meter1/api/getmeterinfo/`;
        const url = `${BASE_URL}/api/test-charge-stream/`;
        const payload = {
          action: "read_obis",
          serial_number: deviceId || "Avc",
          parameters: [
            {
              obis_code,
              attribute_index,
            },
          ],
        };

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        const rawText = await response.text();
        console.log("Raw response:", rawText);

        // Strip "data: " prefix (SSE format) and parse
        const jsonString = rawText.replace(/^data:\s*/, "").trim();
        const data = JSON.parse(jsonString);
        console.log("Parsed data:", data);

        if (data.status !== "success") {
            console.error("Read failed:", data.message);
            setFilterData([]);
            return;
        }

        const rawValue = data.value;
        const value = parseValue(rawValue);

        const definitions = bitDefinitionsMap[activeFilterKey] || [];
        setFilterData(createBitData(value, definitions));
      } catch (err) {
        console.error(err);
        setFilterData([]);
      } finally {
        setLoading(false);
      }
    };

    if (deviceId) {
      fetchData();
    }
  }, [activeFilter, deviceId]);

  return (
    <div className="relay-container">
      <div className="view-toggle" role="tablist" aria-label="Filter selection">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className={`view-btn ${activeFilter === filter.id ? "active" : ""}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.name}
          </button>
        ))}
      </div>

      <div className="filter-content">
        <h2>{filters.find((x) => x.id === activeFilter)?.name}</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="tableTariff1">
            <thead>
              <tr>
                <th>Checked</th>
                <th>Bit</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {filterData.map((item) => (
                <tr key={item.bit}>
                  <td>
                    <input type="checkbox" checked={item.checked} readOnly />
                  </td>
                  <td>{item.bit}</td>
                  <td>{item.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EventReportFilter;