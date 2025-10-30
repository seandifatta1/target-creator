import * as React from 'react';
import { createRoot } from 'react-dom/client';

// Simple test component without Three.js
const TestApp: React.FC = () => {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>Target Creator - Test Mode</h1>
      <p>React is working! Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4c9eff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Click me!
      </button>
      <p style={{ marginTop: '20px', color: '#666' }}>
        If you see this, React is working. Next step: Add Three.js.
      </p>
    </div>
  );
};

// Render the test app
const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);

