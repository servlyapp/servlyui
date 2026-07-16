import React from 'react';
import { createRoot } from 'react-dom/client';
import '@servlyui/number-input/styles.css';
import 'slot-text/style.css';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
