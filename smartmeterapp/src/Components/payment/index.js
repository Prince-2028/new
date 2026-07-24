import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import './index.css'

const AccountDetails = () => {
  const [activeTab, setActiveTab] = useState('status');


  const [StatusformData, setStatusformData] = useState({

    paymentMode: "EditValue is null", // Default value
    accountStatus: "EditValue is null",
    currentCreditInUse: "",
    currentCreditStatus: [], // Store multiple selected statuses
    method: "Active account",
  });



  // Handle changes to any form field
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStatusformData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);


  const handleSubmit = async () => {
    //////////update code Bug0022**************

    const requestData = [{
      device_id: deviceId,
      payment_mode: StatusformData.paymentMode,
      account_status: StatusformData.accountStatus,
      current_credit_in_use: StatusformData.currentCreditInUse,
      current_credit_status: StatusformData.currentCreditStatus,
      method: StatusformData.method,
    }];

    // Validate all fields
    const formData = requestData[0];

    const missingFields = Object.entries(formData)
      .filter(([key, value]) =>
        value === "" ||
        value === null ||
        value === "EditValue is null" ||
        value === undefined
        //(Array.isArray(value) && value.length === 0)
      )
      .map(([key]) => key.replace(/_/g, " "));

    if (missingFields.length > 0) {
      alert(
        `Please fill all required fields:\n\n${missingFields.join("\n")}`
      );
      return;
    }

    console.log("Request Data:", requestData);

    ///////////////end update bug 0023 

    console.log("Request Data", requestData); // Debug log

    try {
      const response = await axios.post(`${BASE_URL}/api/account-details-status/`, requestData);
      alert("Data submitted successfully!");
      console.log(response.data);
    } catch (error) {
      // Debugging the error response
      if (error.response) {
        console.error("Error response:", error.response.data); // Log backend validation errors
        alert(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
        console.error("Error submitting data", error);
        alert("Failed to submit data!");
      }
    }
  };



  const [valueFormData, setValueFormData] = useState({
    availableCredit: 0,
    amountToClear: 0,
    clearanceThreshold: 0,
    aggregatedDebt: 0,
    accountActivationTime: "",
    accountClosureTime: "",
    currency: {
      name: "",
      scale: "",
      unit: "",
    },
    lowCreditThreshold: 0,
    nextCreditAvailableThreshold: 0,
    maxProvision: 0,
    maxProvisionPeriod: 0,
  });

  // Handle changes for standard input fields
  const valueHandleInputChange = (e) => {
    const { name, value } = e.target;
    setValueFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle changes for nested currency fields
  const valueHandleCurrencyChange = (e) => {
    const { name, value } = e.target;
    setValueFormData((prevData) => ({
      ...prevData,
      currency: {
        ...prevData.currency,
        [name]: value,
      },
    }));
  };

  const valueHandleSubmit = async (e) => {
    e.preventDefault();


    const isEmpty = (val) =>
      val === "" || val === null || val === undefined;

    const isInvalidNumber = (val) =>
      isEmpty(val) || Number.isNaN(Number(val));

    const convertToUTC = (datetimeStr) => {
      if (isEmpty(datetimeStr)) return null;

      const date = new Date(datetimeStr);
      if (Number.isNaN(date.getTime())) return null;

      return new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      ).toISOString();
    };

    const missingFields = [];

    if (isInvalidNumber(valueFormData.availableCredit))
      missingFields.push("available credit");
    if (isInvalidNumber(valueFormData.amountToClear))
      missingFields.push("amount to clear");
    if (isInvalidNumber(valueFormData.clearanceThreshold))
      missingFields.push("clearance threshold");
    if (isInvalidNumber(valueFormData.aggregatedDebt))
      missingFields.push("aggregated debt");

    if (isEmpty(valueFormData.accountActivationTime))
      missingFields.push("account activation time");
    if (isEmpty(valueFormData.accountClosureTime))
      missingFields.push("account closure time");

    if (!valueFormData.currency || isEmpty(valueFormData.currency.name))
      missingFields.push("currency name");
    if (!valueFormData.currency || isEmpty(valueFormData.currency.scale))
      missingFields.push("currency scale");
    if (!valueFormData.currency || isEmpty(valueFormData.currency.unit))
      missingFields.push("currency unit name");

    if (isInvalidNumber(valueFormData.lowCreditThreshold))
      missingFields.push("low credit threshold");
    if (isInvalidNumber(valueFormData.nextCreditAvailableThreshold))
      missingFields.push("next credit available threshold");
    if (isInvalidNumber(valueFormData.maxProvision))
      missingFields.push("max provision");
    if (isInvalidNumber(valueFormData.maxProvisionPeriod))
      missingFields.push("max provision period");

    if (!deviceId) {
      missingFields.push("device id");
    }

    const activationTime = convertToUTC(valueFormData.accountActivationTime);
    const closureTime = convertToUTC(valueFormData.accountClosureTime);

    if (!activationTime) {
      missingFields.push("valid account activation time");
    }

    if (!closureTime) {
      missingFields.push("valid account closure time");
    }

    if (missingFields.length > 0) {
      alert(`Please fill the following details:\n\n${missingFields.join("\n")}`);
      return;
    }

    // Convert the dates to UTC before sending
    const formattedData = {
      device_id: deviceId,
      available_credit: parseFloat(valueFormData.availableCredit),
      amount_to_clear: parseFloat(valueFormData.amountToClear),
      clearance_threshold: parseFloat(valueFormData.clearanceThreshold),
      aggregated_debt: parseFloat(valueFormData.aggregatedDebt),
      account_activation_time: convertToUTC(valueFormData.accountActivationTime),
      account_closure_time: convertToUTC(valueFormData.accountClosureTime),
      currency_name: valueFormData.currency.name,
      currency_scale: valueFormData.currency.scale ? parseInt(valueFormData.currency.scale) : null,
      currency_unit_name: valueFormData.currency.unit,
      low_credit_threshold: parseFloat(valueFormData.lowCreditThreshold),
      next_credit_available_threshold: parseFloat(valueFormData.nextCreditAvailableThreshold),
      max_provision: parseFloat(valueFormData.maxProvision),
      max_provision_period: parseInt(valueFormData.maxProvisionPeriod),
    };


    console.log(formattedData)

    try {
      const response = await axios.post(`${BASE_URL}/api/account-details-values/`, [formattedData]);
      console.log("Data sent successfully:", response.data);
      alert("Data submitted successfully!");
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Failed to submit data!");
    }
  };




  const [creditReferences, setCreditReferences] = useState([]);
  const [newReference, setNewReference] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Handle input change for adding a new reference
  const CreditReferenceListHandleInput = (e) => {
    setNewReference(e.target.value);
  };

  // Add a new credit reference to the list
  const handleAddReference = () => {

    CreditReferenceListHandleSubmit()
  };



  // Submit all credit references to the backend
  const CreditReferenceListHandleSubmit = async () => {
    console.log("creditReferences", newReference);

    // Format data to match the backend expectations
    const formattedData = [{
      device_id: deviceId, // You can dynamically set the device_id as needed
      credit_reference: newReference,
    }];

    try {
      // Send the formatted data to the backend
      const response = await axios.post(`${BASE_URL}/api/credit-reference/`, formattedData);

      // Handle successful response
      console.log("Credit references saved successfully:", response.data);
      alert("Credit references saved successfully!");
    } catch (error) {
      // Handle error
      console.error("Error saving credit references:", error);
      alert("Failed to save credit references.");
    }
  };


  const fetchCreditReferences = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/credit-reference/${deviceId}/`);
      setCreditReferences(response.data);
    } catch (error) {
      console.error("Error fetching credit references:", error);
      alert("Failed to fetch credit references.");
    }
  };



  useEffect(() => {
    fetchCreditReferences();
    getCreditChargeConfig(deviceId)
    fetchGatewayConfigs(deviceId)

  }, []);



  // Toggle adding new credit reference form
  const toggleAddForm = () => {
    setIsAdding(!isAdding);
  };


  const [creditChargeConfig, setCreditChargeConfig] = useState([]);
  const [newCreditReference, setNewCreditReference] = useState("");
  const [newChargeReference, setNewChargeReference] = useState("");
  const [creditReferenceIsAdding, setCreditReferenceIsAdding] = useState(false); // Renamed state

  // Handle input change for both credit and charge references
  const CreditChargeHandleInput = (e) => {
    const { name, value } = e.target;
    if (name === "creditReference") {
      setNewCreditReference(value);
    } else if (name === "chargeReference") {
      setNewChargeReference(value);
    }
  };

  // Add a new credit charge configuration to the list
  const handleAddConfig = () => {
    createCreditChargeConfig(deviceId, newCreditReference, newChargeReference)
  };




  const createCreditChargeConfig = async (deviceId, creditReference, chargeReference) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/credit-charge-config/`, [
        {
          device_id: deviceId,
          credit_reference: creditReference,
          charge_reference: chargeReference,
        }
      ]);
      console.log("Credit Charge Config Created:", response.data);
    } catch (error) {
      console.error("Error creating Credit Charge Config:", error);
    }
  };



  const getCreditChargeConfig = async (deviceId) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/credit-charge-config/${deviceId}/`);
      console.log("Credit Charge Configs:", response.data);
      setCreditChargeConfig(response.data)
    } catch (error) {
      console.error("Error fetching Credit Charge Configs:", error);
    }
  };


  // Submit all credit charge configurations to the backend
  const CreditChargeConfigHandleSubmit = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/credit-charge-config`, {
        creditChargeConfig,
      });
      console.log("Credit charge configurations saved successfully:", response.data);
      alert("Credit charge configurations saved successfully!");
    } catch (error) {
      console.error("Error saving credit charge configurations:", error);
      alert("Failed to save credit charge configurations.");
    }
  };

  // Toggle adding new credit charge configuration form
  const creditChargeToggleAddForm = () => {
    setCreditReferenceIsAdding(!creditReferenceIsAdding); // Renamed function to match state
  };


  const [gatewayConfigs, setGatewayConfigs] = useState([]); // Stores list of token gateway configurations
  const [creditRef, setCreditRef] = useState(""); // Stores the new credit reference
  const [tokenProp, setTokenProp] = useState(""); // Stores the new token proportion
  const [isAddingNewConfig, setIsAddingNewConfig] = useState(false); // Toggles form for adding new config

  // Handles input change for credit reference and token proportion
  const handleConfigInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "creditReference") {
      setCreditRef(value);
    } else if (name === "tokenProportion") {
      setTokenProp(value);
    }
  };

  // Adds a new configuration to the list of token gateway configurations
  const addNewTokenConfig = () => {
    console.log("hello")
    createTokenGatewayConfig(1, creditRef, tokenProp)
  };



  // Toggles the form to add new token gateway configuration
  const toggleAddTokenConfigForm = () => {
    setIsAddingNewConfig(!isAddingNewConfig); // Toggle the add config form visibility

  }




  const createTokenGatewayConfig = async (deviceId, creditRef, tokenProp) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/token-gateway-config/`, [
        {
          device_id: deviceId,
          credit_reference: creditRef,
          token_proportion: tokenProp,
        }
      ]);
      console.log("Credit Charge Config Created:", response.data);
    } catch (error) {
      console.error("Error creating Credit Charge Config:", error);
    }
  };


  const fetchGatewayConfigs = async (deviceId) => {
    try {
      if (deviceId) {
        const response = await axios.get(
          `${BASE_URL}/api/token-gateway-config/${deviceId}/`
        );
        setGatewayConfigs(response.data);
      }
    } catch (error) {
      console.error("Error fetching token gateway configs:", error);
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'status':
        return (


          <div>
            {/* Account Mode and Status */}
            <div className="security-form">


              <label>
                <span> Payment Mode </span>
                <select
                  id="paymentMode"
                  name="paymentMode"
                  value={StatusformData.paymentMode || "EditValue is null"}
                  onChange={handleChange}
                >
                  <option value="EditValue is null" disabled>
                    EditValue is null
                  </option>
                  <option value="credit">Credit Mode</option>
                  <option value="prepayment">Prepayment Mode</option>
                </select>
              </label>


            </div>





            {/* Account Status */}
            <div className="security-form">
              <label>
                <span> Account Status: </span>
                <select
                  id="accountStatus"
                  name="accountStatus"
                  value={StatusformData.accountStatus || "EditValue is null"}
                  onChange={handleChange}
                >
                  <option value="EditValue is null" disabled>
                    EditValue is null
                  </option>
                  <option value="new_inactive">New Inactive Account</option>
                  <option value="active">Account Active</option>
                  <option value="closed">Account Closed</option>
                </select>
              </label>
            </div>


            {/* Current Credit in Use */}
            <div className="security-form">
              <label>
                <span> Current Credit in Use: </span>
                <input
                  type="number"
                  name="currentCreditInUse"
                  value={StatusformData.currentCreditInUse}
                  onChange={handleChange}
                  placeholder="Enter current credit in use"
                />
              </label>
            </div>



            {/* Current Credit Status */}
            <div className="ppp-container" style={{ marginTop: "2%", padding: '2%' }}>
              <p className="ppp-heading ">  Current Credit Status</p>

              <div className="options-grid">
                {[
                  "In Credit",
                  "Low Credit",
                  "Next Credit Enabled",
                  "Next Credit Selectable",
                  "Next Credit Selected",
                  "Next Selectable Credit in Use",
                  "Out of Credit",
                ].map((status) => (
                  <label className="option-label" key={status}>
                    <input
                      type="checkbox"
                      className="option-checkbox"
                      name="currentCreditStatus"
                      value={status}
                      checked={StatusformData.currentCreditStatus.includes(status)}
                      onChange={(e) => {
                        const { value, checked } = e.target;
                        setStatusformData((prev) => ({
                          ...prev,
                          currentCreditStatus: checked
                            ? [...prev.currentCreditStatus, value] // Add status if checked
                            : prev.currentCreditStatus.filter((s) => s !== value), // Remove if unchecked
                        }));
                      }}
                    />
                    <span className="option-text">    {status} </span>


                  </label>
                ))}
              </div>
            </div>


            {/* Method */}
            <div className="security-form">
              <label>
                <span> Method:  </span>
                <select name="method" value={StatusformData.method} onChange={handleChange}>
                  <option value="Active account">Active Account</option>
                  <option value="Inactive account">Inactive Account</option>
                </select>
              </label>
            </div>

            {/* Submit Button */}
            <button style={{ marginLeft: "40%" }} className='scheduler-add-button' onClick={handleSubmit}>
              Submit
            </button>
          </div>


        );
      case 'value':
        return (
          <form onSubmit={valueHandleSubmit}>

            <div className="security-form">
              <label>
                <span>Available Credit:</span>
                <input
                  type="number"
                  name="availableCredit"
                  value={valueFormData.availableCredit}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Amount to Clear:</span>
                <input
                  type="number"
                  name="amountToClear"
                  value={valueFormData.amountToClear}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Clearance Threshold:</span>
                <input
                  type="number"
                  name="clearanceThreshold"
                  value={valueFormData.clearanceThreshold}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Aggregated Debt:</span>
                <input
                  type="number"
                  name="aggregatedDebt"
                  value={valueFormData.aggregatedDebt}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Account Activation Time:</span>
                <input
                  type="datetime-local"
                  name="accountActivationTime"
                  value={valueFormData.accountActivationTime}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Account Closure Time:</span>
                <input
                  type="datetime-local"
                  name="accountClosureTime"
                  value={valueFormData.accountClosureTime}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Currency Name:</span>
                <input
                  type="text"
                  name="name"
                  value={valueFormData.currency.name}
                  onChange={valueHandleCurrencyChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Currency Scale:</span>
                <input
                  type="number"
                  name="scale"
                  value={valueFormData.currency.scale}
                  onChange={valueHandleCurrencyChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Currency Unit:</span>
                <input
                  type="text"
                  name="unit"
                  value={valueFormData.currency.unit}
                  onChange={valueHandleCurrencyChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Low Credit Threshold:</span>
                <input
                  type="number"
                  name="lowCreditThreshold"
                  value={valueFormData.lowCreditThreshold}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Next Credit Available Threshold:</span>
                <input
                  type="number"
                  name="nextCreditAvailableThreshold"
                  value={valueFormData.nextCreditAvailableThreshold}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Max Provision:</span>
                <input
                  type="number"
                  name="maxProvision"
                  value={valueFormData.maxProvision}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Max Provision Period:</span>
                <input
                  type="number"
                  name="maxProvisionPeriod"
                  value={valueFormData.maxProvisionPeriod}
                  onChange={valueHandleInputChange}
                />
              </label>
            </div>

            <button style={{ marginLeft: "40%" }} className='scheduler-add-button' type="submit">Submit</button>

          </form>
        );

      case 'creditRefList':
        return (


          <div style={{ margin: "2%" }}>



            <div className="security-form">
              <label>
                <span onClick={handleAddReference}>
                  <button style={{ marginLeft: "10%" }} className='scheduler-add-button'>Add Reference </button></span>
                <input
                  type="text"
                  value={newReference}
                  onChange={CreditReferenceListHandleInput}
                  placeholder="Enter credit reference"
                />
              </label>

            </div>




            <div className='table-container-autoanswer' style={{ marginTop: '4%' }}>

              <table className='tableTariff1'>
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Credit Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {creditReferences.map((reference, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{reference.credit_reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


          </div>
        );

      case 'creditChargeConfig':
        return (
          <div>




            <div className="security-form">
              <label>
                <span onClick={handleAddConfig}>
                  <button style={{ marginLeft: "10%" }} className='scheduler-add-button'>Add Configuration </button></span>
                <input
                  type="text"
                  value={newCreditReference}
                  onChange={(e) => setNewCreditReference(e.target.value)}
                  placeholder="Enter credit reference"
                />
              </label>

            </div>



            <div className='table-container-autoanswer' style={{ marginTop: '4%' }}>

              <table className='tableTariff1'>
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Credit Reference</th>
                    <th>Charge Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {creditChargeConfig.map((config, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{config.credit_reference}</td>
                      <td>{config.charge_reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {creditChargeConfig.length > 0 && (
              <button onClick={CreditChargeConfigHandleSubmit}>
                Save Credit Charge Configurations
              </button>
            )}
          </div>
        );
      case 'tokenGatewayConfig':
        return (
          <div>



            <div className="security-form">
              <label>
                <span>   Credit reference </span>
                <input
                  type="text"
                  name="creditReference"
                  value={creditRef}
                  onChange={handleConfigInputChange}
                  placeholder="Enter credit reference"
                />
              </label>
            </div>
            <div className="security-form">
              <label>
                <span>  Token proportion </span>
                <input
                  type="text"
                  name="tokenProportion"
                  value={tokenProp}
                  onChange={handleConfigInputChange}
                  placeholder="Enter token proportion"
                />
              </label>

            </div>

            <button style={{ marginLeft: "40%" }} className='scheduler-add-button' onClick={addNewTokenConfig}>Add Configuration</button>




            <div className='table-container-autoanswer' style={{ marginTop: '4%' }}>

              <table className="tableTariff1">
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Credit Reference</th>
                    <th>Token Proportion</th>
                  </tr>
                </thead>
                <tbody>
                  {gatewayConfigs.map((config, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{config.credit_reference}</td>
                      <td>{config.token_proportion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


          </div>
        );
      default:
        return <p>Please select a tab to view the content.</p>;
    }
  };

  const tabs = [
    { key: "status", label: "Status" },
    { key: "value", label: "Value" },
    { key: "creditRefList", label: "Credit Reference List" },
    { key: "creditChargeConfig", label: "Credit Charge Configuration" },
    { key: "tokenGatewayConfig", label: "Token Gateway Configuration" },
  ];

  const containerRef = useRef(null);
  const buttonRefs = useRef({});
  const underlineRef = useRef(null);
  const movingTimeout = useRef(null);

  // Position the underline under the active button
  const moveUnderlineTo = (key) => {
    const btn = buttonRefs.current[key];
    const container = containerRef.current;
    const u = underlineRef.current;
    if (!btn || !container || !u) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const left = btnRect.left - containerRect.left;
    const width = btnRect.width;

    // Apply styles
    u.style.transform = `translateX(${left}px)`;
    u.style.width = `${Math.max(36, width)}px`; // min width for visibility

    // add moving class for glow animation then remove
    u.classList.add("moving");
    clearTimeout(movingTimeout.current);
    movingTimeout.current = setTimeout(() => u.classList.remove("moving"), 520);
  };

  useEffect(() => {
    moveUnderlineTo(activeTab);

    const onResize = () => moveUnderlineTo(activeTab);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(movingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // initially move after mount
  useEffect(() => {
    setTimeout(() => moveUnderlineTo(activeTab), 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div >

      <div className="controlsGroup_tabs" ref={containerRef} role="tablist" aria-label="Credit tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            ref={(el) => (buttonRefs.current[t.key] = el)}
            className={`tou_button ${activeTab === t.key ? "activeButton" : ""}`}
            onClick={() => setActiveTab(t.key)}
            type="button"
            role="tab"
            aria-pressed={activeTab === t.key}
          >
            {t.label}
          </button>
        ))}

        <div ref={underlineRef} className="underline" aria-hidden="true" />
      </div>

      <div className="content-container">
        {renderContent()}
      </div>
    </div>
  );
};







const Credit = () => {

  const [activePage, setActivePage] = useState("tokenCredit");



  const [isTokenValueActive, setIsTokenValueActive] = useState(true); // State to manage which section is active
  const [TokenValuesData, setTokenValuesData] = useState({

    currentCreditAmount: 0,
    creditType: "prepaid",
    priority: 0,
    limit: 0,
    creditConfiguration: "",
    presetCreditAmount: 0,
    creditAvailableThreshold: 0,
    period: "",
  });

  // Handle changes in input fields
  const handleChangeTokenCredit = (e) => {
    const { name, value } = e.target;
    setTokenValuesData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };



  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);



  const tokenValueHandleSubmit1 = (e) => {
    e.preventDefault();



    axios.post(`${BASE_URL}/api/token-credit/`, [{
      device_id: deviceId,  // This matches the backend expected field
      current_credit_amount: TokenValuesData.currentCreditAmount,
      credit_type: TokenValuesData.creditType,
      priority: TokenValuesData.priority,
      limit: TokenValuesData.limit,
      credit_configuration: TokenValuesData.creditConfiguration,
      preset_credit_amount: TokenValuesData.presetCreditAmount,
      credit_available_threshold: TokenValuesData.creditAvailableThreshold,
      period: TokenValuesData.period,
    }])
      .then(response => {
        alert("Token Credit Updated Successfully!");
      })
      .catch(error => {
        console.error("Error updating token credit:", error);
      });
  };

  //***********33333333333333 */
  ////////////****** */
  const tokenValueHandleSubmit = (e) => {
    e.preventDefault();

    ////////////****** */


    const isEmpty = (val) =>
      val === "" || val === null || val === undefined;

    const missingFields = [];

    if (isEmpty(TokenValuesData.currentCreditAmount))
      missingFields.push("current credit amount");

    if (isEmpty(TokenValuesData.creditType))
      missingFields.push("credit type");

    if (isEmpty(TokenValuesData.priority))
      missingFields.push("priority");

    if (isEmpty(TokenValuesData.limit))
      missingFields.push("limit");

    if (isEmpty(TokenValuesData.creditConfiguration))
      missingFields.push("credit configuration");

    if (isEmpty(TokenValuesData.presetCreditAmount))
      missingFields.push("preset credit amount");

    if (isEmpty(TokenValuesData.creditAvailableThreshold))
      missingFields.push("credit available threshold");

    if (isEmpty(TokenValuesData.period))
      missingFields.push("period");

    if (!deviceId) {
      missingFields.push("device id");
    }

    if (missingFields.length > 0) {
      alert(`Please fill the following details:\n\n${missingFields.join(",")}`);
      return;
    }

    ////////////****** */

    axios.post(`${BASE_URL}/api/token-credit/`, [{
      device_id: deviceId,  // This matches the backend expected field
      current_credit_amount: TokenValuesData.currentCreditAmount,
      credit_type: TokenValuesData.creditType,
      priority: TokenValuesData.priority,
      limit: TokenValuesData.limit,
      credit_configuration: TokenValuesData.creditConfiguration,
      preset_credit_amount: TokenValuesData.presetCreditAmount,
      credit_available_threshold: TokenValuesData.creditAvailableThreshold,
      period: TokenValuesData.period,
    }])
      .then(response => {
        alert("Token Credit Updated Successfully!");
      })
      .catch(error => {
        console.error("Error updating token credit:", error);
      });
  };




  // Function to fetch token credit data
  const fetchTokenCreditData = async (deviceId) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/token-credit/${deviceId}/`);
      // Assuming the response is an array, we'll pick the first item from it
      const tokenCredit = response.data[0];

      setTokenValuesData({
        currentCreditAmount: tokenCredit.current_credit_amount || '',
        creditType: tokenCredit.credit_type || '',
        priority: tokenCredit.priority || '',
        limit: tokenCredit.limit || '',
        creditConfiguration: tokenCredit.credit_configuration || '',
        presetCreditAmount: tokenCredit.preset_credit_amount || '',
        creditAvailableThreshold: tokenCredit.credit_available_threshold || '',
        period: tokenCredit.period || '',
      });
    } catch (error) {
      console.error("Error fetching token credit data:", error);
    }
  };

  useEffect(() => {
    // Call the fetch function with the deviceId
    fetchTokenCreditData(deviceId);
    fetchEmergencyCreditData(deviceId)
  }, []);



  const [amount, setAmount] = useState("");
  const [presetAmount, setPresetAmount] = useState("");
  const [invokeCredit, setInvokeCredit] = useState(false);


  const handleTokenCreditAction = (e, action, amountValue = null) => {
    e.preventDefault();

    if (action === "invoke-credit") {
      if (!invokeCredit) {
        alert("Please check the 'Invoke Credit' checkbox before submitting.");
        return;
      }
    }


    // API Endpoint
    const url = `${BASE_URL}/api/token-credit/${action}/`;

    // Request Data
    const data = { device_id: deviceId };
    if (amountValue !== null) data.amount = amountValue;

    // Send Request
    axios
      .put(url, data)
      .then(() => alert(`Action '${action}' executed successfully!`))
      .catch((error) => console.error(`Error executing '${action}':`, error));
  };



  const tokenToggleSection = (section) => {
    setIsTokenValueActive(section === 'value');
  };







  const [emergencyCreditSetValue, setEmergencyCreditSetValue] = useState(true);

  // State for Value data
  const [emergencyValueData, setEmergencyValueData] = useState({

    currentCreditAmount: "",
    creditType: "",
    priority: "",
    warningThreshold1: "",
    limit: "",
    creditConfiguration: "",
    creditStatus: "",
    presetCreditAmount: "",
    creditAvailableThreshold: "",
    period: "",
  });

  // State for Method data
  const [emergencyMethodData, setEmergencyMethodData] = useState({
    updateAmount: "",
    setAmount: "",
    invokeCredit: "",
  });

  // Toggle between Value and Method sections
  const emergencyToggleSection = (section) => {
    setEmergencyCreditSetValue(section === "value");
  };

  // Handle input changes for Value section
  const handleEmergencyValueChange = (e) => {
    const { name, value } = e.target;
    setEmergencyValueData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle input changes for Method section
  const handleEmergencyMethodChange = (e) => {
    const { name, value } = e.target;
    setEmergencyMethodData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleEmergencyValueSubmit1 = async () => {
    try {
      const payload = [
        {
          device_id: deviceId,  // Ensure device_id is included
          current_credit_amount: emergencyValueData.currentCreditAmount,
          credit_type: emergencyValueData.creditType,
          priority: emergencyValueData.priority,
          warning_threshold_1: emergencyValueData.warningThreshold1,
          limit: emergencyValueData.limit,
          credit_configuration: emergencyValueData.creditConfiguration,
          credit_status: emergencyValueData.creditStatus,
          preset_credit_amount: emergencyValueData.presetCreditAmount,
          credit_available_threshold: emergencyValueData.creditAvailableThreshold,
          period: emergencyValueData.period
        }
      ];

      const response = await axios.post(
        `${BASE_URL}/api/emergency-credit`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Value data submitted successfully:", response.data);
    } catch (error) {
      console.error("Error submitting Value data:", error.response?.data || error.message);
    }
  };

  const handleEmergencyValueSubmit = async () => {

    /////////////*********44444444 */

    const isEmpty = (val) =>
      val === "" || val === null || val === undefined;

    const missingFields = [];

    if (isEmpty(emergencyValueData.currentCreditAmount))
      missingFields.push("current credit amount");

    if (isEmpty(emergencyValueData.creditType))
      missingFields.push("credit type");

    if (isEmpty(emergencyValueData.priority))
      missingFields.push("priority");

    if (isEmpty(emergencyValueData.warningThreshold1))
      missingFields.push("warning threshold 1");

    if (isEmpty(emergencyValueData.limit))
      missingFields.push("limit");

    if (isEmpty(emergencyValueData.creditConfiguration))
      missingFields.push("credit configuration");

    if (isEmpty(emergencyValueData.creditStatus))
      missingFields.push("credit status");

    if (isEmpty(emergencyValueData.presetCreditAmount))
      missingFields.push("preset credit amount");

    if (isEmpty(emergencyValueData.creditAvailableThreshold))
      missingFields.push("credit available threshold");

    if (isEmpty(emergencyValueData.period))
      missingFields.push("period");

    if (!deviceId)
      missingFields.push("device id");

    if (missingFields.length > 0) {
      alert(
        `Please fill the following details: ${missingFields.join(", ")}`
      );
      return;
    }

    /////////////*********44444444 */



    try {
      const payload = [
        {
          device_id: deviceId,  // Ensure device_id is included
          current_credit_amount: emergencyValueData.currentCreditAmount,
          credit_type: emergencyValueData.creditType,
          priority: emergencyValueData.priority,
          warning_threshold_1: emergencyValueData.warningThreshold1,
          limit: emergencyValueData.limit,
          credit_configuration: emergencyValueData.creditConfiguration,
          credit_status: emergencyValueData.creditStatus,
          preset_credit_amount: emergencyValueData.presetCreditAmount,
          credit_available_threshold: emergencyValueData.creditAvailableThreshold,
          period: emergencyValueData.period
        }
      ];

      const response = await axios.post(
        `${BASE_URL}/api/emergency-credit`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Value data submitted successfully:", response.data);
    } catch (error) {
      console.error("Error submitting Value data:", error.response?.data || error.message);
    }
  };



  const fetchEmergencyCreditData = async (deviceId) => {
    try {
      if (!deviceId) return; // Ensure deviceId is provided

      const response = await axios.get(`${BASE_URL}/api/emergency-credit/${deviceId}/`);
      const data = response.data[0]; // Assuming response is an array

      setEmergencyValueData({
        currentCreditAmount: data.current_credit_amount || "",
        creditType: data.credit_type || "",
        priority: data.priority?.toString() || "",
        warningThreshold1: data.warning_threshold_1 || "",
        limit: data.limit || "",
        creditConfiguration: data.credit_configuration || "",
        creditStatus: data.credit_status || "",
        presetCreditAmount: data.preset_credit_amount || "",
        creditAvailableThreshold: data.credit_available_threshold || "",
        period: data.period || "",
      });

      console.log("Emergency credit data fetched successfully:", data);
    } catch (error) {
      console.error("Error fetching emergency credit data:", error.response?.data || error.message);
    }
  };


  // Handle form submission
  const handleEmergencyMethodSubmit = (e, action) => {
    e.preventDefault();

    if (action === "invoke-credit" && !emergencyMethodData.invokeCredit) {
      alert("Please check the 'Invoke Credit' checkbox before submitting.");
      return;
    }

    // API Endpoint
    const url = `${BASE_URL}/api/emergency-credit/${action}/`;

    // Request Data
    const data = { device_id: deviceId };
    if (action === "update-amount") data.amount = emergencyMethodData.updateAmount;
    if (action === "set-amount") data.amount = emergencyMethodData.setAmount;

    console.log("data", data)


    // Send Request
    axios
      .put(url, data)
      .then(() => alert(`Action '${action}' executed successfully!`))
      .catch((error) => console.error(`Error executing '${action}':`, error));
  };


  const [monthlyRentData, setMonthlyRentData] = useState({
    value: "",
    presetCreditAmount: "",
    period: "",
  });

  // Handler to update state on input change
  const monthlyRentHandleInputChange = (e) => {
    const { name, value } = e.target;
    setMonthlyRentData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Submit form data to the API
  const monthlyRentHandleSubmit1 = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/monthly-rent-credit`, monthlyRentData);
      console.log("Data submitted successfully:", response.data);
      alert("Monthly Rent Credit data submitted successfully!");
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Failed to submit Monthly Rent Credit data.");
    }
  };


  const monthlyRentHandleSubmit = async () => {
    const isEmpty = (val) =>
      val === "" || val === null || val === undefined;

    const missingFields = [];

    if (isEmpty(monthlyRentData.value))
      missingFields.push("value");

    if (isEmpty(monthlyRentData.period))
      missingFields.push("period");

    if (isEmpty(monthlyRentData.presetCreditAmount))
      missingFields.push("presetCreditAmount");

    if (!deviceId)
      missingFields.push("device id");

    if (missingFields.length > 0) {
      alert(`Please fill the following details: ${missingFields.join(", ")}`);
      return;
    }

    try {
      const payload = {
        device_id: deviceId,
        value: monthlyRentData.value,
        presetCreditAmount: monthlyRentData.presetCreditAmount || "",
        period: monthlyRentData.period,
      };

      const response = await axios.post(
        `${BASE_URL}/api/monthly-rent-credit/`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Monthly Rent Credit data submitted successfully:", response.data);
      alert(response.data.message || "Monthly Rent Credit data submitted successfully!");
    } catch (error) {
      console.error(
        "Error submitting Monthly Rent Credit data:",
        error.response?.data || error.message
      );
      alert("Failed to submit Monthly Rent Credit data.");
    }
  };






  const pages = [
    { key: "tokenCredit", label: "Token Credit" },
    { key: "emergencyCredit", label: "Emergency Credit" },
    { key: "monthlyRentCredit", label: "Monthly Rent Credit" },
  ];

  const containerRef = useRef(null);
  const buttonRefs = useRef({});
  const underlineRef = useRef(null);
  const movingTimeout = useRef(null);

  const moveUnderlineTo = (key) => {
    const btn = buttonRefs.current[key];
    const container = containerRef.current;
    const u = underlineRef.current;
    if (!btn || !container || !u) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const left = btnRect.left - containerRect.left;
    const width = btnRect.width;

    u.style.transform = `translateX(${left}px)`;
    u.style.width = `${Math.max(36, width)}px`;

    u.classList.add("moving");
    clearTimeout(movingTimeout.current);
    movingTimeout.current = setTimeout(() => u.classList.remove("moving"), 520);
  };

  useEffect(() => {
    // initial position + move on activePage change
    setTimeout(() => moveUnderlineTo(activePage), 20);

    const onResize = () => moveUnderlineTo(activePage);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(movingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);
  // Function to toggle between different credit types
  const handlePageChange = (page) => {
    setActivePage(page);
  };

  // Function to render the different forms based on the activePage
  const renderForm = () => {
    switch (activePage) {
      case "tokenCredit":
        return (


          <div>


            <div>
              <button type="button" onClick={() => tokenToggleSection('value')}>
                Value
              </button>
              <button type="button" onClick={() => tokenToggleSection('method')}>
                Method
              </button>
            </div>

            {isTokenValueActive ? (
              <div>


                <form onSubmit={tokenValueHandleSubmit}>

                  <div className="security-form">
                    <label>
                      <span>Current Credit Amount:</span>
                      <input
                        type="number"
                        name="currentCreditAmount"
                        value={TokenValuesData.currentCreditAmount}
                        onChange={handleChangeTokenCredit}
                      />
                    </label>
                  </div>

                  <div className="security-form">
                    <label>
                      <span>Credit Type:</span>
                      <select
                        name="creditType"
                        value={TokenValuesData.creditType}
                        onChange={handleChangeTokenCredit}
                      >
                        <option value="prepaid">Prepaid</option>
                        <option value="postpaid">Postpaid</option>
                      </select>
                    </label>
                  </div>

                  <div className="security-form">
                    <label>
                      <span>Priority:</span>
                      <input
                        type="number"
                        name="priority"
                        value={TokenValuesData.priority}
                        onChange={handleChangeTokenCredit}
                      />
                    </label>
                  </div>

                  <div className="security-form">
                    <label>
                      <span>Limit:</span>
                      <input
                        type="number"
                        name="limit"
                        value={TokenValuesData.limit}
                        onChange={handleChangeTokenCredit}
                      />
                    </label>
                  </div>

                  <div className="security-form">
                    <label>
                      <span>Credit Configuration:</span>
                      <textarea
                        name="creditConfiguration"
                        value={TokenValuesData.creditConfiguration}
                        onChange={handleChangeTokenCredit}
                      />
                    </label>
                  </div>

                  <div className="security-form">
                    <label>
                      <span>Preset Credit Amount:</span>
                      <input
                        type="number"
                        name="presetCreditAmount"
                        value={TokenValuesData.presetCreditAmount}
                        onChange={handleChangeTokenCredit}
                      />
                    </label>
                  </div>

                  <div className="security-form">
                    <label>
                      <span>Credit Available Threshold:</span>
                      <input
                        type="number"
                        name="creditAvailableThreshold"
                        value={TokenValuesData.creditAvailableThreshold}
                        onChange={handleChangeTokenCredit}
                      />
                    </label>
                  </div>

                  <div className="security-form">
                    <label>
                      <span>Period:</span>
                      <input
                        type="text"
                        name="period"
                        value={TokenValuesData.period}
                        onChange={handleChangeTokenCredit}
                      />
                    </label>
                  </div>

                  <button style={{ marginLeft: "42%" }} className='scheduler-add-button' type="submit">Save </button>
                </form>
              </div>
            ) : (
              <div>


                {/* Update Amount */}
                <form onSubmit={(e) => handleTokenCreditAction(e, "update-amount", amount)}>

                  <div className="security-form">
                    <label>
                      <span>Update Amount:</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        required
                      />
                    </label>
                  </div>

                  <button style={{ marginLeft: "42%" }} className='scheduler-add-button' type="submit">Update Amount</button>
                </form>

                {/* Set Amount */}
                <form onSubmit={(e) => handleTokenCreditAction(e, "set-amount", presetAmount)}>

                  <div className="security-form">
                    <label>
                      <span>Set Amount:</span>
                      <input
                        type="number"
                        value={presetAmount}
                        onChange={(e) => setPresetAmount(e.target.value)}
                        placeholder="Enter preset amount"
                        required
                      />
                    </label>
                  </div>

                  <button style={{ marginLeft: "42%" }} className='scheduler-add-button' type="submit">Set Amount</button>
                </form>

                {/* Invoke Credit */}
                <div className="security-form">
                  <label>
                    <span>Invoke Credit:</span>
                    <input
                      type="checkbox"
                      checked={invokeCredit}
                      onChange={(e) => {
                        setInvokeCredit(e.target.checked);
                        handleTokenCreditAction(e, "invoke-credit");
                      }}
                    />
                  </label>
                </div>

              </div>
            )}
          </div>







        );












      case "emergencyCredit":

        return (
          <div>


            <div>
              <button type="button" onClick={() => emergencyToggleSection("value")}>
                Value
              </button>
              <button type="button" onClick={() => emergencyToggleSection("method")}>
                Method
              </button>
            </div>

            {emergencyCreditSetValue ? (
              <div>
                {/* Value Section */}
                <div className="security-form">
                  <label>
                    <span>Current credit amount:</span>
                    <input
                      type="text"
                      name="currentCreditAmount"
                      value={emergencyValueData.currentCreditAmount}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <label>
                    <span>Credit type:</span>
                    <input
                      type="text"
                      name="creditType"
                      value={emergencyValueData.creditType}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <label>
                    <span>Priority:</span>
                    <input
                      type="text"
                      name="priority"
                      value={emergencyValueData.priority}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <label>
                    <span>Warning threshold 1:</span>
                    <input
                      type="text"
                      name="warningThreshold1"
                      value={emergencyValueData.warningThreshold1}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <label>
                    <span>Limit:</span>
                    <input
                      type="text"
                      name="limit"
                      value={emergencyValueData.limit}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <label>
                    <span>Credit Configuration:</span>
                    <input
                      type="text"
                      name="creditConfiguration"
                      value={emergencyValueData.creditConfiguration}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <label>
                    <span>Credit Status:</span>
                    <input
                      type="text"
                      name="creditStatus"
                      value={emergencyValueData.creditStatus}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <label>
                    <span>Preset credit amount:</span>
                    <input
                      type="text"
                      name="presetCreditAmount"
                      value={emergencyValueData.presetCreditAmount}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <label>
                    <span>Credit available threshold:</span>
                    <input
                      type="text"
                      name="creditAvailableThreshold"
                      value={emergencyValueData.creditAvailableThreshold}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <label>
                    <span>Period:</span>
                    <input
                      type="text"
                      name="period"
                      value={emergencyValueData.period}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                </div>

                <div className="security-form">
                  <button type="button" onClick={handleEmergencyValueSubmit}>
                    Submit Value
                  </button>
                </div>
              </div>
            ) : (
              <div>


                {/* Update Amount Form */}
                <form onSubmit={(e) => handleEmergencyMethodSubmit(e, "update-amount")}>
                  <div className="security-form">
                    <label>
                      <span>Update Amount:</span>
                      <input
                        type="number"
                        name="updateAmount"
                        value={emergencyMethodData.updateAmount}
                        onChange={handleEmergencyMethodChange}
                        placeholder="Enter amount"
                        required
                      />
                    </label>
                  </div>

                  <div className="security-form">
                    <button style={{ marginLeft: "40%" }} className='scheduler-add-button' type="submit">Update Amount</button>
                  </div>
                </form>

                {/* Set Amount Form */}
                <form onSubmit={(e) => handleEmergencyMethodSubmit(e, "set-amount")}>
                  <div className="security-form">
                    <label>
                      <span>Set Amount:</span>
                      <input
                        type="number"
                        name="setAmount"
                        value={emergencyMethodData.setAmount}
                        onChange={handleEmergencyMethodChange}
                        placeholder="Enter preset amount"
                        required
                      />
                    </label>
                  </div>

                  <div className="security-form">
                    <button style={{ marginLeft: "40%" }} className='scheduler-add-button' type="submit">Set Amount</button>
                  </div>
                </form>

                {/* Invoke Credit */}
                <div className="security-form">
                  <label>
                    <span>Invoke Credit:</span>
                    <input
                      type="checkbox"
                      name="invokeCredit"
                      checked={emergencyMethodData.invokeCredit}
                      onChange={handleEmergencyMethodChange}
                    />
                  </label>

                  <div style={{ marginTop: 8 }}>
                    <button
                      style={{ marginLeft: "40%" }} className='scheduler-add-button'
                      type="button"
                      onClick={(e) => handleEmergencyMethodSubmit(e, "invoke-credit")}
                    >
                      Submit Invoke Credit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "monthlyRentCredit":
        return (

          <div>


            <div className="security-form">
              <label>
                <span>Value:</span>
                <input
                  type="text"
                  name="value"
                  value={monthlyRentData.value}
                  onChange={monthlyRentHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Preset credit amount:</span>
                <input
                  type="text"
                  name="presetCreditAmount"
                  value={monthlyRentData.presetCreditAmount}
                  onChange={monthlyRentHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Period:</span>
                <input
                  type="text"
                  name="period"
                  value={monthlyRentData.period}
                  onChange={monthlyRentHandleInputChange}
                />
              </label>
            </div>

            <div className="security-form">
              <button style={{ marginLeft: "40%" }} className='scheduler-add-button' type="button" onClick={monthlyRentHandleSubmit}>
                Submit
              </button>
            </div>
          </div>

        );
      default:
        return <div>Select a Credit Type</div>;
    }
  };

  return (
    <div>
      {/* Buttons to switch between credit configurations */}

      <div style={{ marginLeft: '2%' }}
        className="controlsGroup_tabs"
        ref={containerRef}
        role="tablist"
        aria-label="Page tabs"
      >
        {pages.map((p) => (
          <button
            key={p.key}
            ref={(el) => (buttonRefs.current[p.key] = el)}
            className={`tou_button ${activePage === p.key ? "activeButton" : ""}`}
            onClick={() => handlePageChange(p.key)}
            type="button"
            role="tab"
            aria-pressed={activePage === p.key}
          >
            {p.label}
          </button>
        ))}

        <div ref={underlineRef} className="underline" aria-hidden="true" />
      </div>


      {/* Render form based on activePage */}
      {renderForm()}
    </div>
  );
};







const CHARGE_VALUE_OPTIONS = [
  {
    index: 2,
    field: "total_amount_paid",
    label: "Total Amount Paid",
    type: "number",
  },

  {
    index: 3,
    field: "charge_type",
    label: "Charge Type",
    type: "text",
  },

  {
    index: 4,
    field: "priority",
    label: "Priority",
    type: "number",
  },

  // corrected index
  {
    index: 8,
    field: "period",
    label: "Period",
    type: "number",
  },

  {
    index: 9,
    field: "charge_configuration",
    label: "Charge Configuration",
    type: "text",
  },

  {
    index: 10,
    field: "last_collection_time",
    label: "Last Collection Time",
    type: "text",
  },

  {
    index: 11,
    field: "last_collection_amount",
    label: "Last Collection Amount",
    type: "number",
  },

  {
    index: 12,
    field: "total_amount_remaining",
    label: "Total Amount Remaining",
    type: "number",
  },

  {
    index: 13,
    field: "proportion",
    label: "Proportion",
    type: "number",
  },
];




const Charge1 = () => {

  const UNIT_CHARGE_TABLE_ROWS = Array.from({ length: 10 }, (_, i) => i + 1);


  const [currentPage, setCurrentPage] = useState("value");

  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );

  useEffect(() => {
    const storedId = localStorage.getItem("selectedDeviceId");
    setDeviceId(storedId);
  }, []);

  const [valueFormData, setValueFormData] = useState({
    device_id: deviceId,
    total_amount_paid: "",
    charge_type: "",
    priority: "",
    period: "",
    charge_configuration: [],
    last_collection_time: "",
    last_collection_amount: "",
    total_amount_remaining: "",
    proportion: "",
  });

  useEffect(() => {
    setValueFormData((prev) => ({
      ...prev,
      device_id: deviceId,
    }));
  }, [deviceId]);


  // Change these to your actual meter OBIS if needed
  const UNIT_CHARGE_ACTIVE_OBIS_CODE = "0.0.19.20.0.255";
  const UNIT_CHARGE_PASSIVE_OBIS_CODE = "0.0.19.20.0.255";

  const createChargeTable = () =>
    UNIT_CHARGE_TABLE_ROWS.map((step) => ({
      step: `Step ${step}`,
      tariff1: "",
      tariff2: "",
      tariff3: "",
      tariff4: "",
    }));



  const createUnitChargeState = () => ({
    selected: false,
    activationTimeSelected: false,
    commodityScale: "",
    priceScale: "",
    classId: "",
    logicalName: "",
    attributeId: "",
    unitChargeActivationTime: "",
    chargeTable: createChargeTable(),
  });

  const [unitChargeActiveData, setUnitChargeActiveData] = useState(
    createUnitChargeState()
  );
  const [unitChargePassiveData, setUnitChargePassiveData] = useState(
    createUnitChargeState()
  );

  const getUnitChargeState = (mode) =>
    mode === "active" ? unitChargeActiveData : unitChargePassiveData;

  const setUnitChargeState = (mode, updater) => {
    if (mode === "active") {
      setUnitChargeActiveData(updater);
    } else {
      setUnitChargePassiveData(updater);
    }
  };

  const handleUnitChargeFieldChange = (mode, field, value) => {
    setUnitChargeState(mode, (prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUnitChargeTableChange = (mode, rowIndex, field, value) => {
    setUnitChargeState(mode, (prev) => {
      const nextTable = [...prev.chargeTable];
      nextTable[rowIndex] = {
        ...nextTable[rowIndex],
        [field]: value,
      };
      return {
        ...prev,
        chargeTable: nextTable,
      };
    });
  };

  const normalizeUnitChargeTable = (rawTable) => {
    const baseTable = createChargeTable();

    if (!Array.isArray(rawTable)) return baseTable;

    return baseTable.map((row, index) => {
      const src = rawTable[index] ?? {};

      if (Array.isArray(src)) {
        return {
          step: row.step,
          tariff1: src[0] ?? "",
          tariff2: src[1] ?? "",
          tariff3: src[2] ?? "",
          tariff4: src[3] ?? "",
        };
      }

      return {
        step: row.step,
        tariff1: src.tariff1 ?? src.value1 ?? src.charge_per_unit ?? "",
        tariff2: src.tariff2 ?? src.value2 ?? "",
        tariff3: src.tariff3 ?? src.value3 ?? "",
        tariff4: src.tariff4 ?? src.value4 ?? "",
      };
    });
  };

  const parseUnitChargeResponse = (rawData) => {
    const root = Array.isArray(rawData) ? rawData[0] : rawData;
    const payload = root?.value ?? root?.data ?? root?.result ?? root ?? {};

    const scaling =
      payload.charge_per_unit_scaling ??
      payload.scaling ??
      payload.chargePerUnitScaling ??
      {};

    const reference =
      payload.commodity_reference ??
      payload.reference ??
      payload.commodityReference ??
      {};

    const table =
      payload.charge_table ??
      payload.chargeTable ??
      payload.table ??
      [];

    return {
      selected: true,
      activationTimeSelected: true,
      commodityScale: scaling.commodity_scale ?? scaling.commodityScale ?? "",
      priceScale: scaling.price_scale ?? scaling.priceScale ?? "",
      classId: reference.class_id ?? reference.classId ?? "",
      logicalName: reference.logical_name ?? reference.logicalName ?? "",
      attributeId: reference.attribute_index ?? reference.attributeId ?? "",
      unitChargeActivationTime:
        payload.unit_charge_activation_time ??
        payload.unitChargeActivationTime ??
        "",
      chargeTable: normalizeUnitChargeTable(table),
    };
  };

  const handleUnitChargeRead = async (mode) => {
    const serial =
      localStorage.getItem("selectedSerialNumber") ||
      localStorage.getItem("selectedDeviceId") ||
      deviceId;

    if (!serial) {
      alert("No serial/device selected");
      return;
    }

    const current = getUnitChargeState(mode);

    if (!current.selected && !(mode === "passive" && current.activationTimeSelected)) {
      alert(`Please select ${mode === "active" ? "Unit charge active" : "Unit charge passive"}`);
      return;
    }

    const parameters = [];

    if (mode === "active" && current.selected) {
      parameters.push({
        obis_code: UNIT_CHARGE_ACTIVE_OBIS_CODE,
        attribute_index: "5",
      });
    }

    if (mode === "passive") {
      if (current.selected) {
        parameters.push({
          obis_code: UNIT_CHARGE_PASSIVE_OBIS_CODE,
          attribute_index: "6",
        });
      }

      if (current.activationTimeSelected) {
        parameters.push({
          obis_code: UNIT_CHARGE_PASSIVE_OBIS_CODE,
          attribute_index: "7",
        });
      }
    }

    const payload = {
      serial_number: serial,
      action: "read_obis",
      parameters,
    };

    try {
      setReadLoading(true);

      const response = await axios.post(`${BASE_URL}/api/getmeterinfo/`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response?.data?.data ?? response?.data ?? {};
      const nextState = parseUnitChargeResponse(data);

      setUnitChargeState(mode, (prev) => ({
        ...prev,
        ...nextState,
      }));
    } catch (error) {
      console.error("Unit charge read error:", error);
      alert("Failed to read unit charge data");
    } finally {
      setReadLoading(false);
    }
  };

  const renderUnitChargeSection = (mode) => {
    const isActive = mode === "active";
    const state = getUnitChargeState(mode);

    const setSelected = (checked) =>
      setUnitChargeState(mode, (prev) => ({
        ...prev,
        selected: checked,
      }));

    const setActivationSelected = (checked) =>
      setUnitChargeState(mode, (prev) => ({
        ...prev,
        activationTimeSelected: checked,
      }));

    return (
      <form onSubmit={(e) => handleSubmit(e, mode)}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={state.selected}
              onChange={(e) => setSelected(e.target.checked)}
            />
            {isActive ? "Unit charge active" : "Unit charge passive"}
            <span style={{ marginLeft: 8, color: "#666" }}>
              (Attribute Index: {isActive ? "5" : "6"})
            </span>
          </label>

          <button
            type="button"
            className="scheduler-add-button"
            onClick={() => handleUnitChargeRead(mode)}
            disabled={readLoading}
          >
            {readLoading ? "Reading..." : "Read"}
          </button>
        </div>

        <fieldset style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
          <legend style={{ padding: "0 8px" }}>Per unit scaling</legend>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Commodity scale</span>
              <input
                type="number"
                value={state.commodityScale}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "commodityScale", e.target.value)
                }
              />
            </label>
          </div>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Price scale</span>
              <input
                type="number"
                value={state.priceScale}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "priceScale", e.target.value)
                }
              />
            </label>
          </div>
        </fieldset>

        <fieldset style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
          <legend style={{ padding: "0 8px" }}>Commodity reference</legend>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Class ID</span>
              <input
                type="text"
                value={state.classId}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "classId", e.target.value)
                }
              />
            </label>
          </div>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Logical name</span>
              <input
                type="text"
                value={state.logicalName}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "logicalName", e.target.value)
                }
              />
            </label>
          </div>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Attribute ID</span>
              <input
                type="text"
                value={state.attributeId}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "attributeId", e.target.value)
                }
              />
            </label>
          </div>
        </fieldset>

        {!isActive && (
          <fieldset style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
            <legend style={{ padding: "0 8px" }}>Activation time</legend>

            <div className="security-form" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={state.activationTimeSelected}
                onChange={(e) => setActivationSelected(e.target.checked)}
              />
              <span style={{ minWidth: 120 }}>Unit charge activation time</span>
              <input
                type="text"
                value={state.unitChargeActivationTime}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "unitChargeActivationTime", e.target.value)
                }
              />
            </div>
          </fieldset>
        )}

        <fieldset style={{ border: "1px solid #ddd", padding: 12 }}>
          <legend style={{ padding: "0 8px" }}>Charge table</legend>

          <div style={{ maxWidth: "100%", overflowX: "auto" }}>
            <table className="tableTariff1" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th></th>
                  <th>Tariff 1</th>
                  <th>Tariff 2</th>
                  <th>Tariff 3</th>
                  <th>Tariff 4</th>
                </tr>
              </thead>
              <tbody>
                {state.chargeTable.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td style={{ whiteSpace: "nowrap", padding: "6px 8px" }}>
                      {row.step}
                    </td>

                    {["tariff1", "tariff2", "tariff3", "tariff4"].map((field) => (
                      <td key={field}>
                        <input
                          type="text"
                          value={row[field]}
                          onChange={(e) =>
                            handleUnitChargeTableChange(
                              mode,
                              rowIndex,
                              field,
                              e.target.value
                            )
                          }
                          style={{ width: "100%" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>
      </form>
    );
  };

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [readValues, setReadValues] = useState({});
  const [readLoading, setReadLoading] = useState(false);

  const [formData, setFormData] = useState({
    commodityScale: 0,
    priceScale: 0,
    classId: "",
    logicalName: "",
    attributeId: "",
    unitChargeActivationTime: "",
    tariffs: {
      tariff1: "",
      tariff2: "",
      tariff3: "",
      tariff4: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const tabs = [
    { key: "value", label: "Value" },
    { key: "unitChargeActive", label: "Unit Charge Active" },
    { key: "unitChargePassive", label: "Unit Charge Passive" },
  ];

  const containerRef = useRef(null);
  const buttonRefs = useRef({});
  const underlineRef = useRef(null);

  const moveUnderline = (key) => {
    const btn = buttonRefs.current[key];
    const container = containerRef.current;
    const underline = underlineRef.current;
    if (!btn || !container || !underline) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    underline.style.transform = `translateX(${btnRect.left - containerRect.left}px)`;
    underline.style.width = `${btnRect.width}px`;
  };

  useEffect(() => {
    const timer = setTimeout(() => moveUnderline(currentPage), 20);
    const handleResize = () => moveUnderline(currentPage);

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [currentPage]);

  const valueHandleChange = (name, value) => {
    setValueFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChargeConfigCheckboxChange = (e) => {
    const { value, checked } = e.target;

    setValueFormData((prev) => {
      const current = Array.isArray(prev.charge_configuration)
        ? prev.charge_configuration
        : [];

      return {
        ...prev,
        charge_configuration: checked
          ? Array.from(new Set([...current, value]))
          : current.filter((item) => item !== value),
      };
    });
  };

  const handleReadCheckbox = (index) => {
    const next = new Set(selectedItems);
    if (next.has(index)) next.delete(index);
    else next.add(index);

    setSelectedItems(next);
    setSelectAll(next.size === CHARGE_VALUE_OPTIONS.length);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    setSelectedItems(
      checked ? new Set(CHARGE_VALUE_OPTIONS.map((_, i) => i)) : new Set()
    );
  };

  const normalizeChargeConfig = (rawValue) => {
    if (Array.isArray(rawValue)) return rawValue.map(String).filter(Boolean);

    if (typeof rawValue === "string") {
      return rawValue
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }

    if (rawValue !== null && rawValue !== undefined && rawValue !== "") {
      return [String(rawValue)];
    }

    return [];
  };

  const handleReadValues1 = async () => {
    const serial =
      localStorage.getItem("selectedSerialNumber") ||
      localStorage.getItem("selectedDeviceId") ||
      deviceId;

    if (!serial) {
      alert("No serial/device selected");
      return;
    }

    if (selectedItems.size === 0) {
      alert("Please select at least one checkbox");
      return;
    }

    const parameters = Array.from(selectedItems).map((i) => {
      const item = CHARGE_VALUE_OPTIONS[i];
      return {
        obis_code: "0.0.19.20.0.255",
        attribute_index: String(item.index),
      };
    });

    const payload = {
      serial_number: serial,
      action: "read_obis",
      parameters,
    };

    try {
      setReadLoading(true);

      const response = await axios.post(`${BASE_URL}/api/getmeterinfo/`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response?.data?.data ?? response?.data ?? [];
      const nextReadValues = {};
      const nextFormValues = {};

      const processItem = (attrIndex, rawValue) => {
        const matched = CHARGE_VALUE_OPTIONS.find(
          (x) => String(x.index) === String(attrIndex)
        );
        if (!matched) return;

        if (matched.field === "charge_configuration") {
          const arrayValue = normalizeChargeConfig(rawValue);
          nextReadValues[matched.field] = arrayValue.join(", ");
          nextFormValues[matched.field] = arrayValue;
          return;
        }

        nextReadValues[matched.field] =
          rawValue === null || rawValue === undefined ? "" : String(rawValue);
        nextFormValues[matched.field] = rawValue;
      };

      if (Array.isArray(data)) {
        data.forEach((item) => {
          processItem(
            item.attribute_index ?? item.index ?? item.parameter_index,
            item.value ?? item.result ?? item.data ?? item.response
          );
        });
      } else if (data && typeof data === "object") {
        Object.keys(data).forEach((key) => {
          processItem(key, data[key]);
        });
      }

      setReadValues((prev) => ({
        ...prev,
        ...nextReadValues,
      }));

      setValueFormData((prev) => ({
        ...prev,
        ...nextFormValues,
        device_id: serial,
      }));
    } catch (error) {
      console.error("Read Error:", error);
      alert("Failed to read charge values");
    } finally {
      setReadLoading(false);
    }
  };












  const controllerRef = useRef(null);

  const handleReadValues = async () => {
    const serial =
      localStorage.getItem("selectedSerialNumber") ||
      localStorage.getItem("selectedDeviceId") ||
      deviceId;

    if (!serial) {
      alert("No serial/device selected");
      return;
    }

    if (selectedItems.size === 0) {
      alert("Please select at least one checkbox");
      return;
    }

    const parameters = Array.from(selectedItems).map((i) => {
      const item = CHARGE_VALUE_OPTIONS[i];
      return {
        obis_code: "0.0.19.20.0.255",
        attribute_index: String(item.index),
      };
    });

    const payload = {
      serial_number: serial,
      action: "read_obis",
      parameters,
    };

    try {
      setReadLoading(true);

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();

      const response = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      const nextReadValues = {};
      const nextFormValues = {};

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();

        for (const chunk of chunks) {
          if (!chunk.startsWith("data:")) continue;

          try {
            const msg = JSON.parse(chunk.replace(/^data:\s*/, ""));

            const matched = CHARGE_VALUE_OPTIONS.find(
              (x) => String(x.index) === String(msg.attribute_index)
            );

            if (!matched) continue;

            if (matched.field === "charge_configuration") {
              const arrayValue = normalizeChargeConfig(msg.value);
              nextReadValues[matched.field] = arrayValue.join(", ");
              nextFormValues[matched.field] = arrayValue;
            } else {
              const displayValue =
                msg.value === null || msg.value === undefined
                  ? ""
                  : typeof msg.value === "object"
                    ? JSON.stringify(msg.value)
                    : String(msg.value);

              nextReadValues[matched.field] = displayValue;
              nextFormValues[matched.field] = msg.value;
            }

            setReadValues((prev) => ({
              ...prev,
              ...nextReadValues,
            }));

            setValueFormData((prev) => ({
              ...prev,
              ...nextFormValues,
              device_id: serial,
            }));
          } catch (err) {
            console.error("Chunk parse error:", err);
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Read Error:", error);
        alert("Failed to read charge values");
      }
    } finally {
      setReadLoading(false);
    }
  };



















  const valueHandleSubmit = async (e) => {
    e.preventDefault();

    const formattedData = {
      ...valueFormData,
      total_amount_paid: parseFloat(valueFormData.total_amount_paid) || 0,
      period: parseFloat(valueFormData.period) || 0,
      last_collection_amount:
        parseFloat(valueFormData.last_collection_amount) || 0,
      total_amount_remaining:
        parseFloat(valueFormData.total_amount_remaining) || 0,
      proportion: parseFloat(valueFormData.proportion) || 0,
      charge_configuration: Array.isArray(valueFormData.charge_configuration)
        ? valueFormData.charge_configuration
        : [],
    };

    try {
      await axios.post(`${BASE_URL}/api/payment-charge-value/`, [formattedData]);
      alert("Data sent successfully!");
    } catch (error) {
      console.error("Error sending data:", error.response?.data || error);
      alert("Failed to submit charge value data");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = ["commodityScale", "priceScale"].includes(name)
      ? parseFloat(value) || 0
      : value;

    if (name.startsWith("tariff")) {
      setFormData((prev) => ({
        ...prev,
        tariffs: {
          ...prev.tariffs,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    }
  };

  const handleSubmit = async (e, unit_type) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formattedData = [
      {
        device: deviceId,
        unit_type: unit_type,
        commodity_scale: formData.commodityScale,
        price_scale: formData.priceScale,
        class_id: formData.classId,
        logical_name: formData.logicalName,
        attribute_id: formData.attributeId,
        unit_charge_activation_time: formData.unitChargeActivationTime,
        tariff_1: parseFloat(formData.tariffs.tariff1) || 0.0,
        tariff_2: parseFloat(formData.tariffs.tariff2) || 0.0,
        tariff_3: parseFloat(formData.tariffs.tariff3) || 0.0,
        tariff_4: parseFloat(formData.tariffs.tariff4) || 0.0,
      },
    ];

    try {
      const response = await axios.post(
        `${BASE_URL}/api/unit-charges/`,
        formattedData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 201) {
        setMessage("✅ Data successfully submitted!");
        setFormData({
          device: "",
          unitType: "active",
          commodityScale: 0,
          priceScale: 0,
          classId: "",
          logicalName: "",
          attributeId: "",
          unitChargeActivationTime: "",
          tariffs: {
            tariff1: "",
            tariff2: "",
            tariff3: "",
            tariff4: "",
          },
        });
      }
    } catch (error) {
      if (error.response) {
        setMessage(
          `❌ Error: ${error.response.data.detail || "Invalid data submission."}`
        );
      } else {
        setMessage("❌ Error submitting data. Please try again.");
      }
      console.error("Error:", error);
    }

    setLoading(false);
  };

  const getFieldValue = (field) =>
    readValues[field] ?? valueFormData[field] ?? "";

  const renderValueField = (field, label, type, idx) => {
    let displayValue = getFieldValue(field);

    // Add % for proportion field
    if (
      field === "proportion" &&
      displayValue !== "" &&
      displayValue !== null &&
      displayValue !== undefined
    ) {
      displayValue = `${displayValue}%`;
    }

    return (
      <div className="security-form" key={field}>
        <label >
          <input
            type="checkbox"
            checked={selectedItems.has(idx)}
            onChange={() => handleReadCheckbox(idx)}
          />
          <span>{label}:</span>
          <input
            type={type}
            value={displayValue}
            readOnly
            onChange={(e) => valueHandleChange(field, e.target.value)}
          />
        </label>


      </div>
    );
  };



  const getChargeTypeDisplay = (value) => {
    // Empty before meter read
    if (value === "" || value === null || value === undefined) {
      return "";
    }

    switch (Number(value)) {
      case 0:
        return "0 (Consumption Based Collection)";
      case 1:
        return "1 (Time Based Collection)";
      case 2:
        return "2 (Payment Event Based Collection)";
      default:
        return value;
    }
  };

  const renderChargeTypeField = () => {
    const rawValue = getFieldValue("charge_type");
    const displayValue = getChargeTypeDisplay(rawValue);

    return (
      <div className="security-form" key="charge_type">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(1)}
            onChange={() => handleReadCheckbox(1)}
          />
          <span>Charge Type:</span>

          <input
            type="text"
            value={displayValue}
            readOnly
          />
        </label>
      </div>
    );
  };







  const renderChargeConfigurationField = () => {
    let displayValue =
      readValues.charge_configuration ??
      (Array.isArray(valueFormData.charge_configuration)
        ? valueFormData.charge_configuration.join(", ")
        : "");

    displayValue = parseInt(displayValue)
    return (
      <div className="security-form">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(4)}
            onChange={() => handleReadCheckbox(4)}
          />
          <span>Charge Configuration:</span>

          <label>
            <input
              type="checkbox"
              value="continuous"
              checked={displayValue === 2 || displayValue === 3}

            />
            Continuous collection
          </label>

          <label>
            <input
              type="checkbox"
              value="percentage_based"
              checked={displayValue === 1 || displayValue === 3}
            />
            Percentage collection
          </label>


        </label>
      </div>




    );
  };


  const getPriorityDisplay = (value) => {
    // Empty before meter read
    if (value === "" || value === null || value === undefined) {
      return "";
    }

    switch (Number(value)) {
      case 1:
        return "1 (Highest Priority)";
      case 0:
        return "0 (Not Activated)";
      case 255:
        return "255 (Lowest Priority)";
      default:
        return value;
    }
  };

  const renderPriorityField = () => {
    const rawValue = getFieldValue("priority");
    const displayValue = getPriorityDisplay(rawValue);

    return (
      <div className="security-form" key="priority">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(2)}
            onChange={() => handleReadCheckbox(2)}
          />
          <span>Priority:</span>
          <input
            type="text"
            value={displayValue}
            readOnly
          />
        </label>
      </div>
    );
  };




  const formatPeriod = (seconds) => {
    // Empty before meter read
    if (seconds === "" || seconds === null || seconds === undefined) {
      return "";
    }

    const totalSeconds = Number(seconds);

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hrs}h:${mins}m:${secs}s`;
  };

  const renderPeriodField = () => {
    const rawValue = getFieldValue("period");
    const displayValue = formatPeriod(rawValue);

    return (
      <div className="security-form" key="period">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(3)}
            onChange={() => handleReadCheckbox(3)}
          />
          <span>Period:</span>

          <input
            type="text"
            value={displayValue}
            readOnly
          />
        </label>
      </div>
    );
  };





  const formatLastCollectionTime = (value) => {
    if (!value) return "";

    // If value comes as a JSON string
    let data = value;
    if (typeof value === "string") {
      try {
        data = JSON.parse(value);
      } catch (error) {
        return value;
      }
    }

    const datePart = data?.Date || "";
    const timePart = data?.Time || "";

    // Remove extra text like "(Deviation: Z)"
    const cleanTime = timePart.split(" ")[0];

    // Remove weekday text like "Saturday,"
    const cleanDate = datePart.includes(",")
      ? datePart.split(",")[1].trim()
      : datePart;

    if (!cleanDate && !cleanTime) return "";

    return `${cleanDate} ${cleanTime}`.trim();
  };

  const renderLastCollectionTimeField = () => {
    const rawValue = getFieldValue("last_collection_time");
    const displayValue = formatLastCollectionTime(rawValue);

    return (
      <div className="security-form" key="last_collection_time">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(4)}
            onChange={() => handleReadCheckbox(4)}
          />
          <span>Last Collection Time:</span>

          <input
            type="text"
            value={displayValue}
            readOnly
          />
        </label>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentPage) {
      case "value":
        return (
          <form onSubmit={valueHandleSubmit}>
            <div className="security-form">
              <button
                type="button"
                className="scheduler-add-button"
                onClick={handleReadValues}
                disabled={readLoading}
                style={{ marginLeft: "60%" }}
              >
                {readLoading ? "Reading..." : "Read"}
              </button>
            </div>

            <div className="security-form">
              <label>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                Select All
              </label>
            </div>

            {renderValueField("total_amount_paid", "Total Amount Paid", "number", 0)}

            {renderChargeTypeField()}
            {renderPriorityField()}
            {renderPeriodField()}
            {renderChargeConfigurationField()}
            {renderLastCollectionTimeField()}
            {renderValueField(
              "last_collection_amount",
              "Last Collection Amount",
              "number",
              6
            )}
            {renderValueField(
              "total_amount_remaining",
              "Total Amount Remaining",
              "number",
              7
            )}
            {renderValueField("proportion", "Proportion", "text", 8)}


          </form>
        );

      case "unitChargeActive":
        return renderUnitChargeSection("active");

      case "unitChargePassive":
        return renderUnitChargeSection("passive");





      default:
        return <p>Please select an option above.</p>;
    }
  };

  return (
    <div>
      <div className="controlsGroup_tabs" ref={containerRef}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => (buttonRefs.current[tab.key] = el)}
            className={`tou_button ${currentPage === tab.key ? "activeButton" : ""}`}
            onClick={() => setCurrentPage(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
        <div ref={underlineRef} className="underline" />
      </div>

      <div>{renderContent()}</div>
    </div>
  );
};






const Charge = () => {

  const UNIT_CHARGE_TABLE_ROWS = Array.from({ length: 10 }, (_, i) => i + 1);

  const unitChargeControllerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState("value");

  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );

  useEffect(() => {
    const storedId = localStorage.getItem("selectedDeviceId");
    setDeviceId(storedId);
  }, []);

  const [valueFormData, setValueFormData] = useState({
    device_id: deviceId,
    total_amount_paid: "",
    charge_type: "",
    priority: "",
    period: "",
    charge_configuration: [],
    last_collection_time: "",
    last_collection_amount: "",
    total_amount_remaining: "",
    proportion: "",
  });

  useEffect(() => {
    setValueFormData((prev) => ({
      ...prev,
      device_id: deviceId,
    }));
  }, [deviceId]);


  // Change these to your actual meter OBIS if needed
  const UNIT_CHARGE_ACTIVE_OBIS_CODE = "0.0.19.20.0.255";
  const UNIT_CHARGE_PASSIVE_OBIS_CODE = "0.0.19.20.0.255";

  const createChargeTable = () =>
    UNIT_CHARGE_TABLE_ROWS.map((step) => ({
      step: `Step ${step}`,
      tariff1: "",
      tariff2: "",
      tariff3: "",
      tariff4: "",
    }));






  const createUnitChargeState = () => ({
    selected: false,
    activationTimeSelected: false,
    commodityScale: "",
    priceScale: "",
    classId: "",
    logicalName: "",
    attributeId: "",
    unitChargeActivationTime: "",
    chargeTableRaw: "",
    chargeTable: createChargeTable(),
  });


  const [unitChargeActiveData, setUnitChargeActiveData] = useState(
    createUnitChargeState()
  );
  const [unitChargePassiveData, setUnitChargePassiveData] = useState(
    createUnitChargeState()
  );

  const getUnitChargeState = (mode) =>
    mode === "active" ? unitChargeActiveData : unitChargePassiveData;

  const setUnitChargeState = (mode, updater) => {
    if (mode === "active") {
      setUnitChargeActiveData(updater);
    } else {
      setUnitChargePassiveData(updater);
    }
  };

  const handleUnitChargeFieldChange = (mode, field, value) => {
    setUnitChargeState(mode, (prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUnitChargeTableChange = (mode, rowIndex, field, value) => {
    setUnitChargeState(mode, (prev) => {
      const nextTable = [...prev.chargeTable];
      nextTable[rowIndex] = {
        ...nextTable[rowIndex],
        [field]: value,
      };
      return {
        ...prev,
        chargeTable: nextTable,
      };
    });
  };

  const normalizeUnitChargeTable = (rawTable) => {
    const baseTable = createChargeTable();

    if (!Array.isArray(rawTable)) return baseTable;

    return baseTable.map((row, index) => {
      const src = rawTable[index] ?? {};

      if (Array.isArray(src)) {
        return {
          step: row.step,
          tariff1: src[0] ?? "",
          tariff2: src[1] ?? "",
          tariff3: src[2] ?? "",
          tariff4: src[3] ?? "",
        };
      }

      return {
        step: row.step,
        tariff1: src.tariff1 ?? src.value1 ?? src.charge_per_unit ?? "",
        tariff2: src.tariff2 ?? src.value2 ?? "",
        tariff3: src.tariff3 ?? src.value3 ?? "",
        tariff4: src.tariff4 ?? src.value4 ?? "",
      };
    });
  };

  const parseUnitChargeResponse = (rawData) => {
    const root = Array.isArray(rawData) ? rawData[0] : rawData;
    const payload = root?.value ?? root?.data ?? root?.result ?? root ?? {};

    const scaling =
      payload.charge_per_unit_scaling ??
      payload.scaling ??
      payload.chargePerUnitScaling ??
      {};

    const reference =
      payload.commodity_reference ??
      payload.reference ??
      payload.commodityReference ??
      {};

    const table =
      payload.charge_table ??
      payload.chargeTable ??
      payload.table ??
      [];

    return {
      selected: true,
      activationTimeSelected: true,
      commodityScale: scaling.commodity_scale ?? scaling.commodityScale ?? "",
      priceScale: scaling.price_scale ?? scaling.priceScale ?? "",
      classId: reference.class_id ?? reference.classId ?? "",
      logicalName: reference.logical_name ?? reference.logicalName ?? "",
      attributeId: reference.attribute_index ?? reference.attributeId ?? "",
      unitChargeActivationTime:
        payload.unit_charge_activation_time ??
        payload.unitChargeActivationTime ??
        "",
      chargeTable: normalizeUnitChargeTable(table),
    };
  };

  const handleUnitChargeRead1 = async (mode) => {
    const serial =
      localStorage.getItem("selectedSerialNumber") ||
      localStorage.getItem("selectedDeviceId") ||
      deviceId;

    if (!serial) {
      alert("No serial/device selected");
      return;
    }

    const current = getUnitChargeState(mode);

    if (!current.selected && !(mode === "passive" && current.activationTimeSelected)) {
      alert(`Please select ${mode === "active" ? "Unit charge active" : "Unit charge passive"}`);
      return;
    }

    const parameters = [];

    if (mode === "active" && current.selected) {
      parameters.push({
        obis_code: UNIT_CHARGE_ACTIVE_OBIS_CODE,
        attribute_index: "5",
      });
    }

    if (mode === "passive") {
      if (current.selected) {
        parameters.push({
          obis_code: UNIT_CHARGE_PASSIVE_OBIS_CODE,
          attribute_index: "6",
        });
      }

      if (current.activationTimeSelected) {
        parameters.push({
          obis_code: UNIT_CHARGE_PASSIVE_OBIS_CODE,
          attribute_index: "7",
        });
      }
    }

    const payload = {
      serial_number: serial,
      action: "read_obis",
      parameters,
    };

    try {
      setReadLoading(true);

      const response = await axios.post(`${BASE_URL}/api/getmeterinfo/`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response?.data?.data ?? response?.data ?? {};
      const nextState = parseUnitChargeResponse(data);

      setUnitChargeState(mode, (prev) => ({
        ...prev,
        ...nextState,
      }));
    } catch (error) {
      console.error("Unit charge read error:", error);
      alert("Failed to read unit charge data");
    } finally {
      setReadLoading(false);
    }
  };



  const [writeLoading, setWriteLoading] = useState(false);



  const renderUnitChargeSection = (mode) => {
    const isActive = mode === "active";
    const state = getUnitChargeState(mode);

    const setSelected = (checked) =>
      setUnitChargeState(mode, (prev) => ({
        ...prev,
        selected: checked,
      }));

    const setActivationSelected = (checked) =>
      setUnitChargeState(mode, (prev) => ({
        ...prev,
        activationTimeSelected: checked,
      }));





    const parseUnitChargeResponseItem = (item) => {
      const attr = String(
        item?.attribute_index ?? item?.attributeId ?? item?.attribute_index ?? ""
      );

      const value = item?.value ?? item?.data ?? item?.result ?? item;

      const next = { selected: true };

      const scaling =
        value?.charge_per_unit_scaling ??
        value?.scaling ??
        value?.chargePerUnitScaling ??
        null;

      if (scaling) {
        next.commodityScale =
          scaling.commodity_scale ?? scaling.commodityScale ?? "";
        next.priceScale = scaling.price_scale ?? scaling.priceScale ?? "";
      }

      const reference =
        value?.commodity_reference ??
        value?.reference ??
        value?.commodityReference ??
        null;

      if (reference) {
        next.classId = reference.class_id ?? reference.classId ?? "";
        next.logicalName = reference.logical_name ?? reference.logicalName ?? "";
        next.attributeId = reference.attribute_index ?? reference.attributeId ?? "";
      }

      if (attr === "6") {
        next.chargeTableRaw =
          typeof value === "string" ? value : JSON.stringify(value ?? "");

        const maybeTable = Array.isArray(value)
          ? value
          : value?.charge_table ?? value?.chargeTable ?? value?.table ?? null;

        if (maybeTable) {
          next.chargeTable = normalizeUnitChargeTable(maybeTable);
        }
      }

      if (attr === "7") {
        next.activationTimeSelected = true;
        next.unitChargeActivationTime = formatUnitChargeActivationTime(value);
      }

      const maybeTable =
        value?.charge_table ?? value?.chargeTable ?? value?.table ?? null;

      if (Array.isArray(maybeTable)) {
        next.chargeTable = normalizeUnitChargeTable(maybeTable);
      }

      return next;
    };

    const parseUnitChargeRaw = (raw) => {
      const text = String(raw ?? "");

      // Example:
      // "-120, -89None, 30[]"
      const parts = text.split(",");

      const commodityScale = parts[0]?.trim() ?? "";

      const secondPart = parts[1]?.trim() ?? "";
      const priceMatch = secondPart.match(/-?\d+/);
      const priceScale = priceMatch?.[0] ?? "";

      const logicalName = secondPart.replace(/-?\d+/, "").trim() || "None";

      const chargeTableRaw = parts.slice(2).join(",").trim();

      return {
        commodityScale,
        priceScale,
        logicalName,
        chargeTableRaw,
      };
    };

    const mergeUnitChargeResponse = (rawData) => {
      const items = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];

      return items.reduce((acc, item) => {
        const parsed = parseUnitChargeResponseItem(item);

        return {
          ...acc,
          ...parsed,
          chargeTable: parsed.chargeTable ?? acc.chargeTable,
        };
      }, {});
    };


    //*************** */ 

    const normalizeUnitChargeTable = (rows = []) => {
      if (!Array.isArray(rows)) return [];

      const result = [];

      for (let i = 0; i < rows.length; i += 4) {
        result.push({
          step: `Step ${Math.floor(i / 4) + 1}`,

          tariff1: rows[i]?.chargePerUnit ?? "",

          tariff2: rows[i + 1]?.chargePerUnit ?? "",

          tariff3: rows[i + 2]?.chargePerUnit ?? "",

          tariff4: rows[i + 3]?.chargePerUnit ?? "",
        });
      }

      return result;
    };

    const formatUnitChargeActivationTime = (value) => {
      if (value == null) return "";
      if (typeof value === "string") return value;
      if (typeof value !== "object") return String(value);

      const date = value.Date ?? value.date ?? "";
      const time = value.Time ?? value.time ?? "";
      const status =
        value["Clock Status"] ??
        value.clock_status ??
        value.clockStatus ??
        "";

      return [date, time, status !== "" ? `Clock Status: ${status}` : ""]
        .filter(Boolean)
        .join(" | ");
    };

    const applyUnitChargeResponse = (mode, msg) => {
      const attr = String(msg?.attribute_index ?? "");
      const value = msg?.value ?? {};

      setUnitChargeState(mode, (prev) => {
        const next = {
          ...prev,
          selected: true,
        };

        if (attr === "5" || attr === "6") {
          next.commodityScale =
            value?.chargePerUnitScaling?.commodityScale ?? "";

          next.priceScale =
            value?.chargePerUnitScaling?.priceScale ?? "";

          next.classId = value?.commodity?.classId ?? "";
          next.logicalName = value?.commodity?.logicalName ?? "";
          next.attributeId = value?.commodity?.attributeIndex ?? "";

          next.chargeTableRaw = JSON.stringify(
            value?.chargeTables ?? [],
            null,
            2
          );

          next.chargeTable = normalizeUnitChargeTable(
            value?.chargeTables ?? []
          );
        }

        if (mode === "passive" && attr === "7") {
          next.activationTimeSelected = true;
          next.unitChargeActivationTime =
            formatUnitChargeActivationTime(value);
        }

        return next;
      });
    };

    const handleUnitChargeRead = async (mode) => {
      const serial =
        localStorage.getItem("selectedSerialNumber") ||
        localStorage.getItem("selectedDeviceId") ||
        deviceId;

      if (!serial) {
        alert("No serial/device selected");
        return;
      }

      const current = getUnitChargeState(mode);

      if (
        !current.selected &&
        !(mode === "passive" && current.activationTimeSelected)
      ) {
        alert(
          `Please select ${mode === "active" ? "Unit charge active" : "Unit charge passive"
          }`
        );
        return;
      }

      const parameters = [];

      if (mode === "active" && current.selected) {
        parameters.push({
          obis_code: UNIT_CHARGE_ACTIVE_OBIS_CODE,
          attribute_index: "5",
        });
      }

      if (mode === "passive") {
        if (current.selected) {
          parameters.push({
            obis_code: UNIT_CHARGE_PASSIVE_OBIS_CODE,
            attribute_index: "6",
          });
        }

        if (current.activationTimeSelected) {
          parameters.push({
            obis_code: UNIT_CHARGE_PASSIVE_OBIS_CODE,
            attribute_index: "7",
          });
        }
      }

      const payload = {
        serial_number: serial,
        action: "read_obis",
        parameters,
      };

      try {
        setReadLoading(true);

        if (unitChargeControllerRef.current) {
          unitChargeControllerRef.current.abort();
        }

        unitChargeControllerRef.current = new AbortController();

        const response = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: unitChargeControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            if (!chunk.startsWith("data:")) continue;

            try {
              const msg = JSON.parse(chunk.replace(/^data:\s*/, ""));
              console.log("STREAM MSG", msg);

              applyUnitChargeResponse(mode, msg);
            } catch (err) {
              console.error("Unit charge chunk parse error:", err);
            }
          }
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Request was aborted");
        } else {
          console.error("Unit charge read error:", error);
          alert("Failed to read unit charge data");
        }
      } finally {
        setReadLoading(false);
      }
    };
    ////////////////////********** */


    const handleUnitChargeRead1 = async (mode) => {
      const serial =
        localStorage.getItem("selectedSerialNumber") ||
        localStorage.getItem("selectedDeviceId") ||
        deviceId;

      if (!serial) {
        alert("No serial/device selected");
        return;
      }

      const current = getUnitChargeState(mode);

      if (
        !current.selected &&
        !(mode === "passive" && current.activationTimeSelected)
      ) {
        alert(
          `Please select ${mode === "active"
            ? "Unit charge active"
            : "Unit charge passive"
          }`
        );
        return;
      }

      const parameters = [];

      if (mode === "active" && current.selected) {
        parameters.push({
          obis_code: UNIT_CHARGE_ACTIVE_OBIS_CODE,
          attribute_index: "5",
        });
      }

      if (mode === "passive") {
        if (current.selected) {
          parameters.push({
            obis_code: UNIT_CHARGE_PASSIVE_OBIS_CODE,
            attribute_index: "6",
          });
        }

        if (current.activationTimeSelected) {
          parameters.push({
            obis_code: UNIT_CHARGE_PASSIVE_OBIS_CODE,
            attribute_index: "7",
          });
        }
      }

      const payload = {
        serial_number: serial,
        action: "read_obis",
        parameters,
      };

      try {
        setReadLoading(true);

        if (unitChargeControllerRef.current) {
          unitChargeControllerRef.current.abort();
        }

        unitChargeControllerRef.current = new AbortController();

        const response = await fetch(
          `${BASE_URL}/api/getmeterinfo/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: unitChargeControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");

          buffer = chunks.pop();

          for (const chunk of chunks) {
            if (!chunk.startsWith("data:")) continue;

            try {
              const msg = JSON.parse(
                chunk.replace(/^data:\s*/, "")
              );

              console.log("STREAM MSG", msg);


              const attr = String(msg.attribute_index ?? "");


              setUnitChargeState(mode, (prev) => {
                const next = { ...prev };

                const attr = String(msg.attribute_index ?? "");
                const rawValue = msg.value;

                next.selected = true;

                if (mode === "active" && attr === "5") {
                  const parsed = parseUnitChargeRaw(rawValue);

                  next.commodityScale = parsed.commodityScale;
                  next.priceScale = parsed.priceScale;
                  next.logicalName = parsed.logicalName;
                  next.chargeTableRaw = parsed.chargeTableRaw;

                  next.chargeTable = createChargeTable().map((row, index) => ({
                    ...row,
                    tariff1: index === 0 ? parsed.chargeTableRaw : "",
                  }));
                }

                if (mode === "passive" && attr === "6") {
                  const parsed = parseUnitChargeRaw(rawValue);

                  next.commodityScale = parsed.commodityScale;
                  next.priceScale = parsed.priceScale;
                  next.logicalName = parsed.logicalName;
                  next.chargeTableRaw = parsed.chargeTableRaw;

                  next.chargeTable = createChargeTable().map((row, index) => ({
                    ...row,
                    tariff1: index === 0 ? parsed.chargeTableRaw : "",
                  }));
                }

                if (mode === "passive" && attr === "7") {
                  next.activationTimeSelected = true;

                  const date = rawValue?.Date ?? "";
                  const time = rawValue?.Time ?? "";
                  const status = rawValue?.["Clock Status"] ?? "";

                  next.unitChargeActivationTime =
                    [date, time, status ? `Clock Status: ${status}` : ""]
                      .filter(Boolean)
                      .join(" | ");
                }

                return next;
              });





            } catch (err) {
              console.error(
                "Unit charge chunk parse error:",
                err
              );
            }
          }
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Request was aborted");
        } else {
          console.error("Unit charge read error:", error);
          alert("Failed to read unit charge data");
        }
      } finally {
        setReadLoading(false);
      }
    };

    const buildUnitChargeChargeTables = (rows = []) => {
      if (!Array.isArray(rows)) return [];

      const chargeTables = [];

      rows.forEach((row, rowIndex) => {
        ["tariff1", "tariff2", "tariff3", "tariff4"].forEach(
          (field, tariffIndex) => {
            const raw = row?.[field];
            const text = String(raw ?? "").trim();

            if (text === "") return;

            const num = Number(text);

            chargeTables.push([
              rowIndex * 4 + tariffIndex + 1, // index
              Number.isNaN(num) ? 0 : num,    // chargePerUnit
            ]);
          }
        );
      });

      return chargeTables;
    };

    ///// update 
    const handleUnitChargeWrite = async (mode) => {
      // Only allow write for passive attribute 6
      if (mode !== "passive") {
        alert("Write is enabled only for Unit charge passive (Attribute 6).");
        return;
      }

      const current = getUnitChargeState(mode);



      if (!current.selected) {
        alert("Please select Unit charge passive");
        return;
      }

      if (
        current.commodityScale === "" ||
        current.priceScale === "" ||
        current.classId === "" ||
        !current.logicalName ||
        current.attributeIndex === ""
      ) {
        alert("Please fill all the required values.");
        return;
      }
      const serial =
        localStorage.getItem("selectedSerialNumber") ||
        localStorage.getItem("selectedDeviceId") ||
        deviceId;

      if (!serial) {
        alert("No serial/device selected");
        return;
      }





      const payload = {
        serial_number: serial,
        action: "write_obis",
        parameters: [
          {
            obis_code: UNIT_CHARGE_PASSIVE_OBIS_CODE,
            attribute_index: "6",
            value: [
              [
                Number(current.commodityScale),
                Number(current.priceScale),
              ],

              [
                Number(current.classId),
                current.logicalName
                  .split(".")
                  .map((item) => Number(item)),
                Number(current.attributeIndex || 2),
              ],

              buildUnitChargeChargeTables(current.chargeTable),
            ],
          },
        ],
      };

      try {
        setWriteLoading(true);

        const response = await fetch(`${BASE_URL}/api/TimeSettingsAPIView/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("WRITE RESPONSE:", result);
        alert("Write request sent successfully");
      } catch (error) {
        console.error("Unit charge write error:", error);
        alert("Failed to write unit charge data");
      } finally {
        setWriteLoading(false);
      }
    };

    return (
      <form onSubmit={(e) => handleSubmit(e, mode)}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={state.selected}
              onChange={(e) => setSelected(e.target.checked)}
            />
            {isActive ? "Unit charge active" : "Unit charge passive"}
            <span style={{ marginLeft: 8, color: "#666" }}>
              (Attribute Index: {isActive ? "5" : "6"})
            </span>
          </label>

          <button
            type="button"
            className="scheduler-add-button"
            onClick={() => handleUnitChargeRead(mode)}
            disabled={readLoading}
          >
            {readLoading ? "Reading..." : "Read"}
          </button>


          {!isActive && (
            <button
              type="button"
              className="scheduler-add-button"
              onClick={() => handleUnitChargeWrite(mode)}
              disabled={writeLoading}
            >
              {writeLoading ? "Writing..." : "Write"}
            </button>
          )}
        </div>

        <fieldset style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
          <legend style={{ padding: "0 8px" }}>Per unit scaling</legend>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Commodity scale</span>
              <input
                type="number"
                value={state.commodityScale}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "commodityScale", e.target.value)
                }
              />
            </label>
          </div>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Price scale</span>
              <input
                type="number"
                value={state.priceScale}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "priceScale", e.target.value)
                }
              />
            </label>
          </div>
        </fieldset>

        <fieldset style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
          <legend style={{ padding: "0 8px" }}>Commodity reference</legend>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Class ID</span>
              <input
                type="text"
                value={state.classId}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "classId", e.target.value)
                }
              />
            </label>
          </div>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Logical name</span>
              <input
                type="text"
                value={state.logicalName}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "logicalName", e.target.value)
                }
              />
            </label>
          </div>

          <div className="security-form">
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ minWidth: 120 }}>Attribute ID</span>
              <input
                type="text"
                value={state.attributeId}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "attributeId", e.target.value)
                }
              />
            </label>
          </div>
        </fieldset>

        {!isActive && (
          <fieldset style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
            <legend style={{ padding: "0 8px" }}>Activation time</legend>

            <div className="security-form" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={state.activationTimeSelected}
                onChange={(e) => setActivationSelected(e.target.checked)}
              />
              <span style={{ minWidth: 120 }}>Unit charge activation time</span>
              <input
                type="text"
                value={state.unitChargeActivationTime}
                onChange={(e) =>
                  handleUnitChargeFieldChange(mode, "unitChargeActivationTime", e.target.value)
                }
              />
            </div>
          </fieldset>
        )}





        <table className="tableTariff1">
          <thead>
            <tr>
              <th>Step</th>
              <th>Tariff 1</th>
              <th>Tariff 2</th>
              <th>Tariff 3</th>
              <th>Tariff 4</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(state.chargeTable) ? state.chargeTable : []).map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td style={{ width: "180px" }} >{row.step}</td>
                {["tariff1", "tariff2", "tariff3", "tariff4"].map((field) => (
                  <td style={{ width: "180px" }} key={field}>
                    <input

                      style={{
                        width: "100%",
                        minWidth: "160px",
                        padding: "6px 10px",
                        boxSizing: "border-box",
                      }}

                      type="text"
                      value={row[field]}
                      onChange={(e) =>
                        handleUnitChargeTableChange(mode, rowIndex, field, e.target.value)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

      </form>
    );
  };





















  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [readValues, setReadValues] = useState({});
  const [readLoading, setReadLoading] = useState(false);

  const [formData, setFormData] = useState({
    commodityScale: 0,
    priceScale: 0,
    classId: "",
    logicalName: "",
    attributeId: "",
    unitChargeActivationTime: "",
    tariffs: {
      tariff1: "",
      tariff2: "",
      tariff3: "",
      tariff4: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const tabs = [
    { key: "value", label: "Value" },
    { key: "unitChargeActive", label: "Unit Charge Active" },
    { key: "unitChargePassive", label: "Unit Charge Passive" },
  ];

  const containerRef = useRef(null);
  const buttonRefs = useRef({});
  const underlineRef = useRef(null);

  const moveUnderline = (key) => {
    const btn = buttonRefs.current[key];
    const container = containerRef.current;
    const underline = underlineRef.current;
    if (!btn || !container || !underline) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    underline.style.transform = `translateX(${btnRect.left - containerRect.left}px)`;
    underline.style.width = `${btnRect.width}px`;
  };

  useEffect(() => {
    const timer = setTimeout(() => moveUnderline(currentPage), 20);
    const handleResize = () => moveUnderline(currentPage);

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [currentPage]);

  const valueHandleChange = (name, value) => {
    setValueFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChargeConfigCheckboxChange = (e) => {
    const { value, checked } = e.target;

    setValueFormData((prev) => {
      const current = Array.isArray(prev.charge_configuration)
        ? prev.charge_configuration
        : [];

      return {
        ...prev,
        charge_configuration: checked
          ? Array.from(new Set([...current, value]))
          : current.filter((item) => item !== value),
      };
    });
  };

  const handleReadCheckbox = (index) => {
    const next = new Set(selectedItems);
    if (next.has(index)) next.delete(index);
    else next.add(index);

    setSelectedItems(next);
    setSelectAll(next.size === CHARGE_VALUE_OPTIONS.length);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    setSelectedItems(
      checked ? new Set(CHARGE_VALUE_OPTIONS.map((_, i) => i)) : new Set()
    );
  };

  const normalizeChargeConfig = (rawValue) => {
    if (Array.isArray(rawValue)) return rawValue.map(String).filter(Boolean);

    if (typeof rawValue === "string") {
      return rawValue
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }

    if (rawValue !== null && rawValue !== undefined && rawValue !== "") {
      return [String(rawValue)];
    }

    return [];
  };














  const controllerRef = useRef(null);

  const handleReadValues = async () => {
    const serial =
      localStorage.getItem("selectedSerialNumber") ||
      localStorage.getItem("selectedDeviceId") ||
      deviceId;

    if (!serial) {
      alert("No serial/device selected");
      return;
    }

    if (selectedItems.size === 0) {
      alert("Please select at least one checkbox");
      return;
    }

    const parameters = Array.from(selectedItems).map((i) => {
      const item = CHARGE_VALUE_OPTIONS[i];
      return {
        obis_code: "0.0.19.20.0.255",
        attribute_index: String(item.index),
      };
    });

    const payload = {
      serial_number: serial,
      action: "read_obis",
      parameters,
    };

    try {
      setReadLoading(true);

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();

      const response = await fetch(`${BASE_URL}/api/getmeterinfo/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      const nextReadValues = {};
      const nextFormValues = {};

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();

        for (const chunk of chunks) {
          if (!chunk.startsWith("data:")) continue;

          try {
            const msg = JSON.parse(chunk.replace(/^data:\s*/, ""));

            const matched = CHARGE_VALUE_OPTIONS.find(
              (x) => String(x.index) === String(msg.attribute_index)
            );

            if (!matched) continue;

            if (matched.field === "charge_configuration") {
              const arrayValue = normalizeChargeConfig(msg.value);
              nextReadValues[matched.field] = arrayValue.join(", ");
              nextFormValues[matched.field] = arrayValue;
            } else {
              const displayValue =
                msg.value === null || msg.value === undefined
                  ? ""
                  : typeof msg.value === "object"
                    ? JSON.stringify(msg.value)
                    : String(msg.value);

              nextReadValues[matched.field] = displayValue;
              nextFormValues[matched.field] = msg.value;
            }

            setReadValues((prev) => ({
              ...prev,
              ...nextReadValues,
            }));

            setValueFormData((prev) => ({
              ...prev,
              ...nextFormValues,
              device_id: serial,
            }));
          } catch (err) {
            console.error("Chunk parse error:", err);
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Read Error:", error);
        alert("Failed to read charge values");
      }
    } finally {
      setReadLoading(false);
    }
  };



















  const valueHandleSubmit = async (e) => {
    e.preventDefault();

    const formattedData = {
      ...valueFormData,
      total_amount_paid: parseFloat(valueFormData.total_amount_paid) || 0,
      period: parseFloat(valueFormData.period) || 0,
      last_collection_amount:
        parseFloat(valueFormData.last_collection_amount) || 0,
      total_amount_remaining:
        parseFloat(valueFormData.total_amount_remaining) || 0,
      proportion: parseFloat(valueFormData.proportion) || 0,
      charge_configuration: Array.isArray(valueFormData.charge_configuration)
        ? valueFormData.charge_configuration
        : [],
    };

    try {
      await axios.post(`${BASE_URL}/api/payment-charge-value/`, [formattedData]);
      alert("Data sent successfully!");
    } catch (error) {
      console.error("Error sending data:", error.response?.data || error);
      alert("Failed to submit charge value data");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = ["commodityScale", "priceScale"].includes(name)
      ? parseFloat(value) || 0
      : value;

    if (name.startsWith("tariff")) {
      setFormData((prev) => ({
        ...prev,
        tariffs: {
          ...prev.tariffs,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    }
  };

  const handleSubmit = async (e, unit_type) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formattedData = [
      {
        device: deviceId,
        unit_type: unit_type,
        commodity_scale: formData.commodityScale,
        price_scale: formData.priceScale,
        class_id: formData.classId,
        logical_name: formData.logicalName,
        attribute_id: formData.attributeId,
        unit_charge_activation_time: formData.unitChargeActivationTime,
        tariff_1: parseFloat(formData.tariffs.tariff1) || 0.0,
        tariff_2: parseFloat(formData.tariffs.tariff2) || 0.0,
        tariff_3: parseFloat(formData.tariffs.tariff3) || 0.0,
        tariff_4: parseFloat(formData.tariffs.tariff4) || 0.0,
      },
    ];

    try {
      const response = await axios.post(
        `${BASE_URL}/api/unit-charges/`,
        formattedData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 201) {
        setMessage("✅ Data successfully submitted!");
        setFormData({
          device: "",
          unitType: "active",
          commodityScale: 0,
          priceScale: 0,
          classId: "",
          logicalName: "",
          attributeId: "",
          unitChargeActivationTime: "",
          tariffs: {
            tariff1: "",
            tariff2: "",
            tariff3: "",
            tariff4: "",
          },
        });
      }
    } catch (error) {
      if (error.response) {
        setMessage(
          `❌ Error: ${error.response.data.detail || "Invalid data submission."}`
        );
      } else {
        setMessage("❌ Error submitting data. Please try again.");
      }
      console.error("Error:", error);
    }

    setLoading(false);
  };

  const getFieldValue = (field) =>
    readValues[field] ?? valueFormData[field] ?? "";

  const renderValueField = (field, label, type, idx) => {
    let displayValue = getFieldValue(field);

    // Add % for proportion field
    if (
      field === "proportion" &&
      displayValue !== "" &&
      displayValue !== null &&
      displayValue !== undefined
    ) {
      displayValue = `${displayValue}%`;
    }

    return (
      <div className="security-form" key={field}>
        <label >
          <input
            type="checkbox"
            checked={selectedItems.has(idx)}
            onChange={() => handleReadCheckbox(idx)}
          />
          <span>{label}:</span>
          <input
            type={type}
            value={displayValue}
            readOnly
            onChange={(e) => valueHandleChange(field, e.target.value)}
          />
        </label>


      </div>
    );
  };



  const getChargeTypeDisplay = (value) => {
    // Empty before meter read
    if (value === "" || value === null || value === undefined) {
      return "";
    }

    switch (Number(value)) {
      case 0:
        return "0 (Consumption Based Collection)";
      case 1:
        return "1 (Time Based Collection)";
      case 2:
        return "2 (Payment Event Based Collection)";
      default:
        return value;
    }
  };

  const renderChargeTypeField = () => {
    const rawValue = getFieldValue("charge_type");
    const displayValue = getChargeTypeDisplay(rawValue);

    return (
      <div className="security-form" key="charge_type">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(1)}
            onChange={() => handleReadCheckbox(1)}
          />
          <span>Charge Type:</span>

          <input
            type="text"
            value={displayValue}
            readOnly
          />
        </label>
      </div>
    );
  };







  const renderChargeConfigurationField = () => {
    let displayValue =
      readValues.charge_configuration ??
      (Array.isArray(valueFormData.charge_configuration)
        ? valueFormData.charge_configuration.join(", ")
        : "");

    displayValue = parseInt(displayValue)
    return (
      <div className="security-form">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(4)}
            onChange={() => handleReadCheckbox(4)}
          />
          <span>Charge Configuration:</span>

          <label>
            <input
              type="checkbox"
              value="continuous"
              checked={displayValue === 2 || displayValue === 3}

            />
            Continuous collection
          </label>

          <label>
            <input
              type="checkbox"
              value="percentage_based"
              checked={displayValue === 1 || displayValue === 3}
            />
            Percentage collection
          </label>


        </label>
      </div>




    );
  };


  const getPriorityDisplay = (value) => {
    // Empty before meter read
    if (value === "" || value === null || value === undefined) {
      return "";
    }

    switch (Number(value)) {
      case 1:
        return "1 (Highest Priority)";
      case 0:
        return "0 (Not Activated)";
      case 255:
        return "255 (Lowest Priority)";
      default:
        return value;
    }
  };

  const renderPriorityField = () => {
    const rawValue = getFieldValue("priority");
    const displayValue = getPriorityDisplay(rawValue);

    return (
      <div className="security-form" key="priority">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(2)}
            onChange={() => handleReadCheckbox(2)}
          />
          <span>Priority:</span>
          <input
            type="text"
            value={displayValue}
            readOnly
          />
        </label>
      </div>
    );
  };




  const formatPeriod = (seconds) => {
    // Empty before meter read
    if (seconds === "" || seconds === null || seconds === undefined) {
      return "";
    }

    const totalSeconds = Number(seconds);

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hrs}h:${mins}m:${secs}s`;
  };

  const renderPeriodField = () => {
    const rawValue = getFieldValue("period");
    const displayValue = formatPeriod(rawValue);

    return (
      <div className="security-form" key="period">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(3)}
            onChange={() => handleReadCheckbox(3)}
          />
          <span>Period:</span>

          <input
            type="text"
            value={displayValue}
            readOnly
          />
        </label>
      </div>
    );
  };





  const formatLastCollectionTime = (value) => {
    if (!value) return "";

    // If value comes as a JSON string
    let data = value;
    if (typeof value === "string") {
      try {
        data = JSON.parse(value);
      } catch (error) {
        return value;
      }
    }

    const datePart = data?.Date || "";
    const timePart = data?.Time || "";

    // Remove extra text like "(Deviation: Z)"
    const cleanTime = timePart.split(" ")[0];

    // Remove weekday text like "Saturday,"
    const cleanDate = datePart.includes(",")
      ? datePart.split(",")[1].trim()
      : datePart;

    if (!cleanDate && !cleanTime) return "";

    return `${cleanDate} ${cleanTime}`.trim();
  };

  const renderLastCollectionTimeField = () => {
    const rawValue = getFieldValue("last_collection_time");
    const displayValue = formatLastCollectionTime(rawValue);

    return (
      <div className="security-form" key="last_collection_time">
        <label>
          <input
            type="checkbox"
            checked={selectedItems.has(4)}
            onChange={() => handleReadCheckbox(4)}
          />
          <span>Last Collection Time:</span>

          <input
            type="text"
            value={displayValue}
            readOnly
          />
        </label>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentPage) {
      case "value":
        return (
          <form onSubmit={valueHandleSubmit}>
            <div className="security-form">
              <button
                type="button"
                className="scheduler-add-button"
                onClick={handleReadValues}
                disabled={readLoading}
                style={{ marginLeft: "60%" }}
              >
                {readLoading ? "Reading..." : "Read"}
              </button>
            </div>

            <div className="security-form">
              <label>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                Select All
              </label>
            </div>

            {renderValueField("total_amount_paid", "Total Amount Paid", "number", 0)}

            {renderChargeTypeField()}
            {renderPriorityField()}
            {renderPeriodField()}
            {renderChargeConfigurationField()}
            {renderLastCollectionTimeField()}
            {renderValueField(
              "last_collection_amount",
              "Last Collection Amount",
              "number",
              6
            )}
            {renderValueField(
              "total_amount_remaining",
              "Total Amount Remaining",
              "number",
              7
            )}
            {renderValueField("proportion", "Proportion", "text", 8)}


          </form>
        );

      case "unitChargeActive":
        return renderUnitChargeSection("active");

      case "unitChargePassive":
        return renderUnitChargeSection("passive");





      default:
        return <p>Please select an option above.</p>;
    }
  };

  return (
    <div>
      <div className="controlsGroup_tabs" ref={containerRef}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => (buttonRefs.current[tab.key] = el)}
            className={`tou_button ${currentPage === tab.key ? "activeButton" : ""}`}
            onClick={() => setCurrentPage(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
        <div ref={underlineRef} className="underline" />
      </div>

      <div>{renderContent()}</div>
    </div>
  );
};









const TokenGateway = () => {
  const initialFormData = {
    token: "",
    tokenTime: "",
    tokenDescription: [],
    tokenDeliveryMethod: "",

    statusCode: "",
    datavalue: "",
    enterMethod: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [showPopup, setShowPopup] = useState(false);
  const [newDescription, setNewDescription] = useState({ index: "", description: "" });


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    setNewDescription({ ...newDescription, [e.target.name]: e.target.value });
  };

  const addDescription = () => {
    setFormData({
      ...formData,
      tokenDescription: [...formData.tokenDescription, newDescription],
    });
    setShowPopup(false);
    setNewDescription({ index: "", description: "" });
  };


  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting Data:", formData);

    const formattedData = {
      device_id: deviceId,
      token: formData.token,
      token_time: formData.tokenTime,  // Converted to snake_case
      token_description: formData.tokenDescription,  // Converted to snake_case
      token_delivery_method: formData.tokenDeliveryMethod,  // Converted to snake_case
      status_code: formData.statusCode,  // Converted to snake_case
      data_value: formData.datavalue,  // Converted to snake_case
      enter_method: formData.enterMethod,  // Converted to snake_case
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/payment-token/`, formattedData);
      console.log("Response:", response.data);
      alert("Token data submitted successfully!");
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error submitting token data:", error);
      alert("Failed to submit token data.");
    }
  };


  return (
    <form onSubmit={handleSubmit}>

      <div className="security-form">
        <label>
          <span>Token:</span>
          <input
            type="text"
            name="token"
            value={formData.token}
            onChange={handleChange}
            className="input"
          />
        </label>
      </div>

      <div className="security-form">
        <label>
          <span>Token Time:</span>
          <input
            type="text"
            name="tokenTime"
            value={formData.tokenTime}
            onChange={handleChange}
            className="input"
          />
        </label>
      </div>

      <div className="security-form">
        <label>
          <span>Token Description:</span>
        </label>

        <div className="description-container">
          <table className="tableTariff1">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>Index</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {formData.tokenDescription.map((desc, index) => (
                <tr key={index}>
                  <td>{index}</td>
                  <td>{desc.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Add Token Description</h3>

            <div className="security-form">
              <label>
                <span>Index:</span>
                <input
                  type="text"
                  style={{ width: "60%" }}
                  value={newDescription.index}
                  onChange={handleDescriptionChange}
                  className="input"
                />
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Description:</span>
                <input
                  type="text"
                  name="description"
                  style={{ width: "60%" }}
                  value={newDescription.description}
                  onChange={handleDescriptionChange}
                  className="input"
                />
              </label>
            </div>

            <div className="security-form">
              <button type="button" onClick={addDescription} className="confirm-button">
                Add
              </button>

              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="security-form">
        <label>
          <span>Token Delivery Method:</span>
          <input
            type="text"
            name="tokenDeliveryMethod"
            value={formData.tokenDeliveryMethod}
            onChange={handleChange}
            className="input"
          />
        </label>
      </div>

      <h5> Token Status </h5>

      <div className="security-form">
        <label>
          <span>Status Code:</span>
          <input
            type="text"
            name="statusCode"
            value={formData.statusCode}
            onChange={handleChange}
            className="input"
          />
        </label>
      </div>

      <div className="security-form">
        <label>
          <span>Data Value:</span>
          <input
            type="text"
            name="datavalue"
            value={formData.datavalue}
            onChange={handleChange}
            className="input"
          />
        </label>
      </div>

      <div className="security-form">
        <label>
          <span>Enter Method:</span>
          <input
            type="text"
            name="enterMethod"
            value={formData.enterMethod}
            onChange={handleChange}
            className="input"
          />
        </label>
      </div>

      <div className="security-form">
        <button style={{ marginLeft: "42%" }} className='scheduler-add-button' type="submit" >Submit</button>
      </div>
    </form>
  );
};







const PaymentInfoTable1 = () => {
  const [selected, setSelected] = useState({});
  const [paymentData, setPaymentData] = useState(
    [
      { id: 1, name: "STS Ti", code: "1,0-68: 128.0.1.255", value: "", unit: "" },
      { id: 2, name: "STS KEN", code: "1,0-68: 128.0.2.255", value: "", unit: "" },
      { id: 3, name: "STS KRN", code: "1,0-68: 128.0.3.255", value: "", unit: "" },
      { id: 4, name: "STS KT", code: "1,0-68: 128.0.4.255", value: "", unit: "" },
      { id: 5, name: "STS SGC", code: "1,0-68: 128.0.8.255", value: "", unit: "" },
      { id: 6, name: "STS EA", code: "1,0-68: 128.0.11.255", value: "", unit: "" },
      { id: 7, name: "Manufacture TID", code: "1,0-68: 128.0.9.255", value: "", unit: "" },
      { id: 8, name: "Residual Credit", code: "3,0-0: 19.130.0.255", value: "", unit: "" },
      { id: 9, name: "Energy used", code: "3,1-0: 15.9.0.255", value: "", unit: "GHC" },
      { id: 10, name: "Currency used", code: "3,0-0: 19.133.0.255", value: "", unit: "KWh" },
      { id: 11, name: "Cumulative purchase credit", code: "3,1-65: 1.140.2.255", value: "", unit: "GHC" },
      { id: 12, name: "Cumulative consume Credit", code: "3,1-0: 96.51.5.255", value: "", unit: "GHC" },
      { id: 13, name: "Max Credit limit", code: "3,0-0: 19.50.1.255", value: "", unit: "GHC" },
      { id: 14, name: "Non-resident monthly rent price", code: "1,0-0: 19.14.12.255", value: "", unit: "" },
      { id: 15, name: "Monthly rent mode", code: "1,0-0: 96.14.13.255", value: "", unit: "" },
    ]);


  const toggleCheckbox = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };



  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/payment-information/${deviceId}/`); // Replace with your actual API endpoint
        const apiData = response.data; // Assuming API returns an array of objects with `code` and `value`

        // Update paymentData with fetched values
        const updatedPaymentData = paymentData.map((item) => {
          const matchingItem = apiData.find((apiItem) => apiItem.code === item.code);
          return matchingItem ? { ...item, value: matchingItem.value } : item;
        });

        setPaymentData(updatedPaymentData);
      } catch (error) {
        console.error("Error fetching payment data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4">


      <table className="tableTariff1">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Checked</th>
            <th className="border p-2">No</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Code</th>
            <th className="border p-2">Value</th>
            <th className="border p-2">Unit</th>
          </tr>
        </thead>
        <tbody>
          {paymentData.map((item) => (
            <tr key={item.id} className="text-center">
              <td className="border p-2">
                <input
                  type="checkbox"
                  checked={!!selected[item.id]}
                  onChange={() => toggleCheckbox(item.id)}
                />
              </td>
              <td className="border p-2">{item.id}</td>
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.code}</td>
              <td className="border p-2">
                {item.value}
              </td>
              <td className="border p-2">{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}





const PaymentInfoTable = () => {
  const [apiData, setApiData] = useState([]);

  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );

  const [rows, setRows] = useState([
    {
      checked: false,
      no: 1,
      name: "STS Ti",
      code: "0.68.128.0.1.255",
      codes: "{1,0-68:128.0.1.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
    {
      checked: false,
      no: 2,
      name: "STS KEN",
      code: "0.68.128.0.2.255",
      codes: "{1,0-68:128.0.2.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
    {
      checked: false,
      no: 3,
      name: "STS KRN",
      code: "0.68.128.0.3.255",
      codes: "{1,0-68:128.0.3.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
    {
      checked: false,
      no: 4,
      name: "STS KT",
      code: "0.68.128.0.4.255",
      codes: "{1,0-68:128.0.4.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
    {
      checked: false,
      no: 5,
      name: "STS SGC",
      code: "0.68.128.0.8.255",
      codes: "{1,0-68:128.0.8.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
    {
      checked: false,
      no: 6,
      name: "STS EA",
      code: "0.68.128.0.11.255",
      codes: "{1,0-68:128.0.11.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
    {
      checked: false,
      no: 7,
      name: "Manufacture TID",
      code: "0.68.128.0.9.255",
      codes: "{1,0-68:128.0.9.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
    {
      checked: false,
      no: 8,
      name: "Residual Credit",
      code: "0.0.19.130.0.255",
      codes: "{3,0-0:19.130.0.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
    {
      checked: false,
      no: 9,
      name: "Energy used",
      code: "1.0.15.9.0.255",
      codes: "{3,1-0:15.9.0.255}",
      attribute_index: 2,
      value: "",
      unit: "GHC",
    },
    {
      checked: false,
      no: 10,
      name: "Currency used",
      code: "0.0.19.133.0.255",
      codes: "{3,0-0:19.133.0.255}",
      attribute_index: 2,
      value: "",
      unit: "KWh",
    },
    {
      checked: false,
      no: 11,
      name: "Cumulative purchase credit",
      code: "1.65.1.140.2.255",
      codes: "{3,1-65:1.140.2.255}",
      attribute_index: 2,
      value: "",
      unit: "GHC",
    },
    {
      checked: false,
      no: 12,
      name: "Cumulative consume Credit",
      code: "1.0.96.51.5.255",
      codes: "{3,1-0:96.51.5.255}",
      attribute_index: 2,
      value: "",
      unit: "GHC",
    },
    {
      checked: false,
      no: 13,
      name: "Max Credit limit",
      code: "0.0.19.50.1.255",
      codes: "{3,0-0:19.50.1.255}",
      attribute_index: 2,
      value: "",
      unit: "GHC",
    },
    {
      checked: false,
      no: 14,
      name: "Non-resident monthly rent price",
      code: "0.0.96.14.12.255",
      codes: "{1,0-0:96.14.12.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
    {
      checked: false,
      no: 15,
      name: "Monthly rent mode",
      code: "0.0.96.14.13.255",
      codes: "{1,0-0:96.14.13.255}",
      attribute_index: 2,
      value: "",
      unit: "",
    },
  ]);

  useEffect(() => {
    const storedId = localStorage.getItem("selectedDeviceId");
    setDeviceId(storedId);
  }, []);

  const handleCheckboxChange = (index) => {
    setRows((prevRows) =>
      prevRows.map((row, i) =>
        i === index ? { ...row, checked: !row.checked } : row
      )
    );
  };

  const handleSelectAll1 = () => {
    const allSelected = rows.every((row) => row.checked);

    setRows((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        checked: !allSelected,
      }))
    );
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;

    setRows(prevRows =>
      prevRows.map(row => ({
        ...row,
        checked: isChecked
      }))
    );
  };
  const handleSendSelected = async () => {
    const selectedItems = rows.filter((row) => row.checked);

    if (selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }

    if (!deviceId) {
      alert("Device ID not found");
      return;
    }

    try {
      const payload = {
        action: "read_obis",
        serial_number: localStorage.getItem("selectedSerialNumber") || "",
        parameters: selectedItems.map((item) => ({
          name: item.name,
          obis_code: item.code,
          attribute_index: item.attribute_index,
          value: item.value || "",
          unit: item.unit || "",
        })),
      };

      console.log("Payment Payload:", payload);

      const response = await axios.post(
        `${BASE_URL}/api/getmeterinfo/`,
        payload
      );

      console.log("Payment   sumittttttttt Response:", response.data);

      const parsedData = response.data
        .split("\n\n")
        .filter((chunk) => chunk.trim())
        .map((chunk) => JSON.parse(chunk.replace(/^data:\s*/, "")));

      setApiData(parsedData);
    } catch (error) {
      console.error("Payment API Error:", error);

      if (error.response) {
        console.log("Backend Error:", error.response.data);
      }
    }
  };

  const getValueByCode = (code) => {
    const found = apiData.find((item) => item.obis_code === code);
    return found ? found.value : "";
  };

  return (
    <div className="tou_container">
      <div style={{ marginBottom: "15px" }}>


        <button
          className="scheduler-add-button"
          onClick={handleSendSelected}
        >
          Read
        </button>
      </div>

      <table className="tableTariff1">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={rows.length > 0 && rows.every(row => row.checked)}
                onChange={handleSelectAll}
              />
              {" "}
            </th>
            <th>No</th>
            <th>Name</th>
            <th>Code</th>
            <th>Value</th>
            <th>Unit</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((item, index) => (
            <tr key={item.no}>
              <td>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleCheckboxChange(index)}
                />
              </td>

              <td>{item.no}</td>

              <td>{item.name}</td>

              <td>{item.codes}</td>

              <td>{getValueByCode(item.code)}</td>

              <td>{item.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};











const FriendlyPeriods1 = () => {
  const [periods, setPeriods] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);

  // Replace this with actual device_id if needed

  // Fetch periods from the backend
  const fetchPeriods = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/friendly-periods/${deviceId}/`);
      setPeriods(response.data);
    } catch (error) {
      console.error("Error fetching periods:", error);
    }
  };

  // Call fetchPeriods on component mount
  useEffect(() => {
    fetchPeriods();
  }, []);

  // Handle adding a period (POST request)
  const handleAddPeriod = async () => {
    if (!startTime || !endTime) {
      alert("Please enter both Start Time and End Time.");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/api/friendly-periods/`, {
        device_id: deviceId,
        start_time: startTime,
        end_time: endTime,
      });

      // Update the list with the new period
      setPeriods([...periods, response.data]);

      // Clear input fields
      setStartTime("");
      setEndTime("");
    } catch (error) {
      console.error("Error adding period:", error);
    }
  };

  return (
    <div className="pushObjactContainer">
      {/* Input Fields for Start and End Time */}
      <div className="push-object">
        <label className="account">Start Time:</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <br />
        <label className="font-medium">End Time:</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      <div className="push-object pushsetup-button-action">
        <button onClick={handleAddPeriod} className="pushsetup-add-button">
          + Add
        </button>
      </div>

      {/* Table for Start & End Times */}
      <div className="push-object">
        <table className="table-pushsetup">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">No</th>
              <th className="border p-2">Start Time</th>
              <th className="border p-2">End Time</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period, index) => (
              <tr key={period.id} className="text-center">
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{period.start_time}</td>
                <td className="border p-2">{period.end_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



const FriendlyPeriods = () => {
  const [periods, setPeriods] = useState([]); // saved periods fetched from server
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );

  const [selectedRow, setSelectedRow] = useState(null);
  const rowRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingField, setEditingField] = useState(null); // "start" or "end"
  const [editValue, setEditValue] = useState("");

  const hasSelected = selectedRow !== null;
  const atFirst = hasSelected && selectedRow === 0;
  const atLast = hasSelected && selectedRow === periods.length - 1;

  // refresh when deviceId changes in localStorage (if some other code updates it)
  useEffect(() => {
    const handler = () => {
      const id = localStorage.getItem("selectedDeviceId");
      setDeviceId(id);
    };
    handler();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // fetch periods
  const fetchPeriods = async () => {
    if (!deviceId) {
      setPeriods([]);
      setSelectedRow(null);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/friendly-periods/${deviceId}/`);
      setPeriods(res.data || []);
      setSelectedRow(null);
    } catch (err) {
      console.error("Error fetching periods:", err);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
    // eslint-disable-next-line
  }, [deviceId]);

  // ADD (append)
  const handleAdd = async () => {
    if (!deviceId) return alert("Select a device");
    if (!startTime || !endTime) return alert("Enter both start and end time");

    const payload = {
      device_id: deviceId,
      start_time: startTime,
      end_time: endTime,
    };
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/friendly-periods/`, payload);
      // append created record (backend should return created object)
      setPeriods((p) => [...p, res.data]);
      setStartTime("");
      setEndTime("");
      setSelectedRow((prev) => (periods.length ? periods.length : 0));
    } catch (err) {
      console.error("Add failed:", err);
      alert("Failed to add period. See console.");
    } finally {
      setLoading(false);
    }
  };

  // INSERT after selected row (client-side; backend ordering depends on server)
  const handleInsertAfter = async () => {
    if (!deviceId) return alert("Select a device");
    if (!startTime || !endTime) return alert("Enter both start and end time");
    if (selectedRow === null) return alert("Select a row to insert after");

    const payload = {
      device_id: deviceId,
      start_time: startTime,
      end_time: endTime,
    };

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/friendly-periods/`, payload);
      // Insert created record client-side after selectedRow
      setPeriods((prev) => {
        const next = [...prev];
        next.splice(selectedRow + 1, 0, res.data);
        return next;
      });
      setStartTime("");
      setEndTime("");
      setSelectedRow((prev) => prev + 1);
    } catch (err) {
      console.error("Insert failed:", err);
      alert("Insert failed. See console.");
    } finally {
      setLoading(false);
    }
  };

  // DELETE selected row
  const handleDelete = async () => {
    if (selectedRow === null) return alert("Select a row to delete");
    const item = periods[selectedRow];
    if (!item?.id) {
      // if no server ID, just remove client-side
      setPeriods((prev) => prev.filter((_, i) => i !== selectedRow));
      setSelectedRow(null);
      return;
    }

    const ok = window.confirm("Delete selected period?");
    if (!ok) return;

    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/api/friendly-periods/item/${item.id}/`);
      await fetchPeriods();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed. See console.");
    } finally {
      setLoading(false);
    }
  };

  // CLEAR all for this device
  const handleClear = async () => {
    if (!deviceId) return alert("Select a device");
    const ok = window.confirm("Clear all friendly periods for this device?");
    if (!ok) return;

    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/api/friendly-periods/clean/${deviceId}/`);
      setPeriods([]);
      setSelectedRow(null);
    } catch (err) {
      console.error("Clear failed:", err);
      alert("Clear failed. See console.");
    } finally {
      setLoading(false);
    }
  };





  // Move row position
  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined) return;

    setPeriods((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);

      const insertIndex = Math.max(0, Math.min(toIndex, next.length));
      next.splice(insertIndex, 0, item);

      setSelectedRow(insertIndex);
      return next;
    });
  };

  const handleFirst = () => {
    if (selectedRow === null) return;
    if (selectedRow === 0) return;
    moveItem(selectedRow, 0);
  };

  const handlePrevious = () => {
    if (selectedRow === null) return;
    if (selectedRow <= 0) return;
    moveItem(selectedRow, selectedRow - 1);
  };

  const handleNext = () => {
    if (selectedRow === null) return;
    if (selectedRow >= periods.length - 1) return;
    moveItem(selectedRow, selectedRow + 1);
  };

  const handleLast = () => {
    if (selectedRow === null) return;
    if (selectedRow === periods.length - 1) return;
    moveItem(selectedRow, periods.length - 1);
  };
  // scroll selected into view
  useEffect(() => {
    if (selectedRow !== null && rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedRow]);

  // Inline edit handling
  const startInlineEdit = (index, field) => {
    setEditingIndex(index);
    setEditingField(field);
    const item = periods[index];
    setEditValue(field === "start" ? item.start_time : item.end_time);
  };

  const saveInlineEdit = async (index) => {
    const item = periods[index];
    if (!item || editValue === undefined) {
      cancelInlineEdit();
      return;
    }

    // if server id exists, PATCH the record
    if (item.id) {
      try {
        await axios.patch(`${BASE_URL}/api/friendly-periods/item/${item.id}/`, {
          start_time: editingField === "start" ? editValue : item.start_time,
          end_time: editingField === "end" ? editValue : item.end_time,
        });
        // refresh
        await fetchPeriods();
      } catch (err) {
        console.error("Update failed:", err);
        alert("Update failed. See console.");
      } finally {
        cancelInlineEdit();
      }
    } else {
      // just update client-side
      setPeriods((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          start_time: editingField === "start" ? editValue : next[index].start_time,
          end_time: editingField === "end" ? editValue : next[index].end_time,
        };
        return next;
      });
      cancelInlineEdit();
    }
  };

  const cancelInlineEdit = () => {
    setEditingIndex(null);
    setEditingField(null);
    setEditValue("");
  };

  // helper: client-side insert at index (useful if backend doesn't preserve ordering)
  const clientInsertAt = (index, newItem) => {
    setPeriods((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newItem);
      return next;
    });
  };

  return (
    <div className="display-root">
      <div className="sub_container_display">
        <div className="security-form">
          <label>
            <span>Start Time</span>
            <input
              type="time"

              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="friendly-input"
            />
          </label>
        </div>

        <div className="security-form">
          <label>
            <span>End Time</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="friendly-input"
            />
          </label>
        </div>
      </div>




      <div className="vertical-toolbar">
        <button className="tool-btn" onClick={handleAdd} title="Add selected to end">
          <span className="tool-icon">+</span>
          <span className="tool-text">Add1</span>
        </button>

        <button className="tool-btn" onClick={handleAdd} title="Insert after selected row">
          <span className="tool-icon red-dot"></span>
          <span className="tool-text">Insert</span>
        </button>

        <button className="tool-btn" onClick={handleDelete} title="Delete selected row">
          <span className="tool-icon">−</span>
          <span className="tool-text">Delete</span>
        </button>

        <button className="tool-btn" onClick={handleClear} title="Clear all">
          <span className="tool-icon">×</span>
          <span className="tool-text">Clear</span>
        </button>

        <div className="tool-separator" />

        <button
          className="tool-btn"
          onClick={handleFirst}
          title="First"
          disabled={!hasSelected || atFirst}
        >
          <span className="tool-icon">|◀</span>
          <span className="tool-text">First</span>
        </button>

        <button
          className="tool-btn"
          onClick={handlePrevious}
          title="Previous"
          disabled={!hasSelected || atFirst}
        >
          <span className="tool-icon">◀</span>
          <span className="tool-text">Previous</span>
        </button>

        <button
          className="tool-btn"
          onClick={handleNext}
          title="Next"
          disabled={!hasSelected || atLast}
        >
          <span className="tool-icon">▶</span>
          <span className="tool-text">Next</span>
        </button>

        <button
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
        <div className="display_table">
          <table className="tableTariff1">
            <thead>
              <tr className="thead-row">
                <th className="th-cell">No</th>
                <th className="th-cell">Start Time</th>
                <th className="th-cell">End Time</th>
              </tr>
            </thead>

            <tbody>
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-cell">
                    No periods saved
                  </td>
                </tr>
              ) : (
                periods.map((period, idx) => (
                  <tr
                    key={period.id || idx}
                    ref={(el) => (rowRefs.current[idx] = el)}
                    style={{
                      cursor: "pointer",
                      background: selectedRow === idx ? "#eef6ff" : "",
                      color: selectedRow === idx ? "#0b53a0" : "#111",
                      fontWeight: selectedRow === idx ? 600 : 400,
                      transition: "background 120ms ease, color 120ms ease",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                    onClick={() => setSelectedRow(idx)}

                  >
                    <td className="td-cell">{idx + 1}</td>
                    <td className="td-cell">{period.start_time}</td>
                    <td className="td-cell">{period.end_time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};



const FriendlyWeekday = () => {
  const [weekdays, setWeekdays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  });



  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);

  // Fetch existing data from backend
  useEffect(() => {
    const fetchWeekdays = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/friendly-weekdays/${deviceId}/`);
        setWeekdays(response.data);
      } catch (error) {
        console.error("Error fetching weekdays:", error);
      }
    };
    fetchWeekdays();
  }, []);

  // Handle checkbox change
  const handleCheckboxChange = (day) => {
    setWeekdays((prev) => {
      const updatedWeekdays = { ...prev, [day]: !prev[day] };

      // Send updated data to backend
      axios.post(`${BASE_URL}/api/friendly-weekdays/`, {
        device_id: deviceId,
        ...updatedWeekdays,
      });

      return updatedWeekdays;
    });
  };

  return (

    <div className="table-container-payment">
      <div className="options-grid">

        <label className="option-label">
          <input
            className="option-checkbox"
            type="checkbox"
            checked={weekdays.monday}
            onChange={() => handleCheckboxChange("monday")}
          />
          Monday
        </label>

        <label className="option-label">
          <input
            className="option-checkbox"
            type="checkbox"
            checked={weekdays.tuesday}
            onChange={() => handleCheckboxChange("tuesday")}
          />
          Tuesday
        </label>

        <label className="option-label">
          <input
            className="option-checkbox"
            type="checkbox"
            checked={weekdays.wednesday}
            onChange={() => handleCheckboxChange("wednesday")}
          />
          Wednesday
        </label>

        <label className="option-label">
          <input
            className="option-checkbox"
            type="checkbox"
            checked={weekdays.thursday}
            onChange={() => handleCheckboxChange("thursday")}
          />
          Thursday
        </label>

        <label className="option-label">
          <input
            className="option-checkbox"
            type="checkbox"
            checked={weekdays.friday}
            onChange={() => handleCheckboxChange("friday")}
          />
          Friday
        </label>

        <label className="option-label">
          <input
            className="option-checkbox"
            type="checkbox"
            checked={weekdays.saturday}
            onChange={() => handleCheckboxChange("saturday")}
          />
          Saturday
        </label>

        <label className="option-label">
          <input
            className="option-checkbox"
            type="checkbox"
            checked={weekdays.sunday}
            onChange={() => handleCheckboxChange("sunday")}
          />
          Sunday
        </label>

      </div>
    </div>
  );
};














const FriendlyHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(""); // backend format or placeholder (e.g. "2026-03-08 00:00:00" or "ffff-ff-01 00:00:00")
  const [selectedRow, setSelectedRow] = useState(null);
  const rowRefs = useRef([]);

  const [deviceId, setDeviceId] = useState(() =>
    localStorage.getItem("selectedDeviceId")
  );

  // Modal states (from your first component)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yearType, setYearType] = useState("Every Year");
  const [specialYear, setSpecialYear] = useState("");
  const [month, setMonth] = useState("Every Month");
  const [day, setDay] = useState("Every Day");

  const hasSelected = selectedRow !== null;
  const atFirst = hasSelected && selectedRow === 0;
  const atLast = hasSelected && selectedRow === holidays.length - 1;

  useEffect(() => {
    const storedId = localStorage.getItem("selectedDeviceId");
    setDeviceId(storedId);
  }, []);

  // Format Date based on selection (returns backend-friendly string)
  const formatDate = () => {
    // Year
    let formattedYear = yearType === "Every Year" ? "ffff" : String(specialYear || "").padStart(4, "0");
    // Month -> "ff" or "01".."12"
    let formattedMonth =
      month === "Every Month"
        ? "ff"
        : String(new Date(`${month} 1`).getMonth() + 1).padStart(2, "0");
    // Day -> "01" or actual day padded
    let formattedDay = day === "Every Day" ? "01" : String(day).padStart(2, "0");
    return `${formattedYear}-${formattedMonth}-${formattedDay} 00:00:00`;
  };

  // Helper: if backend datetime (e.g. "2026-03-08 00:00:00") present, derive a short display
  const displayValue = (backendDate) => {
    if (!backendDate) return "";
    // show only date part for the input (YYYY-MM-DD...) to keep it neat
    return backendDate.split(" ")[0];
  };

  // Fetch holidays
  const fetchHolidays = async () => {
    if (!deviceId) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/friendlyholiday/${deviceId}/`);
      setHolidays(res.data || []);
      setSelectedRow(null);
    } catch (err) {
      console.error("Error fetching holidays:", err);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [deviceId]);

  // Add Holiday (uses selectedDate which is already formatted by modal)
  const handleAdd = async () => {
    if (!selectedDate) return alert("Select holiday date (click the input).");
    try {
      const res = await axios.post(`${BASE_URL}/api/friendlyholiday/`, {
        device_id: deviceId,
        date: selectedDate,
      });

      setHolidays((prev) => {
        const next = [...prev, res.data];
        setSelectedRow(next.length - 1);
        return next;
      });
      fetchHolidays();

      setSelectedDate("");
    } catch (err) {
      console.error("Add failed:", err);
    }
  };

  // Insert Holiday after selectedRow
  const handleInsert = async () => {
    if (!selectedDate) return alert("Select holiday date (click the input).");
    if (selectedRow === null) return alert("Select a row");

    try {
      const res = await axios.post(`${BASE_URL}/api/friendlyholiday/`, {
        device_id: deviceId,
        date: selectedDate,
      });

      setHolidays((prev) => {
        const next = [...prev];
        next.splice(selectedRow + 1, 0, res.data);
        return next;
      });

      setSelectedRow((r) => r + 1);
      setSelectedDate("");
    } catch (err) {
      console.error("Insert failed:", err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (selectedRow === null) return alert("Select a row");
    const item = holidays[selectedRow];
    try {
      await axios.delete(`${BASE_URL}/api/friendlyholiday/delete/${item.id}/`);
      setHolidays((prev) => prev.filter((_, i) => i !== selectedRow));
      setSelectedRow(null);
      setSelectedDate("");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Clear
  const handleClear = async () => {
    const ok = window.confirm("Clear all holidays?");
    if (!ok) return;
    try {
      await axios.delete(`${BASE_URL}/api/friendlyholiday/clear/${deviceId}/`);
      setHolidays([]);
      setSelectedRow(null);
      setSelectedDate("");
    } catch (err) {
      console.error("Clear failed:", err);
    }
  };

  // Reorder helper
  const moveItem = (fromIndex, toIndex) => {
    setHolidays((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      const insertIndex = Math.max(0, Math.min(toIndex, next.length));
      next.splice(insertIndex, 0, item);
      setSelectedRow(insertIndex);
      return next;
    });
  };

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
    moveItem(selectedRow, holidays.length - 1);
  };

  // Auto scroll to selected row
  useEffect(() => {
    if (selectedRow !== null && rowRefs.current[selectedRow]) {
      rowRefs.current[selectedRow].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedRow]);

  // When user clicks a row, populate selectedDate for display (backend string)
  const handleRowClick = (index) => {
    setSelectedRow(index);
    const dt = holidays[index]?.date || "";
    setSelectedDate(dt); // this will be backend format (e.g. "2026-03-08 00:00:00")
  };

  return (
    <div className="display-root">
      {/* LEFT FORM */}
      <div className="sub_container_display">
        <div className="security-form">
          <label>
            <span>Select Holiday Date</span>
            {/* Read-only input that opens the modal on click */}
            <input
              type="text"
              readOnly
              placeholder="Click to select date"
              value={displayValue(selectedDate)}
              onClick={() => {
                // reset modal pickers to defaults (optionally parse current to prefill)
                setYearType("Every Year");
                setSpecialYear("");
                setMonth("Every Month");
                setDay("Every Day");
                setIsModalOpen(true);
              }}
            />
          </label>
        </div>
      </div>

      {/* POPUP MODAL */}
      {isModalOpen && (
        <div className="popup">
          <div style={{ padding: "2%" }} className="popup-content">
            <h4>Select Holiday Date</h4>

            <div className="security-form">
              <label>
                <span>Year Type:</span>
                <select
                  name="year_type"
                  value={yearType}
                  onChange={(e) => setYearType(e.target.value)}
                >
                  <option value="Every Year">Every Year</option>
                  <option value="Special Year">Special Year</option>
                </select>
              </label>
            </div>

            {yearType === "Special Year" && (
              <div className="security-form">
                <label>
                  <span>Enter Year:</span>
                  <input
                    type="number"
                    name="special_year"
                    placeholder="YYYY"
                    value={specialYear}
                    onChange={(e) => setSpecialYear(e.target.value)}
                  />
                </label>
              </div>
            )}

            <div className="security-form">
              <label>
                <span>Month:</span>
                <select
                  name="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
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
              </label>
            </div>

            <div className="security-form">
              <label>
                <span>Day:</span>
                <select
                  name="day"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                >
                  <option value="Every Day">Every Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="modal-buttons">
              <button
                type="button"
                onClick={() => {
                  const formatted = formatDate();
                  setSelectedDate(formatted);
                  setIsModalOpen(false);
                }}
              >
                OK
              </button>

              <button type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="vertical-toolbar">
        <button className="tool-btn" onClick={handleAdd}>
          <span className="tool-icon">+</span>
          <span className="tool-text">Add</span>
        </button>

        <button className="tool-btn" onClick={handleInsert}>
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

        <div className="tool-separator" />

        <button className="tool-btn" disabled={!hasSelected || atFirst} onClick={handleFirst}>
          <span className="tool-icon">|◀</span>
          <span className="tool-text">First</span>
        </button>

        <button className="tool-btn" disabled={!hasSelected || atFirst} onClick={handlePrevious}>
          <span className="tool-icon">◀</span>
          <span className="tool-text">Previous</span>
        </button>

        <button className="tool-btn" disabled={!hasSelected || atLast} onClick={handleNext}>
          <span className="tool-icon">▶</span>
          <span className="tool-text">Next</span>
        </button>

        <button className="tool-btn" disabled={!hasSelected || atLast} onClick={handleLast}>
          <span className="tool-icon">▶|</span>
          <span className="tool-text">Last</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="sub_container_display_2">
        <div className="display_table">
          <table className="tableTariff1">
            <thead>
              <tr>
                <th>No</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={2}>No holidays</td>
                </tr>
              ) : (
                holidays.map((holiday, index) => (
                  <tr
                    key={holiday.id}
                    ref={(el) => (rowRefs.current[index] = el)}
                    onClick={() => handleRowClick(index)}
                    style={{
                      background: selectedRow === index ? "#eef6ff" : "",
                      cursor: "pointer",
                    }}
                  >
                    <td>{index + 1}</td>
                    <td>{holiday.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};














const Friendly = () => {
  const [activePage, setActivePage] = useState("periods");


  const tabs = [
    { key: "periods", label: "Friendly Periods" },
    { key: "weekday", label: "Friendly Weekday" },
    { key: "holidays", label: "Friendly Holidays" },
  ];

  const containerRef = useRef(null);
  const buttonRefs = useRef({});
  const underlineRef = useRef(null);

  const moveUnderline = (key) => {
    const btn = buttonRefs.current[key];
    const container = containerRef.current;
    const underline = underlineRef.current;
    if (!btn || !container || !underline) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    underline.style.transform = `translateX(${btnRect.left - containerRect.left}px)`;
    underline.style.width = `${btnRect.width}px`;
  };

  useEffect(() => {
    setTimeout(() => moveUnderline(activePage), 20);

    const handleResize = () => moveUnderline(activePage);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activePage]);

  return (
    <div className="">
      {/* Buttons to Switch Pages */}
      <div className="controlsGroup_tabs" ref={containerRef}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => (buttonRefs.current[tab.key] = el)}
            className={`tou_button ${activePage === tab.key ? "activeButton" : ""
              }`}
            onClick={() => setActivePage(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}

        <div ref={underlineRef} className="underline" />
      </div>
      {/* Rendering Components Based on Selected Page */}
      {activePage === "periods" && <FriendlyPeriods />}
      {activePage === "weekday" && <FriendlyWeekday />}
      {activePage === "holidays" && <FriendlyHolidays />}
    </div>
  );
};



const AlarmOfCredit = () => {
  const [alarmData, setAlarmData] = useState([
    {
      no: 1,
      name: "Low Credit Alarm Threshold 1",
      code: "{112,0-0:19.10.0.255}",
      value: "",
      unit: "GHC",
    },
    {
      no: 2,
      name: "Low Credit Alarm Threshold 2",
      code: "{3,0-0:96.14.129.255}",
      value: "",
      unit: "GHC",
    },
  ]);

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const fetchAlarmData = async () => {
      try {
        const payload = {
          action: "read_obis",
          serial_number: "Avc",
          parameters: [
            {
              obis_code: "0.0.19.10.0.255",
              attribute_index: 5,
            },
            {
              obis_code: "0.0.96.14.129.255",
              attribute_index: 2,
            },
          ],
        };

        const response = await axios.post(
          `${BASE_URL}/api/getmeterinfo/`,
          payload
        );

        const rawData = response.data;

        const events = rawData
          .split("\n\n")
          .filter((item) => item.trim() !== "");

        const updatedValues = {};

        events.forEach((event) => {
          const json = JSON.parse(event.replace("data:", "").trim());

          if (
            json.obis_code === "0.0.19.10.0.255" &&
            json.attribute_index === 5
          ) {
            updatedValues["Low Credit Alarm Threshold 1"] = json.value;
          }

          if (
            json.obis_code === "0.0.96.14.129.255" &&
            json.attribute_index === 2
          ) {
            updatedValues["Low Credit Alarm Threshold 2"] = json.value;
          }
        });

        setAlarmData((prev) =>
          prev.map((item) => ({
            ...item,
            value: updatedValues[item.name] ?? item.value,
          }))
        );
      } catch (error) {
        console.error("Error fetching alarm data:", error);
      }
    };

    fetchAlarmData();
  }, []);

  return (
    <>
      <div>
        <table className="tableTariff1">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">No</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Code</th>
              <th className="border p-2">Value</th>
              <th className="border p-2">Unit</th>
            </tr>
          </thead>
          <tbody>
            {alarmData.map((item) => (
              <tr key={item.no} className="text-center border">
                <td className="border p-2">{item.no}</td>
                <td className="border p-2">{item.name}</td>
                <td className="border p-2">{item.code}</td>
                <td className="border p-2">{item.value}</td>
                <td className="border p-2">{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>

  );
};



const StepPrice1 = () => {
  const [rows, setRows] = useState([{ step: 1, price: 0 }]); // Initial row
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Add a new row with incremented step
  const addRow = () => {
    setRows([...rows, { step: rows.length + 1, price: 0 }]);
  };

  // Handle double-click to enable editing
  const handleDoubleClick = (index) => {
    setEditingIndex(index);
    setEditValue(rows[index].price);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setEditValue(e.target.value);
  };

  // Save edited price value
  const saveEdit = (index) => {
    const updatedRows = [...rows];
    updatedRows[index].price = parseFloat(editValue) || 0; // Ensure valid number
    setRows(updatedRows);
    setEditingIndex(null);
  };

  return (
    <div>
      <p> ResidentMonthlyRentStep </p>
      <button onClick={addRow}>Add Row</button>
      <table border="1">
        <thead>
          <tr>
            <th>Step</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>{row.step}</td>
              <td
                onDoubleClick={() => handleDoubleClick(index)}
                style={{ cursor: "pointer" }}
              >
                {editingIndex === index ? (
                  <input
                    type="number"
                    value={editValue}
                    onChange={handleInputChange}
                    onBlur={() => saveEdit(index)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(index)}
                    autoFocus
                  />
                ) : (
                  row.price
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};




const StepPrice = () => {
  const [rows, setRows] = useState([]);

  console.log("rows", rows)


  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));

  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);



  const fetchStepPrices = async (deviceId, setRows) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/step-price/${deviceId}/`);

      console.log("Raw API Response:", response.data);  // Check what we get from API

      // Extract step_prices array from response
      const stepPrices = response.data?.step_prices;

      console.log("Extracted step_prices:", stepPrices);  // Ensure we extracted the array

      if (Array.isArray(stepPrices)) {
        console.log("Setting rows:", stepPrices);  // Ensure we are setting the correct data
        setRows(stepPrices);
      } else {
        console.log("Received invalid data structure. Setting empty array.");
        setRows([]);
      }
    } catch (error) {
      console.error("Error fetching step prices:", error);
      setRows([]); // Fallback to empty array on error
    }
  };


  useEffect(() => {
    fetchStepPrices(deviceId, setRows);
  }, [deviceId]); // Dependency on deviceId

  const addRow = async () => {
    if (!deviceId) {
      console.error("Device ID is missing!");
      return;
    }


    const newPrice = { price: 0, device_id: deviceId }; // ✅ Include device_id

    try {
      const response = await axios.post(`${BASE_URL}/api/step-price/`, newPrice);
      console.log("API Response:", response.data); // Debugging

      if (response.data) {
        setRows((prevRows) => [...prevRows, response.data]); // ✅ Update state
      }
    } catch (error) {
      console.error("Error adding row:", error.response?.data || error);
    }
  };



  // Handle double-click to enable editing
  const handleDoubleClick = (index) => {
    setEditingIndex(index);
    setEditValue(rows[index].price);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setEditValue(e.target.value);
  };

  // Save edited price value
  const saveEdit = (index) => {
    const updatedStep = rows[index];
    const updatedPrice = parseFloat(editValue) || 0;

    axios
      .put(`${BASE_URL}/api/step-price/update/${updatedStep.id}/`, { price: updatedPrice })
      .then(() => {
        const updatedRows = [...rows];
        updatedRows[index].price = updatedPrice;
        setRows(updatedRows);
        setEditingIndex(null);
      })
      .catch((error) => console.error("Error updating price:", error));
  };

  // Select a row when clicked
  const handleRowClick = (index) => {
    setSelectedRow(index);
  };

  // Delete selected row
  const deleteRow = () => {
    if (selectedRow !== null) {
      const stepId = rows[selectedRow].id;

      axios
        .delete(`${BASE_URL}/api/step-price/delete/${stepId}/`)
        .then(() => {
          const updatedRows = rows.filter((_, index) => index !== selectedRow);
          setRows(updatedRows);
          setSelectedRow(null);
        })
        .catch((error) => console.error("Error deleting row:", error));
    }
  };

  return (
    <div>


      <div className="table-container">
        <table className="tableTariff1">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Step</th>
              <th className="border p-2">Price</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className="text-center border"
                onClick={() => handleRowClick(index)}
                style={{
                  backgroundColor:
                    selectedRow === index ? "#ff5e00" : "",
                  cursor: "pointer",
                }}
              >
                <td className="border p-2">{row.step}</td>

                <td
                  className="border p-2"
                  onDoubleClick={() => handleDoubleClick(index)}
                >
                  {editingIndex === index ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={handleInputChange}
                      onBlur={() => saveEdit(index)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && saveEdit(index)
                      }
                      autoFocus
                      style={{ width: "100%" }}
                    />
                  ) : (
                    row.price
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div >
      <div style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        marginLeft: '20%',
        // will wrap on very small screens
      }}>
        <button className='scheduler-add-button' onClick={addRow}>Add Row</button>
        <button className='scheduler-delete-button' onClick={deleteRow} disabled={selectedRow === null}>
          Delete Selected Row
        </button>
      </div>



    </div>
  );
};





const Payment = () => {
  const [activeComponent, setActiveComponent] = useState('AccountDetails');

  const renderComponent = () => {
    switch (activeComponent) {
      case 'AccountDetails':
        return <AccountDetails />;
      case 'Credit':
        return <Credit />;
      case 'Charge':
        return <Charge />
      case 'TokenGateway':
        return <TokenGateway />
      case 'PaymentInfoTable':
        return <PaymentInfoTable />
      case 'Friendly':
        return <Friendly />
      case 'AlarmOfCredit':
        return <AlarmOfCredit />
      case 'StepPrice':
        return <StepPrice />
      default:
        return <p>Please select a section to view the content.</p>;
    }
  };

  return (
    <div>
      <div
        className="view-toggle"
        role="tablist"
        aria-label="Component selection"
      >
        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "AccountDetails"}
          className={`view-btn ${activeComponent === "AccountDetails" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("AccountDetails")}
        >
          Account Details
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "Credit"}
          className={`view-btn ${activeComponent === "Credit" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("Credit")}
        >
          Credit
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "Charge"}
          className={`view-btn ${activeComponent === "Charge" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("Charge")}
        >
          Charge
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "TokenGateway"}
          className={`view-btn ${activeComponent === "TokenGateway" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("TokenGateway")}
        >
          Token Gateway
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "PaymentInfoTable"}
          className={`view-btn ${activeComponent === "PaymentInfoTable" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("PaymentInfoTable")}
        >
          Payment Information
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "Friendly"}
          className={`view-btn ${activeComponent === "Friendly" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("Friendly")}
        >
          Friendly
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "AlarmOfCredit"}
          className={`view-btn ${activeComponent === "AlarmOfCredit" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("AlarmOfCredit")}
        >
          Alarm Of Credit
        </button>

        <button
          type="button"
          role="tab"
          aria-pressed={activeComponent === "StepPrice"}
          className={`view-btn ${activeComponent === "StepPrice" ? "active" : ""
            }`}
          onClick={() => setActiveComponent("StepPrice")}
        >
          Step Price
        </button>
      </div>
      <div className="load-control-container">{renderComponent()}</div>
    </div>
  );
};

export default Payment;