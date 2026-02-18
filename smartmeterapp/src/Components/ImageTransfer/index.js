import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload} from '@fortawesome/free-solid-svg-icons';
import './index.css'
import { FaBookOpen, FaFileExport,FaArrowUp  } from "react-icons/fa"; // Import icons
// This component represents the "Image parameters" tab content
const ImageParametersTab = () => {
    return (
        <div className="tab-content">
            <div className="form-grid">
                <div className="form-row">
                    <label>Image type</label>
                    <div className="radio-group">
                        <label><input type="radio" name="imageType" value="Device" defaultChecked /> Device</label>
                        <label><input type="radio" name="imageType" value="Module" /> Module</label>
                    </div>
                </div>
                <div className="form-row">
                    <label>Image block size</label>
                    <input type="text" value="256" readOnly />
                </div>
                <div className="form-row">
                    <label>Image transfer enabled</label>
                    <input type="text" value="False" readOnly />
                </div>
                <div className="form-row">
                    <label>Image transfer status</label>
                    <input type="text" value="NotInitiated" readOnly />
                </div>
                <div className="form-row">
                    <label>Image to activate information</label>
                    <input type="text" value="Image size: 0, Identification:" readOnly />
                </div>
            </div>
        </div>
    );
};


// This component represents the "Image transfer" tab content
const ImageTransferTab = ({ onUpgrade }) => {
    const [formData, setFormData] = useState({
        imageType: 'Device',   // Added this
        file: '',
        version: '',
        completenessCheck: 'block',
        activationScheduler: '2017-01-19T00:00', // fixed datetime-local format
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="tab-content">
            <div className="form-grid">
                <div className="form-row">
                    <label>Image type</label>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                name="imageType"
                                value="Device"
                                checked={formData.imageType === 'Device'}
                                onChange={handleInputChange}
                            /> Device
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="imageType"
                                value="Module"
                                checked={formData.imageType === 'Module'}
                                onChange={handleInputChange}
                            /> Module
                        </label>
                    </div>
                </div>

                <div className="form-row">
                    <label htmlFor="file">File</label>
                    <input
                        type="text"
                        id="file"
                        name="file"
                        value={formData.file}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-row">
                    <label htmlFor="version">Version</label>
                    <input
                        type="text"
                        id="version"
                        name="version"
                        value={formData.version}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-row">
                    <label>Completeness check after image transfer</label>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                name="completenessCheck"
                                value="block"
                                checked={formData.completenessCheck === 'block'}
                                onChange={handleInputChange}
                            /> Image transferred block
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="completenessCheck"
                                value="firstBlock"
                                checked={formData.completenessCheck === 'firstBlock'}
                                onChange={handleInputChange}
                            /> Image first not transferred block number
                        </label>
                    </div>
                </div>

                {/* Show Activation Scheduler only if imageType is Device */}
                {formData.imageType === 'Device' && (
                    <div className="form-row">
                        <label htmlFor="activationScheduler">Activation scheduler</label>
                        <input
                            type="datetime-local"
                            name="activationScheduler"
                            value={formData.activationScheduler}
                            onChange={handleInputChange}
                        />
                    </div>
                )}
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Channel</th>
                            <th>Serial number</th>
                            <th>Remark</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td></td>
                            <td>Stop upgrade</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <button onClick={() => onUpgrade(formData)}>Upgrade</button>
        </div>
    );
};

// This is the main dashboard component for Image Transfer.
const ImageTransferDashboard = () => {
    const [activeTab, setActiveTab] = useState('imageTransfer');

    const handleUpgradeAction = (formData) => {
        console.log("Sending the following data to backend for upgrade:", formData);
        // Here you would typically use fetch or axios to make an API call
        // e.g., fetch('/api/image-transfer', { method: 'POST', body: JSON.stringify(formData) });
        alert("Upgrade data logged to console. In a real app, this would be sent to a backend.");
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                
                    <div className="tabs">
                        <button
                            className={`tab-btn ${activeTab === 'imageParameters' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('imageParameters')}
                        >
                            Image Parameters
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'imageTransfer' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('imageTransfer')}
                        >
                            Image Transfer
                        </button>
                    </div>
                
               
            </div>
            <div className="dashboard-content">
                {activeTab === 'imageParameters' && <ImageParametersTab />}
                {activeTab === 'imageTransfer' && <ImageTransferTab onUpgrade={handleUpgradeAction} />}
            </div>
        </div>
    );
};

// This is the component for the entire page, including the sidebar.
const ImageTransferSection = () => {
    const [activeSection, setActiveSection] = useState('imageTransfer');

    const renderSection = () => {
        switch (activeSection) {
            case 'imageTransfer':
                return <ImageTransferDashboard />;
            // Add other cases for other sections if needed
            default:
                return <ImageTransferDashboard />;
        }
    };

    const handleItemClick = (section) => {
        setActiveSection(section);
    };

    return (
         <div className="header-dashboard">
    <div className='header-container border-effect'>
            <nav className="sidebar1">
               
                <div className="billing-section-title">Image Transfer</div>
                <ul>
                    <li className={activeSection === 'imageTransfer' ? 'active' : ''}>
                        <button onClick={() => handleItemClick('imageTransfer')} className="sidebar1-btn">
                            <FontAwesomeIcon icon={faUpload} className="icon" />
                            Image transfer
                        </button>
                    </li>
                </ul>
            </nav>
            <main className="content">
                <div className="read-write-container">
                    <button className="dashboard-btn">
                        <FaBookOpen style={{ marginRight: "8px",color:"#ff4d00ff" }} />
                        Read
                    </button>

                    <button className="dashboard-btn">
                        <FaFileExport style={{ marginRight: "8px",color:"#ff4d00ff" }} />
                        Export
                    </button>

                    <button className="dashboard-btn">
                        <FaArrowUp style={{ marginRight: "8px",color:"#ff4d00ff" }} />
                        Upgrade
                    </button>
                </div>
                {renderSection()}
            </main>
        </div>
        </div>
    );
};

export default ImageTransferSection;