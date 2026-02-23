import React, { createContext, useContext, useState, useCallback } from 'react';
import './CustomAlert.css';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message) => {
    setAlert(message);
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alert && (
        <div className="custom-alert-overlay" onClick={hideAlert}>
          <div className="custom-alert-box" onClick={(e) => e.stopPropagation()}>
            <div className="custom-alert-message">{alert}</div>
            <button className="custom-alert-button" onClick={hideAlert}>
              OK
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

// Global function to replace window.alert
export const setupCustomAlert = (showAlert) => {
  window.customAlert = showAlert;
  // Override native alert
  window.alert = showAlert;
};
