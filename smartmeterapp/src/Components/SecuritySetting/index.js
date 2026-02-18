import React, { useState,useEffect} from 'react';
import axios from 'axios';
import './index.css';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure

function SecuritySettings() {
    const [securitySettings, setSecuritySettings] = useState({
        device_id: 1, // Default device_id (in snake_case)
        security_policy: '',
        security_suite: '',
        client_system_title: '',
        server_system_title: '',
        security_activate_method: '',
        old_master_key: '',
        global_unicast_key: '',
        global_broadcast_key: '',
        authentication_key: '',
        new_master_key: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSecuritySettings({ ...securitySettings, [name]: value });
    };


    
        
        const [deviceId, setDeviceId] = useState(() => localStorage.getItem('selectedDeviceId'));
           
            useEffect(() => {
              const storedId = localStorage.getItem('selectedDeviceId');
              setDeviceId(storedId);
            }, []);



    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if any field is empty
        const missingFields = Object.entries(securitySettings).filter(([key, value]) => !value && key !== 'device_id');
        if (missingFields.length > 0) {
            alert("Please fill in all the fields.");
            return;
        }

        try {
            // Send data to backend with the correct format
            const response = await axios.post(`${BASE_URL}/api/add-security-settings/`, securitySettings, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Show success message if data is saved or updated successfully
            alert(response.data.message || 'Data saved successfully.');

            // Optionally clear the form
            setSecuritySettings({
                device_id: deviceId, // Retain the device_id
                security_policy: '',
                security_suite: '',
                client_system_title: '',
                server_system_title: '',
                security_activate_method: '',
                old_master_key: '',
                global_unicast_key: '',
                global_broadcast_key: '',
                authentication_key: '',
                new_master_key: ''
            });

        } catch (error) {
            // Show error message in case of failure
            alert("An error occurred. Please try again.");
        }
    };

    const securityOptions = [
  { value: 0, label: "Nothing" },
  { value: 1, label: "All messages to be authenticated" },
  { value: 2, label: "All messages to be encrypted" },
  { value: 3, label: "All messages to be authenticated and encrypted" },
];
    return (
        <div className="load-control-container-securitySetting">
           

            <form onSubmit={handleSubmit} className="security-form">
                <label>
                    <input type="checkbox" />
                    <span>Security Policy:</span>
                 
     
      <select
      
        name="security_policy"
        value={securitySettings.security_policy}
        onChange={handleChange}
      >
        {securityOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            ({opt.value}) {opt.label}
          </option>
        ))}
      </select>
        </label>
                
                <label>
                    <input type="checkbox" />
                    <span>Security Suite:</span>
                    <input
                        type="text"
                        name="security_suite"
                        value={securitySettings.security_suite}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    <input type="checkbox" />
                    <span>Client System Title:</span>
                    <input
                        type="text"
                        name="client_system_title"
                        value={securitySettings.client_system_title}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    <input type="checkbox" />
                    <span>Server System Title:</span>
                    <input
                        type="text"
                        name="server_system_title"
                        value={securitySettings.server_system_title}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    <input type="checkbox" />
                    <span>Security Activate (Method):</span>
                   <select
  name="security_policy"
  value={securitySettings.security_policy}
  onChange={handleChange}
>
  {securityOptions.map((opt) => (
    <option key={opt.value} value={opt.value}>
      ({opt.value}) {opt.label}
    </option>
  ))} </select>
                </label>

                

               

                <div className="section-header">

                    <div className='ppp-heading1'> 
                    <input type="checkbox" />
                    <span>Global Key Transfer (Method):</span>
                    </div>
                    
                
                
                <label className="key-transfer">
                    <span>Old Master Key:</span>
                    <input
                        type="text"
                        name="old_master_key"
                        value={securitySettings.old_master_key}
                        onChange={handleChange}
                    />
                </label>

                <label className="key-transfer">
                    <span>Global Unicast Key:</span>
                    <input
                        type="text"
                        name="global_unicast_key"
                        value={securitySettings.global_unicast_key}
                        onChange={handleChange}
                    />
                </label>

                <label className="key-transfer">
                    <span>Global Broadcast Key:</span>
                    <input
                        type="text"
                        name="global_broadcast_key"
                        value={securitySettings.global_broadcast_key}
                        onChange={handleChange}
                    />
                </label>

                <label className="key-transfer">
                    <span>Authentication Key:</span>
                    <input
                        type="text"
                        name="authentication_key"
                        value={securitySettings.authentication_key}
                        onChange={handleChange}
                    />
                </label>

                <label className="key-transfer">
                    <span>New Master Key:</span>
                    <input
                        type="text"
                        name="new_master_key"
                        value={securitySettings.new_master_key}
                        onChange={handleChange}
                    />
                </label>

            </div>

                <button type="submit">Submit</button>
            </form>
        </div>
    );
}

export default SecuritySettings;
