import React, { useState, useEffect } from 'react';
import './ICModal.css';

const ICModal = ({ isOpen, onClose, currentIC, onSubmit }) => {
  const [icValue, setIcValue] = useState('');

  useEffect(() => {
    if (isOpen && currentIC !== null) {
      setIcValue(currentIC.toString());
    }
  }, [isOpen, currentIC]);

  const handleSubmit = () => {
    const value = parseInt(icValue);
    if (isNaN(value) || value < 0) {
      alert('Please enter a valid positive number.');
      return;
    }
    onSubmit(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ic-modal-overlay" onClick={onClose}>
      <div className="ic-modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="ic-modal-title">Update Invocation Counter</h3>
        <div className="ic-modal-info">
          <p>Current Invocation Counter: <strong>{currentIC}</strong></p>
          <p className="ic-modal-subtitle">Enter new IC value to update ic_obis in dlms_helper.py:</p>
        </div>
        <input
          type="number"
          className="ic-modal-input"
          value={icValue}
          onChange={(e) => setIcValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter IC value"
          autoFocus
          min="0"
        />
        <div className="ic-modal-buttons">
          <button className="ic-modal-button ic-modal-ok" onClick={handleSubmit}>
            OK
          </button>
          <button className="ic-modal-button ic-modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ICModal;
