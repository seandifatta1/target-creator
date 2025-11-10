import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Grid, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import SettingsModal, { CoordinateSettings } from './SettingsModal';
import CoordinateAxes from './CoordinateAxes';
import Target from './Target';
import { GridPoint } from './GridPoint';
import { DragHandler } from './DragHandler';
import { PathRenderer, PathData } from './PathRenderer';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import { useMousePosition } from '../hooks/useMousePosition';
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

/**
 * InfiniteGridScene - Presentational component for 3D scene rendering.
 * This component handles all 3D rendering logic and is used inside a Canvas.
 * It receives all data and callbacks as props (container/presentational pattern).
 */
export interface InfiniteGridSceneProps {
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
}

const InfiniteGridScene: React.FC<InfiniteGridSceneProps> = ({
  coordinateSettings,
  onHoveredObjectChange,
  onPlacedObjectsChange,
  onPlacedPathsChange,
  placedObjects,
  placedPaths,
  openAnnotations,
  onToggleAnnotation,
  waitingForPathEndpoint,
  onWaitingForPathEndpointChange,
  onPathEndpointSnapPointChange,
  selectedItem,
  relatedItemIds = { targets: [], paths: [], coordinates: [] },
  onSelectItem,
  onOpenNamingModal,
  coordinateRegistry,
  relationshipManager,
  onCoordinatesChange,
  onContextMenuRequest,
  pathCreationMode,
  onPathCreationComplete,
  onPathCreationCancel,
  onPathCreationError,
}) => {
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
  }, [mousePosition, mousePositionRef, onContextMenuRequest]);

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
              
              // Add path to state
              onPlacedPathsChange([...placedPaths, newPath]);
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
  }, [isDragging, endDrag, onToggleAnnotation, placedObjects, placedPaths, onPlacedObjectsChange, onPlacedPathsChange, coordinateRegistry, relationshipManager, onCoordinatesChange]);

  return (
    <>
      {/* Drag handler */}
      <DragHandler 
        gridSize={gridSize} 
        onSnapPointUpdate={(point) => {
          if (isDragging) {
            updateSnapPoint(point);
          }
        }}
        alwaysTrack={false}
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

export default InfiniteGridScene;

