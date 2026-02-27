import { useState } from 'react';
import axios from 'axios';
import './ImageTransferREN.css';
import API_BASE_URL from '../../apiConfig';
import ProgressModal from '../ProgressModal';

const ImageTransferREN = () => {
  // Get serial number from localStorage (automatically set when device is selected)
  const serialNumber = localStorage.getItem('selectedSerialNumber');
  
  // Basic fields
  const [classId] = useState(18);
  const [obisCode] = useState('0.0.44.0.0.255');
  const [method, setMethod] = useState('combined');
  
  // Method 1 (Initiate) fields
  const [imageIdentifier, setImageIdentifier] = useState('Image001');
  const [imageSize, setImageSize] = useState(0);
  
  // Method 2 (Block Transfer) fields
  const [blockNumber, setBlockNumber] = useState(0);
  const [blockData, setBlockData] = useState('');
  
  // Combined method fields
  const [firmwareFile, setFirmwareFile] = useState(null);
  const [getBlockSize, setGetBlockSize] = useState(true);
  const [blockSize, setBlockSize] = useState(732);
  const [verificationLoops, setVerificationLoops] = useState(5);
  const [waitTimePerLoop, setWaitTimePerLoop] = useState(1000);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFirmwareFile(file);
    setImageSize(file.size);
    addLog(`File selected: ${file.name} (${file.size} bytes)`, 'success');
  };

  // Build DLMS structure for method 1 (initiate)
  const buildInitiateData = () => {
    return {
      image_identifier: imageIdentifier,
      image_size: imageSize
    };
  };

  // Build DLMS structure for method 2 (block transfer)
  const buildBlockTransferData = (blockNum, blockDataHex) => {
    return {
      image_block_number: blockNum,
      image_block_value: blockDataHex
    };
  };

  // Execute individual method
  const executeMethod = async (methodIndex, data = 0) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/getmeterinfo/`, {
        serial_number: serialNumber,
        action: 'execute_method',
        parameters: {
          obis_code: obisCode,
          method_index: methodIndex,
          data: data
        }
      });

      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    }
  };

  // Handle method 1: Initiate
  const handleInitiate = async () => {
    setLoading(true);
    setError('');
    setLogs([]);
    setShowProgressModal(true); // Show progress modal

    try {
      const initiateData = buildInitiateData();
      const result = await executeMethod(1, initiateData);
      
      setShowProgressModal(false); // Close modal
      
      if (result.status === 'success') {
        addLog('Method 1: Initiate - Success', 'success');
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setShowProgressModal(false);
      setError(err.message);
      addLog(`Method 1: Initiate - Failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle method 2: Block Transfer
  const handleBlockTransfer = async () => {
    setLoading(true);
    setError('');
    setLogs([]);
    setShowProgressModal(true); // Show progress modal

    try {
      const blockTransferData = buildBlockTransferData(blockNumber, blockData);
      const result = await executeMethod(2, blockTransferData);
      
      setShowProgressModal(false); // Close modal
      
      if (result.status === 'success') {
        addLog('Method 2: Block Transfer - Success', 'success');
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setShowProgressModal(false);
      setError(err.message);
      addLog(`Method 2: Block Transfer - Failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle method 3: Verify
  const handleVerify = async () => {
    setLoading(true);
    setError('');
    setLogs([]);
    setShowProgressModal(true); // Show progress modal

    try {
      const result = await executeMethod(3, 0);
      
      setShowProgressModal(false); // Close modal
      
      if (result.status === 'success') {
        addLog('Method 3: Verify - Success', 'success');
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setShowProgressModal(false);
      setError(err.message);
      addLog(`Method 3: Verify - Failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle method 4: Activate
  const handleActivate = async () => {
    setLoading(true);
    setError('');
    setLogs([]);
    setShowProgressModal(true); // Show progress modal

    try {
      const result = await executeMethod(4, 0);
      
      setShowProgressModal(false); // Close modal
      
      if (result.status === 'success') {
        addLog('Method 4: Activate - Success', 'success');
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setShowProgressModal(false);
      setError(err.message);
      addLog(`Method 4: Activate - Failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle combined method
  const handleCombinedTransfer = async () => {
    if (!firmwareFile) {
      setError('Please select a firmware file');
      return;
    }

    setLoading(true);
    setError('');
    setLogs([]);
    setProgress(0);
    setShowProgressModal(true); // Show progress modal

    try {
      // Step 1: Read file as hex
      addLog('Reading firmware file...', 'info');
      const fileBuffer = await firmwareFile.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);
      const fileHex = '0x' + Array.from(fileBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      addLog(`File read: ${fileBytes.length} bytes`, 'success');
      setProgress(5);

      // Step 2: Call combined_image_transfer backend action
      setCurrentStep('Executing combined image transfer...');
      addLog('Starting combined image transfer on backend...', 'info');
      
      const response = await axios.post(`${API_BASE_URL}/api/getmeterinfo/`, {
        serial_number: serialNumber,
        action: 'combined_image_transfer',
        parameters: {
          obis_code: obisCode,
          image_identifier: imageIdentifier,
          image_data: fileHex
        }
      });

      const result = response.data;
      
      // Close modal first
      setShowProgressModal(false);
      
      if (result.status === 'success') {
        // Display transfer log from backend
        if (result.transfer_log && Array.isArray(result.transfer_log)) {
          result.transfer_log.forEach(logEntry => {
            addLog(logEntry, 'info');
          });
        }
        
        addLog(`Transfer complete: ${result.blocks_transferred}/${result.total_blocks} blocks`, 'success');
        setProgress(100);
        setCurrentStep('Complete!');
      } else {
        throw new Error(result.message || 'Combined transfer failed');
      }

    } catch (err) {
      setShowProgressModal(false); // Close modal on error too
      setError(err.response?.data?.message || err.message);
      addLog(`Combined transfer failed: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Execute based on selected method
  const handleExecute = () => {
    switch (method) {
      case '1':
        handleInitiate();
        break;
      case '2':
        handleBlockTransfer();
        break;
      case '3':
        handleVerify();
        break;
      case '4':
        handleActivate();
        break;
      case 'combined':
        handleCombinedTransfer();
        break;
      default:
        setError('Invalid method selected');
    }
  };

  return (
    <div className="image-transfer-ren-container">
      <h2>Image Transfer (New Implementation)</h2>
      
      <div className="form-section">
        <div className="form-group">
          <label>Device Serial Number</label>
          <input
            type="text"
            value={serialNumber || 'No device selected'}
            readOnly
          />
        </div>
        
        <div className="form-group">
          <label>Class ID</label>
          <input type="text" value={classId} readOnly />
        </div>
        
        <div className="form-group">
          <label>OBIS</label>
          <input type="text" value={obisCode} readOnly />
        </div>

        <div className="form-group">
          <label>Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="1">Method 1: Image transfer initiate</option>
            <option value="2">Method 2: Image block transfer</option>
            <option value="3">Method 3: Image verify</option>
            <option value="4">Method 4: Image activate</option>
            <option value="combined">Image transfer (combined method)</option>
          </select>
        </div>
      </div>

      {/* Method 1 fields */}
      {method === '1' && (
        <div className="method-fields">
          <h3>Method 1: Initiate</h3>
          <div className="form-group">
            <label>Image Identifier</label>
            <input
              type="text"
              value={imageIdentifier}
              onChange={(e) => setImageIdentifier(e.target.value)}
              placeholder="e.g., Image001"
            />
          </div>
          <div className="form-group">
            <label>Image Size (bytes)</label>
            <input
              type="number"
              value={imageSize}
              onChange={(e) => setImageSize(parseInt(e.target.value))}
              placeholder="Enter image size"
            />
          </div>
          <div className="info-box">
            <p>Structure: image_identifier (octet-string) + image_size (double-long-unsigned)</p>
          </div>
        </div>
      )}

      {/* Method 2 fields */}
      {method === '2' && (
        <div className="method-fields">
          <h3>Method 2: Block Transfer</h3>
          <div className="form-group">
            <label>Block Number</label>
            <input
              type="number"
              value={blockNumber}
              onChange={(e) => setBlockNumber(parseInt(e.target.value))}
              placeholder="Enter block number"
            />
          </div>
          <div className="form-group">
            <label>Block Data (hex)</label>
            <textarea
              value={blockData}
              onChange={(e) => setBlockData(e.target.value)}
              placeholder="Enter hex data (e.g., 0x1234ABCD...)"
              rows={4}
            />
          </div>
          <div className="info-box">
            <p>Structure: image_block_number (long-unsigned) + image_block_value (octet-string)</p>
          </div>
        </div>
      )}

      {/* Method 3 & 4 - no additional fields */}
      {(method === '3' || method === '4') && (
        <div className="method-fields">
          <h3>{method === '3' ? 'Method 3: Verify' : 'Method 4: Activate'}</h3>
          <div className="info-box">
            <p>No additional parameters required</p>
          </div>
        </div>
      )}

      {/* Combined method fields */}
      {method === 'combined' && (
        <div className="method-fields">
          <h3>Combined Image Transfer</h3>
          <div className="form-group">
            <label>Firmware File</label>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".bin,.rbin,.hex"
            />
            {firmwareFile && (
              <p className="file-info">Selected: {firmwareFile.name} ({firmwareFile.size} bytes)</p>
            )}
          </div>
          
          <div className="form-group">
            <label>Image Identifier</label>
            <input
              type="text"
              value={imageIdentifier}
              onChange={(e) => setImageIdentifier(e.target.value)}
              placeholder="e.g., Image001"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={getBlockSize}
                onChange={(e) => setGetBlockSize(e.target.checked)}
              />
              Get Image Block Size from meter
            </label>
          </div>

          {!getBlockSize && (
            <div className="form-group">
              <label>Block Size (bytes)</label>
              <input
                type="number"
                value={blockSize}
                onChange={(e) => setBlockSize(parseInt(e.target.value))}
                placeholder="Default: 732"
              />
            </div>
          )}

          <div className="form-group">
            <label>Verification loop number</label>
            <input
              type="number"
              value={verificationLoops}
              onChange={(e) => setVerificationLoops(parseInt(e.target.value))}
              placeholder="Default: 5"
            />
            <small>Number of retry attempts for verification</small>
          </div>

          <div className="form-group">
            <label>Wait Time per loop (ms)</label>
            <input
              type="number"
              value={waitTimePerLoop}
              onChange={(e) => setWaitTimePerLoop(parseInt(e.target.value))}
              placeholder="Default: 1000"
            />
            <small>Delay between verification retries</small>
          </div>

          <div className="info-box">
            <p>This will execute all 4 methods sequentially:</p>
            <ol>
              <li>Initiate transfer</li>
              <li>Transfer all blocks</li>
              <li>Verify image (with retry loop)</li>
              <li>Activate image</li>
            </ol>
          </div>
        </div>
      )}

      {/* Execute button */}
      <div className="button-group">
        <button
          onClick={handleExecute}
          disabled={loading || !serialNumber}
          className="execute-button"
        >
          {loading ? 'Executing...' : 'Execute'}
        </button>
      </div>

      {/* Progress bar */}
      {loading && method === 'combined' && (
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">{currentStep} ({Math.round(progress)}%)</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-box">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="logs-section">
          <h3>Execution Log</h3>
          <div className="logs-container">
            {logs.map((log, index) => (
              <div key={index} className={`log-entry log-${log.type}`}>
                <span className="log-timestamp">[{log.timestamp}]</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Image Transfer Progress"
      />
    </div>
  );
};

export default ImageTransferREN;
