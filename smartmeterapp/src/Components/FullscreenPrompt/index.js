import React, { useState, useEffect } from 'react';
import { enterFullscreen } from '../../utils/fullscreen';
import './FullscreenPrompt.css';

const FullscreenPrompt = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Check if already in fullscreen
    const isInFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    if (isInFullscreen) {
      setShow(false);
    }

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const inFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      if (inFullscreen) {
        setShow(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleEnterFullscreen = async () => {
    try {
      await enterFullscreen();
      setShow(false);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  };

  if (!show) return null;

  return (
    <div className="fullscreen-prompt-overlay" onClick={handleEnterFullscreen}>
      <div className="fullscreen-prompt-content">
        <div className="fullscreen-prompt-icon">⛶</div>
        <h2>Click anywhere to enter fullscreen</h2>
        <p>For the best experience, this application runs in fullscreen mode</p>
      </div>
    </div>
  );
};

export default FullscreenPrompt;
