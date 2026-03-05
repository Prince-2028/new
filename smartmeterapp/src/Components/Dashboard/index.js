import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import { CiCirclePlus } from 'react-icons/ci';
import { VscCopy } from 'react-icons/vsc';
import { MdEditDocument } from 'react-icons/md';
import { TiDelete } from 'react-icons/ti';
import { RiAccountCircleFill } from 'react-icons/ri';
import { IoOptionsOutline, IoLogOut } from 'react-icons/io5';
import { MdOutlineMessage } from 'react-icons/md';
import { TbFileSettings } from 'react-icons/tb';
import Port from '../Port';
import Logs from '../Logs';
import AddDevice from '../test1';
import Account from '../Account';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS } from '../../permissions';
import MessageLog from '../Message'
import Options from '../Options'
import logo from '../../assets/logo.png'
import { enterFullscreen } from '../../utils/fullscreen';
import ICModal from '../ICModal';


const Dashboard = () => {
    const [data, setData] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isPortPopupOpen, setIsPortPopupOpen] = useState(false);
    const [isLogsPopupOpen, setIsLogsPopupOpen] = useState(false);
    const [isMessagePopupOpen ,setIsMessagePopupOpen]=useState(false)
    const [isAddDevicePopupOpen, setIsAddDevicePopupOpen] = useState(false);
    const [isOptionPopupOpen , setIsOptionPopupOpen] = useState(false);
    const [isCopyPopupOpen, setIsCopyPopupOpen] = useState(false);
    const [isICModalOpen, setIsICModalOpen] = useState(false);
    const [currentIC, setCurrentIC] = useState(null);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const [selectedDeviceData, setSelectedDeviceData] = useState(null);
    const [selectedDeviceSerial, setSelectedDeviceSerial] = useState('');
    const navigate = useNavigate();

    const userId = localStorage.getItem('userId');
    console.log("selectedDeviceData",selectedDeviceId)

    // Ensure fullscreen on Dashboard mount and maintain it
    useEffect(() => {
        console.log('Dashboard mounted, setting up fullscreen handler...');
        
        let hasEnteredFullscreen = false;

        // Function to enter fullscreen on first user interaction
        const handleFirstInteraction = () => {
            if (!hasEnteredFullscreen) {
                console.log('First user interaction detected, entering fullscreen...');
                enterFullscreen()
                    .then(() => {
                        hasEnteredFullscreen = true;
                        console.log('✓ Fullscreen entered successfully');
                    })
                    .catch(err => {
                        console.log('Fullscreen failed:', err);
                    });
            }
        };

        // Function to maintain fullscreen on subsequent interactions
        const maintainFullscreen = () => {
            if (hasEnteredFullscreen) {
                const isInFullscreen = !!(
                    document.fullscreenElement ||
                    document.webkitFullscreenElement ||
                    document.mozFullScreenElement ||
                    document.msFullscreenElement
                );
                
                if (!isInFullscreen) {
                    console.log('Not in fullscreen, re-entering...');
                    enterFullscreen().catch(err => {
                        console.log('Failed to maintain fullscreen:', err);
                    });
                }
            }
        };

        // Listen for first click to enter fullscreen
        document.addEventListener('click', handleFirstInteraction, { once: true, capture: true });
        
        // Listen for subsequent clicks to maintain fullscreen
        document.addEventListener('click', maintainFullscreen, { capture: true });

        return () => {
            document.removeEventListener('click', handleFirstInteraction, { capture: true });
            document.removeEventListener('click', maintainFullscreen, { capture: true });
        };
    }, []);

    const openPortPopup = () => {
    if (!selectedDeviceId) {
      return alert('Please select a device first!');
    }
    
    // Find the selected device and save its serial number to localStorage
    const device = data.find(d => d.id === selectedDeviceId);
    if (device) {
      localStorage.setItem('selectedSerialNumber', device.serial_number);
      console.log('Saved serial number to localStorage:', device.serial_number);
    }
    
    setIsPortPopupOpen(true);
  };

    const role = localStorage.getItem('userRole');
    const perms = PERMISSIONS[role] || {};
  
    console.log(perms)



  useEffect(() => {
    const selectedDeviceId = localStorage.getItem('selectedDeviceId');
    if (selectedDeviceId) {
      // Small delay to ensure React Router is fully initialized
      const timer = setTimeout(() => {
        console.log('Auto-navigating to /dashboard/header with device:', selectedDeviceId);
        navigate('/dashboard/header', { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [navigate]);


    const fetchUserDevices = async () => {
        if (!userId) {
            alert('User ID is required.');
            return;
        }

        try {
            const response = await axios.get(`${BASE_URL}/get-user-devices/`, {
                params: { user_id: userId }
            });
            setData(response.data.devices || []);
            console.log(response.data)
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    useEffect(() => {
        fetchUserDevices();
    }, []);

    const closePortPopup = () => setIsPortPopupOpen(false);
    const closeAddDevicePopup = () => {
        setIsAddDevicePopupOpen(false);
        fetchUserDevices();
    };
    const closePopup = () => setIsPopupOpen(false);
    const closeLogPopup = () => setIsLogsPopupOpen(false);
    const closeMessagePopup = ()=> setIsMessagePopupOpen(false)
    const closeOptionPopup = ()=> setIsOptionPopupOpen(false) 

    const handleDelete = async () => {
        if (!selectedDeviceId) {
            alert('No device selected for deletion.');
            return;
        }

        const confirmDelete = window.confirm('Are you sure you want to delete this device?');

        if (!confirmDelete) {
            return;
        }

        try {
            await axios.delete(`${BASE_URL}/delete-device/`, {
                data: { device_id: selectedDeviceId }
            });
            fetchUserDevices();
            setSelectedDeviceId(null);
            setSelectedDeviceData(null);
        } catch (error) {
            console.error('Error deleting device:', error);
        }
    };

    const handleEdit = () => {
        if (!selectedDeviceId) {
            alert('No device selected for editing.');
            return;
        }
        const device = data.find(d => d.id === selectedDeviceId);

        setSelectedDeviceData(device);
        setIsAddDevicePopupOpen(true);
    };

    const handleAddClick = () => {
        setSelectedDeviceData(null); // Clear any selected device data
        setIsAddDevicePopupOpen(true); // Open the popup for adding a new device
    };

    const handleCopy = async() => {
        if (!selectedDeviceId) {
            alert('No device selected for copying.');
            return;
        }
        const device = data.find(d => d.id === selectedDeviceId);
        setSelectedDeviceSerial(device.serial_number);
        setIsCopyPopupOpen(true);
        const confirmCopy = window.confirm(`Are you sure you want to copy this device with Serial Number: ${device.serial_number}?`);

        if (!confirmCopy) {
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/copy-device/`, {
                device_id: selectedDeviceId,
                user_id: userId
            });
            
            console.log(response.data)
            
            if (response.data.message === 'Device copied successfully') {
                fetchUserDevices(); // Refresh the device list
                alert('Device copied successfully.');
            } else {
                alert('Error copying device: ' + response.data.error);
            }
        } catch (err) {
            console.error('Error copying device:', err);
            alert('Error copying device.');
        } finally {
            setIsCopyPopupOpen(false);
        }
    };

    const handleIC = async () => {
        try {
            // First, get the current IC value
            const getResponse = await axios.get(`${BASE_URL}/invocation-counter/`);
            const currentICValue = getResponse.data.current_ic;
            
            // Open custom modal instead of window.prompt
            setCurrentIC(currentICValue);
            setIsICModalOpen(true);
        } catch (err) {
            console.error('Error getting IC:', err);
            alert('Error: ' + (err.response?.data?.error || 'Failed to get IC value.'));
        }
    };

    const handleICSubmit = async (icValue) => {
        try {
            // Update the IC value in dlms_helper.py
            const postResponse = await axios.post(`${BASE_URL}/invocation-counter/`, {
                ic_value: icValue
            });
            
            alert(postResponse.data.message);
            setIsICModalOpen(false);
        } catch (err) {
            console.error('Error updating IC:', err);
            alert('Error: ' + (err.response?.data?.error || 'Failed to update IC value.'));
        }
    };

    const handleRowClick = (item) => {
        // Save device ID and serial number in localStorage
        localStorage.setItem('selectedDeviceId', item.id);
        localStorage.setItem('selectedSerialNumber', item.serial_number);

        
    
        // Navigate to /dashboard/header
        navigate('/dashboard/header');
      };

     



    const handleLogout = () => {
        console.log("hello1")
    localStorage.removeItem('userId'); // clear the selected device only
    navigate('/'); // redirect to login
        };

    
 


     
    

    return (
        <div className='dashboardContainer'>
             
            <div className='HeaderOption'>

                
             <div className='logo-wrap'> 
                <img 
                    src={logo}
                    alt="Aviconn"
                    className="aviconn-logo"
                    
                />
                </div>
        
      
               

               

                {perms.manageAccounts && (




               
               
               
               <div className="action-item" onClick={() => setIsPopupOpen(true)}>
                    <RiAccountCircleFill style={{ fontSize: '25px', backgroundColor: '#739deb', borderRadius: '10px', color: 'white' }} className="icon" />
                    <span style={{ marginLeft: '3px', fontWeight: '600' }}>Account</span>
                </div>
                 )}

                <div className="action-item" onClick={openPortPopup}>
                    <IoOptionsOutline style={{ fontSize: '27px' }} className="icon" />
                    <span style={{ marginLeft: '3px', fontWeight: '600' }}>Port</span>
                </div>

                

                


                <div className="action-item" style={{ cursor: 'pointer' }}>
                    <MdOutlineMessage style={{ fontSize: '25px' }} className="icon" onClick={() => setIsMessagePopupOpen(true)} />
                    <span style={{ marginLeft: '3px', fontWeight: '600' }}>Message</span>
                </div>
                <div className="action-item" style={{ cursor: 'pointer' }} onClick={() => setIsLogsPopupOpen(true)}>
                    <TiDelete style={{ fontSize: '20px', color: 'red' }} className="icon" />
                    <span style={{ marginLeft: '3px', fontWeight: '600' }}>Logs</span>
                </div>
                <div className="action-item" style={{ cursor: 'pointer'   }} onClick={() => setIsOptionPopupOpen(true)}>
                    <TbFileSettings style={{ fontSize: '25px' }} className="icon" />
                    <span style={{ marginLeft: '3px', fontWeight: '600' }}>Options</span>
                </div>
                <div onClick={handleLogout} className="action-item" style={{ cursor: 'pointer' }}>
                    <IoLogOut   style={{ fontSize: '27px', color: 'red' }} className="icon" />
                    <span style={{ marginLeft: '3px', fontWeight: '600' }}> Logout </span>
                </div>
            </div>



   





            <div className='iconTableContainer border-effect'>
              
             
                <div id='addDeviceContainer'>
                    <h2>Device List</h2>
                     {(role === 'Programmer' || role === 'Administrator') && (
                    <div className='addDeviceOption'>

                        {perms.addDevice && (
              
                
                        <div id="device_action" className="action-item" onClick={handleAddClick}>
                            <CiCirclePlus className="icon add-icon" style={{ fontSize: '20px' }} />
                            <span>Add</span>
                        </div>
                         )}

                         {perms.copyDevice && (
                        <div id="device_action" className="action-item" onClick={handleCopy}>
                            <VscCopy className="icon copy-icon" style={{ fontSize: '20px' }} />
                            <span>Copy</span>
                        </div>
                         )}

                         {perms.editDevice && (
                        <div id="device_action" className="action-item" onClick={handleEdit}>
                            <MdEditDocument className="icon edit-icon" style={{ fontSize: '20px' }} />
                            <span>Edit</span>
                        </div>
                         )}

                          {perms.deleteDevice && (

                        <div id="device_action" className="action-item" onClick={handleDelete}>
                            <TiDelete className="icon delete-icon" style={{ fontSize: '20px' }} />
                            <span>Remove</span>
                        </div>
                          )}
                        
                        <div id="device_action" className="action-item" onClick={handleIC}>
                            <TbFileSettings className="icon" style={{ fontSize: '20px', color: '#4CAF50' }} />
                            <span>IC</span>
                        </div>
                    </div>
                     )}
                </div>
             

                {isPopupOpen && <Account closePopup={closePopup} />}
               

                 {isPortPopupOpen && (<Port deviceId={selectedDeviceId} 
                 closePortPopup={closePortPopup}
                 /> )}


                {isLogsPopupOpen && <Logs closeLogPopup={closeLogPopup} />}
                {isMessagePopupOpen && <MessageLog closeMessagePopup={closeMessagePopup}/>}
                {isAddDevicePopupOpen && <AddDevice closeAdddevicePopup={closeAddDevicePopup} deviceData={selectedDeviceData} />}
                {isOptionPopupOpen && <Options onClose={closeOptionPopup}/>}
                <ICModal 
                    isOpen={isICModalOpen}
                    onClose={() => setIsICModalOpen(false)}
                    currentIC={currentIC}
                    onSubmit={handleICSubmit}
                />
        

                <table className="dashboardTable">
                    <thead>
                        <tr>
                            <th className='space'> </th>
                            <th className="no">No</th>
                            <th className="meter-number">Meter Type</th>
                            <th className="serial-number">Serial Number</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                           
                                                    <tr
                            key={item.id}
                            
                            onClick={() => setSelectedDeviceId(item.id)} // Single click: only select row
                            onDoubleClick={() => handleRowClick(item)}  // Double click: save to localStorage and navigate
                            id={selectedDeviceId === item.id ? 'selected_item' : ''}
                            >
                            <td> </td>
                            <td>{index + 1}.</td>
                            <td>{item.meter_type}</td>
                            <td>{item.serial_number}</td>
                            </tr>



                            
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
