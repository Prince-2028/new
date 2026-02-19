import React from 'react';
import './FullscreenButton.css';

const FullscreenButton = () => {
  console.log('FullscreenButton component rendered!');

  const toggleFullscreen = () => {
    console.log('Button clicked!');
    
    const elem = document.documentElement;
    
    if (!document.fullscreenElement) {
      console.log('Entering fullscreen...');
      if (elem.requestFullscreen) {
        elem.requestFullscreen().then(() => {
          console.log('Fullscreen entered successfully');
        }).catch(err => {
          console.error('Fullscreen error:', err);
        });
      }
    } else {
      console.log('Exiting fullscreen...');
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <button
      className="fullscreen-button"
      onClick={toggleFullscreen}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: '#f88b3e',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        zIndex: 9999,
        fontSize: '24px'
      }}
    >
      ⛶
    </button>
  );
};

export default FullscreenButton;
