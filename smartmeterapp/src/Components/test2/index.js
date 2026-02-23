import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TbUserCode } from "react-icons/tb";
import myImage from '../../assets/serialnumber.jpg'; // Adjust the path as needed
import { FaUserAlt } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import { enterFullscreen } from '../../utils/fullscreen';

import './index.css';

function LoginSignup() {
  const baseUrl = BASE_URL;
  const [serialNumber, setSerialNumber] = useState('');
  const [view, setView] = useState('signup'); // 'login' or 'signup'
  const [userCode, setUserCode] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState(true);
  const [userId, setUserId] = useState('');
  
  const navigate = useNavigate();

  

  const generateUserCode = async () => {
   

    try {
      // endpoint: POST /api/step1-generate-code/
      const response = await axios.post(`${BASE_URL}/api/step1-generate-code/`, {});

      // log the whole response for debugging (optional)
      console.log("API response:", response);

      // adapt to the response shape you showed in your view
      const success = response?.data?.success;
      const code = response?.data?.user_code || response?.data?.userCode || "";

      if (success && code) {
        console.log("Generated user code:", code); // <-- requirement: print to console
        setUserCode(code);                          // set state
        localStorage.setItem("userCode", code);     // persist it (step saved)
        
        
      } else {
        const serverError = response?.data?.error || "Unknown server response";
        throw new Error(serverError);
      }
    } catch (err) {
      console.error("Generate user code failed:", err);
      setError(err.message || "Failed to generate user code");
    } 
  };



  const getSerialNumber1 = async (userCode)=> 
  {
    const data={
      "user_code": userCode

   
    }

    try 
    { 
     const response= await axios.post(`${BASE_URL}/api/step2-generate-serial/`, data) 

     const success = response?.data?.success;
     const serial_number = response?.data?.serial_number || response?.data?.serial_number || "";

      if (success && serial_number) {
        

        setSerialNumber(serial_number)    
                              // set state
        
      } else {
        const serverError = response?.data?.error || "Unknown server response";
        throw new Error(serverError);
      }


    }
    catch (err) 
    {
      console.error("Generate user code failed:", err);
      setError(err.message || "Failed to generate user code");
    }
  }

  // ✅ Redirect if already logged in
  useEffect(() => {
   
    const serialVerified=localStorage.getItem('serialVerified')
    console.log("serialVerified",serialVerified)
    if (serialVerified==="true") 
    {
      setView('login')
      setError(false)
    }
   
    else 
    {
      
      generateUserCode()
    }
  }, []);
  
  const handleRegistrationSubmit1 = async (e) => {
    e.preventDefault();

    const data = {
      user_code: userCode,
      serial_number: serialNumber,
    };

    try {
      const response = await axios.post(`${baseUrl}/create_user/`, data);
      setMessage(response.data.message);
      setView('login');
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.error);
      } else {
        setMessage('An error occurred. Please try again.');
      }
    }
  };
  


  
  const handleRegistrationSubmit = async (event) => {
   
     event.preventDefault()
    try {
      const payload = {
        user_code: userCode,
        serial_number: serialNumber,
      };

      console.log(userCode,serialNumber)

      // POST request to verification endpoint
      const res = await axios.post(
        `${BASE_URL}/api/step3-verify-serial/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Verify API response:", res);

      // adapt to your backend response structure
      // e.g. { success: true, message: "...", ... }
      const data = res?.data || {};
      if (data.success) {
       
        setMessage(data.message || "Serial verified successfully.");
        // optional: persist verification info
        
        localStorage.setItem("serialVerified", "true");
        setView('login')
      } else {
       
        const errMsg = data.error || data.message || "Verification failed";
        setMessage(errMsg);
        localStorage.setItem("serialVerified", "false");
      }
    } catch (err) {
      console.error("Verification request failed:", err);
     
      // prefer server error message if present
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        "Network or server error";
      setMessage(errMsg);
      localStorage.setItem("serialVerified", "false");
    } 
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    console.log('=== LOGIN SUBMIT STARTED ===');

    const data = {
      username: account,
      password: password,
    };

    try {
      const response = await axios.post(`${baseUrl}/login/`, data);

      if (response.status === 200) {
        console.log('Login successful, attempting fullscreen...');
        
        setUserId(response.data.user_id);
        setUserCode("")
        setAccount("")
        setPassword("")
        setSerialNumber("")
        
        localStorage.setItem('userId', response.data.user_id);
        localStorage.setItem('userRole', response.data.user_type);

        // Try to enter fullscreen immediately
        try {
          await enterFullscreen();
          console.log('Fullscreen activated, navigating...');
        } catch (err) {
          console.error('Fullscreen activation failed:', err);
        }

        // Navigate after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 200);
      } else {
        console.error('Error:', response.status);
      }
    } catch (error) {
      setError(true);
      console.error('Error:', error.message);
    }
  };



  return (
    <div className='login_Container'>
      <div className={`container ${view === 'signup' ? 's--signup' : ''}`}>
        <div className="form_login sign-in">
        <div className="form_inside_Container" > 
          <form  onSubmit={handleLoginSubmit}>
          <h2 className='Create_Account_heading'>Welcome</h2>
          <label className='login_label'>
          <span> Account </span>
          <div className="input-wrapper">
        
              <input className='login_input'
              
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
              />
              <FaUserAlt className="input-image" />
             </div>
            </label>
            <label className='login_label' >
              <span>Password</span>
              <div className="input-wrapper"> 
            
              <input
               className='login_input'
                type="password"
              
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
               
               <RiLockPasswordFill className="input-image"/>
               </div>
            </label>
           
            <button type="submit" className="Sign_in_button">Sign In</button>
          </form>
     
          {error && <h1 style={{ color: 'red', fontSize: '18px' }}>Invalid username and password</h1>}
         
        </div>
        </div>

        <div className="sub-container">
          <div className="image-container">
           
            
          </div>
  
          <div className="form_login sign-up"> 
          
           
           
            <form  className='form_inside_Container' onSubmit={handleRegistrationSubmit}>
            <h2 className='Create_Account_heading'>Create your Account</h2>
          
              <label  className='login_label'>
                <span>User Code</span>
            
                <div className="input-wrapper"> 
                <input readOnly
               className='login_input'

                  type="text"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  required
                />

                <TbUserCode className="input-image" />
                </div>
              </label>
              <label  className='login_label'>
                <span id='label_headings'>Serial Number</span>
                <div className="input-wrapper">
                <input
                 className='login_input'
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  required
                />
                
                 <img src={myImage} alt="serial number" className="input-image" />
                 </div>

                
              </label> 
              <div className='button_Container'> 
              <button type="submit" className="submit">Sign Up</button>
           
              </div>
              <h1 style={{ color: 'red', fontSize: '18px' }}>{message}</h1>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;
