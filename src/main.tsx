import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA Android App capability
if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost.invalid')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Store Medicine PWA Service Worker Registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA Service Worker registration error:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

