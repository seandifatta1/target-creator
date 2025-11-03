import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { DragTargetProvider } from './hooks/DragTargetContext';
import './index.css';

// Render the app
const root = createRoot(
  document.getElementById('root') as HTMLElement
);

// Apply dark theme class to body for Blueprint
document.body.classList.add('bp3-dark');

root.render(
  <React.StrictMode>
    <DragTargetProvider>
      <App />
    </DragTargetProvider>
  </React.StrictMode>
);
