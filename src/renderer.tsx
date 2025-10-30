import * as React from 'react';
import { createRoot } from 'react-dom/client';
import InfiniteGridCanvas from './components/InfiniteGrid';

// Render the infinite grid app
const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <InfiniteGridCanvas />
  </React.StrictMode>
);
