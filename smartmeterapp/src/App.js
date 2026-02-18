import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import Dashboard from './Components/Dashboard';
import LoginSignup from './Components/test2';
import DashboardTwo from './Components/Iconbar';
import PrivateRoute from './Components/PrivateRoute/PrivateRoute';
import BillingSection from './Components/BillingSection';
import ImageTransferSection from './Components/ImageTransfer';

import './App.css';

function App() {
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
    </div>
  );
}

export default App;


