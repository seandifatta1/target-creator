import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Grid, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Button, Icon, Collapse, Menu, MenuItem, MenuDivider, OverlayToaster, Toast } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import SettingsModal, { CoordinateSettings, CoordinateSystem } from './SettingsModal';
import CoordinateAxes from './CoordinateAxes';
import Target from './Target';
import Path from './Path';
import NameModal from './NameModal';
import TargetBuilder from './TargetBuilder';
import PathBuilder from './PathBuilder';
import { GridPoint } from './GridPoint';
import { DragHandler } from './DragHandler';
import { OrbitControlsWrapper } from './OrbitControlsWrapper';
import { PathRenderer, PathData } from './PathRenderer';
import { DragTooltip } from './DragTooltip';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import { useMousePosition } from '../hooks/useMousePosition';
import { usePathCreation } from '../hooks/usePathCreation';
import { useGridInteraction } from '../hooks/useGridInteraction';
import { ICoordinateRegistry } from '../services/CoordinateRegistry';
import { IRelationshipManager } from '../services/RelationshipManager';
import {
  positionsEqual,
  generateGridPoints,
  getValidLineEndpoints,
  Position3D,
} from '../utils/gridUtils';
import './InfiniteGrid.css';


// Infinite grid system
const InfiniteGrid: React.FC<{ 
  coordinateSettings: CoordinateSettings;
  onHoveredObjectChange: (id: string | null) => void;
  onPlacedObjectsChange: (objects: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>) => void;
  onPlacedPathsChange: (paths: Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; name?: string; litTiles: [number, number, number][] }>) => void;
  placedObjects: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>;
  placedPaths: Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; name?: string; litTiles: [number, number, number][] }>;
  openAnnotations: Set<string>;
  onToggleAnnotation: (id: string) => void;
  waitingForPathEndpoint: { id: string; pathType: string; pathLabel: string } | null;
  onWaitingForPathEndpointChange: (state: { id: string; pathType: string; pathLabel: string } | null) => void;
  onPathEndpointSnapPointChange: (point: [number, number, number] | null) => void;
  selectedItem: { type: 'target'; id: string } | { type: 'path'; id: string } | { type: 'coordinate'; id: string; position: [number, number, number]; name?: string } | null;
  relatedItemIds?: { targets: string[]; paths: string[]; coordinates: string[] };
  onSelectItem: (item: { type: 'target'; id: string; targetId: string; label: string; name?: string; position: [number, number, number]; iconEmoji?: string } | { type: 'path'; id: string; pathType: string; label: string; name?: string; points: [number, number, number][] } | { type: 'coordinate'; id: string; position: [number, number, number]; name?: string } | null) => void;
  onOpenNamingModal: (modal: { isOpen: boolean; itemType: 'target' | 'path' | 'coordinate'; itemId: string; currentName?: string; itemLabel?: string }) => void;
  coordinateRegistry?: ICoordinateRegistry;
  relationshipManager?: IRelationshipManager;
  onCoordinatesChange?: (coordinates: Array<{ id: string; position: [number, number, number]; name?: string }>) => void;
  onContextMenuRequest?: (state: { isOpen: boolean; position: [number, number, number] | null; menuPosition: { x: number; y: number } | null }) => void;
  pathCreationMode?: { isActive: boolean; type: 'line' | 'curve' | null; startPosition: [number, number, number] | null; pathType: string; pathLabel: string };
  onPathCreationComplete?: (startPosition: [number, number, number], endPosition: [number, number, number], pathType: string, pathLabel: string) => void;
  onPathCreationCancel?: () => void;
  onPathCreationError?: (message: string) => void;
}> = ({ coordinateSettings, onHoveredObjectChange, onPlacedObjectsChange, onPlacedPathsChange, placedObjects, placedPaths, openAnnotations, onToggleAnnotation, waitingForPathEndpoint, onWaitingForPathEndpointChange, onPathEndpointSnapPointChange, selectedItem, relatedItemIds = { targets: [], paths: [], coordinates: [] }, onSelectItem, onOpenNamingModal, coordinateRegistry, relationshipManager, onCoordinatesChange, onContextMenuRequest, pathCreationMode, onPathCreationComplete, onPathCreationCancel, onPathCreationError }) => {
  const { gl } = useThree();
  const [gridSize] = useState(20); // Grid extends from -10 to +10 in each direction
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [pathEndpointSnapPoint, setPathEndpointSnapPoint] = useState<[number, number, number] | null>(null);
  const [hoveredGridPoint, setHoveredGridPoint] = useState<[number, number, number] | null>(null);
  const { isDragging, dragData, snapPoint, updateSnapPoint, endDrag } = useDragTargetContext();

  // Create a combined snap point (commented out path endpoint logic)
  const currentSnapPoint = isDragging ? snapPoint : null; // (waitingForPathEndpoint ? pathEndpointSnapPoint : null);

  useEffect(() => {
    onHoveredObjectChange(hoveredObject);
  }, [hoveredObject, onHoveredObjectChange]);

  // Commented out - no path endpoint logic
  // // Clear path endpoint snap point when not waiting
  // useEffect(() => {
  //   if (!waitingForPathEndpoint) {
  //     setPathEndpointSnapPoint(null);
  //     onPathEndpointSnapPointChange(null);
  //   }
  // }, [waitingForPathEndpoint, onPathEndpointSnapPointChange]);

  // // Notify parent of path endpoint snap point changes
  // useEffect(() => {
  //   onPathEndpointSnapPointChange(pathEndpointSnapPoint);
  // }, [pathEndpointSnapPoint, onPathEndpointSnapPointChange]);

  // // Handle Escape key to cancel path placement
  // useEffect(() => {
  //   if (!waitingForPathEndpoint) return;

  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === 'Escape') {
  //       onWaitingForPathEndpointChange(null);
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [waitingForPathEndpoint, onWaitingForPathEndpointChange]);


  // Use grid interaction hook
  const { handleGridPointClick } = useGridInteraction({
    gridSize,
    placedPaths,
    placedObjects,
    pathCreationMode,
    coordinateRegistry,
    relationshipManager,
    onPlacedObjectsChange,
    onSelectItem,
    onCoordinatesChange,
    onPathCreationComplete,
    onPathCreationError,
  });

  // Track mouse position globally (same approach as DragTooltip)
  const { position: mousePosition, positionRef: mousePositionRef } = useMousePosition();

  // Handle context menu for grid points
  const handleGridPointContextMenu = useCallback((e: any, position: [number, number, number]) => {
    e.stopPropagation();
    
    // Use the ref position (captured on contextmenu event) - same logic as target tooltip
    const clientX = mousePositionRef.current.x || mousePosition.x;
    const clientY = mousePositionRef.current.y || mousePosition.y;
    
    // Notify parent to open context menu at actual click position
    if (onContextMenuRequest) {
      onContextMenuRequest({
        isOpen: true,
        position: position,
        menuPosition: { x: clientX, y: clientY }
      });
    }
  }, [mousePosition, onContextMenuRequest]);


  // Handle drop
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        const result = endDrag();
        if (result && result.snapPoint) {
          // Check if this is a path item
          if (result.dragData.id.startsWith('path-')) {
            // For paths, just light up the tile that was hovered over when released
            if (result.snapPoint && result.snapPoint.length === 3) {
              const point: [number, number, number] = [
                result.snapPoint[0], 
                result.snapPoint[1], 
                result.snapPoint[2]
              ];
              
              // Create the path with only the lit tile (no points, no other logic)
              const newPath = {
                id: `path_${Date.now()}`,
                points: [], // Commented out - not using points
                pathType: result.dragData.id,
                pathLabel: result.dragData.label,
                name: undefined, // Will be set via right-click modal
                litTiles: [point] // Light up the tile that was hovered over
              };
              
              // Register coordinates and create relationships
              if (coordinateRegistry && relationshipManager) {
                const coord = coordinateRegistry.getOrCreate(point);
                relationshipManager.attachPathToCoordinates(newPath.id, [coord.id]);
                if (onCoordinatesChange) {
                  onCoordinatesChange(coordinateRegistry.getAll());
                }
              }
              
              // Note: For paths with multiple lit tiles, we need to register all of them
              // This is currently handled on creation, but if paths are updated later,
              // we should re-register all coordinates in litTiles
              
              // Add path to state
              onPlacedPathsChange([...placedPaths, newPath]);
              
              // Commented out - no endpoint waiting mode
              // onWaitingForPathEndpointChange({
              //   id: newPath.id,
              //   pathType: result.dragData.id,
              //   pathLabel: result.dragData.label
              // });
            }
          } else {
            // Place target object at snapped grid point
            // Extract emoji from icon ReactNode
            let iconEmoji = '🎯';
            if (result.dragData.icon) {
              const iconChildren = React.Children.toArray(result.dragData.icon);
              const iconSpan = iconChildren.find((child: any) => 
                typeof child === 'object' && child.props?.children
              ) as any;
              iconEmoji = iconSpan?.props?.children || '🎯';
            }
            
            const newObject = {
              id: `obj_${Date.now()}`,
              position: result.snapPoint,
              targetId: result.dragData.id,
              targetLabel: result.dragData.label,
              iconEmoji: iconEmoji
            };
            
            // Register coordinate and create relationship
            if (coordinateRegistry && relationshipManager) {
              const coord = coordinateRegistry.getOrCreate(result.snapPoint);
              relationshipManager.attachTargetToCoordinate(newObject.id, coord.id);
              if (onCoordinatesChange) {
                onCoordinatesChange(coordinateRegistry.getAll());
              }
            }
            
            onPlacedObjectsChange([...placedObjects, newObject]);
            // Open annotation for newly placed object
            onToggleAnnotation(newObject.id);
          }
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, endDrag, onToggleAnnotation, onWaitingForPathEndpointChange, placedObjects, placedPaths, onPlacedObjectsChange, onPlacedPathsChange]);


  return (
    <>
      {/* Drag handler */}
      <DragHandler 
        gridSize={gridSize} 
        onSnapPointUpdate={(point) => {
          if (isDragging) {
            updateSnapPoint(point);
          }
          // Commented out - no path endpoint tracking
          // else if (waitingForPathEndpoint) {
          //   setPathEndpointSnapPoint(point);
          // }
        }}
        alwaysTrack={false} // !!waitingForPathEndpoint
      />

      {/* Coordinate Axes */}
      <CoordinateAxes 
        coordinateSystem={coordinateSettings.system}
        minUnit={coordinateSettings.minUnit}
        gridSize={gridSize}
      />

      {/* Infinite grid lines */}
      <Grid
        args={[100, 100]}
        cellSize={coordinateSettings.minUnit}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={coordinateSettings.minUnit * 5}
        sectionThickness={1}
        sectionColor="#9d4edd"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Grid points */}
      {generateGridPoints(gridSize).map((position, index) => {
        // Check if this grid point is lit up by any path
        const isLitByPath = placedPaths.some(path => 
          path.litTiles && path.litTiles.some(tile => 
            tile[0] === position[0] && tile[1] === position[1] && tile[2] === position[2]
          )
        );
        
        // Check if this grid point is currently hovered
        const isHovered = positionsEqual(position, hoveredGridPoint);
        
        // Check if this is the start position for path creation
        const isStartPosition = pathCreationMode?.isActive && pathCreationMode.startPosition
          ? positionsEqual(position, pathCreationMode.startPosition)
          : false;
        
        // Calculate valid endpoints if in path creation mode
        const validEndpoints = pathCreationMode?.isActive && pathCreationMode.type === 'line' && pathCreationMode.startPosition
          ? getValidLineEndpoints(pathCreationMode.startPosition, gridSize)
          : [];
        
        // Check if this is a valid endpoint
        const isValidEndpoint = validEndpoints.some(ep => 
          ep[0] === position[0] && ep[1] === position[1] && ep[2] === position[2]
        );
        
        return (
          <GridPoint
            key={`${position[0]}-${position[2]}`}
            position={position}
            onClick={() => {
              handleGridPointClick(position);
            }}
            onContextMenu={(e) => handleGridPointContextMenu(e, position)}
            isPermanentlyLit={isLitByPath}
            isHovered={isHovered}
            onPointerOver={() => setHoveredGridPoint(position)}
            onPointerOut={() => setHoveredGridPoint(null)}
            isStartPosition={isStartPosition}
            isValidEndpoint={isValidEndpoint}
          />
        );
      })}

      {/* Snap point indicator */}
      {currentSnapPoint && (
        <Sphere
          position={currentSnapPoint}
          args={[0.4, 16, 16]}
        >
          <meshStandardMaterial color="#00ff00" transparent opacity={0.6} />
        </Sphere>
      )}

      {/* Commented out - no path preview line */}
      {/* {waitingForPathEndpoint && (() => {
        // Use existing path's last point if available, otherwise use snap point
        const existingPath = placedPaths.find(p => p.id === waitingForPathEndpoint.id);
        const lastPoint = existingPath?.points[existingPath.points.length - 1];
        const previewEnd = pathEndpointSnapPoint;
        
        if (!lastPoint || lastPoint.length !== 3) return null;
        if (!previewEnd || previewEnd.length !== 3) return null;
        
        return (
          <Line
            points={[
              new THREE.Vector3(
                lastPoint[0],
                lastPoint[1],
                lastPoint[2]
              ),
              new THREE.Vector3(
                previewEnd[0],
                previewEnd[1],
                previewEnd[2]
              )
            ]}
            color="#00ff00"
            lineWidth={2}
          />
        );
      })()} */}

      {/* Render paths as thick white lines connecting lit tiles */}
      {placedPaths.map((path) => {
        const isSelected = selectedItem?.type === 'path' && selectedItem.id === path.id;
        const isRelated = relatedItemIds.paths.includes(path.id);
        
        return (
          <PathRenderer
            key={path.id}
            path={path as PathData}
            isSelected={isSelected}
            isRelated={isRelated}
            onSelect={() => {
              onSelectItem({
                type: 'path',
                id: path.id,
                pathType: path.pathType,
                label: path.pathLabel,
                name: path.name,
                points: path.litTiles || []
              });
            }}
            onContextMenu={() => {
              onOpenNamingModal({
                isOpen: true,
                itemType: 'path',
                itemId: path.id,
                currentName: path.name,
                itemLabel: path.pathLabel
              });
            }}
          />
        );
      })}

      {/* Placed objects */}
      {placedObjects.map((obj) => {
        const annotationIsOpen = openAnnotations.has(obj.id);
        const isSelected = selectedItem?.type === 'target' && selectedItem.id === obj.id;
        const isRelated = relatedItemIds.targets.includes(obj.id);
        
        return (
          <Target
            key={obj.id}
            id={obj.id}
            position={obj.position}
            targetId={obj.targetId}
            targetLabel={obj.targetLabel}
            iconEmoji={obj.iconEmoji}
            coordinateSettings={coordinateSettings}
            isAnnotationOpen={annotationIsOpen}
            isRelated={isRelated}
            onToggleAnnotation={onToggleAnnotation}
            onPointerOver={() => {
              // Only set hovered if annotation is closed
              if (!annotationIsOpen) {
                setHoveredObject(obj.id);
              }
            }}
            onPointerOut={() => setHoveredObject(null)}
            onClick={() => {
              onSelectItem({
                type: 'target',
                id: obj.id,
                targetId: obj.targetId,
                label: obj.targetLabel,
                name: obj.name,
                position: obj.position,
                iconEmoji: obj.iconEmoji
              });
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              onOpenNamingModal({
                isOpen: true,
                itemType: 'target',
                itemId: obj.id,
                currentName: obj.name,
                itemLabel: obj.targetLabel
              });
            }}
          />
        );
      })}

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
    </>
  );
};



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
        <InfiniteGrid 
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