import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ProgressModal.css';
import API_BASE_URL from '../../apiConfig';

const ProgressModal = ({ isOpen, onClose, title = "Progress" }) => {
  const [logs, setLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const pollIntervalRef = useRef(null);
  const lastPositionRef = useRef(0);
  const logsEndRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setLogs([]);
      setIsComplete(false);
      lastPositionRef.current = 0;
      
      // Start polling logFile.txt
      startPolling();
    } else {
      // Stop polling when modal closes
      stopPolling();
    }

    return () => stopPolling();
  }, [isOpen]);

  const startPolling = () => {
    // Poll every 100ms for immediate log updates
    pollIntervalRef.current = setInterval(async () => {
      try {
        // Add timestamp and random parameter to prevent caching
        const cacheBuster = `${Date.now()}_${Math.random()}`;
        const response = await axios.get(`${API_BASE_URL}/api/logfile/?t=${cacheBuster}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const logContent = response.data.content || '';
        
        // Parse new log entries
        const lines = logContent.split('\n');
        
        // Detect if file was reset (current content is shorter than our last position)
        if (lines.length < lastPositionRef.current) {
          console.log('Log file was reset, restarting from beginning');
          setLogs([]);
          lastPositionRef.current = 0;
        }
        
        // Get only new lines after last position
        const newLines = lines.slice(lastPositionRef.current);
        
        if (newLines.length > 0) {
          const filteredNewLines = newLines.filter(line => line.trim());
          if (filteredNewLines.length > 0) {
            setLogs(prev => [...prev, ...filteredNewLines]);
          }
          lastPositionRef.current = lines.length;
          
          // Check for completion indicators
          const lastLine = newLines[newLines.length - 1] || '';
          if (
            lastLine.includes('finished') ||
            lastLine.includes('Result status')
          ) {
            setIsComplete(true);
            stopPolling();
            // Auto-close after 1.5 seconds
            setTimeout(() => {
              onClose();
            }, 1500);
          }
        }
      } catch (error) {
        // Ignore errors during polling (file might not exist yet)
        console.log('Polling error:', error.message);
      }
    }, 100); // Poll every 100ms for immediate updates
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="progress-modal-overlay">
      <div className="progress-modal">
        <div className="progress-modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="progress-modal-body">
          <p className="progress-message">Please wait for a moment</p>
          
          <div className="progress-logs">
            {logs.map((log, index) => (
              <div key={index} className="log-line">
                {log}
              </div>
            ))}
            {/* Invisible element to scroll to */}
            <div ref={logsEndRef} />
          </div>
          
          {isComplete && (
            <div className="completion-message">
              ✓ Operation completed successfully
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;
