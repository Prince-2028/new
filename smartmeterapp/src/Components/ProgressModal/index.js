import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ProgressModal.css';
import API_BASE_URL from '../../apiConfig';

const ProgressModal = ({ isOpen, onClose, title = "Progress" }) => {
  const [logs, setLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const pollIntervalRef = useRef(null);
  const logsEndRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [logs]);

  useEffect(() => {
    const initModal = async () => {
      if (isOpen) {
        // Reset state when modal opens
        setLogs([]);
        setIsComplete(false);
        
        // Add a separator marker to the log file to mark the start of this operation
        await addLogSeparator();
        
        // Small delay to ensure marker is written
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Start polling logFile.txt
        startPolling();
      } else {
        // Stop polling when modal closes
        stopPolling();
      }
    };

    initModal();

    return () => {
      stopPolling();
    };
  }, [isOpen]);

  const addLogSeparator = async () => {
    try {
      const timestamp = new Date().toISOString();
      await axios.post(`${API_BASE_URL}/api/logfile/separator/`, {
        marker: `\n=== OPERATION START: ${timestamp} ===\n`
      });
      console.log('Log separator added');
    } catch (error) {
      console.log('Failed to add log separator:', error.message);
    }
  };

  const startPolling = () => {
    // Poll every 500ms
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
        
        // Find the last separator marker and only show logs after it
        const separatorIndex = logContent.lastIndexOf('=== OPERATION START:');
        const relevantContent = separatorIndex >= 0 
          ? logContent.substring(separatorIndex) 
          : logContent;
        
        // Parse log entries from the current operation only
        const lines = relevantContent.split('\n').filter(line => {
          const trimmed = line.trim();
          // Filter out the separator line itself and empty lines
          return trimmed && !trimmed.startsWith('=== OPERATION START:');
        });
        
        // Simply set all lines - no queuing, no delays
        setLogs(lines);
        
        // Check for completion indicators in the last line
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1] || '';
          if (
            lastLine.includes('finished') ||
            lastLine.includes('Result status')
          ) {
            setIsComplete(true);
            // Wait 2 seconds then close
            setTimeout(() => {
              stopPolling();
              setTimeout(() => {
                onClose();
              }, 1000);
            }, 2000);
          }
        }
      } catch (error) {
        // Ignore errors during polling (file might not exist yet)
        console.log('Polling error:', error.message);
      }
    }, 500);
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
            {logs.map((log, index) => {
              const isRX = log.includes('RX:');
              const isTX = log.includes('TX:');
              return (
                <div 
                  key={index} 
                  className="log-line"
                  style={{
                    backgroundColor: isRX ? '#e8f5e9' : isTX ? '#fff3e0' : 'transparent',
                    fontWeight: isRX ? 'bold' : 'normal'
                  }}
                >
                  {log}
                </div>
              );
            })}
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
