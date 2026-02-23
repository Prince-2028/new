import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import Dashboard from './Components/Dashboard';
import LoginSignup from './Components/test2';
import DashboardTwo from './Components/Iconbar';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import BillingSection from './Components/BillingSection';
import ImageTransferSection from './Components/ImageTransfer';
import FullscreenButton from './Components/FullscreenButton';
import FullscreenPrompt from './Components/FullscreenPrompt';
import { AlertProvider, setupCustomAlert, useAlert } from './Components/CustomAlert';
import { enterFullscreen } from './utils/fullscreen';

import './App.css';

function AppContent() {
  const [fullscreenLocked, setFullscreenLocked] = useState(true);
  const [fullscreenActivated, setFullscreenActivated] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    // Setup custom alert globally
    setupCustomAlert(showAlert);
    console.log('Custom alert system initialized');
  }, [showAlert]);

  useEffect(() => {
    console.log('App mounted - setting up fullscreen triggers');

    // Try to enter fullscreen on ANY user interaction
    const activateFullscreen = () => {
      if (!fullscreenActivated) {
        console.log('First user interaction detected, entering fullscreen...');
        enterFullscreen()
          .then(() => {
            console.log('✓ Fullscreen activated successfully');
            setFullscreenActivated(true);
            localStorage.setItem('fullscreenActivated', 'true');
          })
          .catch(err => {
            console.log('✗ Fullscreen activation failed:', err);
          });
      }
    };

    // Check if fullscreen was previously activated
    const wasActivated = localStorage.getItem('fullscreenActivated') === 'true';
    if (wasActivated) {
      console.log('Fullscreen was previously activated, attempting to re-enter...');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        activateFullscreen();
      }, 100);
    }

    // Listen for ANY user interaction
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, activateFullscreen, { once: true, capture: true });
    });

    // Monitor fullscreen changes and re-enter if locked - MORE AGGRESSIVE
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      console.log('Fullscreen change detected. In fullscreen:', isInFullscreen, 'Locked:', fullscreenLocked);
      
      if (!isInFullscreen && fullscreenLocked && fullscreenActivated) {
        console.log('Fullscreen exited unexpectedly, re-entering IMMEDIATELY...');
        // Immediate re-entry without delay
        enterFullscreen()
          .then(() => console.log('✓ Re-entered fullscreen successfully'))
          .catch(err => {
            console.log('✗ Failed to re-enter fullscreen, retrying...', err);
            // Retry after short delay if first attempt fails
            setTimeout(() => {
              enterFullscreen().catch(e => console.log('Retry failed:', e));
            }, 50);
          });
      }
    };

    // Use multiple event listeners for better browser compatibility
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Also listen for visibility changes (when user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden && fullscreenLocked && fullscreenActivated) {
        const isInFullscreen = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        );
        
        if (!isInFullscreen) {
          console.log('Tab became visible and not in fullscreen, re-entering...');
          setTimeout(() => {
            enterFullscreen().catch(err => console.log('Failed on visibility change:', err));
          }, 100);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, activateFullscreen, { capture: true });
      });
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fullscreenLocked, fullscreenActivated]);

  return (
    <div className="App">
      <FullscreenPrompt />
      <Router>
        <Routes>
          <Route path="/" element={<LoginSignup />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/header"
            element={
              <PrivateRoute requireDevice={true}>
                <DashboardTwo />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
      <FullscreenButton 
        fullscreenLocked={fullscreenLocked} 
        setFullscreenLocked={setFullscreenLocked} 
      />
    </div>
  );
}

function App() {
  return (
    <AlertProvider>
      <AppContent />
    </AlertProvider>
  );
}

export default App;


