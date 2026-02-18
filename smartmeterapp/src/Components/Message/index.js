import React from 'react';
import { IoIosCloseCircle } from "react-icons/io";
import './index.css';

// Updated sample data to simulate messages with different types for styling
const dummyMessages = [
    {
        timestamp: '2025-08-18 16:50:08,895',
        type: 'INFO',
        source: 'MeterView',
        text: 'Get Service power quality profile success'
    },
    {
        timestamp: '2025-08-18 16:50:08,923',
        type: 'INFO',
        source: 'MeterView',
        text: 'Get Service power quality profile [7, 1-0:99.14.0.255, 2]'
    },
      {
        timestamp: '2025-08-18 16:50:12,075',
        type: 'LOG',
        source: 'MeterView',
        text: 'Port(COM9) closed'
    },
    {
        timestamp: '2025-08-18 16:50:08,931',
        type: 'INFO',
        source: 'MeterView',
        text: 'GetRequestNormal, [7, 1-0:99.14.0.255, 2]'
    },
    {
        timestamp: '2025-08-18 16:50:09,437',
        type: 'HEX',
        source: 'MeterView',
        text: '<W>  <R> 7E A0 2C 03 03 BA 09 E2 E6 E6 00 C8 1E 30 00 00 00 07 32 10 54 8F 04 B5 92 45 A5 B0 A5 AE 7E 82 C9 57 8B FA E3 09 34 21 FF A3 2C E0 F3 7E'
    },
    {
        timestamp: '2025-08-18 16:50:09,484',
        type: 'INFO',
        source: 'MeterView',
        text: 'Get Service power quality profile success'
    },
    {
        timestamp: '2025-08-18 16:50:09,688',
        type: 'HEX',
        source: 'MeterView',
        text: '<W> <R> 7E A0 2C 03 03 DC 39 E4 E6 E6 00 C8 1E 30 00 00 00 08 8A F9 19 18 F0 FE 37 41 B1 0C AD A3 BA 9B B3 7C BA B2 B1 0F FD 5D 82 A3 29 28 7E'
    },
    {
        timestamp: '2025-08-18 16:50:09,939',
        type: 'HEX',
        source: 'MeterView',
        text: '<W> <R> 7E A0 2C 03 03 DF C6 E6 E7 00 CF CC 9F 10 8D 83 AB 26 B6 0B 04 A1 69 A3 82 9B 02 C6 97 9E F9 25 6B 04 0C DD 8B E8 FB 10 D5 E8 C1 0E BC 04 50 AD A3 DD 88 F1 E0 9B B3 BA FE 30 5C 59 DF 31 72 DE 3E 46 A0 46 A3 10 E3 F8 86 43 9F F1 50 A3 D2 6A 3E 26 BA 01 62 8B 40 02 C4 DC D9 BB 68 AC 0C EE AD 37 40 33 62 49 AE 7E 02 EC 35 0E 74'
    },
    {
        timestamp: '2025-08-18 16:50:12,075',
        type: 'LOG',
        source: 'MeterView',
        text: 'Port(COM7) closed'
    },
];

const MessageLog = ({ closeMessagePopup }) => {
    // Determine the color based on the message type
    const getTypeClassName = (type) => {
        switch (type.toLowerCase()) {
            case 'info':
                return 'info-message';
            case 'hex':
                return 'hex-message';
            case 'log':
                return 'log-message';
            default:
                return '';
        }
    };

    const closePopupOutside = (e) => {
        // A robust check to ensure the click is on the container and not a child element
        if (e.target === e.currentTarget) {
            // Check if the prop exists and is a function before calling it
            if (typeof closeMessagePopup === 'function') {
                closeMessagePopup();
            } else {
                console.warn("The 'closeMessagePopup' prop is not a function.");
            }
        }
    };

    return (
         <div className="logpopup" onClick={closePopupOutside}>
        <div className="logpopup-container">
            <div className='port-header'>
                      <h1 style={{ fontSize: '18px', marginLeft: '5px' }}>Communication Message</h1>
                      <IoIosCloseCircle onClick={()=>closeMessagePopup()} style={{ fontSize: '30px' }} />
                    </div>
            <div className="message-log-header">
                <div className="column-title">Timestamp</div>
                <div className="column-title">Type</div>
                <div className="column-title">Source</div>
                <div className="column-title">Message</div>
            </div>
            <div className="message-list">
                {dummyMessages.map((msg, index) => (
                    <div key={index} className={`message-item ${getTypeClassName(msg.type)}`}>
                        <span className="timestamp">{msg.timestamp}</span>
                        <span className="type">{msg.type}</span>
                        <span className="source">{msg.source}</span>
                        <span className="text">{msg.text}</span>
                    </div>
                ))}
            </div>
        </div>
        </div>
    );
};

export default MessageLog;