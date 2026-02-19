import React, { useEffect } from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import Dashboard from './Components/Dashboard';
import LoginSignup from './Components/test2';
import DashboardTwo from './Components/Iconbar';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import BillingSection from './Components/BillingSection';
import ImageTransferSection from './Components/ImageTransfer';
import FullscreenButton from './Components/FullscreenButton';

import './App.css';

function App() {
  useEffect(() => {
    // Auto-enter fullscreen on app load
    const enterFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.log('Auto-fullscreen failed, user interaction required:', err);
        });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    };

    // Try immediately (may fail due to browser security)
    enterFullscreen();

    // Fallback: Enter fullscreen on first user interaction
    const handleFirstInteraction = () => {
      enterFullscreen();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  return (
    <div className="App">
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
      <FullscreenButton />
    </div>
  );
}

export default App;


