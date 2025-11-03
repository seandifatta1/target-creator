import * as React from 'react';
import { useState, useEffect } from 'react';
import Toolbar from './Toolbar';
import HamburgerMenu, { HamburgerMenuItem } from './HamburgerMenu';
import InfiniteGridCanvas from './InfiniteGrid';
import Drawer from './Drawer';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import { useCoordinateRegistry } from '../hooks/useCoordinateRegistry';
import { useRelationshipManager } from '../hooks/useRelationshipManager';
import { Coordinate } from '../services/CoordinateRegistry';
import { RelatedItem } from '../services/RelationshipManager';
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
  
  // State for placed objects and paths (will be lifted from InfiniteGridCanvas)
  const [placedObjects, setPlacedObjects] = useState<Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>>([]);
  const [placedPaths, setPlacedPaths] = useState<Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; name?: string; litTiles: [number, number, number][] }>>([]);
  const [coordinates, setCoordinates] = useState<Array<{ id: string; position: [number, number, number]; name?: string }>>([]);
  
  // Business logic services
  const { registry: coordinateRegistry, getAll: getAllCoordinates, updateName: updateCoordinateName } = useCoordinateRegistry();
  const { manager: relationshipManager, getRelatedItems, getRelationshipCounts } = useRelationshipManager();
  
  // Sync coordinates from registry
  useEffect(() => {
    setCoordinates(coordinateRegistry.getAll());
  }, [coordinateRegistry, coordinates.length]);
  
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
            coordinateRegistry={coordinateRegistry}
            relationshipManager={relationshipManager}
            onCoordinatesChange={(coords) => setCoordinates(coords)}
            onPlacedObjectsChange={setPlacedObjects}
            onPlacedPathsChange={setPlacedPaths}
            placedObjects={placedObjects}
            placedPaths={placedPaths}
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
                  {relationshipManager && selectedItem ? (() => {
                    const counts = relationshipManager.getRelationshipCounts('target', selectedItem.id);
                    const relatedItems = relationshipManager.getRelatedItems(
                      'target',
                      selectedItem.id,
                      coordinates,
                      placedObjects,
                      placedPaths
                    );
                    const relatedTargets = relatedItems.filter(item => item.type === 'target');
                    const relatedPaths = relatedItems.filter(item => item.type === 'path');
                    const relatedCoords = relatedItems.filter(item => item.type === 'coordinate');
                    
                    return (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">Paths:</span>
                          <span className="detail-value">{relatedPaths.length}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Coordinates:</span>
                          <span className="detail-value">{relatedCoords.length}</span>
                        </div>
                        {relatedPaths.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div className="detail-label" style={{ marginBottom: '5px' }}>Related Paths:</div>
                            {relatedPaths.map(item => (
                              <div 
                                key={item.id} 
                                className="detail-value" 
                                style={{ cursor: 'pointer', color: '#9b59b6', textDecoration: 'underline' }}
                                onClick={() => {
                                  const path = placedPaths.find(p => p.id === item.id);
                                  if (path) {
                                    setSelectedItem({
                                      type: 'path',
                                      id: path.id,
                                      pathType: path.pathType,
                                      label: path.pathLabel,
                                      name: path.name,
                                      points: path.litTiles || []
                                    });
                                    setActiveTab('paths');
                                    setSelectedPathId(path.id);
                                  }
                                }}
                              >
                                {item.name || item.id}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div className="detail-row">
                      <span className="detail-value">Loading relationships...</span>
                    </div>
                  )}
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
                  {relationshipManager && selectedItem ? (() => {
                    const counts = relationshipManager.getRelationshipCounts('path', selectedItem.id);
                    const relatedItems = relationshipManager.getRelatedItems(
                      'path',
                      selectedItem.id,
                      coordinates,
                      placedObjects,
                      placedPaths
                    );
                    const relatedTargets = relatedItems.filter(item => item.type === 'target');
                    const relatedPaths = relatedItems.filter(item => item.type === 'path');
                    const relatedCoords = relatedItems.filter(item => item.type === 'coordinate');
                    
                    return (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">Targets:</span>
                          <span className="detail-value">{relatedTargets.length}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Coordinates:</span>
                          <span className="detail-value">{relatedCoords.length}</span>
                        </div>
                        {relatedTargets.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div className="detail-label" style={{ marginBottom: '5px' }}>Related Targets:</div>
                            {relatedTargets.map(item => (
                              <div 
                                key={item.id} 
                                className="detail-value" 
                                style={{ cursor: 'pointer', color: '#9b59b6', textDecoration: 'underline' }}
                                onClick={() => {
                                  const target = placedObjects.find(t => t.id === item.id);
                                  if (target) {
                                    setSelectedItem({
                                      type: 'target',
                                      id: target.id,
                                      targetId: target.targetId,
                                      label: target.targetLabel,
                                      name: target.name,
                                      position: target.position,
                                      iconEmoji: target.iconEmoji
                                    });
                                    setActiveTab('targets');
                                    setSelectedTargetId(target.id);
                                  }
                                }}
                              >
                                {item.name || item.id}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div className="detail-row">
                      <span className="detail-value">Loading relationships...</span>
                    </div>
                  )}
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
                  {relationshipManager && selectedItem ? (() => {
                    const counts = relationshipManager.getRelationshipCounts('coordinate', selectedItem.id);
                    const relatedItems = relationshipManager.getRelatedItems(
                      'coordinate',
                      selectedItem.id,
                      coordinates,
                      placedObjects,
                      placedPaths
                    );
                    const relatedTargets = relatedItems.filter(item => item.type === 'target');
                    const relatedPaths = relatedItems.filter(item => item.type === 'path');
                    
                    return (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">Targets:</span>
                          <span className="detail-value">{relatedTargets.length}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Paths:</span>
                          <span className="detail-value">{relatedPaths.length}</span>
                        </div>
                        {relatedTargets.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div className="detail-label" style={{ marginBottom: '5px' }}>Related Targets:</div>
                            {relatedTargets.map(item => (
                              <div 
                                key={item.id} 
                                className="detail-value" 
                                style={{ cursor: 'pointer', color: '#9b59b6', textDecoration: 'underline' }}
                                onClick={() => {
                                  const target = placedObjects.find(t => t.id === item.id);
                                  if (target) {
                                    setSelectedItem({
                                      type: 'target',
                                      id: target.id,
                                      targetId: target.targetId,
                                      label: target.targetLabel,
                                      name: target.name,
                                      position: target.position,
                                      iconEmoji: target.iconEmoji
                                    });
                                    setActiveTab('targets');
                                    setSelectedTargetId(target.id);
                                  }
                                }}
                              >
                                {item.name || item.id}
                              </div>
                            ))}
                          </div>
                        )}
                        {relatedPaths.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div className="detail-label" style={{ marginBottom: '5px' }}>Related Paths:</div>
                            {relatedPaths.map(item => (
                              <div 
                                key={item.id} 
                                className="detail-value" 
                                style={{ cursor: 'pointer', color: '#9b59b6', textDecoration: 'underline' }}
                                onClick={() => {
                                  const path = placedPaths.find(p => p.id === item.id);
                                  if (path) {
                                    setSelectedItem({
                                      type: 'path',
                                      id: path.id,
                                      pathType: path.pathType,
                                      label: path.pathLabel,
                                      name: path.name,
                                      points: path.litTiles || []
                                    });
                                    setActiveTab('paths');
                                    setSelectedPathId(path.id);
                                  }
                                }}
                              >
                                {item.name || item.id}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div className="detail-row">
                      <span className="detail-value">Loading relationships...</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : undefined}
        targets={placedObjects.map(obj => ({ id: obj.id, name: obj.name, label: obj.targetLabel }))}
        paths={placedPaths.map(path => ({ id: path.id, name: path.name, label: path.pathLabel }))}
        coordinates={coordinates.map(coord => ({ id: coord.id, name: coord.name, position: coord.position }))}
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
