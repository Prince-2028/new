import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // optional - used if serial is in URL
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faList, faPlayCircle } from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../apiConfig'; // Adjust path based on your file structure
import './index.css';

const ExecuteListDashboard = ({ serialNumber: propSerialNumber = null }) => {
  // static list (you can replace with fetch from backend later)
  const [executeListData, setExecuteListData] = useState([
    { id: 1, checked: false, no: 1, name: 'MDI reset / End of billing period', code: '[0, 0-10.0.1.255.0001]' },
    { id: 2, checked: false, no: 2, name: 'Standard event log reset', code: '[7, 0-0.99.98.0.255]' },
    { id: 3, checked: false, no: 3, name: 'Fraud detection log reset', code: '[7, 0-0.99.98.1.255]' },
    { id: 4, checked: false, no: 4, name: 'Disconnector control log reset', code: '[7, 0-0.99.98.2.255]' },
    { id: 5, checked: false, no: 5, name: 'Power quality log reset', code: '[7, 0-0.99.98.4.255]' },
    { id: 6, checked: false, no: 6, name: 'Comunication event log reset', code: '[7, 0-0.99.98.5.255]' },
    { id: 7, checked: false, no: 7, name: 'Other event log reset', code: '[7, 0-0.99.98.6.255]' },
    { id: 8, checked: false, no: 8, name: 'Long power down log reset', code: '[7, 0-0.99.97.0.255]' },
    { id: 9, checked: false, no: 9, name: 'Load profile with period 1 reset', code: '[7, 1-0.99.1.0.255]' },
    { id: 10, checked: false, no: 10, name: 'Load profile with period 2 reset', code: '[7, 1-0.99.2.0.255]' },
    { id: 11, checked: false, no: 11, name: 'Power quality profile reset', code: '[7, 1-0.99.14.0.255]' },
  ]);

  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const selectAllRef = useRef(null);


  
  const serialNumber =  localStorage.getItem("selectedSerialNumber")|| "REPLACE_WITH_SERIAL";

  // keep header checkbox indeterminate when some (but not all) rows are selected
  useEffect(() => {
    const allChecked = executeListData.length > 0 && executeListData.every(i => i.checked);
    const someChecked = executeListData.some(i => i.checked) && !allChecked;

    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someChecked;
    }
  }, [executeListData]);

  // toggle single row
  const handleCheckboxChange = (id) => {
    setExecuteListData(prevData =>
      prevData.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // select / deselect all rows
  const handleSelectAllChange = (e) => {
    const checked = e.target.checked;
    setExecuteListData(prevData => prevData.map(item => ({ ...item, checked })));
  };

  // when user clicks Execute, open password popup if any selected
  const handleExecuteClick = () => {
    const selectedItems = executeListData.filter(item => item.checked);
    if (selectedItems.length === 0) {
      alert("No items selected to execute.");
      return;
    }
    setShowPasswordPopup(true);
  };

  // Confirm -> send to backend
  const handleConfirmExecute = async () => {
    const selectedItems = executeListData
      .filter(item => item.checked)
      .map(item => ({ name: item.name, code: item.code }));

    if (selectedItems.length === 0) {
      alert("No items selected!");
      return;
    }

    // Replace serialNumber fallback before testing in prod
    if (!serialNumber || serialNumber === "REPLACE_WITH_SERIAL") {
      alert("Serial number not provided. Set serial number in component props or URL.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/execute/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serial_number: serialNumber,
          password: password,
          commands: selectedItems
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // success - show friendly message
        alert("✅ Execution successful.");

        // Optional: update UI to reflect success (here we simply uncheck the items)
        setExecuteListData(prev =>
          prev.map(item => item.checked ? { ...item, checked: false } : item)
        );

        console.log("Execution results:", data.results || data);
      } else {
        // backend returned error
        const message = data.error || JSON.stringify(data);
        alert("❌ Execution failed: " + message);
        console.error("Execute error:", data);
      }
    } catch (err) {
      console.error("Network/Server error:", err);
      alert("🚫 Network or server error. Check console.");
    } finally {
      setLoading(false);
      setShowPasswordPopup(false);
      setPassword("");
    }
  };

  const closePopupOutside = (e) => {
    if (e.target.className === 'popup') {
      setShowPasswordPopup(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="read-write-container">
          <button
            className="dashboard-btn"
            onClick={handleExecuteClick}
            disabled={loading}
            title={loading ? "Processing..." : "Execute selected commands"}
          >
            <FontAwesomeIcon icon={faPlayCircle} className="icon" /> Execute
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  ref={selectAllRef}
                  checked={executeListData.length > 0 && executeListData.every(i => i.checked)}
                  onChange={handleSelectAllChange}
                  aria-label="Select all items"
                />
              </th>
              <th>No.</th>
              <th>Name</th>
              <th>Code</th>
            </tr>
          </thead>
          <tbody>
            {executeListData.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleCheckboxChange(item.id)}
                    aria-label={`Select ${item.name}`}
                  />
                </td>
                <td>{item.no}</td>
                <td>{item.name}</td>
                <td>{item.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Password Popup */}
      {showPasswordPopup && (
        <div className="popup" onClick={closePopupOutside}>
          <div className="popup-container-Execute">
            <h3>Enter Password</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <div style={{ marginTop: 12 }}>
              <button
                className="popup-buttons"
                onClick={handleConfirmExecute}
                disabled={loading}
                style={{ marginRight: 8 }}
              >
                OK
              </button>
              <button
                className="popup-buttons"
                onClick={() => setShowPasswordPopup(false)}
                disabled={loading}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExecuteSection = (props) => {
  const [activeSection, setActiveSection] = useState('executeList');
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (menuName) => {
    setOpenSubmenus(prevState => ({
      ...prevState,
      [menuName]: !prevState[menuName]
    }));
  };

  const handleItemClick = (section, menuName = null) => {
    setActiveSection(section);
    if (menuName) {
      setOpenSubmenus(prevState => ({
        ...prevState,
        [menuName]: true
      }));
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'executeList':
        // pass serial number prop from parent if available: <ExecuteListDashboard serialNumber="..." />
        return <ExecuteListDashboard {...props} />;
      default:
        return <ExecuteListDashboard {...props} />;
    }
  };

  return (
    <div className="header-dashboard">
      <div className='header-container border-effect'>
        <nav className="sidebar1">
          <div className="billing-section-title">
            <FontAwesomeIcon icon={faBolt} className="icon" />Execute
          </div>
          <ul>
            <li className={activeSection === 'executeList' ? 'active' : ''}>
              <button onClick={() => handleItemClick('executeList')} className="sidebar1-btn">
                <FontAwesomeIcon icon={faList} className="icon" />
                Execute list
              </button>
            </li>
          </ul>
        </nav>
        <main className="content">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default ExecuteSection;
