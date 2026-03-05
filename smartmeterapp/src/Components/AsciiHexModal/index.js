import React, { useState, useEffect } from 'react';
import './AsciiHexModal.css';

const AsciiHexModal = ({ isOpen, onClose, itemName, itemCode, onSubmit, initialValue = '' }) => {
  const [inputValue, setInputValue] = useState('');
  const [displayMode, setDisplayMode] = useState('ascii'); // 'ascii' or 'hex'
  const [hexPreview, setHexPreview] = useState('');

  useEffect(() => {
    if (isOpen) {
      // If there's an initial value, try to display it as ASCII
      if (initialValue) {
        const asciiValue = hexToAscii(initialValue);
        setInputValue(asciiValue);
        updateHexPreview(asciiValue);
      } else {
        setInputValue('');
        setHexPreview('');
      }
      setDisplayMode('ascii');
    }
  }, [isOpen, initialValue]);

  // Convert ASCII string to hex (pad to 16 bytes)
  const asciiToHex = (asciiStr) => {
    const bytes = [];
    
    // Convert ASCII characters to bytes
    for (let i = 0; i < asciiStr.length && i < 16; i++) {
      bytes.push(asciiStr.charCodeAt(i));
    }
    
    // Pad remaining bytes with 0x00 (null character)
    while (bytes.length < 16) {
      bytes.push(0x00);
    }
    
    // Convert to hex string
    return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
  };

  // Convert hex string to ASCII (handle non-printable characters)
  const hexToAscii = (hexStr) => {
    if (!hexStr) return '';
    
    // Remove spaces and ensure even length
    const cleanHex = hexStr.replace(/\s/g, '');
    let asciiStr = '';
    
    for (let i = 0; i < cleanHex.length && i < 32; i += 2) {
      const byte = parseInt(cleanHex.substr(i, 2), 16);
      // Only show printable ASCII characters (32-126)
      if (byte >= 32 && byte <= 126) {
        asciiStr += String.fromCharCode(byte);
      } else if (byte === 0) {
        // Stop at null terminator
        break;
      } else {
        // Show non-printable as dot
        asciiStr += '·';
      }
    }
    
    return asciiStr;
  };

  // Format hex string with spaces for readability
  const formatHexDisplay = (hexStr) => {
    return hexStr.match(/.{1,2}/g)?.join(' ') || '';
  };

  const updateHexPreview = (asciiValue) => {
    const hex = asciiToHex(asciiValue);
    setHexPreview(formatHexDisplay(hex));
  };

  const handleInputChange = (e) => {
    let value = e.target.value;
    
    if (displayMode === 'ascii') {
      // Limit to 16 ASCII characters
      if (value.length > 16) {
        value = value.substring(0, 16);
      }
      setInputValue(value);
      updateHexPreview(value);
    } else {
      // Hex mode: only allow hex characters and spaces
      value = value.replace(/[^0-9A-Fa-f\s]/g, '').toUpperCase();
      // Limit to 32 hex characters (16 bytes)
      const cleanValue = value.replace(/\s/g, '');
      if (cleanValue.length > 32) {
        value = formatHexDisplay(cleanValue.substring(0, 32));
      }
      setInputValue(value);
      setHexPreview(value);
    }
  };

  const toggleDisplayMode = () => {
    if (displayMode === 'ascii') {
      // Switch to hex mode
      const hex = asciiToHex(inputValue);
      setInputValue(formatHexDisplay(hex));
      setDisplayMode('hex');
    } else {
      // Switch to ASCII mode
      const ascii = hexToAscii(inputValue.replace(/\s/g, ''));
      setInputValue(ascii);
      updateHexPreview(ascii);
      setDisplayMode('ascii');
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      alert('Please enter a value');
      return;
    }

    // Always send as hex string (without spaces)
    const hexValue = displayMode === 'ascii' 
      ? asciiToHex(inputValue)
      : inputValue.replace(/\s/g, '');
    
    onSubmit(hexValue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ascii-hex-modal-overlay" onClick={onClose}>
      <div className="ascii-hex-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ascii-hex-modal-header">
          <h3>Write Value</h3>
          <button className="ascii-hex-modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="ascii-hex-modal-body">
          <div className="ascii-hex-item-info">
            <p><strong>Item:</strong> {itemName}</p>
            <p><strong>Code:</strong> {itemCode}</p>
          </div>

          <div className="ascii-hex-mode-toggle">
            <button 
              className={`mode-btn ${displayMode === 'ascii' ? 'active' : ''}`}
              onClick={() => displayMode === 'hex' && toggleDisplayMode()}
            >
              ASCII
            </button>
            <button 
              className={`mode-btn ${displayMode === 'hex' ? 'active' : ''}`}
              onClick={() => displayMode === 'ascii' && toggleDisplayMode()}
            >
              HEX
            </button>
          </div>

          <div className="ascii-hex-input-group">
            <label>
              {displayMode === 'ascii' ? 'Enter ASCII Value (max 16 characters):' : 'Enter HEX Value (max 32 hex digits):'}
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={displayMode === 'ascii' ? 'Enter ASCII text...' : 'Enter hex value...'}
              className="ascii-hex-input"
              autoFocus
            />
            <div className="ascii-hex-char-count">
              {displayMode === 'ascii' 
                ? `${inputValue.length}/16 characters`
                : `${inputValue.replace(/\s/g, '').length}/32 hex digits (${inputValue.replace(/\s/g, '').length / 2} bytes)`
              }
            </div>
          </div>

          <div className="ascii-hex-preview">
            <label>Hex Preview (16 bytes):</label>
            <div className="ascii-hex-preview-box">
              {hexPreview || '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'}
            </div>
          </div>
        </div>

        <div className="ascii-hex-modal-footer">
          <button className="ascii-hex-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="ascii-hex-btn-submit" onClick={handleSubmit}>
            Write Value
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsciiHexModal;
