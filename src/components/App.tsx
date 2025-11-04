import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import Toolbar from './Toolbar';
import HamburgerMenu, { HamburgerMenuItem } from './HamburgerMenu';
import InfiniteGridCanvas from './InfiniteGrid';
import Drawer from './Drawer';
import ExportWizard from './ExportWizard';
import ImportDialog from './ImportDialog';
import SettingsModal, { CoordinateSettings } from './SettingsModal';
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
  
  // Dialog states
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [coordinateSettings, setCoordinateSettings] = useState<CoordinateSettings>({
    system: 'Cartesian',
    minUnit: 0.1
  });
  
  // Business logic services
  const { registry: coordinateRegistry, getAll: getAllCoordinates, updateName: updateCoordinateName } = useCoordinateRegistry();
  const { manager: relationshipManager, getRelatedItems, getRelationshipCounts, attachTargetToCoordinate, attachPathToCoordinates, detachTargetFromCoordinate, detachPathFromCoordinate } = useRelationshipManager();
  
  // Sync coordinates from registry
  useEffect(() => {
    setCoordinates(coordinateRegistry.getAll());
  }, [coordinateRegistry, coordinates.length]);
  
  const { isDragging } = useDragTargetContext();
  
  // Get selected item IDs for export
  const getSelectedItemIds = () => {
    if (!selectedItem) return { targets: [], paths: [], coordinates: [] };
    
    if (selectedItem.type === 'target') {
      return { targets: [selectedItem.id], paths: [], coordinates: [] };
    } else if (selectedItem.type === 'path') {
      return { targets: [], paths: [selectedItem.id], coordinates: [] };
    } else if (selectedItem.type === 'coordinate') {
      return { targets: [], paths: [], coordinates: [selectedItem.id] };
    }
    return { targets: [], paths: [], coordinates: [] };
  };
  
  // Handle import
  const handleImport = (importData: any) => {
    // Import targets
    if (importData.targets && Array.isArray(importData.targets)) {
      const newTargets = importData.targets.map((t: any) => ({
        id: t.id || `obj_${Date.now()}_${Math.random()}`,
        position: t.position || [0, 0, 0],
        targetId: t.targetId || t.id || 'target',
        targetLabel: t.targetLabel || t.label || 'Imported Target',
        name: t.name,
        iconEmoji: t.iconEmoji || '🎯'
      }));
      setPlacedObjects([...placedObjects, ...newTargets]);
      
      // Create relationships for imported targets
      if (importData.relationships?.targetToCoordinate && relationshipManager) {
        importData.relationships.targetToCoordinate.forEach((rel: any) => {
          const target = newTargets.find(t => t.id === rel.targetId);
          if (target) {
            const coord = coordinateRegistry.getOrCreate(target.position);
            relationshipManager.attachTargetToCoordinate(target.id, coord.id);
          }
        });
      }
    }
    
    // Import paths
    if (importData.paths && Array.isArray(importData.paths)) {
      const newPaths = importData.paths.map((p: any) => ({
        id: p.id || `path_${Date.now()}_${Math.random()}`,
        points: [],
        pathType: p.pathType || 'path-line',
        pathLabel: p.pathLabel || p.label || 'Imported Path',
        name: p.name,
        litTiles: p.litTiles || p.points || []
      }));
      setPlacedPaths([...placedPaths, ...newPaths]);
      
      // Create relationships for imported paths
      if (importData.relationships?.pathToCoordinates && relationshipManager) {
        importData.relationships.pathToCoordinates.forEach((rel: any) => {
          const path = newPaths.find(p => p.id === rel.pathId);
          if (path && rel.coordinateIds) {
            const coordIds = rel.coordinateIds.map((coordId: string) => {
              // Find or create coordinates
              const coord = coordinates.find(c => c.id === coordId);
              if (coord) return coord.id;
              // If coordinate not found, create from path points
              if (path.litTiles && path.litTiles.length > 0) {
                return path.litTiles.map(pos => coordinateRegistry.getOrCreate(pos).id);
              }
              return [];
            }).flat();
            relationshipManager.attachPathToCoordinates(path.id, coordIds);
          }
        });
      }
    }
    
    // Update coordinates
    setCoordinates([...coordinateRegistry.getAll()]);
  };

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
        onExport={() => setIsExportWizardOpen(true)}
        onImport={() => setIsImportDialogOpen(true)}
        onSettings={() => setIsSettingsModalOpen(true)}
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
            relatedItemIds={selectedItem && relationshipManager ? (() => {
              const relatedItems = relationshipManager.getRelatedItems(
                selectedItem.type,
                selectedItem.id,
                coordinates,
                placedObjects,
                placedPaths
              );
              return {
                targets: relatedItems.filter(item => item.type === 'target').map(item => item.id),
                paths: relatedItems.filter(item => item.type === 'path').map(item => item.id),
                coordinates: relatedItems.filter(item => item.type === 'coordinate').map(item => item.id)
              };
            })() : { targets: [], paths: [], coordinates: [] }}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>Relationships</h4>
                    <Popover
                      content={
                        <Menu>
                          {coordinates.map(coord => {
                            const currentCoordIds = relationshipManager?.getTargetCoordinates(selectedItem.id) || [];
                            const isLinked = currentCoordIds.includes(coord.id);
                            return (
                              <MenuItem
                                key={coord.id}
                                text={coord.name || `[${coord.position[0]}, ${coord.position[1]}, ${coord.position[2]}]`}
                                icon={isLinked ? IconNames.TICK : IconNames.CIRCLE}
                                onClick={() => {
                                  if (isLinked) {
                                    detachTargetFromCoordinate(selectedItem.id, coord.id);
                                  } else {
                                    attachTargetToCoordinate(selectedItem.id, coord.id);
                                  }
                                  // Force re-render by updating coordinates
                                  setCoordinates([...coordinateRegistry.getAll()]);
                                }}
                              />
                            );
                          })}
                        </Menu>
                      }
                      position={Position.BOTTOM_RIGHT}
                    >
                      <Button icon={IconNames.ADD} minimal small text="Link Coordinate" />
                    </Popover>
                  </div>
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
                        {relatedCoords.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div className="detail-label" style={{ marginBottom: '5px' }}>Linked Coordinates:</div>
                            {relatedCoords.map(item => {
                              const coord = coordinates.find(c => c.id === item.id);
                              return (
                                <div 
                                  key={item.id} 
                                  style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '4px 0',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    const coord = coordinates.find(c => c.id === item.id);
                                    if (coord) {
                                      setSelectedItem({
                                        type: 'coordinate',
                                        id: coord.id,
                                        position: coord.position,
                                        name: coord.name
                                      });
                                      setActiveTab('coordinates');
                                      setSelectedCoordinateId(coord.id);
                                    }
                                  }}
                                >
                                  <span style={{ color: '#9b59b6', textDecoration: 'underline' }}>
                                    {item.name || (coord ? `[${coord.position[0]}, ${coord.position[1]}, ${coord.position[2]}]` : item.id)}
                                  </span>
                                  <Button
                                    icon={IconNames.CROSS}
                                    minimal
                                    small
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      detachTargetFromCoordinate(selectedItem.id, item.id);
                                      setCoordinates([...coordinateRegistry.getAll()]);
                                    }}
                                  />
                                </div>
                              );
                            })}
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
                        {relatedCoords.length === 0 && relatedPaths.length === 0 && (
                          <p style={{ color: '#888', fontStyle: 'italic', marginTop: '10px' }}>
                            No relationships. Click "Link Coordinate" to create one.
                          </p>
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
                  <h4>Coordinates</h4>
                  {selectedItem.points.length > 0 ? (
                    <div style={{ marginTop: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#a8c7e8', fontWeight: '600' }}>X</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#a8c7e8', fontWeight: '600' }}>Y</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#a8c7e8', fontWeight: '600' }}>Z</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItem.points.map((point, index) => (
                            <tr 
                              key={index} 
                              style={{ 
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <td style={{ padding: '8px', textAlign: 'right', color: '#fff' }}>{point[0]}</td>
                              <td style={{ padding: '8px', textAlign: 'right', color: '#fff' }}>{point[1]}</td>
                              <td style={{ padding: '8px', textAlign: 'right', color: '#fff' }}>{point[2]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>No coordinates available</p>
                  )}
                </div>
                <div className="detail-section" style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>Relationships</h4>
                    <Popover
                      content={
                        <Menu>
                          {coordinates.map(coord => {
                            const currentCoordIds = relationshipManager?.getPathCoordinates(selectedItem.id) || [];
                            const isLinked = currentCoordIds.includes(coord.id);
                            return (
                              <MenuItem
                                key={coord.id}
                                text={coord.name || `[${coord.position[0]}, ${coord.position[1]}, ${coord.position[2]}]`}
                                icon={isLinked ? IconNames.TICK : IconNames.CIRCLE}
                                onClick={() => {
                                  const currentIds = relationshipManager?.getPathCoordinates(selectedItem.id) || [];
                                  if (isLinked) {
                                    detachPathFromCoordinate(selectedItem.id, coord.id);
                                  } else {
                                    attachPathToCoordinates(selectedItem.id, [...currentIds, coord.id]);
                                  }
                                  setCoordinates([...coordinateRegistry.getAll()]);
                                }}
                              />
                            );
                          })}
                        </Menu>
                      }
                      position={Position.BOTTOM_RIGHT}
                    >
                      <Button icon={IconNames.ADD} minimal small text="Link Coordinates" />
                    </Popover>
                  </div>
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
                        {relatedCoords.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div className="detail-label" style={{ marginBottom: '5px' }}>Linked Coordinates:</div>
                            {relatedCoords.map(item => {
                              const coord = coordinates.find(c => c.id === item.id);
                              return (
                                <div 
                                  key={item.id} 
                                  style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '4px 0',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    const coord = coordinates.find(c => c.id === item.id);
                                    if (coord) {
                                      setSelectedItem({
                                        type: 'coordinate',
                                        id: coord.id,
                                        position: coord.position,
                                        name: coord.name
                                      });
                                      setActiveTab('coordinates');
                                      setSelectedCoordinateId(coord.id);
                                    }
                                  }}
                                >
                                  <span style={{ color: '#9b59b6', textDecoration: 'underline' }}>
                                    {item.name || (coord ? `[${coord.position[0]}, ${coord.position[1]}, ${coord.position[2]}]` : item.id)}
                                  </span>
                                  <Button
                                    icon={IconNames.CROSS}
                                    minimal
                                    small
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      detachPathFromCoordinate(selectedItem.id, item.id);
                                      setCoordinates([...coordinateRegistry.getAll()]);
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                        {relatedCoords.length === 0 && relatedTargets.length === 0 && (
                          <p style={{ color: '#888', fontStyle: 'italic', marginTop: '10px' }}>
                            No relationships. Click "Link Coordinates" to create one.
                          </p>
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
                  <h4 style={{ marginBottom: '10px' }}>Relationships</h4>
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
                            <div className="detail-label" style={{ marginBottom: '5px' }}>Linked Targets:</div>
                            {relatedTargets.map(item => {
                              const target = placedObjects.find(t => t.id === item.id);
                              return (
                                <div 
                                  key={item.id} 
                                  style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '4px 0',
                                    cursor: 'pointer'
                                  }}
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
                                  <span style={{ color: '#9b59b6', textDecoration: 'underline' }}>
                                    {item.name || item.id}
                                  </span>
                                  <Button
                                    icon={IconNames.CROSS}
                                    minimal
                                    small
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      detachTargetFromCoordinate(item.id, selectedItem.id);
                                      setCoordinates([...coordinateRegistry.getAll()]);
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {relatedPaths.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <div className="detail-label" style={{ marginBottom: '5px' }}>Linked Paths:</div>
                            {relatedPaths.map(item => {
                              const path = placedPaths.find(p => p.id === item.id);
                              return (
                                <div 
                                  key={item.id} 
                                  style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '4px 0',
                                    cursor: 'pointer'
                                  }}
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
                                  <span style={{ color: '#9b59b6', textDecoration: 'underline' }}>
                                    {item.name || item.id}
                                  </span>
                                  <Button
                                    icon={IconNames.CROSS}
                                    minimal
                                    small
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      detachPathFromCoordinate(item.id, selectedItem.id);
                                      setCoordinates([...coordinateRegistry.getAll()]);
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {relatedTargets.length === 0 && relatedPaths.length === 0 && (
                          <p style={{ color: '#888', fontStyle: 'italic', marginTop: '10px' }}>
                            No relationships. Relationships are created automatically when targets or paths are placed at this coordinate.
                          </p>
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
      
      {/* Export Wizard */}
      <ExportWizard
        isOpen={isExportWizardOpen}
        onClose={() => setIsExportWizardOpen(false)}
        targets={placedObjects}
        paths={placedPaths}
        coordinates={coordinates}
        relationshipManager={relationshipManager}
        coordinateSystem={coordinateSettings.system}
        selectedItemIds={getSelectedItemIds()}
      />
      
      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImport}
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={coordinateSettings}
        onSettingsChange={setCoordinateSettings}
      />
    </div>
  );
};

export default App;
