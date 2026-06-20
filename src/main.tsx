import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the offline-first Service Worker for FlowSpace AI
if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[FlowSpace SW] Service Worker registered with scope: ', registration.scope);
      })
      .catch((err) => {
        console.error('[FlowSpace SW] Registration failed: ', err);
      });
  });
}

