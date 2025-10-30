import * as React from 'react';
import { useState } from 'react';
import Toolbar from './Toolbar';
import HamburgerMenu, { HamburgerMenuItem } from './HamburgerMenu';
import InfiniteGridCanvas from './InfiniteGrid';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import './App.css';

const App: React.FC = () => {
  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);
  const [isRightMenuOpen, setIsRightMenuOpen] = useState(true); // Open by default
  const { isDragging } = useDragTargetContext();

  const leftMenuItems: HamburgerMenuItem[] = [
    { id: 'scenes', label: 'Scenes', onClick: () => console.log('Scenes clicked') },
    { id: 'targets', label: 'Targets', onClick: () => console.log('Targets clicked') },
    { id: 'settings', label: 'Settings', onClick: () => console.log('Settings clicked') },
  ];

  const rightMenuItems: HamburgerMenuItem[] = [
    {
      id: 'target-browser',
      label: 'Target browser',
      children: [
        { id: 'target-1', label: 'Target 1', icon: <span>🎯</span>, onClick: () => console.log('Target 1 clicked') },
        { id: 'target-2', label: 'Target 2', icon: <span>🎯</span>, onClick: () => console.log('Target 2 clicked') },
        { id: 'target-3', label: 'Target 3', icon: <span>🎯</span>, onClick: () => console.log('Target 3 clicked') },
        { id: 'target-4', label: 'Target 4', icon: <span>🎯</span>, onClick: () => console.log('Target 4 clicked') },
        { id: 'target-5', label: 'Target 5', icon: <span>🎯</span>, onClick: () => console.log('Target 5 clicked') },
      ],
    },
    {
      id: 'path-browser',
      label: 'Path browser',
      children: [
        { id: 'path-line', label: 'Line', icon: <span>📏</span>, onClick: () => console.log('Line clicked') },
      ],
    },
  ];

  return (
    <div className="app-container">
      <Toolbar 
        title="Target Creator"
        onMenuToggle={() => setIsLeftMenuOpen(!isLeftMenuOpen)}
        isMenuOpen={isLeftMenuOpen}
      />
      <div className="app-body">
        <HamburgerMenu
          isOpen={isLeftMenuOpen}
          position="left"
          onToggle={() => setIsLeftMenuOpen(!isLeftMenuOpen)}
          items={leftMenuItems}
          header={<div className="menu-header">Target Creator</div>}
          footer={<div className="menu-footer">v1.0.0</div>}
        />
        <div className={`app-content ${isLeftMenuOpen ? 'left-menu-open' : ''} ${isRightMenuOpen ? 'right-menu-open' : ''} ${isDragging ? 'dragging' : ''}`}>
          <InfiniteGridCanvas />
        </div>
        <HamburgerMenu
          isOpen={isRightMenuOpen}
          position="right"
          onToggle={() => setIsRightMenuOpen(!isRightMenuOpen)}
          items={rightMenuItems}
          initiallyExpanded={['target-browser', 'path-browser']}
        />
      </div>
    </div>
  );
};

export default App;
