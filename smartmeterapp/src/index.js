import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA
serviceWorkerRegistration.register({
  onSuccess: () => console.log('PWA installed successfully!'),
  onUpdate: (registration) => {
    console.log('New version available! Please refresh.');
    if (window.confirm('New version available! Reload to update?')) {
      window.location.reload();
    }
  }
});

reportWebVitals();
