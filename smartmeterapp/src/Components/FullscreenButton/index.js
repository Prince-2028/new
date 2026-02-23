import React, { useState, useEffect } from 'react';
import './FullscreenButton.css';
import { enterFullscreen, exitFullscreen, isFullscreen } from '../../utils/fullscreen';

const FullscreenButton = ({ fullscreenLocked, setFullscreenLocked }) => {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = isFullscreen();
      setFullscreen(inFullscreen);
      console.log('Fullscreen state changed:', inFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Check initial state
    setFullscreen(isFullscreen());

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    console.log('Fullscreen button clicked!');
    
    if (!fullscreen) {
      console.log('Entering fullscreen...');
      setFullscreenLocked(true);
      try {
        await enterFullscreen();
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    } else {
      console.log('Exiting fullscreen...');
      setFullscreenLocked(false);
      try {
        await exitFullscreen();
      } catch (err) {
        console.error('Failed to exit fullscreen:', err);
      }
    }
  };

  return (
    <button
      className="fullscreen-button"
      onClick={toggleFullscreen}
      title={fullscreen ? "Exit Fullscreen (Locked)" : "Enter Fullscreen"}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: fullscreenLocked && fullscreen ? '#e74c3c' : '#f88b3e',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        zIndex: 9999,
        fontSize: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease'
      }}
    >
      {fullscreen ? '⛶' : '⛶'}
    </button>
  );
};

export default FullscreenButton;
