import * as React from 'react';
import { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Basic Electron + rdfsrdReact App</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <p>This app runs in both browser and Electron with hot reload!</p>
    </div>
  );
};

export default App;
