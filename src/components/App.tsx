import * as React from 'react';
import { useState } from 'react';
import Toolbar from './Toolbar';
import HamburgerMenu from './HamburgerMenu';
import InfiniteGridCanvas from './InfiniteGrid';
import './App.css';

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'scenes', label: 'Scenes', onClick: () => console.log('Scenes clicked') },
    { id: 'targets', label: 'Targets', onClick: () => console.log('Targets clicked') },
    { id: 'settings', label: 'Settings', onClick: () => console.log('Settings clicked') },
  ];

  return (
    <div className="app-container">
      <Toolbar 
        title="Target Creator"
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />
      <div className="app-body">
        <HamburgerMenu
          isOpen={isMenuOpen}
          onToggle={() => setIsMenuOpen(!isMenuOpen)}
          items={menuItems}
          header={<div className="menu-header">Target Creator</div>}
          footer={<div className="menu-footer">v1.0.0</div>}
        />
        <div className={`app-content ${isMenuOpen ? 'menu-open' : ''}`}>
          <InfiniteGridCanvas />
        </div>
      </div>
    </div>
  );
};

export default App;

