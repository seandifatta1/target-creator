import * as React from 'react';
import { useState } from 'react';
import Toolbar from './Toolbar';
import HamburgerMenu, { HamburgerMenuItem } from './HamburgerMenu';
import InfiniteGridCanvas from './InfiniteGrid';
import Drawer from './Drawer';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import './App.css';

export type SelectedItem = 
  | { type: 'target'; id: string; targetId: string; label: string; name?: string; position: [number, number, number]; iconEmoji?: string }
  | { type: 'path'; id: string; pathType: string; label: string; name?: string; points: [number, number, number][] }
  | { type: 'coordinate'; id: string; position: [number, number, number]; name?: string }
  | null;

const App: React.FC = () => {
  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);
  const [isRightMenuOpen, setIsRightMenuOpen] = useState(true); // Open by default
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [activeTab, setActiveTab] = useState<'targets' | 'paths' | 'coordinates'>('targets');
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>();
  const [selectedPathId, setSelectedPathId] = useState<string | undefined>();
  const [selectedCoordinateId, setSelectedCoordinateId] = useState<string | undefined>();
  
  // Mock data for relationships (will be replaced with real data later)
  const [mockTargets] = useState([
    { id: 'target-1', name: 'Target Alpha', label: 'Target 1' },
    { id: 'target-2', name: 'Target Beta', label: 'Target 2' },
  ]);
  const [mockPaths] = useState([
    { id: 'path-1', name: 'Path One', label: 'Line' },
    { id: 'path-2', name: 'Path Two', label: 'Line' },
  ]);
  const [mockCoordinates] = useState([
    { id: 'coord-1', name: 'Coordinate A', position: [0, 0, 0] as [number, number, number] },
    { id: 'coord-2', name: 'Coordinate B', position: [1, 0, 1] as [number, number, number] },
  ]);
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
          <InfiniteGridCanvas 
            selectedItem={selectedItem}
            onSelectItem={(item) => {
              setSelectedItem(item);
              // Set active tab based on item type
              if (item) {
                if (item.type === 'target') {
                  setActiveTab('targets');
                  setSelectedTargetId(item.id);
                } else if (item.type === 'path') {
                  setActiveTab('paths');
                  setSelectedPathId(item.id);
                } else if (item.type === 'coordinate') {
                  setActiveTab('coordinates');
                  setSelectedCoordinateId(item.id);
                }
              }
            }}
          />
        </div>
        <HamburgerMenu
          isOpen={isRightMenuOpen}
          position="right"
          onToggle={() => setIsRightMenuOpen(!isRightMenuOpen)}
          items={rightMenuItems}
          initiallyExpanded={['target-browser', 'path-browser']}
        />
      </div>
      
      {/* Bottom Drawer */}
      <Drawer
        isOpen={selectedItem !== null}
        onClose={() => {
          setSelectedItem(null);
          setSelectedTargetId(undefined);
          setSelectedPathId(undefined);
          setSelectedCoordinateId(undefined);
        }}
        title={selectedItem ? (selectedItem.name || (selectedItem.type === 'coordinate' ? `[${selectedItem.position[0]}, ${selectedItem.position[1]}, ${selectedItem.position[2]}]` : selectedItem.label)) : undefined}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        leftContent={selectedItem ? (
          <div className="drawer-item-details">
            {selectedItem.type === 'target' ? (
              <>
                <div className="detail-section">
                  <h4>Target Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedItem.name || selectedItem.label}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{selectedItem.targetId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Position:</span>
                    <span className="detail-value">
                      [{selectedItem.position[0]}, {selectedItem.position[1]}, {selectedItem.position[2]}]
                    </span>
                  </div>
                </div>
                <div className="detail-section" style={{ marginTop: '20px' }}>
                  <h4>Relationships</h4>
                  <div className="detail-row">
                    <span className="detail-label">Paths:</span>
                    <span className="detail-value">2 (mock)</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Coordinates:</span>
                    <span className="detail-value">1 (mock)</span>
                  </div>
                </div>
              </>
            ) : selectedItem.type === 'path' ? (
              <>
                <div className="detail-section">
                  <h4>Path Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedItem.name || selectedItem.label}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{selectedItem.pathType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Lit Tiles:</span>
                    <span className="detail-value">{selectedItem.points.length}</span>
                  </div>
                </div>
                <div className="detail-section" style={{ marginTop: '20px' }}>
                  <h4>Relationships</h4>
                  <div className="detail-row">
                    <span className="detail-label">Targets:</span>
                    <span className="detail-value">3 (mock)</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Coordinates:</span>
                    <span className="detail-value">{selectedItem.points.length} (mock)</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="detail-section">
                  <h4>Coordinate Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedItem.name || `[${selectedItem.position[0]}, ${selectedItem.position[1]}, ${selectedItem.position[2]}]`}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Position:</span>
                    <span className="detail-value">
                      [{selectedItem.position[0]}, {selectedItem.position[1]}, {selectedItem.position[2]}]
                    </span>
                  </div>
                </div>
                <div className="detail-section" style={{ marginTop: '20px' }}>
                  <h4>Relationships</h4>
                  <div className="detail-row">
                    <span className="detail-label">Targets:</span>
                    <span className="detail-value">1 (mock)</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Paths:</span>
                    <span className="detail-value">2 (mock)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : undefined}
        targets={mockTargets}
        paths={mockPaths}
        coordinates={mockCoordinates}
        selectedTargetId={selectedTargetId}
        selectedPathId={selectedPathId}
        selectedCoordinateId={selectedCoordinateId}
        onTargetSelect={(id) => {
          setSelectedTargetId(id);
          setActiveTab('targets');
        }}
        onPathSelect={(id) => {
          setSelectedPathId(id);
          setActiveTab('paths');
        }}
        onCoordinateSelect={(id) => {
          setSelectedCoordinateId(id);
          setActiveTab('coordinates');
        }}
      />
    </div>
  );
};

export default App;
