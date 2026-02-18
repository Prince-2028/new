import React, { useState,useEffect  } from "react";
import axios from "axios";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import './index.css'

const AccountDetails = () => {
  const [activeTab, setActiveTab] = useState(null);


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
    const requestData = [{
      "device_id": deviceId,
      account_mode_and_status: StatusformData.accountModeAndStatus,
      payment_mode: StatusformData.paymentMode,
      account_status: StatusformData.accountStatus,
      current_credit_in_use: StatusformData.currentCreditInUse,
      current_credit_status: StatusformData.currentCreditStatus,
      method: StatusformData.method,
    }];
  
    // Validation: Check for empty fields
    for (const [key, value] of Object.entries(requestData)) {
      if (value === "" || value === null || value === undefined) {
        alert(`Data is missing: Please fill all fields. Missing field: ${key.replace(/_/g, ' ')}`);
        return;
      }
    }
  
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
   
  
    const convertToUTC = (datetimeStr) => {
      const date = new Date(datetimeStr);
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
    };
    
    // Convert the dates to UTC before sending
    const formattedData = {
      device_id:deviceId,
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
    createCreditChargeConfig(deviceId,newCreditReference,newChargeReference)
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
      createTokenGatewayConfig(1,creditRef,tokenProp)
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
            <h2>Status</h2>
            <div className="form-container">
              {/* Account Mode and Status */}
      <div className="form-field">        
 <p>Account Mode and Status</p>

  <label htmlFor="paymentMode">Payment Mode</label>
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
 

</div>

      
      
              {/* Account Status */}
                          <div className="form-field">
              <label htmlFor="accountStatus">Account Status:</label>
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
            </div>

      
              {/* Current Credit in Use */}
              <div className="form-field">
                <label>Current Credit in Use:</label>
                <input
                  type="number"
                  name="currentCreditInUse"
                  value={StatusformData.currentCreditInUse}
                  onChange={handleChange}
                  placeholder="Enter current credit in use"
                />
              </div>
      
              {/* Current Credit Status */}
              <div className="form-field">
  <p>Current Credit Status:</p>
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    {[
      "In Credit",
      "Low Credit",
      "Next Credit Enabled",
      "Next Credit Selectable",
      "Next Credit Selected",
      "Next Selectable Credit in Use",
      "Out of Credit",
    ].map((status) => (
      <label key={status}>
        <input
          type="checkbox"
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
        {status}
      </label>
    ))}
  </div>
</div>

      
              {/* Method */}
              <div className="form-field">
                <label>Method:</label>
                <select name="method" value={StatusformData.method} onChange={handleChange}>
                  <option value="Active account">Active Account</option>
                  <option value="Inactive account">Inactive Account</option>
                </select>
              </div>
      
              {/* Submit Button */}
              <button onClick={handleSubmit} className="submit-button">
                Submit
              </button>
            </div>
            </div>
         
        );
      case 'value':
        return (
            <form onSubmit={valueHandleSubmit}>
            <div>
              <label>Available Credit:</label>
              <input
                type="number"
                name="availableCredit"
                value={valueFormData.availableCredit}
                onChange={valueHandleInputChange}
              />
            </div>
            <div>
              <label>Amount to Clear:</label>
              <input
                type="number"
                name="amountToClear"
                value={valueFormData.amountToClear}
                onChange={valueHandleInputChange}
              />
            </div>
            <div>
              <label>Clearance Threshold:</label>
              <input
                type="number"
                name="clearanceThreshold"
                value={valueFormData.clearanceThreshold}
                onChange={valueHandleInputChange}
              />
            </div>
            <div>
              <label>Aggregated Debt:</label>
              <input
                type="number"
                name="aggregatedDebt"
                value={valueFormData.aggregatedDebt}
                onChange={valueHandleInputChange}
              />
            </div>
            <div>
              <label>Account Activation Time:</label>
              <input
                type="datetime-local"
                name="accountActivationTime"
                value={valueFormData.accountActivationTime}
                onChange={valueHandleInputChange}
              />
            </div>
            <div>
              <label>Account Closure Time:</label>
              <input
                type="datetime-local"
                name="accountClosureTime"
                value={valueFormData.accountClosureTime}
                onChange={valueHandleInputChange}
              />
            </div>
            <div>
              <label>Currency Name:</label>
              <input
                type="text"
                name="name"
                value={valueFormData.currency.name}
                onChange={valueHandleCurrencyChange}
              />
            </div>
            <div>
              <label>Currency Scale:</label>
              <input
                type="number"
                name="scale"
                value={valueFormData.currency.scale}
                onChange={valueHandleCurrencyChange}
              />
            </div>
            <div>
              <label>Currency Unit:</label>
              <input
                type="text"
                name="unit"
                value={valueFormData.currency.unit}
                onChange={valueHandleCurrencyChange}
              />
            </div>
            <div>
              <label>Low Credit Threshold:</label>
              <input
                type="number"
                name="lowCreditThreshold"
                value={valueFormData.lowCreditThreshold}
                onChange={valueHandleInputChange}
              />
            </div>
            <div>
              <label>Next Credit Available Threshold:</label>
              <input
                type="number"
                name="nextCreditAvailableThreshold"
                value={valueFormData.nextCreditAvailableThreshold}
                onChange={valueHandleInputChange}
              />
            </div>
            <div>
              <label>Max Provision:</label>
              <input
                type="number"
                name="maxProvision"
                value={valueFormData.maxProvision}
                onChange={valueHandleInputChange}
              />
            </div>
            <div>
              <label>Max Provision Period:</label>
              <input
                type="number"
                name="maxProvisionPeriod"
                value={valueFormData.maxProvisionPeriod}
                onChange={valueHandleInputChange}
              />
            </div>
            <button type="submit">Submit</button>
          </form>
        );
      
        case 'creditRefList':
        return (
            <div>
            <button onClick={toggleAddForm}>
              {isAdding ? "Cancel" : "Add Credit Reference"}
            </button>
      
            {isAdding && (
              <div>
                <input
                  type="text"
                  value={newReference}
                  onChange={CreditReferenceListHandleInput}
                  placeholder="Enter credit reference"
                />
                <button onClick={handleAddReference}>Add Reference</button>
              </div>
            )}
      
            <div>
              <h3>Credit Reference List</h3>
              <table>
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
      
            {creditReferences.length > 0 && (
              <button onClick={CreditReferenceListHandleSubmit}>Save Credit References</button>
            )}
          </div>
        );
        
      case 'creditChargeConfig':
        return (
            <div>
            <button onClick={creditChargeToggleAddForm}>
              {creditReferenceIsAdding ? "Cancel" : "Add Credit Charge Configuration"}
            </button>
      
            {creditReferenceIsAdding && (
              <div>
                <input
                  type="text"
                  name="creditReference"
                  value={newCreditReference}
                  onChange={CreditChargeHandleInput}
                  placeholder="Enter credit reference"
                />
                <input
                  type="text"
                  name="chargeReference"
                  value={newChargeReference}
                  onChange={CreditChargeHandleInput}
                  placeholder="Enter charge reference"
                />
                <button onClick={handleAddConfig}>Add Configuration</button>
              </div>
            )}
      
            <div>
              <h3>Credit Charge Configuration List</h3>
              <table>
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
            <button onClick={toggleAddTokenConfigForm}>
              {isAddingNewConfig ? "Cancel" : "Add Token Gateway Configuration"}
            </button>
      
            {isAddingNewConfig && (
              <div>
                <input
                  type="text"
                  name="creditReference"
                  value={creditRef}
                  onChange={handleConfigInputChange}
                  placeholder="Enter credit reference"
                />
                <input
                  type="text"
                  name="tokenProportion"
                  value={tokenProp}
                  onChange={handleConfigInputChange}
                  placeholder="Enter token proportion"
                />
                <button onClick={addNewTokenConfig}>Add Configuration</button>
              </div>
            )}
      
            <div>
              <h3>Token Gateway Configuration List</h3>
              <table>
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

  return (
    <div className="Display_Container">
      <div className="">
        <button onClick={() => setActiveTab('status')}>Status</button>
        <button onClick={() => setActiveTab('value')}>Value</button>
        <button onClick={() => setActiveTab('creditRefList')}>Credit Reference List</button>
        <button onClick={() => setActiveTab('creditChargeConfig')}>Credit Charge Configuration</button>
        <button onClick={() => setActiveTab('tokenGatewayConfig')}>Token Gateway Configuration</button>
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
    presetCreditAmount:0,
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
  

 
  const tokenValueHandleSubmit = (e) => {
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

  const handleEmergencyValueSubmit = async () => {
    try {
      const payload = [
        {
          device_id:deviceId,  // Ensure device_id is included
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

    console.log("data",data)
    

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
  const monthlyRentHandleSubmit = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/monthly-rent-credit`, monthlyRentData);
      console.log("Data submitted successfully:", response.data);
      alert("Monthly Rent Credit data submitted successfully!");
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Failed to submit Monthly Rent Credit data.");
    }
  };






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
          <h3>Token Credit</h3>
          <div>
            <button onClick={() => tokenToggleSection('value')}>Value</button>
            <button onClick={() => tokenToggleSection('method')}>Method</button>
          </div>
          
          {/* Render Value Section */}
          {isTokenValueActive ? (
            <div>
            <h2>Token Credit Configuration</h2>
            <form onSubmit={tokenValueHandleSubmit}>
              
              <label>Current Credit Amount:</label>
              <input type="number" name="currentCreditAmount" value={TokenValuesData.currentCreditAmount} onChange={handleChangeTokenCredit} />
      
              <label>Credit Type:</label>
              <select name="creditType" value={TokenValuesData.creditType} onChange={handleChangeTokenCredit}>
                <option value="prepaid">Prepaid</option>
                <option value="postpaid">Postpaid</option>
              </select>
      
              <label>Priority:</label>
              <input type="number" name="priority" value={TokenValuesData.priority} onChange={handleChangeTokenCredit} />
      
              <label>Limit:</label>
              <input type="number" name="limit" value={TokenValuesData.limit} onChange={handleChangeTokenCredit} />
      
              <label>Credit Configuration:</label>
              <textarea name="creditConfiguration" value={TokenValuesData.creditConfiguration} onChange={handleChangeTokenCredit}></textarea>
      
              <label>Preset Credit Amount:</label>
              <input type="number" name="presetCreditAmount" value={TokenValuesData.presetCreditAmount} onChange={handleChangeTokenCredit} />
      
              <label>Credit Available Threshold:</label>
              <input type="number" name="creditAvailableThreshold" value={TokenValuesData.creditAvailableThreshold} onChange={handleChangeTokenCredit} />
      
              <label>Period:</label>
              <input type="text" name="period" value={TokenValuesData.period} onChange={handleChangeTokenCredit} />
      
              <button type="submit">Save Value</button>
            </form>
          </div>
          ) : (
            <div>
      <h2>Token Credit Management</h2>

      {/* Update Amount Form */}
      <form onSubmit={(e) => handleTokenCreditAction(e, "update-amount", amount)}>
        <label>Update Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
        />
        <button type="submit">Update Amount</button>
      </form>

      {/* Set Amount Form */}
      <form onSubmit={(e) => handleTokenCreditAction(e, "set-amount", presetAmount)}>
        <label>Set Amount:</label>
        <input
          type="number"
          value={presetAmount}
          onChange={(e) => setPresetAmount(e.target.value)}
          placeholder="Enter preset amount"
          required
        />
        <button type="submit">Set Amount</button>
      </form>

      {/* Invoke Credit Checkbox */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={invokeCredit}
            onChange={(e) => {
              setInvokeCredit(e.target.checked);
              handleTokenCreditAction(e, "invoke-credit");
            }}
          />
          Invoke Credit
        </label>
      </div>
    </div>
          )}
        </div>
        );
        
      case "emergencyCredit":
         
          return (
            <div>
              <h3>Emergency Credit</h3>
              <div>
                <button onClick={() => emergencyToggleSection("value")}>Value</button>
                <button onClick={() => emergencyToggleSection("method")}>Method</button>
              </div>
        
              {/* Render Value Section */}
              {emergencyCreditSetValue ? (
                <div>
                  <label>
                    Current credit amount:
                    <input
                      type="text"
                      name="currentCreditAmount"
                      value={emergencyValueData.currentCreditAmount}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <label>
                    Credit type:
                    <input
                      type="text"
                      name="creditType"
                      value={emergencyValueData.creditType}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <label>
                    Priority:
                    <input
                      type="text"
                      name="priority"
                      value={emergencyValueData.priority}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <label>
                    Warning threshold 1:
                    <input
                      type="text"
                      name="warningThreshold1"
                      value={emergencyValueData.warningThreshold1}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <label>
                    Limit:
                    <input
                      type="text"
                      name="limit"
                      value={emergencyValueData.limit}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <label>
                    Credit Configuration:
                    <input
                      type="text"
                      name="creditConfiguration"
                      value={emergencyValueData.creditConfiguration}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <label>
                    Credit Status:
                    <input
                      type="text"
                      name="creditStatus"
                      value={emergencyValueData.creditStatus}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <label>
                    Preset credit amount:
                    <input
                      type="text"
                      name="presetCreditAmount"
                      value={emergencyValueData.presetCreditAmount}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <label>
                    Credit available threshold:
                    <input
                      type="text"
                      name="creditAvailableThreshold"
                      value={emergencyValueData.creditAvailableThreshold}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <label>
                    Period:
                    <input
                      type="text"
                      name="period"
                      value={emergencyValueData.period}
                      onChange={handleEmergencyValueChange}
                    />
                  </label>
                  <br />
                  <button onClick={handleEmergencyValueSubmit}>Submit Value</button>
                </div>
              ) : (
                // Render Method Section
                <div>
                {/* Update Amount Form */}
                <form onSubmit={(e) => handleEmergencyMethodSubmit(e, "update-amount")}>
                  <label>Update Amount:</label>
                  <input
                    type="number"
                    name="updateAmount"
                    value={emergencyMethodData.updateAmount}
                    onChange={handleEmergencyMethodChange}
                    placeholder="Enter amount"
                    required
                  />
                  <button type="submit">Update Amount</button>
                </form>
          
                {/* Set Amount Form */}
                <form onSubmit={(e) => handleEmergencyMethodSubmit(e, "set-amount")}>
                  <label>Set Amount:</label>
                  <input
                    type="number"
                    name="setAmount"
                    value={emergencyMethodData.setAmount}
                    onChange={handleEmergencyMethodChange}
                    placeholder="Enter preset amount"
                    required
                  />
                  <button type="submit">Set Amount</button>
                </form>
          
                {/* Invoke Credit Checkbox */}
                <div>
                  <label>
                    <input
                      type="checkbox"
                      name="invokeCredit"
                      checked={emergencyMethodData.invokeCredit}
                      onChange={handleEmergencyMethodChange}
                    />
                    Invoke Credit
                  </label>
                  <button onClick={(e) => handleEmergencyMethodSubmit(e, "invoke-credit")}>
                    Submit Invoke Credit
                  </button>
                </div>
              </div>
          
          )}
            </div>
          );
        
      case "monthlyRentCredit":
        return (
          <div>
      <h3>Monthly Rent Credit</h3>
      <label>
        Value:
        <input
          type="text"
          name="value"
          value={monthlyRentData.value}
          onChange={monthlyRentHandleInputChange}
        />
      </label>
      <br />
      <label>
        Preset credit amount:
        <input
          type="text"
          name="presetCreditAmount"
          value={monthlyRentData.presetCreditAmount}
          onChange={monthlyRentHandleInputChange}
        />
      </label>
      <br />
      <label>
        Period:
        <input
          type="text"
          name="period"
          value={monthlyRentData.period}
          onChange={monthlyRentHandleInputChange}
        />
      </label>
      <br />
      <button onClick={monthlyRentHandleSubmit}>Submit</button>
    </div>
        );
      default:
        return <div>Select a Credit Type</div>;
    }
  };

  return (
    <div>
      {/* Buttons to switch between credit configurations */}
      <div>
        <button onClick={() => handlePageChange("tokenCredit")}>
          Token Credit
        </button>
        <button onClick={() => handlePageChange("emergencyCredit")}>
          Emergency Credit
        </button>
        <button onClick={() => handlePageChange("monthlyRentCredit")}>
          Monthly Rent Credit
        </button>
      </div>

      {/* Render form based on activePage */}
      {renderForm()}
    </div>
  );
};









const Charge = () => {
  const [currentPage, setCurrentPage] = useState(null);

  

  const handleButtonClick = (pageName) => {
    setCurrentPage(pageName);
  };


  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);

 
  const [valueFormData, setValueFormData] = useState({
    device_id: deviceId,
    total_amount_paid: "",
    charge_type: "",
    priority: "",
    charge_configuration: [], // Array instead of string
    last_collection_time: "",
    last_collection_amount: "",
    total_amount_remaining: "",
    proportion: "",
  });

  const valueHandleChange = (name, value) => {
    setValueFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (e) => {
    const { options } = e.target;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setValueFormData((prev) => ({
      ...prev,
      charge_configuration: selectedValues,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setValueFormData((prev) => ({
      ...prev,
      charge_configuration: checked
        ? [...prev.charge_configuration, value]
        : prev.charge_configuration.filter((item) => item !== value),
    }));
  };

  

  const valueHandleSubmit = async (e) => {
    e.preventDefault();
  
    const formattedData = {
      ...valueFormData,
      total_amount_paid: parseFloat(valueFormData.total_amount_paid) || 0,
      last_collection_amount: parseFloat(valueFormData.last_collection_amount) || 0,
      total_amount_remaining: parseFloat(valueFormData.total_amount_remaining) || 0,
      proportion: parseFloat(valueFormData.proportion) || 0,
      last_collection_time: new Date(valueFormData.last_collection_time).toISOString(),
    };
  
    try {
      await axios.post(`${BASE_URL}/api/payment-charge-value/`, [formattedData]); // Wrap in an array
      alert("Data sent successfully!");
    } catch (error) {
      console.error("Error sending data:", error.response?.data || error);
    }
  };
  

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

const handleChange = (e) => {
    const { name, value } = e.target;
    
    const parsedValue = ["commodityScale", "priceScale"].includes(name) ? parseFloat(value) || 0 : value;

    if (name.startsWith("tariff")) {
        setFormData({
            ...formData,
            tariffs: {
                ...formData.tariffs,
                [name]: value,
            },
        });
    } else {
        setFormData({
            ...formData,
            [name]: parsedValue,
        });
    }
};



const handleSubmit = async (e,unit_type) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  // Prepare data with unit_type set to "active"
  const formattedData = [{

device:deviceId , // Ensure device ID is present
 unit_type: unit_type, // Always set to "active"
    commodity_scale: formData.commodityScale,
    price_scale: formData.priceScale,
    class_id: formData.classId,
    logical_name: formData.logicalName,
    attribute_id: formData.attributeId,
    unit_charge_activation_time: formData.unitChargeActivationTime,
    tariff_1: parseFloat(formData.tariffs.tariff1) || 0.00,
    tariff_2: parseFloat(formData.tariffs.tariff2) || 0.00,
    tariff_3: parseFloat(formData.tariffs.tariff3) || 0.00,
    tariff_4: parseFloat(formData.tariffs.tariff4) || 0.00,
  }];

  try {
    const response = await axios.post(`${BASE_URL}/api/unit-charges/`, formattedData, {
      headers: { "Content-Type": "application/json" }
    });

    if (response.status === 201) {
      setMessage("✅ Data successfully submitted!");
      
      // Reset form fields after successful submission
      setFormData({
        device: "", 
        unitType: "active", // Default to active
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
      setMessage(`❌ Error: ${error.response.data.detail || "Invalid data submission."}`);
    } else {
      setMessage("❌ Error submitting data. Please try again.");
    }
    console.error("Error:", error);
  }

  setLoading(false);
};



  const renderContent = () => {
    switch (currentPage) {
      case 'value':
        return (
          <form onSubmit={valueHandleSubmit}>
          <label>
            Total Amount Paid:
            <input
              type="number"
              name="total_amount_paid"
              value={valueFormData.total_amount_paid}
              onChange={(e) => valueHandleChange("total_amount_paid", e.target.value)}
            />
          </label>
          <label>
            Charge Type:
            <input
              type="text"
              name="charge_type"
              value={valueFormData.charge_type}
              onChange={(e) => valueHandleChange("charge_type", e.target.value)}
            />
          </label>
          <label>
            Priority:
            <input
              type="text"
              name="priority"
              value={valueFormData.priority}
              onChange={(e) => valueHandleChange("priority", e.target.value)}
            />
          </label>
    
          <label>Charge Configuration:</label>
          <div>
            <label>
              <input
                type="checkbox"
                value="continuous"
                checked={valueFormData.charge_configuration.includes("continuous")}
                onChange={handleCheckboxChange}
              />
              Continuous
            </label>
    
            <label>
              <input
                type="checkbox"
                value="percentageBased"
                checked={valueFormData.charge_configuration.includes("percentageBased")}
                onChange={handleCheckboxChange}
              />
              Percentage Based
            </label>
          </div>
    
          <label>
            Last Collection Time:
            <input
              type="datetime-local"
              name="last_collection_time"
              value={valueFormData.last_collection_time}
              onChange={(e) => valueHandleChange("last_collection_time", e.target.value)}
            />
          </label>
          <label>
            Last Collection Amount:
            <input
              type="number"
              name="last_collection_amount"
              value={valueFormData.last_collection_amount}
              onChange={(e) => valueHandleChange("last_collection_amount", e.target.value)}
            />
          </label>
          <label>
            Total Amount Remaining:
            <input
              type="number"
              name="total_amount_remaining"
              value={valueFormData.total_amount_remaining}
              onChange={(e) => valueHandleChange("total_amount_remaining", e.target.value)}
            />
          </label>
          <label>
            Proportion:
            <input
              type="text"
              name="proportion"
              value={valueFormData.proportion}
              onChange={(e) => valueHandleChange("proportion", e.target.value)}
            />
          </label>
          <button type="submit">Submit</button>
        </form>
        );
      case 'unitChargeActive':
        return (
          <div>
            <h2>Unit Charge Active Page Content</h2>


           
            <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
            <form  onSubmit={(e) => handleSubmit(e, "active")}>
                <h2 className="text-xl font-semibold mb-4">Per Unit Scaling</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Commodity Scale</label>
                        <input
                            type="number"
                            name="commodityScale"
                            value={formData.commodityScale}
                            onChange={handleChange}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Price Scale</label>
                        <input
                            type="number"
                            name="priceScale"
                            value={formData.priceScale}
                            onChange={handleChange}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                </div>
                
                <h1 className="text-xl font-semibold mt-6">Commodity Reference</h1>
                <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium">Class ID</label>
                        <input type="text" name="classId" value={formData.classId} onChange={handleChange} className="border p-2 rounded w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Logical Name</label>
                        <input type="text" name="logicalName" value={formData.logicalName} onChange={handleChange} className="border p-2 rounded w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Attribute ID</label>
                        <input type="text" name="attributeId" value={formData.attributeId} onChange={handleChange} className="border p-2 rounded w-full" />
                    </div>
                </div>
                
                <h2 className="text-xl font-semibold mt-6">Charge Table</h2>
                <table className="w-full border mt-2">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2"></th>
                            <th className="border p-2">Tariff 1</th>
                            <th className="border p-2">Tariff 2</th>
                            <th className="border p-2">Tariff 3</th>
                            <th className="border p-2">Tariff 4</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border p-2 font-semibold">Unit Charge</td>
                            {Object.keys(formData.tariffs).map((tariff, index) => (
                                <td key={index} className="border p-2">
                                  
                                    <input placeholder={tariff} type="text" name={tariff} value={formData.tariffs[tariff]} onChange={handleChange} className="w-full p-1" />
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
                
                <h2 className="text-xl font-semibold mt-6">Unit Charge Activation Time</h2>
                <div>
                    <label className="block text-sm font-medium">Activation Time</label>
                    <input type="datetime-local" name="unitChargeActivationTime" value={formData.unitChargeActivationTime} onChange={handleChange} className="border p-2 rounded w-full mt-2" />
                </div>
                
                <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded" disabled={loading}>
                    {loading ? "Submitting..." : "Submit"}
                </button>
            </form>
            {message && <p className="mt-4 text-center text-lg">{message}</p>}
        </div>



    
   
          </div>
        );
      case 'unitChargePassive':
        return (
          <div>
          <h2>Unit Charge Passive Page Content</h2>


         
          <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
          <form onSubmit={(e) => handleSubmit(e, "passive")}>
              <h2 className="text-xl font-semibold mb-4">Per Unit Scaling</h2>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium">Commodity Scale</label>
                      <input
                          type="number"
                          name="commodityScale"
                          value={formData.commodityScale}
                          onChange={handleChange}
                          className="border p-2 rounded w-full"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium">Price Scale</label>
                      <input
                          type="number"
                          name="priceScale"
                          value={formData.priceScale}
                          onChange={handleChange}
                          className="border p-2 rounded w-full"
                      />
                  </div>
              </div>
              
              <h1 className="text-xl font-semibold mt-6">Commodity Reference</h1>
              <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                      <label className="block text-sm font-medium">Class ID</label>
                      <input type="text" name="classId" value={formData.classId} onChange={handleChange} className="border p-2 rounded w-full" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium">Logical Name</label>
                      <input type="text" name="logicalName" value={formData.logicalName} onChange={handleChange} className="border p-2 rounded w-full" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium">Attribute ID</label>
                      <input type="text" name="attributeId" value={formData.attributeId} onChange={handleChange} className="border p-2 rounded w-full" />
                  </div>
              </div>
              
              <h2 className="text-xl font-semibold mt-6">Charge Table</h2>
              <table className="w-full border mt-2">
                  <thead>
                      <tr className="bg-gray-200">
                          <th className="border p-2"></th>
                          <th className="border p-2">Tariff 1</th>
                          <th className="border p-2">Tariff 2</th>
                          <th className="border p-2">Tariff 3</th>
                          <th className="border p-2">Tariff 4</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td className="border p-2 font-semibold">Unit Charge</td>
                          {Object.keys(formData.tariffs).map((tariff, index) => (
                              <td key={index} className="border p-2">
                                
                                  <input placeholder={tariff} type="text" name={tariff} value={formData.tariffs[tariff]} onChange={handleChange} className="w-full p-1" />
                              </td>
                          ))}
                      </tr>
                  </tbody>
              </table>
              
              <h2 className="text-xl font-semibold mt-6">Unit Charge Activation Time</h2>
              <div>
                  <label className="block text-sm font-medium">Activation Time</label>
                  <input type="datetime-local" name="unitChargeActivationTime" value={formData.unitChargeActivationTime} onChange={handleChange} className="border p-2 rounded w-full mt-2" />
              </div>
              
              <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded" disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
              </button>
          </form>
          {message && <p className="mt-4 text-center text-lg">{message}</p>}
      </div>



  
 
        </div>
        );
      default:
        return <p>Please select an option above.</p>;
    }
  };

  return (
    <div>
      <h1>Charge Functions</h1>
      <button onClick={() => handleButtonClick('value')}>Value</button>
      <button onClick={() => handleButtonClick('unitChargeActive')}>Unit Charge Active</button>
      <button onClick={() => handleButtonClick('unitChargePassive')}>Unit Charge Passive</button>
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
      device_id:deviceId,
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
    <form onSubmit={handleSubmit} className="token-form">
      <label className="label">Token:</label>
      <input type="text" name="token" value={formData.token} onChange={handleChange} className="input" />
      
      <label className="label">Token Time:</label>
      <input type="text" name="tokenTime" value={formData.tokenTime} onChange={handleChange} className="input" />
      
      <label className="label">Token Description:</label>
      <div className="description-container">
        <div className="description-header">
          <span className="description-index">Index</span>
          <span className="description-text">Description</span>
        </div>
        {formData.tokenDescription.map((desc, index) => (
          <div key={index} className="description-row">
            <span>{desc.index}</span>
            <span>{desc.description}</span>
          </div>
        ))}
        <button type="button" onClick={() => setShowPopup(true)} className="add-button">Add Description</button>
      </div>
      
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Add Token Description</h3>
            <label>Index:</label>
            <input type="text" style={{width:'60%'}} value={newDescription.index} onChange={handleDescriptionChange} className="input" />
           <br/> <label>Description:</label>
            <input style={{width:'60%'}}  type="text" name="description" value={newDescription.description} onChange={handleDescriptionChange} className="input" />
            <br/> <button type="button" onClick={addDescription} className="confirm-button">Add</button>
            <button type="button" onClick={() => setShowPopup(false)} className="cancel-button">Cancel</button>
          </div>
        </div>
      )}
      
      <label className="label">Token Delivery Method:</label>
      <input type="text" name="tokenDeliveryMethod" value={formData.tokenDeliveryMethod} onChange={handleChange} className="input" />
      
      
      <h3> Token Status </h3>
      
      <label className="label">Status Code:</label>
      <input type="text" name="statusCode" value={formData.statusCode} onChange={handleChange} className="input" />
      
      <label className="label">Data Value:</label>
      <input type="text" name="datavalue" value={formData.datavalue} onChange={handleChange} className="input" />
      
      <label className="label">Enter Method:</label>
      <input type="text" name="enterMethod" value={formData.enterMethod} onChange={handleChange} className="input" />
      
      <button type="submit" className="submit-button">Submit</button>
    </form>
  );
};







const PaymentInfoTable=()=> {
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
      <h2 className="text-lg font-bold mb-4">Payment Information</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
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
    </div>
  );
}



const FriendlyPeriods = () => {
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
    <div>
      <label>
        <input
          type="checkbox"
          checked={weekdays.monday}
          onChange={() => handleCheckboxChange("monday")}
        />
        Monday
      </label>
      <label>
        <input
          type="checkbox"
          checked={weekdays.tuesday}
          onChange={() => handleCheckboxChange("tuesday")}
        />
        Tuesday
      </label>
      <label>
        <input
          type="checkbox"
          checked={weekdays.wednesday}
          onChange={() => handleCheckboxChange("wednesday")}
        />
        Wednesday
      </label>
      <label>
        <input
          type="checkbox"
          checked={weekdays.thursday}
          onChange={() => handleCheckboxChange("thursday")}
        />
        Thursday
      </label>
      <label>
        <input
          type="checkbox"
          checked={weekdays.friday}
          onChange={() => handleCheckboxChange("friday")}
        />
        Friday
      </label>
      <label>
        <input
          type="checkbox"
          checked={weekdays.saturday}
          onChange={() => handleCheckboxChange("saturday")}
        />
        Saturday
      </label>
      <label>
        <input
          type="checkbox"
          checked={weekdays.sunday}
          onChange={() => handleCheckboxChange("sunday")}
        />
        Sunday
      </label>
    </div>
  );
};









const FriendlyHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yearType, setYearType] = useState("Every Year");
  const [specialYear, setSpecialYear] = useState("");
  const [month, setMonth] = useState("Every Month");
  const [day, setDay] = useState("Every Day");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedId, setSelectedId] = useState(null); // Track selected row ID

  
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);
  

  // Format Date based on selection
  const formatDate = () => {
    let formattedYear = yearType === "Every Year" ? "ffff" : specialYear;
    let formattedMonth =
      month === "Every Month"
        ? "ff"
        : String(new Date(`${month} 1`).getMonth() + 1).padStart(2, "0");
    let formattedDay = day === "Every Day" ? "01" : String(day).padStart(2, "0");
    return `${formattedYear}-${formattedMonth}-${formattedDay} 00:00:00`;
  };

  // GET holidays from backend for the given device
  const getHolidays = () => {
    fetch(`${BASE_URL}/api/friendlyholiday/${deviceId}/`)
      .then((response) => response.json())
      .then((data) => {
        setHolidays(data);
      })
      .catch((err) => console.error("Error fetching holidays:", err));
  };

  // Call getHolidays when component mounts
  useEffect(() => {
    getHolidays();
  }, []);

 

// ✅ Add Holiday: Validate date then POST to backend and refresh the list.
const handleAddHoliday = () => {
  // Validate selectedDate: it must not be empty and should include both date and time parts.
  if (!selectedDate || selectedDate.split(" ").length !== 2) {
    alert("Please select a valid holiday date with year, month, day, and time.");
    return;
  }

  axios
    .post(`${BASE_URL}/api/friendlyholiday/`, {
      device_id: deviceId,
      date: selectedDate,
    })
    .then((response) => {
      console.log("Holiday added:", response.data);
      // Refresh the holiday list after successful post
      getHolidays();
      setIsModalOpen(false);
      setSelectedDate("");
    })
    .catch((err) => console.error("Error adding holiday:", err));
};



// ✅ Clear all holidays for the device.
const handleClearHolidays = () => {
  axios
    .delete(`${BASE_URL}/api/friendlyholiday/clear/${deviceId}/`)
    .then((response) => {
      console.log("All holidays cleared:", response.data);
      getHolidays();
    })
    .catch((err) => console.error("Error clearing holidays:", err));
};


const handleDeleteHoliday = () => {
  if (selectedId !== null) {
    axios
      .delete(`${BASE_URL}/api/friendlyholiday/delete/${selectedId}/`)
      .then((response) => {
        console.log("Holiday deleted:", response.data);
        // Refresh the holiday list after deletion
        getHolidays();
        setSelectedId(null);
      })
      .catch((err) => console.error("Error deleting holiday:", err));
  }
};

  return (
    <div className="holiday-container">
      {/* Add Holiday Input */}
      <label htmlFor="holidayInput">Select Holiday Date:</label>
      <input
        id="holidayInput"
        type="text"
        readOnly
        placeholder="Click to select date"
        value={selectedDate}
        onClick={() => setIsModalOpen(true)}
      />

      {/* Popup Modal */}
      {isModalOpen && (
        <div className="popup">
          <div className="popup-content">
            <h2>Select Holiday Date</h2>
            <label>Year Type:</label>
            <select value={yearType} onChange={(e) => setYearType(e.target.value)}>
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

            <label>Day:</label>
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="Every Day">Every Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <div className="modal-buttons">
              <button
                onClick={() => {
                  setSelectedDate(formatDate());
                  setIsModalOpen(false);
                }}
              >
                OK
              </button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleAddHoliday}>Add Holiday</button>

      {/* Delete Button */}
      <button onClick={handleDeleteHoliday} disabled={selectedId === null}>
        Delete Selected
      </button>

      <button onClick={handleClearHolidays}>Clear All Holidays</button>

      {/* Holiday Table */}
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {holidays.map((holiday, index) => (
            <tr
              key={holiday.id}
              onClick={() => setSelectedId(holiday.id)}
              style={{
                backgroundColor: selectedId === holiday.id ? "#ddd" : "white",
                cursor: "pointer",
              }}
            >
              <td>{index + 1}</td>
              <td>{holiday.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};














const Friendly = () => {
  const [activePage, setActivePage] = useState("periods");

  return (
    <div className="">
      {/* Buttons to Switch Pages */}
      <div className="">
        <button onClick={() => setActivePage("periods")} >Friendly Periods </button>
        <button onClick={() => setActivePage("weekday")} >Friendly Weekday </button>
        <button onClick={() => setActivePage("holidays")}> Friendly Holidays </button>
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
      value: 0,
      unit: "GHC",
    },
    {
      no: 2,
      name: "Low Credit Alarm Threshold 2",
      code: "{3,0-0:96.14.129.255}",
      value: 0,
      unit: "GHC",
    },
  ]);

  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
   
  useEffect(() => {
    const storedId = localStorage.getItem('selectedDeviceId');
    setDeviceId(storedId);
  }, []);

  useEffect(() => {
    const fetchAlarmData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/alarmcredit/${deviceId}/`);

        
        const updatedData = response.data;

        setAlarmData((prevData) =>
          prevData.map((alarm) => {
            const match = updatedData.find(
              (item) => item.name === alarm.name && item.code === alarm.code
            );
            return match ? { ...alarm, value: match.value } : alarm;
          })
        );
      } catch (error) {
        console.error("Error fetching alarm data:", error);
      }
    };

    fetchAlarmData();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 border rounded-lg shadow-lg bg-white">
      <h2 className="text-lg font-semibold mb-4">Alarm of Credit</h2>
      <table className="w-full border-collapse border border-gray-300">
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
  );
};



const StepPrice1  = () => {
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

  console.log("rows",rows)


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
    fetchStepPrices(deviceId,setRows);
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
      <p>Resident Monthly Rent Step</p>
      <button onClick={addRow}>Add Row</button>
      <button onClick={deleteRow} disabled={selectedRow === null}>
        Delete Selected Row
      </button>
      <table border="1">
        <thead>
          <tr>
            <th>Step</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              onClick={() => handleRowClick(index)}
              style={{
                backgroundColor: selectedRow === index ? "lightgray" : "white",
                cursor: "pointer",
              }}
            >
              <td>{row.step}</td>
              <td onDoubleClick={() => handleDoubleClick(index)}>
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





const Payment = () => {
    const [activeComponent, setActiveComponent] = useState(null);
  
    const renderComponent = () => {
      switch (activeComponent) {
        case 'AccountDetails':
          return <AccountDetails />;
        case 'Credit':
          return <Credit />;
        case 'Charge':
          return <Charge/>
        case 'TokenGateway':
          return <TokenGateway/>
        case 'PaymentInfoTable':
          return <PaymentInfoTable/>
        case 'Friendly':
          return <Friendly/> 
        case 'AlarmOfCredit':
          return <AlarmOfCredit/>
        case 'StepPrice':
          return <StepPrice/>
        default:
          return <p>Please select a section to view the content.</p>;
      }
    };
  
    return (
      <div className="payment-container">
        <div>
          <button onClick={() => setActiveComponent('AccountDetails')}>Account Details</button>
          <button onClick={() => setActiveComponent('Credit')}>Credit</button>
          <button onClick={() => setActiveComponent('Charge')} >Charge </button>
          <button onClick={()=> setActiveComponent("TokenGateway")}> Token Gateway</button>
      
          <button onClick={()=>setActiveComponent('PaymentInfoTable') }>Payment Information </button> 
          <button onClick={()=>setActiveComponent('Friendly')}>Friendly </button>
          <button onClick={()=> setActiveComponent('AlarmOfCredit')}> AlarmOfCredit</button>
          <button onClick={()=> setActiveComponent('StepPrice')}> StepPrice</button>
        </div>
        <div className="load-control-container">{renderComponent()}</div>
      </div>
    );
  };
  
  export default Payment;