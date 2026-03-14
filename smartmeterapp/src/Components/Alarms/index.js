import React, { useState,useEffect } from 'react';
import './index.css';
import axios from 'axios';  // Import axios to send requests
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

const RegisterData = () => {
    const [selectedRegister, setSelectedRegister] = useState('ErrorRegister1');
    const [checkboxStates, setCheckboxStates] = useState({});

    // Define checkbox lists for Alarm Registers and Error Registers
    const checkboxListAlarmRegister1 = [
        'clockInvalid',
        'batteryReplace',
        'programMemoryError',
        'ramError',
        'nvMemoryError',
        'measurementSystemError',
        'watchdogError',
        'fraudAttempt',
    ];

    const checkboxListAlarmRegister2 = [
        'totalPowerFailure',
        'powerResume',
        'voltageMissingL1',
        'voltageNormalL1',
      
        'missingNeutral',
        'phaseAsymmetry',
        'currentReversal',
        'unexpectedConsumption',
        'keyExchanged',
        'badVoltageQualityL1',
        'externalAlert',
        'localCommunicationAttempt',
        'disconnectReconnectFail',
    ];

    const checkboxListErrorRegister1 = [
        'clockInvalid',
        'batteryReplace',
        'programMemoryError',
        'ramError',
        'nvMemoryError',
        'measurementSystemError',
        'watchdogError',
        'fraudAttempt',
    ];

    const checkboxListErrorRegister2 = [
        
      'totalPowerFailure',
        'powerResume',
        'voltageMissingL1',
        'voltageNormalL1',
        'missingNeutral',
        'phaseAsymmetry',
        'currentReversal',
        'unexpectedConsumption',
        'keyExchanged',
        'badVoltageQualityL1',
        'externalAlert',
        'localCommunicationAttempt',
        'disconnectReconnectFail',
    ];


    const checkboxListAlarmFilter1 = [
      'clockInvalid',
      'batteryReplace',
      'programMemoryError',
      'ramError',
      'nvMemoryError',
      'measurementSystemError',
      'watchdogError',
      'fraudAttempt',
  ];

  const checkboxListAlarmFilter2 = [
      
    
    'totalPowerFailure',
      'powerResume',
      'voltageMissingL1',
      'voltageNormalL1',
      'missingNeutral',
      'phaseAsymmetry',
      'currentReversal',
      'unexpectedConsumption',
      'keyExchanged',
      'badVoltageQualityL1',
      'externalAlert',
      'localCommunicationAttempt',
      'disconnectReconnectFail',
  ];



  const checkboxListAlarmDescriptor1 = [
    
    'clockInvalid',
    'batteryReplace',
    'programMemoryError',
    'ramError',
    'nvMemoryError',
    'measurementSystemError',
    'watchdogError',
    'fraudAttempt',
];

const checkboxListAlarmDescriptor2 = [
    
 'totalPowerFailure',
      'powerResume',
      'voltageMissingL1',
      'voltageNormalL1',
      'missingNeutral',
      'phaseAsymmetry',
      'currentReversal',
      'unexpectedConsumption',
      'keyExchanged',
      'badVoltageQualityL1',
      'externalAlert',
      'localCommunicationAttempt',
      'disconnectReconnectFail',
];


  const handleRegisterClick = (register) => {
    setSelectedRegister(register);
    // Set the default checkbox states to false when switching registers
    const checkboxes =
        register === 'AlarmRegister1' || register === 'ErrorRegister1'
            ? checkboxListAlarmRegister1
            : register === 'AlarmRegister2' || register === 'ErrorRegister2'
            ? checkboxListAlarmRegister2
            : register === 'AlarmFilter1'
            ? checkboxListAlarmFilter1
            : register === 'AlarmFilter2'
            ? checkboxListAlarmFilter2
            : register === 'AlarmDescriptor1'
            ? checkboxListAlarmDescriptor1
           
            : register === 'AlarmDescriptor2'
            ? checkboxListAlarmDescriptor2
            : [];
          

    const initialCheckboxStates = checkboxes.reduce((acc, key) => {
        acc[key] = false;
        return acc;
    }, {});

    setCheckboxStates(initialCheckboxStates);
};



    const handleCheckboxChange = (key) => {
        setCheckboxStates((prevState) => ({
            ...prevState,
            [key]: !prevState[key],
        }));
    };

    const renderCheckboxRow = (key, label) => (
        <div key={key} className="checkbox-row">
            <input
                type="checkbox"
                checked={checkboxStates[key] || false}
                onChange={() => handleCheckboxChange(key)}
            />
            <label>{label}</label>
        </div>
    );

    // Separate handleSend functions for each register

const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
       
        useEffect(() => {
          const storedId = localStorage.getItem('selectedDeviceId');
          setDeviceId(storedId);
        }, []);

    const handleSendErrorRegister1 = () => {
      console.log("mama")

         console.log(checkboxStates)
         const dataToSend = {
          device_id: deviceId,  // Replace with the actual device ID
          code: '{1, 0-0:97.98.1.255}', // Default or dynamic code
          clock_invalid: checkboxStates.clockInvalid || false,  // Updated to snake_case
          battery_replace: checkboxStates.batteryReplace || false,  // Updated to snake_case
          program_memory_error: checkboxStates.programMemoryError || false,  // Updated to snake_case
          ram_error: checkboxStates.ramError || false,  // Updated to snake_case
          nv_memory_error: checkboxStates.nvMemoryError || false,  // Updated to snake_case
          measurement_system_error: checkboxStates.measurementSystemError || false,  // Updated to snake_case
          watchdog_error: checkboxStates.watchdogError || false,  // Updated to snake_case
          fraud_attempt: checkboxStates.fraudAttempt || false,  // Updated to snake_case
        };
     
      console.log(dataToSend);
  
      axios.post(`${BASE_URL}/api/create-error-register1/`, dataToSend)
    .then(response => {
        console.log('Error Register 1 data sent successfully:', response.data);
    })
    .catch(error => {
        console.error('Error sending Error Register 1 data:', error.response || error);
    });
    };

    

    const handleSendErrorRegister2 = () => {
      console.log("mama");
  
      console.log(checkboxStates);
  
      const dataToSend = {
          device_id: deviceId,  // Replace with the actual device ID
          code: '{1, 0-0:97.98.1.255}',  // Default or dynamic code
          total_power_failure: checkboxStates.totalPowerFailure || false,  // Updated to snake_case
          power_resume: checkboxStates.powerResume || false,  // Updated to snake_case
          voltage_missing_l1: checkboxStates.voltageMissingL1 || false,  // Updated to snake_case
          voltage_normal_l1: checkboxStates.voltageNormalL1 || false,  // Updated to snake_case
          missing_neutral: checkboxStates.missingNeutral || false,  // Updated to snake_case
          phase_asymmetry: checkboxStates.phaseAsymmetry || false,  // Updated to snake_case
          current_reversal: checkboxStates.currentReversal || false,  // Updated to snake_case
          unexpected_consumption: checkboxStates.unexpectedConsumption || false,  // Updated to snake_case
          key_exchanged: checkboxStates.keyExchanged || false,  // Updated to snake_case
          bad_voltage_quality_l1: checkboxStates.badVoltageQualityL1 || false,  // Updated to snake_case
          external_alert: checkboxStates.externalAlert || false,  // Updated to snake_case
          local_communication_attempt: checkboxStates.localCommunicationAttempt || false,  // Updated to snake_case
          disconnect_reconnect_fail: checkboxStates.disconnectReconnectFail || false,  // Updated to snake_case
      };
  
      console.log(dataToSend);
  
      axios.post(`${BASE_URL}/api/create-error-register2/`, dataToSend)
          .then(response => {
              console.log('Error Register 2 data sent successfully:', response.data);
          })
          .catch(error => {
              console.error('Error sending Error Register 2 data:', error.response || error);
          });
  };
  
  
  const handleSendAlarmRegister1 = () => {
    console.log("Sending Alarm Register 1 data");

    console.log(checkboxStates);
    
    const dataToSend = {
        device_id: deviceId,  // Replace with the actual device ID
        code: '{1,0-0:97.98.0.255}',  // Default or dynamic code
        clock_invalid: checkboxStates.clockInvalid || false,
        battery_replace: checkboxStates.batteryReplace || false,
        program_memory_error: checkboxStates.programMemoryError || false,
        ram_error: checkboxStates.ramError || false,
        nv_memory_error: checkboxStates.nvMemoryError || false,
        measurement_system_error: checkboxStates.measurementSystemError || false,
        watchdog_error: checkboxStates.watchdogError || false,
        fraud_attempt: checkboxStates.fraudAttempt || false,
    };

    console.log(dataToSend);

    axios.post(`${BASE_URL}/api/create-alarm-register1/`, dataToSend)
        .then(response => {
            console.log('Alarm Register 1 data sent successfully:', response.data);
        })
        .catch(error => {
            console.error('Error sending Alarm Register 1 data:', error.response || error);
        });
};



const handleSendAlarmRegister2 = () => {
  console.log("Sending Alarm Register 2 data");

  const dataToSend = {
      device_id: deviceId,  // Replace with actual device ID
      code: '{1,0-0:97.98.1.255}',  // Default or dynamic code
      total_power_failure: checkboxStates.totalPowerFailure || false,
      power_resume: checkboxStates.powerResume || false,
      voltage_missing_l1: checkboxStates.voltageMissingL1 || false,
      voltage_normal_l1: checkboxStates.voltageNormalL1 || false,  // New checkbox field
      missing_neutral: checkboxStates.missingNeutral || false,
      phase_asymmetry: checkboxStates.phaseAsymmetry || false,
      current_reversal: checkboxStates.currentReversal || false,
      unexpected_consumption: checkboxStates.unexpectedConsumption || false,
      key_exchanged: checkboxStates.keyExchanged || false,
      bad_voltage_quality_l1: checkboxStates.badVoltageQualityL1 || false,
      external_alert: checkboxStates.externalAlert || false,
      local_communication_attempt: checkboxStates.localCommunicationAttempt || false,
      disconnect_reconnect_failure: checkboxStates.disconnectReconnectFailure || false,
  };

  axios.post(`${BASE_URL}/api/create-alarm-register2/`, dataToSend)
      .then(response => {
          console.log('Alarm Register 2 data sent successfully:', response.data);
      })
      .catch(error => {
          console.error('Error sending Alarm Register 2 data:', error.response || error);
      });
};
  

 

const handleSendAlarmFilter1 = () => {
  console.log("Sending Alarm Filter 1 data");

  const dataToSend = {
      device_id: deviceId,  // Replace with actual device ID
      code: '{1,0-0:97.98.1.255}',  // Default or dynamic code
      clock_invalid: checkboxStates.clockInvalid || false,
      battery_replace: checkboxStates.batteryReplace || false,
      program_memory_error: checkboxStates.programMemoryError || false,
      ram_error: checkboxStates.ramError || false,
      nv_memory_error: checkboxStates.nvMemoryError || false,
      measurement_system_error: checkboxStates.measurementSystemError || false,
      watchdog_error: checkboxStates.watchdogError || false,
      fraud_attempt: checkboxStates.fraudAttempt || false,
  };

  axios.post(`${BASE_URL}/api/create-alarm-filter1/`, dataToSend)
      .then(response => {
          console.log('Alarm Filter 1 data sent successfully:', response.data);
      })
      .catch(error => {
          console.error('Error sending Alarm Filter 1 data:', error.response || error);
      });
};
   



const handleSendAlarmFilter2 = () => {
  console.log("Sending Alarm Filter 2 data");

  const dataToSend = {
      device_id: deviceId,  // Replace with actual device ID
      code: '{1,0-0:97.98.1.255}',  // Default or dynamic code
      total_power_failure: checkboxStates.totalPowerFailure || false,
      power_resume: checkboxStates.powerResume || false,
      voltage_missing_L1: checkboxStates.voltageMissingL1 || false,
      voltage_normal_L1: checkboxStates.voltageNormalL1 || false,
      missing_neutral: checkboxStates.missingNeutral || false,
      phase_asymmetry: checkboxStates.phaseAsymmetry || false,
      current_reversal: checkboxStates.currentReversal || false,
      unexpected_consumption: checkboxStates.unexpectedConsumption || false,
      key_exchanged: checkboxStates.keyExchanged || false,
      bad_voltage_quality_L1: checkboxStates.badVoltageQualityL1 || false,
      external_alert: checkboxStates.externalAlert || false,
      local_communication_attempt: checkboxStates.localCommunicationAttempt || false,
      disconnect_reconnect_failure: checkboxStates.disconnectReconnectFailure || false,
  };

  axios.post(`${BASE_URL}/api/create-alarm-filter2/`, dataToSend)
      .then(response => {
          console.log('Alarm Filter 2 data sent successfully:', response.data);
      })
      .catch(error => {
          console.error('Error sending Alarm Filter 2 data:', error.response || error);
      });
};






const handleSendAlarmDescriptor1 = () => {
  console.log("Sending Alarm Descriptor 1 data",checkboxStates);


  const dataToSend = {
      device_id: deviceId,  // Replace with actual device ID
      code: '{1,0-0:97.98.20.255}',  // Default or dynamic code
      clock_invalid: checkboxStates.clockInvalid || false,  
      battery_replace: checkboxStates.batteryReplace || false,
      program_memory_error: checkboxStates.programMemoryError || false,
      ram_error: checkboxStates.ramError || false,
      nv_memory_error: checkboxStates.nvMemoryError || false,
      measurement_system_error: checkboxStates.measurementSystemError || false,
      watchdog_error: checkboxStates.watchdogError || false,
      fraud_attempt: checkboxStates.fraudAttempt || false,
  };

  console.log(dataToSend)

  axios.post(`${BASE_URL}/api/create-alarm-descriptor1/`, dataToSend)
      .then(response => {
          console.log('Alarm Descriptor 1 data sent successfully:', response.data);
      })
      .catch(error => {
          console.error('Error sending Alarm Descriptor 1 data:', error.response || error);
      });
};





const handleSendAlarmDescriptor2 = () => {
  console.log("Sending Alarm Descriptor 2 data");

  const dataToSend = {
      device_id: deviceId,  // Replace with actual device ID
      code: '{1,0-0:97.98.1.255}',  // Default or dynamic code
      total_power_failure: checkboxStates.totalPowerFailure || false,
      power_resume: checkboxStates.powerResume || false,
      voltage_missing_l1: checkboxStates.voltageMissingL1 || false,
      voltage_normal_l1: checkboxStates.voltageNormalL1 || false,
      missing_neutral: checkboxStates.missingNeutral || false,
      phase_asymmetry: checkboxStates.phaseAsymmetry || false,
      current_reversal: checkboxStates.currentReversal || false,
      unexpected_consumption: checkboxStates.unexpectedConsumption || false,
      key_exchanged: checkboxStates.keyExchanged || false,
      bad_voltage_quality_l1: checkboxStates.badVoltageQualityL1 || false,
      external_alert: checkboxStates.externalAlert || false,
      local_communication_attempt: checkboxStates.localCommunicationAttempt || false,
      disconnect_reconnect_failure: checkboxStates.disconnectReconnectFailure || false,
  };

  axios.post(`${BASE_URL}/api/create-alarm-descriptor2/`, dataToSend)
      .then(response => {
          console.log('Alarm Descriptor 2 data sent successfully:', response.data);
      })
      .catch(error => {
          console.error('Error sending Alarm Descriptor 2 data:', error.response || error);
      });
};
   







    const renderRegisterContent = () => {
        switch (selectedRegister) {


          case 'ErrorRegister1':
                return (
                    <div>
                       
                      
                        <table className='tableTariff1'>
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
                                    <td><input type="checkbox" /></td>
                                    <td>1</td>
                                    <td>Error Register 1</td>
                                    <td>1</td>
                                </tr>
                            </tbody>
                        </table>
                           <div className="options-grid">
  {checkboxListErrorRegister1.map((item, index) => (
    <div key={item.id || index}>
      <label className="option-label">
        <input
          type="checkbox"
          checked={item.checked}
          
          className="option-checkbox"
        />
        <span className="option-text">
          {item.name || item.replace(/([A-Z])/g, " $1")}
        </span>
      </label>
    </div>
  ))}
                         </div>
                      <button style={{marginLeft:"30%"}} className='scheduler-add-button' onClick={handleSendErrorRegister1}>Send Error Register 1</button>
                    </div>
                );
            case 'ErrorRegister2':
                return (
                    <div>  
                   
                        <table className='tableTariff1'>
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
                                    <td><input type="checkbox" /></td>
                                    <td>2</td>
                                    <td>Error Register 2</td>
                                    <td>2</td>
                                </tr>
                            </tbody>
                        </table>

                          <div className="options-grid">
  {checkboxListErrorRegister2.map((item, index) => (
    <div key={item.id || index}>
      <label className="option-label">
        <input
          type="checkbox"
          checked={item.checked}
          
          className="option-checkbox"
        />
        <span className="option-text">
          {item.name || item.replace(/([A-Z])/g, " $1")}
        </span>
      </label>
    </div>
  ))}
                         </div>

                          <button style={{marginLeft:"30%"}} className='scheduler-add-button' onClick={handleSendErrorRegister2}>Send Error Register 2</button>
                        
                    </div>
                );
            case 'AlarmRegister1':
                return (
                    <div>
                      
                     
                     
                      
                        <table className='tableTariff1'>
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
                                    <td><input type="checkbox" /></td>
                                    <td>1</td>
                                    <td>Alarm Register 1</td>
                                    <td>{`{1,0-0:97.98.0.255}`}</td>
                                </tr>
                            </tbody>
                        </table>

                        
                          <div className="options-grid">
  {checkboxListAlarmRegister1.map((item, index) => (
    <div key={item.id || index}>
      <label className="option-label">
        <input
          type="checkbox"
          checked={item.checked}
          
          className="option-checkbox"
        />
        <span className="option-text">
          {item.name || item.replace(/([A-Z])/g, " $1")}
        </span>
      </label>
    </div>
  ))}
                         </div>
                           <button style={{marginLeft:"30%"}} className='scheduler-add-button' onClick={handleSendAlarmRegister1}>Send Alarm Register 1</button>
                      
                    </div>
                );
            case 'AlarmRegister2':
                return (
                    <div className="register-content">
                       
                      
                        <table className='tableTariff1'>
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
                                    <td><input type="checkbox" /></td>
                                    <td>1</td>
                                    <td>Alarm Register 2</td>
                                    <td>{`{1,0-0:97.98.1.255}`}</td>
                                </tr>
                            </tbody>
                        </table>

                         
                          <div className="options-grid">
  {checkboxListAlarmRegister2.map((item, index) => (
    <div key={item.id || index}>
      <label className="option-label">
        <input
          type="checkbox"
          checked={item.checked}
          
          className="option-checkbox"
        />
        <span className="option-text">
          {item.name || item.replace(/([A-Z])/g, " $1")}
        </span>
      </label>
    </div>
  ))}
                         </div>
                       <button style={{marginLeft:"30%"}} className='scheduler-add-button'  onClick={handleSendAlarmRegister2}>Send Alarm Register 2</button>
                    
                    </div>
                );
            
           
            case 'AlarmFilter1':
                return (
                    <div>
                       
                        <table className="tableTariff1">
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
                                    <td><input type="checkbox" /></td>
                                    <td>1</td>
                                    <td>Alarm Filter 1</td>
                                    <td>{`{1,0-0:97.98.1.255}`}</td>
                                </tr>
                            </tbody>
                        </table>

                         <div className="options-grid">
  {checkboxListAlarmFilter1.map((item, index) => (
    <div key={item.id || index}>
      <label className="option-label">
        <input
          type="checkbox"
          checked={item.checked}
          
          className="option-checkbox"
        />
        <span className="option-text">
          {item.name || item.replace(/([A-Z])/g, " $1")}
        </span>
      </label>
    </div>
  ))}
                         </div>

                      <button  style={{marginLeft:"30%"}} className='scheduler-add-button' onClick={handleSendAlarmFilter1}>Send Alarm Filter 1</button>
                      
                      
                    </div>
                );
            case 'AlarmFilter2':
                return (
                    <div>
                       
                    
                        <table className='tableTariff1'>
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
                                    <td><input type="checkbox" /></td>
                                    <td>1</td>
                                    <td>Alarm Filter 2</td>
                                    <td>{`{1,0-0:97.98.1.255}`}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="options-grid">
  {checkboxListAlarmFilter2.map((item, index) => (
    <div key={item.id || index}>
      <label className="option-label">
        <input
          type="checkbox"
          checked={item.checked}
          
          className="option-checkbox"
        />
        <span className="option-text">
          {item.name || item.replace(/([A-Z])/g, " $1")}
        </span>
      </label>
    </div>
  ))}
                         </div>
                          <button  style={{marginLeft:"30%"}} className='scheduler-add-button' onClick={handleSendAlarmFilter2}>Send Alarm Filter 2</button>

                    </div>
                )
           case 'AlarmDescriptor1':
                  return (
                      <div>
                         
                          
                          <table className="tableTariff1">
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
                                      <td><input type="checkbox" /></td>
                                      <td>1</td>
                                      <td>Alarm Descriptor 1</td>
                                      <td>{`{1,0-0:97.98.20.255}`}</td>
                                  </tr>
                              </tbody>
                          </table>
                            <div className="options-grid">
  {checkboxListAlarmDescriptor1.map((item, index) => (
    <div key={item.id || index}>
      <label className="option-label">
        <input
          type="checkbox"
          checked={item.checked}
          
          className="option-checkbox"
        />
        <span className="option-text">
          {item.name || item.replace(/([A-Z])/g, " $1")}
        </span>
      </label>
    </div>
  ))}
                         </div>

                          <button style={{marginLeft:"30%"}} className='scheduler-add-button' onClick={handleSendAlarmDescriptor1}>Send Alarm Descriptor 1</button>
                        
                      </div>
                  );
            case 'AlarmDescriptor2':
                  return (
                      <div>
                          
                          
                          <table className="tableTariff1">
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
                                      <td><input type="checkbox" /></td>
                                      <td>1</td>
                                      <td>Alarm Descriptor 2</td>
                                      <td>{`{1,0-0:97.98.1.255}`}</td>
                                  </tr>
                              </tbody>
                          </table>

                                                      <div className="options-grid">
  {checkboxListAlarmDescriptor2.map((item, index) => (
    <div key={item.id || index}>
      <label className="option-label">
        <input
          type="checkbox"
          checked={item.checked}
          
          className="option-checkbox"
        />
        <span className="option-text">
          {item.name || item.replace(/([A-Z])/g, " $1")}
        </span>
      </label>
    </div>
  ))}
                         </div>
                          <button style={{marginLeft:"30%"}} className='scheduler-add-button' onClick={handleSendAlarmDescriptor2}>Send Alarm Descriptor 2</button>
                      </div>
                  );
           
                default:
                return <p>Please select a register.</p>;
        }
    };

    return (
        <div>
           

            <div
  className="view-toggle"
  role="tablist"
  aria-label="Register selection"
  style={{margin:'0.3%'}}
>
  <button
    type="button"
    role="tab"
    aria-pressed={selectedRegister === "ErrorRegister1"}
    className={`view-btn ${
      selectedRegister === "ErrorRegister1" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedRegister("ErrorRegister1");
      handleRegisterClick("ErrorRegister1");
    }}
  >
    Error Register 1
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={selectedRegister === "ErrorRegister2"}
    className={`view-btn ${
      selectedRegister === "ErrorRegister2" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedRegister("ErrorRegister2");
      handleRegisterClick("ErrorRegister2");
    }}
  >
    Error Register 2
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={selectedRegister === "AlarmRegister1"}
    className={`view-btn ${
      selectedRegister === "AlarmRegister1" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedRegister("AlarmRegister1");
      handleRegisterClick("AlarmRegister1");
    }}
  >
    Alarm Register 1
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={selectedRegister === "AlarmRegister2"}
    className={`view-btn ${
      selectedRegister === "AlarmRegister2" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedRegister("AlarmRegister2");
      handleRegisterClick("AlarmRegister2");
    }}
  >
    Alarm Register 2
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={selectedRegister === "AlarmFilter1"}
    className={`view-btn ${
      selectedRegister === "AlarmFilter1" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedRegister("AlarmFilter1");
      handleRegisterClick("AlarmFilter1");
    }}
  >
    Alarm Filter 1
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={selectedRegister === "AlarmFilter2"}
    className={`view-btn ${
      selectedRegister === "AlarmFilter2" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedRegister("AlarmFilter2");
      handleRegisterClick("AlarmFilter2");
    }}
  >
    Alarm Filter 2
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={selectedRegister === "AlarmDescriptor1"}
    className={`view-btn ${
      selectedRegister === "AlarmDescriptor1" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedRegister("AlarmDescriptor1");
      handleRegisterClick("AlarmDescriptor1");
    }}
  >
    Alarm Descriptor 1
  </button>

  <button
    type="button"
    role="tab"
    aria-pressed={selectedRegister === "AlarmDescriptor2"}
    className={`view-btn ${
      selectedRegister === "AlarmDescriptor2" ? "active" : ""
    }`}
    onClick={() => {
      setSelectedRegister("AlarmDescriptor2");
      handleRegisterClick("AlarmDescriptor2");
    }}
  >
    Alarm Descriptor 2
  </button>
</div>
            <div className="alarms-container">
                {renderRegisterContent()}
            </div>
        </div>
    );
};

export default RegisterData;
