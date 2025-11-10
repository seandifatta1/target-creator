import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Button, Icon, Collapse, Menu, MenuItem, MenuDivider, OverlayToaster } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import SettingsModal, { CoordinateSettings } from '../SettingsModal';
import NameModal from '../NameModal';
import TargetBuilder from '../TargetBuilder';
import PathBuilder from '../PathBuilder';
import { OrbitControlsWrapper } from '../OrbitControlsWrapper';
import { DragTooltip } from '../DragTooltip';
import InfiniteGridScene from './InfiniteGridScene';
import { useDragTargetContext } from '../../hooks/DragTargetContext';
import { usePathCreation } from './hooks/usePathCreation';
import { ICoordinateRegistry } from '../../services/CoordinateRegistry';
import { IRelationshipManager } from '../../services/RelationshipManager';
import './InfiniteGrid.css';

/**
 * InfiniteGridCanvas - Container component for the infinite 3D grid system
 * 
 * **How it's used in the app:**
 * This is the main component that users interact with when working with the 3D grid. It provides
 * the complete infinite grid experience including: the 3D canvas for placing targets and paths,
 * UI controls for settings and annotations, context menus for creating objects, builder modals
 * for custom targets/paths, naming modals for objects, and drag-and-drop functionality. When a
 * user opens the application, this component orchestrates all the UI elements and manages the
 * state for placed objects, paths, coordinates, and user interactions.
 * 
 * **Dependency Injection:**
 * All business logic services are injected as optional props:
 * - `coordinateRegistry`: Injected to allow the component to register and manage coordinates.
 *   This enables easier testing with mock registries and flexibility to swap implementations
 *   (e.g., in-memory vs persistent storage). If not provided, coordinates are still tracked
 *   but not registered in a centralized registry.
 * - `relationshipManager`: Injected to allow the component to create and manage relationships
 *   between targets, paths, and coordinates. This enables easier testing with mock managers
 *   and flexibility to swap implementations. If not provided, relationships are not tracked.
 * - `onPlacedObjectsChange`, `onPlacedPathsChange`: Injected callbacks to allow parent components
 *   to manage state. This enables separation of concerns - the component handles UI, parent
 *   manages application state. If not provided, component manages state internally.
 * - `onCoordinatesChange`: Injected callback to notify parent when coordinates change. This enables
 *   parent components to sync coordinate state with other parts of the application.
 * 
 * This component follows the container/presentational pattern where it (container) manages state
 * and UI orchestration, while InfiniteGridScene (presentational) focuses on 3D rendering.
 */
// Main infinite grid canvas component
interface InfiniteGridCanvasProps {
  selectedItem: { type: 'target'; id: string } | { type: 'path'; id: string } | { type: 'coordinate'; id: string; position: [number, number, number]; name?: string } | null;
  relatedItemIds?: { targets: string[]; paths: string[]; coordinates: string[] };
  onSelectItem: (item: { type: 'target'; id: string; targetId: string; label: string; name?: string; position: [number, number, number]; iconEmoji?: string } | { type: 'path'; id: string; pathType: string; label: string; name?: string; points: [number, number, number][] } | { type: 'coordinate'; id: string; position: [number, number, number]; name?: string } | null) => void;
  coordinateRegistry?: ICoordinateRegistry;
  relationshipManager?: IRelationshipManager;
  onCoordinatesChange?: (coordinates: Array<{ id: string; position: [number, number, number]; name?: string }>) => void;
  onPlacedObjectsChange?: (objects: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>) => void;
  onPlacedPathsChange?: (paths: Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; name?: string; litTiles: [number, number, number][] }>) => void;
  placedObjects?: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>;
  placedPaths?: Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; name?: string; litTiles: [number, number, number][] }>;
  availableTargets?: Array<{ id: string; label: string; iconEmoji?: string }>;
  availablePaths?: Array<{ id: string; label: string; pathType: string }>;
}

const InfiniteGridCanvas: React.FC<InfiniteGridCanvasProps> = ({ 
  selectedItem,
  relatedItemIds = { targets: [], paths: [], coordinates: [] },
  onSelectItem,
  coordinateRegistry,
  relationshipManager,
  onCoordinatesChange,
  onPlacedObjectsChange: externalOnPlacedObjectsChange,
  onPlacedPathsChange: externalOnPlacedPathsChange,
  placedObjects: externalPlacedObjects,
  placedPaths: externalPlacedPaths,
  availableTargets = [],
  availablePaths = []
}) => {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([10.94, 10.94, 10.94]); // Zoomed out another 5% from [10.42,10.42,10.42]
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false); // Default to collapsed
  const controlsRef = useRef<any>(null);
  const [coordinateSettings, setCoordinateSettings] = useState<CoordinateSettings>({
    system: 'Cartesian',
    minUnit: 0.1
  });
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  
  // Use external state if provided, otherwise use internal state
  const [internalPlacedObjects, setInternalPlacedObjects] = useState<Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>>([]);
  const [internalPlacedPaths, setInternalPlacedPaths] = useState<Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; name?: string; litTiles: [number, number, number][] }>>([]);
  
  const placedObjects = externalPlacedObjects ?? internalPlacedObjects;
  const placedPaths = externalPlacedPaths ?? internalPlacedPaths;
  
  const setPlacedObjects = externalOnPlacedObjectsChange ?? setInternalPlacedObjects;
  const setPlacedPaths = externalOnPlacedPathsChange ?? setInternalPlacedPaths;
  const [openAnnotations, setOpenAnnotations] = useState<Set<string>>(new Set());
  const [waitingForPathEndpoint, setWaitingForPathEndpoint] = useState<{ id: string; pathType: string; pathLabel: string } | null>(null);
  const [pathEndpointSnapPoint, setPathEndpointSnapPoint] = useState<[number, number, number] | null>(null);
  const { snapPoint } = useDragTargetContext();
  
  // Naming modal state
  const [namingModal, setNamingModal] = useState<{
    isOpen: boolean;
    itemType: 'target' | 'path' | 'coordinate';
    itemId: string;
    currentName?: string;
    itemLabel?: string;
  }>({
    isOpen: false,
    itemType: 'target',
    itemId: '',
  });

  // Context menu state
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    position: [number, number, number] | null;
    menuPosition: { x: number; y: number } | null;
  }>({
    isOpen: false,
    position: null,
    menuPosition: null
  });

  // Builder modal states
  const [isTargetBuilderOpen, setIsTargetBuilderOpen] = useState(false);
  const [isPathBuilderOpen, setIsPathBuilderOpen] = useState(false);
  const [builderPosition, setBuilderPosition] = useState<[number, number, number] | null>(null);

  // Toaster for notifications
  const toasterRef = useRef<OverlayToaster | null>(null);

  // Use path creation hook
  const {
    pathCreationMode,
    setPathCreationMode,
    startPathCreation,
    completePathCreation,
    cancelPathCreation,
    showPathCreationError,
  } = usePathCreation(placedPaths, setPlacedPaths, {
    coordinateRegistry,
    relationshipManager,
    onCoordinatesChange,
    toasterRef,
  });

  const handleToggleAnnotation = useCallback((id: string) => {
    setOpenAnnotations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSettingsChange = useCallback((newSettings: CoordinateSettings) => {
    setCoordinateSettings(newSettings);
    // Here you could implement coordinate system conversion logic
    console.log('Coordinate system changed to:', newSettings);
  }, []);

  // Context menu handlers
  const handleAddExistingTarget = useCallback((position: [number, number, number], targetId: string, targetLabel: string, iconEmoji?: string) => {
    const newObject = {
      id: `obj_${Date.now()}`,
      position: position,
      targetId: targetId,
      targetLabel: targetLabel,
      iconEmoji: iconEmoji || '🎯'
    };
    
    // Register coordinate and create relationship
    if (coordinateRegistry && relationshipManager) {
      const coord = coordinateRegistry.getOrCreate(position);
      relationshipManager.attachTargetToCoordinate(newObject.id, coord.id);
      if (onCoordinatesChange) {
        onCoordinatesChange(coordinateRegistry.getAll());
      }
    }
    
    setPlacedObjects([...placedObjects, newObject]);
    // Open annotation for newly placed object
    handleToggleAnnotation(newObject.id);
    setContextMenuState({ isOpen: false, position: null, menuPosition: null });
  }, [placedObjects, setPlacedObjects, handleToggleAnnotation, coordinateRegistry, relationshipManager, onCoordinatesChange]);

  const handleCreateTargetFromBuilder = useCallback((position: [number, number, number], targetData: { targetId: string; targetLabel: string; iconEmoji?: string; name?: string }) => {
    const newObject = {
      id: `obj_${Date.now()}`,
      position: position,
      targetId: targetData.targetId,
      targetLabel: targetData.targetLabel,
      iconEmoji: targetData.iconEmoji || '🎯',
      name: targetData.name
    };
    
    // Register coordinate and create relationship
    if (coordinateRegistry && relationshipManager) {
      const coord = coordinateRegistry.getOrCreate(position);
      relationshipManager.attachTargetToCoordinate(newObject.id, coord.id);
      if (onCoordinatesChange) {
        onCoordinatesChange(coordinateRegistry.getAll());
      }
    }
    
    setPlacedObjects([...placedObjects, newObject]);
    // Open annotation for newly placed object
    handleToggleAnnotation(newObject.id);
    setIsTargetBuilderOpen(false);
  }, [placedObjects, setPlacedObjects, handleToggleAnnotation, coordinateRegistry, relationshipManager, onCoordinatesChange]);

  const handleStartExistingPath = useCallback((position: [number, number, number], pathType: string, pathLabel: string) => {
    startPathCreation(position, pathType, pathLabel);
    setContextMenuState({ isOpen: false, position: null, menuPosition: null });
  }, [startPathCreation]);

  const handleCreatePathFromBuilder = useCallback((position: [number, number, number], pathData: { pathType: string; pathLabel: string; name?: string }) => {
    startPathCreation(position, pathData.pathType, pathData.pathLabel, pathData.name);
    setIsPathBuilderOpen(false);
    setContextMenuState({ isOpen: false, position: null, menuPosition: null });
  }, [startPathCreation]);



  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenuState.isOpen) return;
    
    const handleClick = () => {
      setContextMenuState({ isOpen: false, position: null, menuPosition: null });
    };
    
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenuState.isOpen]);

  const handleNameSave = useCallback((name: string) => {
    if (namingModal.itemType === 'target') {
      const updatedObjects = placedObjects.map(obj => 
        obj.id === namingModal.itemId ? { ...obj, name } : obj
      );
      setPlacedObjects(updatedObjects);
      // Update selectedItem if it's the same target
      if (selectedItem?.type === 'target' && selectedItem.id === namingModal.itemId) {
        const updatedObj = updatedObjects.find(obj => obj.id === namingModal.itemId);
        if (updatedObj) {
          onSelectItem({
            type: 'target',
            id: updatedObj.id,
            targetId: updatedObj.targetId,
            label: updatedObj.targetLabel,
            name: updatedObj.name,
            position: updatedObj.position,
            iconEmoji: updatedObj.iconEmoji
          });
        }
      }
    } else if (namingModal.itemType === 'path') {
      const updatedPaths = placedPaths.map(path => 
        path.id === namingModal.itemId ? { ...path, name } : path
      );
      setPlacedPaths(updatedPaths);
      // Update selectedItem if it's the same path
      if (selectedItem?.type === 'path' && selectedItem.id === namingModal.itemId) {
        const updatedPath = updatedPaths.find(path => path.id === namingModal.itemId);
        if (updatedPath) {
          onSelectItem({
            type: 'path',
            id: updatedPath.id,
            pathType: updatedPath.pathType,
            label: updatedPath.pathLabel,
            name: updatedPath.name,
            points: updatedPath.litTiles || []
          });
        }
      }
    } else if (namingModal.itemType === 'coordinate') {
      // Update coordinate name in registry
      if (coordinateRegistry) {
        coordinateRegistry.updateName(namingModal.itemId, name);
        if (onCoordinatesChange) {
          onCoordinatesChange(coordinateRegistry.getAll());
        }
        // Update selectedItem if it's the same coordinate
        if (selectedItem?.type === 'coordinate' && selectedItem.id === namingModal.itemId) {
          const coord = coordinateRegistry.getById(namingModal.itemId);
          if (coord) {
            onSelectItem({
              type: 'coordinate',
              id: coord.id,
              position: coord.position,
              name: coord.name
            });
          }
        }
      }
    }
  }, [namingModal, placedObjects, placedPaths, selectedItem, onSelectItem, coordinateRegistry, onCoordinatesChange]);

  const getCoordinateSystemLabel = () => {
    switch (coordinateSettings.system) {
      case 'NED': return 'NED (North-East-Down)';
      case 'Cartesian': return 'Cartesian (X-Y-Z)';
      case 'Spherical': return 'Spherical (R-θ-φ)';
      default: return 'Cartesian (X-Y-Z)';
    }
  };

  return (
    <div className="infinite-grid-container">
      {/* Settings FAB */}
      <Button
        className="settings-fab"
        onClick={() => setIsSettingsOpen(true)}
        aria-label="Settings"
        icon={<Icon icon={IconNames.COG} size={24} />}
        minimal
        large
      />

      {/* Controls overlay */}
      <div className={`grid-controls ${!isControlsExpanded ? 'collapsed' : ''}`}>
        <div className="grid-controls-header">
          <h3>Infinite 3D Grid</h3>
          <Button
            className="controls-toggle"
            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            icon={<Icon icon={isControlsExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN} />}
            minimal
            small
            aria-label={isControlsExpanded ? 'Collapse' : 'Expand'}
          />
        </div>
        <Collapse isOpen={isControlsExpanded}>
          <div className="grid-controls-content">
            <div className="coordinate-info">
              <p><strong>System:</strong> {getCoordinateSystemLabel()}</p>
              <p><strong>Min Unit:</strong> {coordinateSettings.minUnit} {coordinateSettings.system === 'Spherical' ? '°' : 'km'}</p>
            </div>
            <p>Click on blue grid points to place objects</p>
            {waitingForPathEndpoint && (
              <p style={{ color: '#00ff00', fontWeight: 'bold' }}>
                Click on a grid point to set path endpoint
              </p>
            )}
            <p>Use mouse to orbit, zoom, and pan</p>
            <div className="control-buttons">
              <Button 
                onClick={() => {
                  setCameraPosition([10.94, 10.94, 10.94]);
                  // Reset camera rotation
                  if (controlsRef.current) {
                    const horizontalAngle = (-15.75 * Math.PI) / 180; // -15.75 degrees (increased by 5% from -15)
                    const verticalAngle = (19 * Math.PI) / 180; // 19 degrees (decreased by 5% from 20)
                    controlsRef.current.setAzimuthalAngle(horizontalAngle);
                    controlsRef.current.setPolarAngle(Math.PI / 2 - verticalAngle);
                  }
                }}
                intent="primary"
              >
                Reset Camera
              </Button>
            </div>
          </div>
        </Collapse>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: cameraPosition, fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => {
          // Clear selection when clicking on empty space
          onSelectItem(null);
        }}
      >
        <InfiniteGridScene 
          coordinateSettings={coordinateSettings}
          onHoveredObjectChange={setHoveredObject}
          onPlacedObjectsChange={setPlacedObjects}
          onPlacedPathsChange={setPlacedPaths}
          placedObjects={placedObjects}
          placedPaths={placedPaths}
          openAnnotations={openAnnotations}
          onToggleAnnotation={handleToggleAnnotation}
          waitingForPathEndpoint={waitingForPathEndpoint}
          onWaitingForPathEndpointChange={setWaitingForPathEndpoint}
          onPathEndpointSnapPointChange={setPathEndpointSnapPoint}
          selectedItem={selectedItem}
          relatedItemIds={relatedItemIds}
          onSelectItem={onSelectItem}
          onOpenNamingModal={setNamingModal}
          coordinateRegistry={coordinateRegistry}
          relationshipManager={relationshipManager}
          onCoordinatesChange={onCoordinatesChange}
          onContextMenuRequest={setContextMenuState}
          pathCreationMode={pathCreationMode}
          onPathCreationComplete={completePathCreation}
          onPathCreationCancel={cancelPathCreation}
          onPathCreationError={showPathCreationError}
        />
        <OrbitControlsWrapper 
          waitingForPathEndpoint={!!waitingForPathEndpoint}
          onControlsReady={(controls) => {
            controlsRef.current = controls;
          }}
        />
      </Canvas>

      {/* Drag Tooltip */}
      <DragTooltip
        snapPoint={waitingForPathEndpoint ? pathEndpointSnapPoint : snapPoint}
        coordinateSettings={coordinateSettings}
        hoveredObject={hoveredObject}
        placedObjects={placedObjects}
        openAnnotations={openAnnotations}
        waitingForPathEndpoint={waitingForPathEndpoint}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={coordinateSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Name Modal */}
      <NameModal
        isOpen={namingModal.isOpen}
        onClose={() => setNamingModal({ ...namingModal, isOpen: false })}
        onSave={handleNameSave}
        currentName={namingModal.currentName}
        itemType={namingModal.itemType}
        itemLabel={namingModal.itemLabel}
      />

      {/* Context Menu - positioned directly like DragTooltip */}
      {contextMenuState.isOpen && contextMenuState.position && contextMenuState.menuPosition && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenuState.menuPosition.x + 15}px`,
            top: `${contextMenuState.menuPosition.y + 15}px`,
            pointerEvents: 'auto',
            zIndex: 1000,
          }}
        >
          <Menu className="grid-context-menu">
            {/* Targets Section */}
            <MenuItem
              icon="target"
              text="Add Target"
            >
              {availableTargets.length > 0 ? (
                availableTargets.map(target => (
                  <MenuItem
                    key={target.id}
                    icon={<span>{target.iconEmoji || '🎯'}</span>}
                    text={target.label}
                    onClick={() => {
                      if (contextMenuState.position) {
                        handleAddExistingTarget(contextMenuState.position, target.id, target.label, target.iconEmoji);
                      }
                    }}
                  />
                ))
              ) : (
                <MenuItem text="No targets available" disabled />
              )}
            </MenuItem>
            <MenuItem
              icon="add"
              text="Create Target"
              onClick={() => {
                if (contextMenuState.position) {
                  setBuilderPosition(contextMenuState.position);
                  setIsTargetBuilderOpen(true);
                  setContextMenuState({ isOpen: false, position: null, menuPosition: null });
                }
              }}
            />
            
            <MenuDivider />
            
            {/* Paths Section */}
            <MenuItem
              icon="path-search"
              text="Add Path"
            >
              {availablePaths.length > 0 ? (
                availablePaths.map(path => (
                  <MenuItem
                    key={path.id}
                    icon="path-search"
                    text={path.label}
                    onClick={() => {
                      if (contextMenuState.position) {
                        handleStartExistingPath(contextMenuState.position, path.pathType, path.label);
                      }
                    }}
                  />
                ))
              ) : (
                <MenuItem text="No paths available" disabled />
              )}
            </MenuItem>
            <MenuItem
              icon="add"
              text="Create Path"
              onClick={() => {
                if (contextMenuState.position) {
                  setBuilderPosition(contextMenuState.position);
                  setIsPathBuilderOpen(true);
                  setContextMenuState({ isOpen: false, position: null, menuPosition: null });
                }
              }}
            />
            
            <MenuDivider />
            
            <MenuItem
              icon="edit"
              text="Name Coordinate"
              onClick={() => {
                if (contextMenuState.position) {
                  setNamingModal({
                    isOpen: true,
                    itemType: 'coordinate',
                    itemId: `coord_${contextMenuState.position[0]}_${contextMenuState.position[1]}_${contextMenuState.position[2]}`,
                    currentName: undefined,
                    itemLabel: `[${contextMenuState.position[0]}, ${contextMenuState.position[1]}, ${contextMenuState.position[2]}]`
                  });
                  setContextMenuState({ isOpen: false, position: null, menuPosition: null });
                }
              }}
            />
          </Menu>
        </div>
      )}

      {/* Target Builder Modal */}
      {builderPosition && (
        <TargetBuilder
          isOpen={isTargetBuilderOpen}
          onClose={() => {
            setIsTargetBuilderOpen(false);
            setBuilderPosition(null);
          }}
          onComplete={(targetData) => {
            if (builderPosition) {
              handleCreateTargetFromBuilder(builderPosition, targetData);
              setBuilderPosition(null);
            }
          }}
          position={builderPosition}
        />
      )}

      {/* Path Builder Modal */}
      {builderPosition && (
        <PathBuilder
          isOpen={isPathBuilderOpen}
          onClose={() => {
            setIsPathBuilderOpen(false);
            setBuilderPosition(null);
          }}
          onComplete={(pathData) => {
            if (builderPosition) {
              handleCreatePathFromBuilder(builderPosition, pathData);
              setBuilderPosition(null);
            }
          }}
          position={builderPosition}
        />
      )}

      {/* Toaster for notifications */}
      <OverlayToaster ref={toasterRef} position="top" />
    </div>
  );
};

export default InfiniteGridCanvas;