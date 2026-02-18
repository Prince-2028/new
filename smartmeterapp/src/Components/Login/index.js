import './index.css';
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure


function Login() {
  const baseUrl = BASE_URL;
  const [serialNumber, setSerialNumber] = useState('');
  const [view, setView] = useState('login'); // 'login' or 'signup'
  const [userCode, setUserCode] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();


  
  





  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();

    const data = {
      user_code: userCode,
      serial_number: serialNumber,
    };

    try {
      const response = await axios.post(`${baseUrl}create_user/`, data);
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    const data = {
      username: account,
      password: password,
    };

    try {
      const response = await axios.post(`${baseUrl}login/`, data);

      if (response.status === 200) {

        setUserId(response.data.user_id);
        localStorage.setItem('userId', response.data.user_id);
        setAccount("")
        setUserCode("")
        setPassword("")
        setSerialNumber("")
        navigate('/dashboard');
      } else {
        console.error('Error:', response.status);
      }
    } catch (error) {
      setError(true);
      console.error('Error:', error.message);
    }
  };

  const toggleView = () => {
    setView(view === 'login' ? 'signup' : 'login');
    setMessage('');
    setError(false);
  };

  return (
    <>
      {view === 'login' && (
        <div className='loginContainer'>
          <div className='loginSubContainer'>
            <CgProfile style={{ fontSize: '100px', backgroundColor: 'orange', borderRadius: '100px' }} />
            <form onSubmit={handleLoginSubmit}>
              <div className='input_Container'>
                <label htmlFor="account">Account</label> <br />
                <input
                  className='input-box_1'
                  type="text"
                  id="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  required
                />

              </div>
              <div className='input_Container_2'>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  className='input-box'
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className='login_buttonContainer'>
                <button className='Loginbutton' type="submit">Login</button>
              </div>
            </form>
            {error && <h1 style={{ color: 'red', fontSize: '18px' }}>Invalid username and password</h1>}
            <p>Don't have an account? <span onClick={toggleView} className='toggle-link'>Sign up here</span></p>
          </div>
        </div>
      )}

      {view === 'signup' && (
        <div className='Container'>
          <div className='subContainer'>
            <h5 className='heading1'>Registration Verify</h5>
            <div>
              <img style={{ height: '200px' }} src='https://www.iconbunny.com/media/amasty/webp/catalog/product/cache/005ba24ee4633a59966e01b38bf9424f/1/6/164.2-register-icon-iconbunny_jpg.webp' />
            </div>
            <form onSubmit={handleRegistrationSubmit}>
              <div className='input_Container'>
                <label htmlFor="userCode">User Code:</label>
                <input
                  className='input-box_1'
                  type="text"
                  id="userCode"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  required
                />
              </div>
              <div className='input_Container_2'>
                <label htmlFor="serialNumber">Serial Number:</label>
                <input
                  type="text"
                  className='input-box'
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  required
                />
              </div>
              <div className='login_buttonContainer'>
                <button className='button' type="submit">Verify</button>
                <button className='button' type="button" onClick={toggleView}>Cancel</button>
              </div>
              <h1 style={{ color: 'red', fontSize: '18px' }}>{message}</h1>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Login;
