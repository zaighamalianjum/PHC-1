import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
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

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
