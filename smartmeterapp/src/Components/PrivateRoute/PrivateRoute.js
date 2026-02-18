// src/Components/PrivateRoute/PrivateRoute.js
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, requireDevice = false }) => {
  const userId = localStorage.getItem('userId');
  const selectedDeviceId = localStorage.getItem('selectedDeviceId');

  if (!userId) {
    return <Navigate to="/" />;
  }

  if (requireDevice && !selectedDeviceId) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute;
