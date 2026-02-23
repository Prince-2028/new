// src/Components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import './index.css'
import { VscDebugDisconnect } from "react-icons/vsc";
import Header from "../Header";
import BillingSection from '../BillingSection';
import LoadProfileSection from '../ProfileLoadSection';
import EventLogSection from '../EventLog';
import ExecuteSection from '../Execute';
import ImageTransferSection from '../ImageTransfer'
import { redirect, useNavigate } from 'react-router-dom';

import { TiDelete } from 'react-icons/ti';
import { RiAccountCircleFill } from 'react-icons/ri';
import { IoOptionsOutline, IoLogOut } from 'react-icons/io5';
import { MdOutlineMessage } from 'react-icons/md';
import { TbFileSettings } from 'react-icons/tb';



import Mobile from '../../assets/mobile.png'; // Adjust the path as needed
import  lineChart  from "../../assets/linechart.png";
import timemoney  from '../../assets/timemoney.png'
import edit from '../../assets/edit.png' 
import mobileupload from '../../assets/mobileupload.png'
import executeIcon from  '../../assets/execute.png'
import { PERMISSIONS } from '../../permissions';
import logo from '../../assets/logo.png'
import { enterFullscreen } from '../../utils/fullscreen';

const ICONS = [
  { key: 'header',  src: Mobile,        title: 'Mobile / Header',       aria: 'show header' },
  { key: 'billing', src: timemoney,     title: 'Billing',               aria: 'show billing' },
  { key: 'load',    src: lineChart,     title: 'Load Profile',          aria: 'show load profile' },
  { key: 'event',   src: edit,          title: 'Event Log / Edit',      aria: 'show event log' },
  { key: 'execute', src: executeIcon,      title: 'Execute / Others',      aria: 'show execute' },
  { key: 'image',   src: mobileupload,  title: 'Image Transfer',        aria: 'show image transfer' },

];

export default function DashboardTwo({
  // optional props you already referenced in your snippet
  
  openPortPopup = () => {},
  handleLogout = () => {},
  setIsPopupOpen = () => {},
  setIsLogsPopupOpen = () => {},
}) {
  const [active, setActive] = useState('header'); // default shown panel

  const role = localStorage.getItem('userRole');
  const perms = PERMISSIONS[role] || {};
   const navigate = useNavigate(); 
     
  // Ensure fullscreen on DashboardTwo mount
  useEffect(() => {
    console.log('DashboardTwo mounted, attempting fullscreen...');
    enterFullscreen().catch(err => {
      console.log('DashboardTwo fullscreen failed:', err);
    });
  }, []);

  const renderPanel = () => {
    switch (active) {
      case 'header':  return <Header />;
      case 'billing': return <BillingSection />;
      case 'load':    return <LoadProfileSection />;
      case 'event':   return <EventLogSection />;
      case 'image':   return <ImageTransferSection />;
      case 'execute': return <ExecuteSection />;
      default:        return <div />; // fallback
    }
  };

 
  const handleDisconnect = () => {
    // Remove the selected device ID and serial number
    localStorage.removeItem('selectedDeviceId');
    localStorage.removeItem('selectedSerialNumber');

    // Navigate to the dashboard
    navigate('/dashboard');
  };

  return (
    <div className="dashboardContainer" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top action bar (kept from your snippet) */}
     

       <div className='HeaderOption'>

        <div class="logo-wrap">
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
                          <MdOutlineMessage style={{ fontSize: '25px' }} className="icon" />
                          <span style={{ marginLeft: '3px', fontWeight: '600' }}>Message</span>
                      </div>
                      <div className="action-item" style={{ cursor: 'pointer' }} onClick={() => setIsLogsPopupOpen(true)}>
                          <TiDelete style={{ fontSize: '20px', color: 'red' }} className="icon" />
                          <span style={{ marginLeft: '3px', fontWeight: '600' }}>Logs</span>
                      </div>
                      <div className="action-item" style={{ cursor: 'pointer' }}>
                          <TbFileSettings style={{ fontSize: '25px' }} className="icon" />
                          <span style={{ marginLeft: '3px', fontWeight: '600' }}>Options</span>
                      </div>
                      <div onClick={handleLogout} className="action-item" style={{ cursor: 'pointer' }}>
                          <IoLogOut   style={{ fontSize: '27px', color: 'red' }} className="icon" />
                          <span style={{ marginLeft: '3px', fontWeight: '600' }}> Logout </span>
                      </div>
                        <div className="action-item" onClick={handleDisconnect}>
                          <VscDebugDisconnect style={{ fontSize: '27px' }} className="icon" />
                          <span style={{ marginLeft: '3px', fontWeight: '600' }}>Disconnect</span>
                      </div>
                  </div>

      {/* Main area: sidebar + content */}
      <div>
        {/* Sidebar */}
        <aside className="sidebar" style={{ width:'5%', borderRight: '1px solid #eee', padding: 10, boxSizing: 'border-box',marginTop:"6%" }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {ICONS.map(icon => (
              <button
                key={icon.key}
                onClick={() => setActive(icon.key)}
                title={icon.title}
                aria-label={icon.aria}
                style={{
                  width:'90%',
                  height: '90%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding:4,
                  border: 'none',
                  background: active === icon.key ? '#f0f0f0' : 'transparent',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                <img src={icon.src} alt={icon.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </button>
            ))}
          </div>
        </aside>



        {/* Content area */}
        <div className="mainArea">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}
