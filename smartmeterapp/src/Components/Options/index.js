import React, { useState } from 'react';
import './index.css';
import { IoIosCloseCircle } from "react-icons/io";

const OptionsPopup = ({ onClose }) => {
    const [selectedLanguage, setSelectedLanguage] = useState('English');

    const handleSave = () => {
        // You would typically send the selected language to a backend or state manager here
        console.log(`Saving language: ${selectedLanguage}`);
        if (onClose) {
            onClose(); // Close the popup after saving
        }
    };

       const closePopupOutside = (e) => {

        console.log("hello")
        // A robust check to ensure the click is on the container and not a child element
        if (e.target === e.currentTarget) {
            // Check if the prop exists and is a function before calling it
           
                onClose();
           
        }
    };


    return (
       <div className="logpopup" onClick={closePopupOutside}>
              <div className="options-popup-container">
                  <div className='port-header'>
                            <h1 style={{ fontSize: '18px', marginLeft: '5px' }}>Communication Message</h1>
                            <IoIosCloseCircle onClick={()=>onClose()} style={{ fontSize: '30px' }} />
                          </div>
               
                <div className="popup-content-Options">
                    <div className="form-row">
                        <label htmlFor="language-select">Language</label>
                        <select
                            id="language-select"
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="language-select"
                        >
                            <option value="English">English</option>
                            
                            {/* Add more language options as needed */}
                        </select>
                    </div>
                     
                    <button className="save-button" onClick={handleSave}>Save</button>
              
                </div>
              
            </div>
        </div>
    );
};

export default OptionsPopup;