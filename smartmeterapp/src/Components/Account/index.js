import React, { useState, useEffect } from 'react';
import './account.css';
import { IoIosCloseCircle } from "react-icons/io";
import axios from 'axios';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import { PERMISSIONS } from '../../permissions';

const Account = ({ closePopup }) => {
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [isModifyPopupOpen, setIsModifyPopupOpen] = useState(false);
  const [isChangePasswordPopupOpen, setIsChangePasswordPopupOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const role = localStorage.getItem('userRole');
  const perms = PERMISSIONS[role] || {};
  let userId = localStorage.getItem('userId')

  const [newUser, setNewUser] = useState({
    id: userId,
    username: '',
    password: '',
    confirmPassword: '',
    role: '',
  });

  const [modifyUser, setModifyUser] = useState({
    id: '',
    username: '',
    role: '',
  });

  const [passwordData, setPasswordData] = useState({
    id: '',
    password: '',
    confirmPassword: ''
  });
  const baseUrl = BASE_URL;



  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);





  useEffect(() => {
    GetUsers();
    fetchRoles();
  }, []);

  // <-- 2. NEW FUNCTION TO FETCH ROLES -->
  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${baseUrl}/roles/`);
      if (response.status === 200) {
        setRoles(response.data); // Store the roles in state
        console.log('Successfully fetched roles:', response.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error.message);
      // You might want to show an error message to the user here
    }
  };

  const GetUsers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/get_users/`, {
        params: { id: userId }
      });

      if (response.status === 200) {
        console.log('Success:', response.data);
        const { created_by, users } = response.data;

        const allUsers = [
          {
            id: created_by.id,
            username: created_by.username,
            password: created_by.password,
            role: created_by.user_type
          },
          ...users.map(user => ({
            id: user.id,
            username: user.username,
            password: user.password,
            role: user.user_type
          }))
        ];

        setUsers(allUsers);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };



  const closePopupOutside = (e) => {
    if (e.target.className === 'popup') {

      closePopup()
    }
    if (e.target.className === 'adduser-popup') {
      setIsAddPopupOpen(false)

    }
    if (e.target.className === 'modifyuser-popup') {
      setIsModifyPopupOpen(false)
    }
    if (e.target.className === "changepassword-popup") {
      setIsChangePasswordPopupOpen(false)
    }

  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
  };

  const handleAddButtonClick = () => {
    setIsAddPopupOpen(true);
  };

  const handleModifyButtonClick = () => {
    if (!selectedUser) {
      alert("Please select a user to modify.");
      return;
    }
    setModifyUser({
      id: selectedUser.id,
      username: selectedUser.username,
      role: selectedUser.role
    });
    setIsModifyPopupOpen(true);
  };

  const handleChangePasswordButtonClick1 = () => {
    if (!selectedUser) {
      alert("Please select a user to change password.");
      return;
    }
    setPasswordData({
      id: selectedUser.id,
      password: '',
      confirmPassword: ''
    });
    setIsChangePasswordPopupOpen(true);
  };
  const handleChangePasswordButtonClick = () => {
    // Programmer changes their own password
    if (role === 'Programmer') {
      setPasswordData({
        id: userId,
        password: '',
        confirmPassword: ''
      });

      setIsChangePasswordPopupOpen(true);
      return;
    }

    // Administrator changes selected user's password
    if (!selectedUser) {
      alert("Please select a user to change password.");
      return;
    }

    setPasswordData({
      id: selectedUser.id,
      password: '',
      confirmPassword: ''
    });

    setIsChangePasswordPopupOpen(true);
  };
  const handleInputChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prevState => ({ ...prevState, [name]: value }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post(`${baseUrl}/add_user/`, newUser);

      console.log('Add User Response:', response.data);
      setIsAddPopupOpen(false);
      setNewUser({ id: "2", username: '', password: '', confirmPassword: '', role: '' });
      GetUsers();
    } catch (error) {
      console.error('Error adding user:', error.message);
    }
  };

  const handleModifyUser = async (e) => {
    e.preventDefault();

    console.log(modifyUser)

    try {
      const response = await axios.put(`${baseUrl}/get_users/`, modifyUser);

      console.log('Modify User Response:', response.data);
      setIsModifyPopupOpen(false);
      setSelectedUser(null);
      GetUsers();
    } catch (error) {
      console.error('Error modifying user:', error.message);
    }
  };


  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.put(`${baseUrl}/get_users/`, {
        id: passwordData.id,
        password: passwordData.password
      });

      console.log('Change Password Response:', response.data);
      setIsChangePasswordPopupOpen(false);
      setSelectedUser(null);
      GetUsers();
    } catch (error) {
      console.error('Error changing password:', error.message);
    }
  };







  const handleDeleteUser = async () => {
    if (!selectedUser) {
      alert("Please select a user to delete.");
      return;
    }

    try {
      const response = await axios.delete(`${baseUrl}/delete_user/`, {
        data: { id: selectedUser.id }
      });
      console.log('Delete User Response:', response.data);

      setSelectedUser(null);
      GetUsers();
    } catch (error) {
      console.error('Error deleting user:', error.message);
    }
  };

  return (
    <div className="popup" onClick={closePopupOutside}>
      <div className='popup-container'>
        <div className='Accountheading'>
          <h1 style={{ fontSize: '18px', marginLeft: '5px' }}>Account</h1>
          <IoIosCloseCircle onClick={() => closePopup()} style={{ fontSize: '30px' }} />
        </div>
        <div className="popup-inner">
          <div className="table_info">
            <table className='AccountTable'>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    onClick={() => handleRowClick(user)}
                    id={selectedUser && selectedUser.id === user.id ? 'selected' : ''}
                  >
                    <td>{index + 1}</td>
                    <td>{user.username}</td>
                    <td style={{ fontWeight: '680' }}>{'*'.repeat(user.password.length)}</td>
                    <td>{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="user-actions">

            {perms.manageAccounts && (
              <>
                <div>
                  <button
                    className="Account_button"
                    onClick={handleAddButtonClick}
                  >
                    Add
                  </button>
                </div>

                <div>
                  <button
                    className="Account_button"
                    onClick={handleModifyButtonClick}
                  >
                    Modify
                  </button>
                </div>
              </>
            )}

            {perms.changePassword && (
              <div>
                <button
                  className="Account_button"
                  onClick={handleChangePasswordButtonClick}
                >
                  Change Password
                </button>
              </div>
            )}

            {perms.manageAccounts && (
              <div>
                <button
                  className="Account_button"
                  onClick={handleDeleteUser}
                >
                  Delete
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {isAddPopupOpen && (
        <div className='adduser-popup' onClick={closePopupOutside}>
          <div className='popup-form'>
            <h2 className='Add_account_heading'>Add Account</h2>

            <form className='form' onSubmit={handleAddUser}>
              <label id="label_password"> Enter your Username:</label>


              <input placeholder='Username' type="text" name="username" value={newUser.username} onChange={(e) => handleInputChange(e, setNewUser)} required />

              <label id="label_password">Enter the Password:</label>
              <div className='password-wrapper'>


                <input inputMode="text" placeholder='password' type={showPassword ? "text" : "password"} name="password" value={newUser.password} onChange={(e) => handleInputChange(e, setNewUser)} required />
                <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <IoMdEye /> : <IoMdEyeOff />}
                </span>

              </div>



              <label id="label_password">Confirm Password:</label>




              <div className="password-input-container">

                <input inputMode="text" type={showConfirmPassword ? "text" : "password"} placeholder='confirmPassword' name="confirmPassword" value={newUser.confirmPassword} onChange={(e) => handleInputChange(e, setNewUser)} required />
                <span className="password-toggle-icon-Adduser" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <IoMdEye /> : <IoMdEyeOff />}
                </span>
              </div>




              <label id="label_password" >Role:</label>


              <select name="role" value={newUser.role} onChange={(e) => handleInputChange(e, setNewUser)} required>
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>



              <div className='buttonsContainer'>
                <button className='save_cancel_button' type="submit">Save</button>
                <button className='save_cancel_button' type="button" onClick={() => setIsAddPopupOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {isModifyPopupOpen && (
        <div className='modifyuser-popup' onClick={closePopupOutside}>
          <div className="popup-form">
            <h2 className='Add_account_heading'>Modify User</h2>
            <form className='form' onSubmit={handleModifyUser}>

              <label id="label_password" > Enter your Username:</label>
              <input type="text" name="username" value={modifyUser.username} onChange={(e) => handleInputChange(e, setModifyUser)} required />
              <label id="label_password" >Role:</label>

              <select name="role" value={modifyUser.role} onChange={(e) => handleInputChange(e, setModifyUser)} required>

                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <div className='buttonsContainer'>
                <button className='save_cancel_button' type="submit">Save</button>
                <button className='save_cancel_button' type="button" onClick={() => setIsModifyPopupOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isChangePasswordPopupOpen && (
        <div className='changepassword-popup' onClick={closePopupOutside}>
          <div className="popup-form">
            <h2 className='Add_account_heading'> Change Password</h2>
            <form className='form' onSubmit={handleChangePassword}>



              <label id="label_password" >  Password:</label>
              <div className='password-wrapper'>

                <input placeholder='Password' type={showPassword ? "text" : "password"} name="password" value={passwordData.password} onChange={(e) => handleInputChange(e, setPasswordData)} required />



                <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <IoMdEye /> : <IoMdEyeOff />}
                </span>
              </div>




              <label id="label_password">Confirm Password:</label>
              <div className="password-input-container">

                <input type={showConfirmPassword ? "text" : "password"} placeholder='Confirm Password' name="confirmPassword" value={passwordData.confirmPassword} onChange={(e) => handleInputChange(e, setPasswordData)} required />
                <span className="password-toggle-icon2" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <IoMdEye /> : <IoMdEyeOff />}
                </span>
              </div>













              <div className='buttonsContainer'>
                <button className='save_cancel_button' type="submit">Save</button>
                <button className='save_cancel_button' type="button" onClick={() => setIsChangePasswordPopupOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};

export default Account;
