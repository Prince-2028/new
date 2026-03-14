import React, { useState,useEffect,useRef } from "react";
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
              <div className="ppp-container" style={{marginTop:"2%",padding:'2%'}}>
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
      <label  className="option-label"    key={status}>
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
              <button style={{marginLeft:"40%"}} className='scheduler-add-button' onClick={handleSubmit}>
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

  <button  style={{marginLeft:"40%"}} className='scheduler-add-button' type="submit">Submit</button>

</form>
        );
      
        case 'creditRefList':
        return (
           
           
           <div style={{margin:"2%"}}>
           
      
            
              <div className="security-form">
                <label> 
                   <span onClick={handleAddReference}>
                    <button style={{marginLeft:"10%"}} className='scheduler-add-button'>Add Reference </button></span>
                <input
                  type="text"
                  value={newReference}
                  onChange={CreditReferenceListHandleInput}
                  placeholder="Enter credit reference"
                />
                </label>
               
              </div>
             
              
            
      
            <div className='table-container-autoanswer' style={{marginTop:'4%'}}>
             
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
                    <button style={{marginLeft:"10%"}} className='scheduler-add-button'>Add Configuration </button></span>
               <input
  type="text"
  value={newCreditReference}
  onChange={(e) => setNewCreditReference(e.target.value)}
  placeholder="Enter credit reference"
/>
                </label>
               
              </div>
             
              
      
            <div className='table-container-autoanswer' style={{marginTop:'4%'}}>
             
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

               <button style={{marginLeft:"40%"}} className='scheduler-add-button' onClick={addNewTokenConfig}>Add Configuration</button>
           
      

      
            <div className='table-container-autoanswer' style={{marginTop:'4%'}}>
            
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

        <button style={{marginLeft:"42%"}} className='scheduler-add-button' type="submit">Save </button>
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

        <button style={{marginLeft:"42%"}} className='scheduler-add-button' type="submit">Update Amount</button>
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

        <button style={{marginLeft:"42%"}} className='scheduler-add-button' type="submit">Set Amount</button>
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
    <button  type="button" onClick={() => emergencyToggleSection("value")}>
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
          <button  style={{marginLeft:"40%"}} className='scheduler-add-button'type="submit">Update Amount</button>
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
          <button style={{marginLeft:"40%"}} className='scheduler-add-button' type="submit">Set Amount</button>
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
          style={{marginLeft:"40%"}} className='scheduler-add-button'
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
    <button style={{marginLeft:"40%"}} className='scheduler-add-button' type="button" onClick={monthlyRentHandleSubmit}>
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
      
        <div style={{marginLeft:'2%'}}
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









const Charge = () => {
  const [currentPage, setCurrentPage] = useState('value');

  

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
    setTimeout(() => moveUnderline(currentPage), 20);

    const handleResize = () => moveUnderline(currentPage);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentPage]);


  const renderContent = () => {
    switch (currentPage) {
      case 'value':
        return (
         <form onSubmit={valueHandleSubmit}>

  <div className="security-form">
    <label>
      <span>Total Amount Paid:</span>
      <input
        type="number"
        name="total_amount_paid"
        value={valueFormData.total_amount_paid}
        onChange={(e) =>
          valueHandleChange("total_amount_paid", e.target.value)
        }
      />
    </label>
  </div>

  <div className="security-form">
    <label>
      <span>Charge Type:</span>
      <input
        type="text"
        name="charge_type"
        value={valueFormData.charge_type}
        onChange={(e) =>
          valueHandleChange("charge_type", e.target.value)
        }
      />
    </label>
  </div>

  <div className="security-form">
    <label>
      <span>Priority:</span>
      <input
        type="text"
        name="priority"
        value={valueFormData.priority}
        onChange={(e) =>
          valueHandleChange("priority", e.target.value)
        }
      />
    </label>
  </div>

  {/* Charge Configuration */}
  <div className="security-form">
    <label>
      <span>Charge Configuration:</span>
    </label>

    <div style={{ display: "flex", gap: "20px", marginTop: "6px" }}>
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
  </div>

  <div className="security-form">
    <label>
      <span>Last Collection Time:</span>
      <input
        type="datetime-local"
        name="last_collection_time"
        value={valueFormData.last_collection_time}
        onChange={(e) =>
          valueHandleChange("last_collection_time", e.target.value)
        }
      />
    </label>
  </div>

  <div className="security-form">
    <label>
      <span>Last Collection Amount:</span>
      <input
        type="number"
        name="last_collection_amount"
        value={valueFormData.last_collection_amount}
        onChange={(e) =>
          valueHandleChange("last_collection_amount", e.target.value)
        }
      />
    </label>
  </div>

  <div className="security-form">
    <label>
      <span>Total Amount Remaining:</span>
      <input
        type="number"
        name="total_amount_remaining"
        value={valueFormData.total_amount_remaining}
        onChange={(e) =>
          valueHandleChange("total_amount_remaining", e.target.value)
        }
      />
    </label>
  </div>

  <div className="security-form">
    <label>
      <span>Proportion:</span>
      <input
        type="text"
        name="proportion"
        value={valueFormData.proportion}
        onChange={(e) =>
          valueHandleChange("proportion", e.target.value)
        }
      />
    </label>
  </div>

  <div className="security-form">
    <button  style={{marginLeft:"42%"}} className='scheduler-add-button' type="submit">Submit</button>
  </div>

</form>
        );
      case 'unitChargeActive':
        return (
     
  <div>
   
    <form onSubmit={(e) => handleSubmit(e, "active")}>
    

      <div className="ppp-container-payment" >

         
          <p className="ppp-heading-payment">Per Unit Scaling</p>
        
          <div className="security-form">
            <label>
              <span>Commodity Scale</span>
              <input
                type="number"
                name="commodityScale"
                value={formData.commodityScale}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </label>
          </div>
       

       
          <div className="security-form">
            <label>
              <span>Price Scale</span>
              <input
                type="number"
                name="priceScale"
                value={formData.priceScale}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </label>
          </div>
       
      </div>

     
      <div className="ppp-container-payment">
         <p className="ppp-heading-payment">Commodity Reference</p>
        <div>
          <div className="security-form">
            <label>
              <span>Class ID</span>
              <input
                type="text"
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </label>
          </div>
        </div>

        <div>
          <div className="security-form">
            <label>
              <span>Logical Name</span>
              <input
                type="text"
                name="logicalName"
                value={formData.logicalName}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </label>
          </div>
        </div>

        <div>
          <div className="security-form">
            <label>
              <span>Attribute ID</span>
              <input
                type="text"
                name="attributeId"
                value={formData.attributeId}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </label>
          </div>
        </div>
      </div>

     
      <div style={{ maxWidth: '100%', overflowX: 'auto' }}> 
      
      <table className="tableTariff1" >
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
                <div className="security-form">
                  <label>
                    <span className="sr-only">{tariff}</span>
                    <input
                      placeholder={tariff}
                      type="text"
                      name={tariff}
                      value={formData.tariffs[tariff]}
                      onChange={handleChange}
                      className="w-full p-1"
                    />
                  </label>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      </div>

     
      <div className="security-form">
        <label>
          <span>Activation Time</span>
          <input
            type="datetime-local"
            name="unitChargeActivationTime"
            value={formData.unitChargeActivationTime}
            onChange={handleChange}
            className="border p-2 rounded w-full mt-2"
          />
        </label>
      </div>

      <div className="security-form">
        <button
          type="submit"
          style={{marginLeft:"42%"}} className='scheduler-add-button'
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>

    {message && <p className="mt-4 text-center text-lg">{message}</p>}
  </div>

        );
      case 'unitChargePassive':
        return (
        <div>

  <form onSubmit={(e) => handleSubmit(e, "passive")}>

    {/* Per Unit Scaling */}
    <div className="ppp-container-payment">

      <p className="ppp-heading-payment">
        Per Unit Scaling
      </p>

      <div className="security-form">
        <label>
          <span>Commodity Scale</span>
          <input
            type="number"
            name="commodityScale"
            value={formData.commodityScale}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="security-form">
        <label>
          <span>Price Scale</span>
          <input
            type="number"
            name="priceScale"
            value={formData.priceScale}
            onChange={handleChange}
          />
        </label>
      </div>

    </div>


    {/* Commodity Reference */}
    <div className="ppp-container-payment">

      <p className="ppp-heading-payment">
        Commodity Reference
      </p>

      <div className="security-form">
        <label>
          <span>Class ID</span>
          <input
            type="text"
            name="classId"
            value={formData.classId}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="security-form">
        <label>
          <span>Logical Name</span>
          <input
            type="text"
            name="logicalName"
            value={formData.logicalName}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="security-form">
        <label>
          <span>Attribute ID</span>
          <input
            type="text"
            name="attributeId"
            value={formData.attributeId}
            onChange={handleChange}
          />
        </label>
      </div>

    </div>


    {/* Charge Table */}
    <div style={{ maxWidth: "100%", overflowX: "auto" }}>

      <table className="tableTariff1">
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
          <tr>
            <td>Unit Charge</td>

            {Object.keys(formData.tariffs).map((tariff, index) => (
              <td key={index}>
                <div className="security-form">
                  <label>
                    <span className="sr-only">{tariff}</span>
                    <input
                      type="text"
                      name={tariff}
                      value={formData.tariffs[tariff]}
                      onChange={handleChange}
                      placeholder={tariff}
                    />
                  </label>
                </div>
              </td>
            ))}

          </tr>
        </tbody>
      </table>

    </div>


    {/* Activation Time */}
    <div className="security-form">
      <label>
        <span>Activation Time</span>
        <input
          type="datetime-local"
          name="unitChargeActivationTime"
          value={formData.unitChargeActivationTime}
          onChange={handleChange}
        />
      </label>
    </div>


    {/* Submit */}
    <div className="security-form">
      <button style={{marginLeft:"42%"}} className='scheduler-add-button' type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>

  </form>

  {message && <p className="message-text">{message}</p>}

</div>
        );
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
          className={`tou_button ${
            currentPage === tab.key ? "activeButton" : ""
          }`}
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
    <button style={{marginLeft:"42%"}} className='scheduler-add-button' type="submit" >Submit</button>
  </div>
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
        <div  className="security-form">
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

           <div  className="security-form"> 
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
    <div style={{padding:"2%"}} className="popup-content">
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
          className={`tou_button ${
            activePage === tab.key ? "activeButton" : ""
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
      <div  style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginLeft:'20%', 
    // will wrap on very small screens
  }}> 
       <button className='scheduler-add-button' onClick={addRow}>Add Row</button>
      <button  className='scheduler-delete-button' onClick={deleteRow} disabled={selectedRow === null}>
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
    className={`view-btn ${
      activeComponent === "AccountDetails" ? "active" : ""
    }`}
    onClick={() => setActiveComponent("AccountDetails")}
  >
    Account Details
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={activeComponent === "Credit"}
    className={`view-btn ${
      activeComponent === "Credit" ? "active" : ""
    }`}
    onClick={() => setActiveComponent("Credit")}
  >
    Credit
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={activeComponent === "Charge"}
    className={`view-btn ${
      activeComponent === "Charge" ? "active" : ""
    }`}
    onClick={() => setActiveComponent("Charge")}
  >
    Charge
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={activeComponent === "TokenGateway"}
    className={`view-btn ${
      activeComponent === "TokenGateway" ? "active" : ""
    }`}
    onClick={() => setActiveComponent("TokenGateway")}
  >
    Token Gateway
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={activeComponent === "PaymentInfoTable"}
    className={`view-btn ${
      activeComponent === "PaymentInfoTable" ? "active" : ""
    }`}
    onClick={() => setActiveComponent("PaymentInfoTable")}
  >
    Payment Information
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={activeComponent === "Friendly"}
    className={`view-btn ${
      activeComponent === "Friendly" ? "active" : ""
    }`}
    onClick={() => setActiveComponent("Friendly")}
  >
    Friendly
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={activeComponent === "AlarmOfCredit"}
    className={`view-btn ${
      activeComponent === "AlarmOfCredit" ? "active" : ""
    }`}
    onClick={() => setActiveComponent("AlarmOfCredit")}
  >
    Alarm Of Credit
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={activeComponent === "StepPrice"}
    className={`view-btn ${
      activeComponent === "StepPrice" ? "active" : ""
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