import React, { useState, useEffect } from 'react';
import './WriteModal.css';

const WriteModal = ({ isOpen, onClose, itemName, itemCode, onSubmit }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!value || value.trim() === '') {
      alert('Value cannot be empty.');
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
    <div className="write-modal-overlay" onClick={onClose}>
      <div className="write-modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="write-modal-title">Write Value</h3>
        <div className="write-modal-info">
          <p><strong>{itemName}</strong></p>
          <p className="write-modal-code">Code: {itemCode}</p>
        </div>
        <input
          type="text"
          className="write-modal-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter value"
          autoFocus
        />
        <div className="write-modal-buttons">
          <button className="write-modal-button write-modal-ok" onClick={handleSubmit}>
            OK
          </button>
          <button className="write-modal-button write-modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WriteModal;
