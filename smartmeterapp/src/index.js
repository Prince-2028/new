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

// Unregister service worker to prevent aggressive caching during development
// This ensures updates are immediately visible without hard refresh
serviceWorkerRegistration.unregister();

// If you want PWA functionality in production, use this instead:
// serviceWorkerRegistration.register({
//   onSuccess: () => console.log('PWA installed successfully!'),
//   onUpdate: (registration) => {
//     console.log('New version available! Reloading...');
//     // Automatically reload on update
//     if (registration && registration.waiting) {
//       registration.waiting.postMessage({ type: 'SKIP_WAITING' });
//     }
//     window.location.reload();
//   }
// });

reportWebVitals();
