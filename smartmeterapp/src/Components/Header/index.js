import React, { useState } from "react";
import { VscDebugDisconnect } from "react-icons/vsc";
import Mobile from '../../assets/mobile.png'; // Adjust the path as needed
import  lineChart  from "../../assets/linechart.png";
import timemoney  from '../../assets/timemoney.png'
import edit from '../../assets/edit.png' 
import mobileupload from '../../assets/mobileupload.png'


           


import MeterInfo from '../MeterInfo'
import ThresholdTable from '../Threshold'
import TimeSettingsChart from '../Clock/clock.js'
import Tariff from '../Tariff/tariff.js'
import RegisterLimiter from '../RegisterLimiter'
import SecuritySettings from "../SecuritySetting/index.js";
import PushSetup from "../PushSetup/index.js";
import Scheduler from '../Scheduler/index.js'
import NetworkControl from '../NetworkControl/index.js'
import Diagnose from '../Diagnose/index.js'
import ProfileConfigure from '../ProfileConfigure/index.js'
import RegisterData from '../Alarms/index.js'
import EventReportFilter from '../EventFilter/index.js'
import Billing from '../Billing/index.js'
import Payment from '../payment'
import Display from "../Display/index.js";
import Relay from '../Relay'
import { PERMISSIONS } from '../../permissions';
import "./Header.css";
import { redirect, useNavigate } from 'react-router-dom';

const Header = () => {
  const [selectedDashboard, setSelectedDashboard] = useState("Meter Basic Information");
  const navigate = useNavigate();

  const handleCheckboxChange = (dashboardName) => {
    setSelectedDashboard(dashboardName);
  };






const MobileCheckGearIcon = ({ size = 30 }) => {
  return (
    <svg
      className="mobile-check-gear-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mobile Phone outline - Now grey */}
      <rect x="2" y="2" width="10" height="20" rx="2" ry="2" stroke="#888888" strokeWidth="2" fill="none" />
      
      {/* Checkmark inside the phone - Red as in the original image */}
      <path d="M4 12L6.5 14.5L10 10" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Off-wheel / Half-cogwheel - Now red and partially cut off */}
      <path
        d="M17 19.5L15.5 18C14.7 17.5 14.3 16.5 14.8 15.7L15.9 14L15.9 14C16.5 13.2 16.5 12 15.9 11.2L14.8 9.5C14.3 8.7 14.7 7.7 15.5 7.2L17 5.5"
        stroke="#E53E3E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Cogwheel's central circle - Now red */}
      <circle cx="17" cy="12" r="4" fill="none" stroke="#E53E3E" strokeWidth="2" />
    </svg>
  );
};








  const renderDashboard = () => {
    switch (selectedDashboard) {
      case "Meter Basic Information":
        return <MeterInfo />;
      case "Detection Threshold":
        return <ThresholdTable/>
      case "Clock":
        return <TimeSettingsChart/> 
      case "Tariff":
         return <Tariff/>

      case "Register Limiter":
        return <RegisterLimiter/>

      case "Security Settings":
        return <SecuritySettings/>

      case "Push Setup":
        return <PushSetup/>
      case 'Scheduler':
        return <Scheduler/>
      case 'Network Control':
        return <NetworkControl/>

      case 'Diagnose':
         return <Diagnose/>

      case 'Profile Configure':
        return <ProfileConfigure/>

      case 'Alarms':
        return <RegisterData/>
      case 'Event Filter':
        return <EventReportFilter/>
      case 'Billing':
        return <Billing/>
      case 'Payment':
        return <Payment/>
      case 'Display':
        return <Display/>
      case 'Relay':
        return <Relay/>




      
      // Add more cases for other dashboards
      default:
        return null;
    }
  };



  return (

    <div className="header-dashboard"> 

     

     
 
    
    <div className="header-container border-effect">
       
   
      <div className="header-left">               
        <ul>
          {[
            "Meter Basic Information",
            "Detection Threshold",
            "Clock",
            "Tariff",
            "Display",
            "Diagnose",
            "Billing",
            "Profile Configure",
            "Relay",
            "Network Control",
            "Event Filter",
            "Payment",
            "Scheduler",
            "Push Setup",
            "Alarms",
            "Register Limiter",         
            "Security Settings"
          ].map((item) => (
            <li  key={item}  className={selectedDashboard === item ?'selected_item':'unselected_item' } >
              <label>
                <input
                  type="checkbox"
                  onChange={() => handleCheckboxChange(item)}
                  checked={selectedDashboard === item}
                />
                 
                {item}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="header-right">
        {selectedDashboard && (
          <div>
           
            {renderDashboard()}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Header;

