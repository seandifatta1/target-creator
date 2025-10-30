import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { DragTargetProvider } from './hooks/DragTargetContext';

// Render the app
const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <DragTargetProvider>
      <App />
    </DragTargetProvider>
  </React.StrictMode>
);
