// config.js
import axios from 'axios';

const hostname = window.location.hostname;

let BASE_URL;

if (hostname === 'localhost' || hostname === '127.0.0.1') {
  // Local development
  BASE_URL = 'http://127.0.0.1:8000/meter1';
} else if (hostname.includes('trycloudflare.com')) {
  // Cloudflare Tunnel - Replace with YOUR backend tunnel URL
  BASE_URL = 'https://shops-rouge-particular-puts.trycloudflare.com/meter1';
} else if (hostname.includes('loca.lt')) {
  // localtunnel - Replace with YOUR backend tunnel URL
  BASE_URL = 'https://smartmeter-avc-be.loca.lt/meter1';
} else if (hostname.includes('ngrok')) {
  // ngrok
  BASE_URL = 'https://YOUR-BACKEND-NGROK-URL.ngrok-free.app/meter1';
} else {
  // For other forwarded URLs (VS Code port forwarding)
  BASE_URL = `${window.location.protocol}//${window.location.hostname.replace('-3000', '-8000')}/meter1`;
}

// Add bypass header for localtunnel
if (hostname.includes('loca.lt')) {
  axios.defaults.headers.common['bypass-tunnel-reminder'] = 'true';
}

// Debug: Log the BASE_URL
console.log('Current hostname:', hostname);
console.log('BASE_URL being used:', BASE_URL);

export default BASE_URL;
