import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './pwa.ts';
import { initializeFCMOnBoot } from './utils/fcm.ts';

// Register PWA Service Worker & Firebase Cloud Messaging
registerServiceWorker();
initializeFCMOnBoot().catch(console.warn);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

