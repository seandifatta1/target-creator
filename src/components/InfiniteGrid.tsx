import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Button, Icon, Collapse, Menu, MenuItem, OverlayToaster, Toast } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import SettingsModal, { CoordinateSettings, CoordinateSystem } from './SettingsModal';
import CoordinateAxes from './CoordinateAxes';
import Target from './Target';
import Path from './Path';
import NameModal from './NameModal';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import { ICoordinateRegistry } from '../services/CoordinateRegistry';
import { IRelationshipManager } from '../services/RelationshipManager';
import './InfiniteGrid.css';

// Grid point component
const GridPoint: React.FC<{ 
  position: [number, number, number]; 
  onClick: () => void;
  onContextMenu?: (e: any) => void;
  isPermanentlyLit?: boolean;
  isHovered?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  isStartPosition?: boolean;
  isValidEndpoint?: boolean;
}> = ({ position, onClick, onContextMenu, isPermanentlyLit = false, isHovered = false, onPointerOver, onPointerOut, isStartPosition = false, isValidEndpoint = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      let scale = 1;
      if (isHovered) scale = 1.2;
      else if (isStartPosition || isValidEndpoint) scale = 1.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  // Determine color: start position (red), valid endpoint (white/glowing), permanently lit (red), hovered (red), or default (blue)
  let color = "#4c9eff";
  let opacity = 0.7;
  
  if (isStartPosition) {
    color = "#ff6b6b";
    opacity = 1.0;
  } else if (isValidEndpoint) {
    color = "#ffffff";
    opacity = 0.9;
  } else if (isPermanentlyLit) {
    color = "#ff6b6b";
    opacity = 1.0;
  } else if (isHovered) {
    color = "#ff6b6b";
    opacity = 0.7;
  }

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[0.8, 0.8, 0.8]}
      onClick={onClick}
      onContextMenu={(e) => {
        e.stopPropagation();
        if (onContextMenu) {
          onContextMenu(e);
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (onPointerOver) {
          onPointerOver();
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (onPointerOut) {
          onPointerOut();
        }
      }}
    >
      <meshStandardMaterial 
        color={color}
        transparent 
        opacity={opacity}
        emissive={isValidEndpoint ? "#ffffff" : "#000000"}
        emissiveIntensity={isValidEndpoint ? 0.5 : 0}
      />
    </Box>
  );
};

// Drag handler component
const DragHandler: React.FC<{ 
  gridSize: number; 
  onSnapPointUpdate: (point: [number, number, number] | null) => void;
  alwaysTrack?: boolean;
}> = ({ 
  gridSize, 
  onSnapPointUpdate,
  alwaysTrack = false
}) => {
  const { camera, raycaster, pointer, gl } = useThree();
  const { isDragging } = useDragTargetContext();

  useFrame(() => {
    if (!isDragging && !alwaysTrack) {
      onSnapPointUpdate(null);
      return;
    }

    // Update raycaster with current pointer position
    raycaster.setFromCamera(pointer, camera);

    // Create a plane at y=0 (grid plane)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    const intersects = raycaster.ray.intersectPlane(plane, intersectPoint);

    if (!intersects) {
      onSnapPointUpdate(null);
      return;
    }

    // Calculate nearest grid point
    const gridHalf = gridSize / 2;
    const snapX = Math.round(intersectPoint.x);
    const snapZ = Math.round(intersectPoint.z);
    const snapY = 0;

    // Check if point is within active zone
    if (snapX >= -gridHalf && snapX <= gridHalf && snapZ >= -gridHalf && snapZ <= gridHalf) {
      onSnapPointUpdate([snapX, snapY, snapZ]);
    } else {
      onSnapPointUpdate(null);
    }
  });

  return null;
};

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
  const [selectedGridPoint, setSelectedGridPoint] = useState<[number, number, number] | null>(null);
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

  // Calculate valid endpoints for a line from a start position
  const getValidLineEndpoints = useCallback((startPos: [number, number, number], gridSize: number): Array<[number, number, number]> => {
    const [startX, startY, startZ] = startPos;
    const validPoints: Array<[number, number, number]> = [];
    const gridHalf = gridSize / 2;
    
    // Generate all points in the grid
    for (let x = -gridHalf; x <= gridHalf; x++) {
      for (let z = -gridHalf; z <= gridHalf; z++) {
        const y = 0; // Grid is on y=0 plane
        
        // Skip the start position itself
        if (x === startX && z === startZ) continue;
        
        // Check if point is on a straight line (horizontal, vertical, or diagonal)
        const dx = x - startX;
        const dz = z - startZ;
        
        // Valid if: horizontal (dz === 0), vertical (dx === 0), or diagonal (|dx| === |dz|)
        const isHorizontal = dz === 0;
        const isVertical = dx === 0;
        const isDiagonal = Math.abs(dx) === Math.abs(dz);
        
        if (isHorizontal || isVertical || isDiagonal) {
          validPoints.push([x, y, z]);
        }
      }
    }
    
    return validPoints;
  }, []);

  const handleGridPointClick = useCallback((position: [number, number, number]) => {
    // Handle path creation mode
    if (pathCreationMode?.isActive && pathCreationMode.startPosition) {
      const startPos = pathCreationMode.startPosition;
      
      // Don't allow selecting the start position as endpoint
      if (position[0] === startPos[0] && position[1] === startPos[1] && position[2] === startPos[2]) {
        if (onPathCreationError) {
          onPathCreationError('Cannot select the start point as the endpoint');
        }
        return;
      }
      
      if (pathCreationMode.type === 'line') {
        // Check if the clicked point is a valid endpoint
        const validEndpoints = getValidLineEndpoints(startPos, gridSize);
        const isValidEndpoint = validEndpoints.some(ep => 
          ep[0] === position[0] && ep[1] === position[1] && ep[2] === position[2]
        );
        
        if (isValidEndpoint && onPathCreationComplete) {
          // Complete the path creation
          onPathCreationComplete(startPos, position, pathCreationMode.pathType, pathCreationMode.pathLabel);
        } else if (onPathCreationError) {
          // Show error toast
          onPathCreationError('Please select a valid endpoint. Valid endpoints are points directly through the start point (straight or diagonal).');
        }
      }
      return;
    }

    // Check if this grid point is lit by a path - if so, select that path
    const pathWithThisTile = placedPaths.find(path => 
      path.litTiles && path.litTiles.some(tile => 
        tile[0] === position[0] && tile[1] === position[1] && tile[2] === position[2]
      )
    );

    if (pathWithThisTile) {
      // This tile is lit by a path - select the path and open drawer
      // Pass litTiles as points for display purposes (since drawer expects points)
      onSelectItem({
        type: 'path',
        id: pathWithThisTile.id,
        pathType: pathWithThisTile.pathType,
        label: pathWithThisTile.pathLabel,
        name: pathWithThisTile.name,
        points: pathWithThisTile.litTiles || [] // Pass litTiles as points for drawer display
      });
      return;
    }

    // If not a lit tile, treat as coordinate click
    setSelectedGridPoint(position);
    
    // Register coordinate if registry is available
    let coordinateId = `coord_${position[0]}_${position[1]}_${position[2]}`;
    let coordinateName: string | undefined = undefined;
    
    if (coordinateRegistry) {
      const coord = coordinateRegistry.getOrCreate(position);
      coordinateId = coord.id;
      coordinateName = coord.name;
      if (onCoordinatesChange) {
        onCoordinatesChange(coordinateRegistry.getAll());
      }
    }
    
    onSelectItem({
      type: 'coordinate',
      id: coordinateId,
      position: position,
      name: coordinateName
    });
    
    // Add a new object at this grid point
    const newObject = {
      id: `obj_${Date.now()}`,
      position: position,
      targetId: `target_${Date.now()}`,
      targetLabel: 'Target'
    };
    
    // Register coordinate and create relationship
    if (coordinateRegistry && relationshipManager) {
      const coord = coordinateRegistry.getOrCreate(position);
      relationshipManager.attachTargetToCoordinate(newObject.id, coord.id);
      if (onCoordinatesChange) {
        onCoordinatesChange(coordinateRegistry.getAll());
      }
    }
    
    onPlacedObjectsChange([...placedObjects, newObject]);
  }, [placedPaths, placedObjects, onPlacedObjectsChange, onSelectItem, pathCreationMode, getValidLineEndpoints, gridSize, onPathCreationComplete, onPathCreationError, coordinateRegistry, relationshipManager, onCoordinatesChange]);

  // Track mouse position globally (same approach as DragTooltip)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setMousePosition(pos);
      mousePositionRef.current = pos;
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Also capture on contextmenu to get exact right-click position
    const handleContextMenu = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      mousePositionRef.current = pos;
    };
    
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

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

  // Helper function to check if two positions are equal
  const positionsEqual = (pos1: [number, number, number], pos2: [number, number, number] | null): boolean => {
    if (!pos2) return false;
    return pos1[0] === pos2[0] && pos1[1] === pos2[1] && pos1[2] === pos2[2];
  };

  const generateGridPoints = () => {
    const points: Array<[number, number, number]> = [];
    
    for (let x = -gridSize/2; x <= gridSize/2; x++) {
      for (let z = -gridSize/2; z <= gridSize/2; z++) {
        points.push([x, 0, z]);
      }
    }
    
    return points;
  };

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
      {generateGridPoints().map((position, index) => {
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
        // Validate path has lit tiles
        if (!path || !path.litTiles || !Array.isArray(path.litTiles) || path.litTiles.length === 0) {
          return null;
        }
        
        // Filter out any invalid tiles
        const validTiles = path.litTiles.filter(tile => 
          tile && Array.isArray(tile) && tile.length === 3 &&
          Number.isFinite(tile[0]) && Number.isFinite(tile[1]) && Number.isFinite(tile[2])
        );
        
        if (validTiles.length === 0) {
          return null;
        }
        
        // If only one tile, render a small sphere at that position
        if (validTiles.length === 1) {
          const tile = validTiles[0];
          const isSelected = selectedItem?.type === 'path' && selectedItem.id === path.id;
          const isRelated = relatedItemIds.paths.includes(path.id);
          // Color priority: selected (green) > related (purple) > normal (white)
          const sphereColor = isSelected ? "#00ff00" : (isRelated ? "#9b59b6" : "#ffffff");
          
          return (
            <Sphere
              key={path.id}
              position={[tile[0], tile[1] + 0.5, tile[2]]}
              args={[isRelated ? 0.45 : 0.4, 16, 16]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem({
                  type: 'path',
                  id: path.id,
                  pathType: path.pathType,
                  label: path.pathLabel,
                  name: path.name,
                  points: path.litTiles || []
                });
              }}
              onContextMenu={(e) => {
                e.stopPropagation();
                onOpenNamingModal({
                  isOpen: true,
                  itemType: 'path',
                  itemId: path.id,
                  currentName: path.name,
                  itemLabel: path.pathLabel
                });
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <meshStandardMaterial color={sphereColor} />
            </Sphere>
          );
        }
        
        // Multiple tiles: connect them with lines
        // Ensure we have at least 2 valid tiles for line rendering
        if (validTiles.length < 2) {
          return null;
        }
        
        // Create lines between consecutive tiles
        const lines: React.ReactNode[] = [];
        const clickableBoxes: React.ReactNode[] = [];
        const isSelected = selectedItem?.type === 'path' && selectedItem.id === path.id;
        const isRelated = relatedItemIds.paths.includes(path.id);
        // Color priority: selected (green) > related (purple) > normal (white)
        const lineColor = isSelected ? "#00ff00" : (isRelated ? "#9b59b6" : "#ffffff");
        const lineWidth = isSelected ? 8 : (isRelated ? 7 : 6);
        
        for (let i = 0; i < validTiles.length - 1; i++) {
          const start = validTiles[i];
          const end = validTiles[i + 1];
          
          // Validate points before creating line
          if (!start || !end || 
              !Array.isArray(start) || !Array.isArray(end) ||
              start.length !== 3 || end.length !== 3 ||
              !Number.isFinite(start[0]) || !Number.isFinite(start[1]) || !Number.isFinite(start[2]) ||
              !Number.isFinite(end[0]) || !Number.isFinite(end[1]) || !Number.isFinite(end[2])) {
            console.warn(`Invalid path segment at index ${i} for path ${path.id}`, { start, end });
            continue;
          }
          
          // Create line between tiles
          const startVec = new THREE.Vector3(start[0], start[1] + 0.5, start[2]);
          const endVec = new THREE.Vector3(end[0], end[1] + 0.5, end[2]);
          
          // Ensure vectors are valid (check if components are finite)
          if (!Number.isFinite(startVec.x) || !Number.isFinite(startVec.y) || !Number.isFinite(startVec.z) ||
              !Number.isFinite(endVec.x) || !Number.isFinite(endVec.y) || !Number.isFinite(endVec.z)) {
            console.warn(`Invalid vector for path segment at index ${i} for path ${path.id}`);
            continue;
          }
          
          // Ensure start and end vectors are different (Line component requires distinct points)
          if (startVec.distanceTo(endVec) < 0.001) {
            console.warn(`Start and end vectors are too close for path segment at index ${i} for path ${path.id}`);
            continue;
          }
          
          // Calculate line segment properties for Box geometry
          const segmentLength = startVec.distanceTo(endVec);
          const midpoint = new THREE.Vector3(
            (startVec.x + endVec.x) / 2,
            (startVec.y + endVec.y) / 2,
            (startVec.z + endVec.z) / 2
          );
          
          // Calculate rotation to align box with line direction
          const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize();
          const lineThickness = 0.4; // 50% of block width (0.8 * 0.5 = 0.4)
          
          // Calculate rotation to align Box's Y-axis with line direction
          // Box default extends along Y-axis, so we need to rotate it
          const yAxis = new THREE.Vector3(0, 1, 0);
          const rotationAxis = new THREE.Vector3().crossVectors(yAxis, direction);
          const rotationAxisLength = rotationAxis.length();
          
          let rotation: [number, number, number] = [0, 0, 0];
          
          if (rotationAxisLength > 0.001) {
            // Normalize the rotation axis
            rotationAxis.normalize();
            const angle = Math.acos(Math.max(-1, Math.min(1, yAxis.dot(direction))));
            
            // Convert axis-angle to Euler angles
            const quat = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle);
            const euler = new THREE.Euler().setFromQuaternion(quat);
            
            // Extract rotation as array to avoid readonly property issues
            rotation = [euler.x, euler.y, euler.z];
          } else if (direction.y < -0.999) {
            // Special case: direction is opposite to Y-axis
            rotation = [Math.PI, 0, 0];
          }
          
          // Use Box geometry instead of Line for precise thickness control
          lines.push(
            <Box
              key={`line-${path.id}-${i}`}
              position={[midpoint.x, midpoint.y, midpoint.z]}
              args={[lineThickness, segmentLength, lineThickness]}
              rotation={rotation}
            >
              <meshStandardMaterial color={lineColor} />
            </Box>
          );
          
          // Create clickable box for this segment (using same midpoint, but offset Y by 0.5)
          const clickableMidpoint = new THREE.Vector3(midpoint.x, midpoint.y + 0.5, midpoint.z);
          
          clickableBoxes.push(
            <Box
              key={`box-${path.id}-${i}`}
              position={[clickableMidpoint.x, clickableMidpoint.y, clickableMidpoint.z]}
              args={[Math.max(segmentLength, 0.8), 0.8, 0.8]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem({
                  type: 'path',
                  id: path.id,
                  pathType: path.pathType,
                  label: path.pathLabel,
                  name: path.name,
                  points: path.litTiles || []
                });
              }}
              onContextMenu={(e) => {
                e.stopPropagation();
                onOpenNamingModal({
                  isOpen: true,
                  itemType: 'path',
                  itemId: path.id,
                  currentName: path.name,
                  itemLabel: path.pathLabel
                });
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <meshStandardMaterial transparent opacity={0} />
            </Box>
          );
        }
        
        // Only render if we have valid lines
        if (lines.length === 0) {
          console.warn(`Path ${path.id} has no valid line segments after validation`, { validTiles, path });
          return null;
        }
        
        return (
          <group key={path.id}>
            {lines}
            {clickableBoxes}
          </group>
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

// OrbitControls wrapper that disables controls while dragging or placing path
const OrbitControlsWrapper: React.FC<{ 
  waitingForPathEndpoint: boolean;
  onControlsReady?: (controls: any) => void;
}> = ({ waitingForPathEndpoint, onControlsReady }) => {
  const { isDragging } = useDragTargetContext();
  const shouldDisable = isDragging || waitingForPathEndpoint;
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  useEffect(() => {
    if (controlsRef.current) {
      if (onControlsReady) {
        onControlsReady(controlsRef.current);
      }
      // Set initial rotation angles: horizontal and vertical adjusted by 5%
      const horizontalAngle = (-15.75 * Math.PI) / 180; // -15.75 degrees (increased by 5% from -15)
      const verticalAngle = (19 * Math.PI) / 180; // 19 degrees (decreased by 5% from 20)
      
      // Set spherical coordinates
      // theta is horizontal angle (azimuth), phi is vertical angle (polar)
      // For OrbitControls, polar angle is measured from the positive Y axis
      controlsRef.current.setAzimuthalAngle(horizontalAngle);
      controlsRef.current.setPolarAngle(Math.PI / 2 - verticalAngle);
      controlsRef.current.update();
    }
  }, [onControlsReady]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={!shouldDisable}
      enableZoom={!shouldDisable}
      enableRotate={!shouldDisable}
      minDistance={1}
      maxDistance={100}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
};

// Tooltip component
const DragTooltip: React.FC<{ 
  snapPoint: [number, number, number] | null;
  coordinateSettings: CoordinateSettings;
  hoveredObject: string | null;
  placedObjects: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>;
  openAnnotations: Set<string>;
  waitingForPathEndpoint: { id: string; pathType: string; pathLabel: string } | null;
}> = ({ snapPoint, coordinateSettings, hoveredObject, placedObjects, openAnnotations, waitingForPathEndpoint }) => {
  const { isDragging, dragData } = useDragTargetContext();
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (isDragging || hoveredObject || waitingForPathEndpoint) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isDragging, hoveredObject, waitingForPathEndpoint]);

  // Show tooltip for dragged item, path endpoint, or hovered placed object
  const tooltipData = waitingForPathEndpoint && snapPoint
    ? { label: waitingForPathEndpoint.pathLabel, position: snapPoint }
    : isDragging && snapPoint
    ? { label: dragData?.label || 'Target', position: snapPoint }
    : hoveredObject && !openAnnotations.has(hoveredObject)
    ? (() => {
        const obj = placedObjects.find(o => o.id === hoveredObject);
        return obj ? { label: obj.targetLabel, position: obj.position } : null;
      })()
    : null;

  if (!tooltipData) return null;

  const formatCoordinate = (coord: number) => {
    return (coord * coordinateSettings.minUnit).toFixed(1);
  };

  return (
    <div
      className="drag-tooltip"
      style={{
        position: 'fixed',
        left: `${mousePosition.x + 15}px`,
        top: `${mousePosition.y + 15}px`,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <div className="tooltip-content">
        <div className="tooltip-header">{tooltipData.label}</div>
        <div className="tooltip-coords">
          X: {formatCoordinate(tooltipData.position[0])}, 
          Y: {formatCoordinate(tooltipData.position[1])}, 
          Z: {formatCoordinate(tooltipData.position[2])}
        </div>
        <div className="tooltip-grid">
          Grid: [{tooltipData.position[0]}, {tooltipData.position[1]}, {tooltipData.position[2]}]
        </div>
      </div>
    </div>
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
  placedPaths: externalPlacedPaths
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

  // Path creation mode state
  const [pathCreationMode, setPathCreationMode] = useState<{
    isActive: boolean;
    type: 'line' | 'curve' | null;
    startPosition: [number, number, number] | null;
    pathType: string;
    pathLabel: string;
  }>({
    isActive: false,
    type: null,
    startPosition: null,
    pathType: '',
    pathLabel: ''
  });

  // Toaster for notifications
  const toasterRef = useRef<OverlayToaster | null>(null);
  const pathCreationToastKeyRef = useRef<string | null>(null);

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
  const handleAddTargetFromMenu = useCallback((position: [number, number, number]) => {
    const newObject = {
      id: `obj_${Date.now()}`,
      position: position,
      targetId: `target_${Date.now()}`,
      targetLabel: 'Target',
      iconEmoji: '🎯'
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

  const handleStartPathFromMenu = useCallback((position: [number, number, number], pathType: string = 'path-line', pathLabel: string = 'Line') => {
    // Enter path creation mode instead of creating path immediately
    setPathCreationMode({
      isActive: true,
      type: pathType === 'path-line' ? 'line' : 'curve',
      startPosition: position,
      pathType: pathType,
      pathLabel: pathLabel
    });
    
    // Show toast notification
    if (toasterRef.current) {
      const toastKey = toasterRef.current.show({
        message: `Path creation mode: ${pathLabel}. Select an endpoint. Click this toast to exit path creation mode.`,
        intent: 'primary',
        timeout: 0, // Don't auto-dismiss
        onDismiss: () => {
          setPathCreationMode({
            isActive: false,
            type: null,
            startPosition: null,
            pathType: '',
            pathLabel: ''
          });
          pathCreationToastKeyRef.current = null;
        },
        action: {
          text: 'Cancel',
          onClick: () => {
            setPathCreationMode({
              isActive: false,
              type: null,
              startPosition: null,
              pathType: '',
              pathLabel: ''
            });
            if (toasterRef.current && pathCreationToastKeyRef.current) {
              toasterRef.current.dismiss(pathCreationToastKeyRef.current);
            }
            pathCreationToastKeyRef.current = null;
          }
        }
      });
      pathCreationToastKeyRef.current = toastKey;
    }
    
    setContextMenuState({ isOpen: false, position: null, menuPosition: null });
  }, []);

  // Calculate all points on a line between start and end
  const calculateLinePoints = useCallback((start: [number, number, number], end: [number, number, number]): Array<[number, number, number]> => {
    const [startX, startY, startZ] = start;
    const [endX, endY, endZ] = end;
    
    // Validate inputs
    if (!Number.isFinite(startX) || !Number.isFinite(startY) || !Number.isFinite(startZ) ||
        !Number.isFinite(endX) || !Number.isFinite(endY) || !Number.isFinite(endZ)) {
      console.warn('Invalid start or end position for line calculation', { start, end });
      return [start, end]; // Return at least start and end
    }
    
    const points: Array<[number, number, number]> = [];
    const dx = endX - startX;
    const dz = endZ - startZ;
    
    // Calculate the number of steps needed (use the larger of dx or dz)
    const steps = Math.max(Math.abs(dx), Math.abs(dz));
    
    if (steps === 0) {
      // Start and end are the same
      return [start];
    }
    
    // Ensure steps is at least 1 to avoid division by zero
    const safeSteps = Math.max(1, steps);
    
    // Interpolate between start and end
    for (let i = 0; i <= safeSteps; i++) {
      const t = safeSteps > 0 ? i / safeSteps : 0;
      const x = Math.round(startX + dx * t);
      const z = Math.round(startZ + dz * t);
      const y = 0; // Grid is on y=0 plane
      
      // Validate calculated point
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        points.push([x, y, z]);
      }
    }
    
    // Ensure we have at least start and end points
    if (points.length === 0) {
      return [start, end];
    }
    
    // Ensure start and end are included
    const hasStart = points.some(p => p[0] === startX && p[1] === startY && p[2] === startZ);
    const hasEnd = points.some(p => p[0] === endX && p[1] === endY && p[2] === endZ);
    
    if (!hasStart) points.unshift(start);
    if (!hasEnd) points.push(end);
    
    // Deduplicate consecutive identical points to avoid Line component errors
    const deduplicated: Array<[number, number, number]> = [];
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const prev = deduplicated[deduplicated.length - 1];
      
      if (!prev || prev[0] !== current[0] || prev[1] !== current[1] || prev[2] !== current[2]) {
        deduplicated.push(current);
      }
    }
    
    // Ensure we have at least 2 points for a valid line
    if (deduplicated.length < 2) {
      return [start, end];
    }
    
    return deduplicated;
  }, []);

  // Handle path creation completion
  const handlePathCreationComplete = useCallback((startPosition: [number, number, number], endPosition: [number, number, number], pathType: string, pathLabel: string) => {
    // Calculate all points on the line between start and end
    const allPositions = calculateLinePoints(startPosition, endPosition);
    const newPath = {
      id: `path_${Date.now()}`,
      points: [],
      pathType: pathType,
      pathLabel: pathLabel,
      name: undefined,
      litTiles: allPositions
    };
    
    // Register coordinates and create relationships
    if (coordinateRegistry && relationshipManager) {
      const coords = allPositions.map(pos => coordinateRegistry.getOrCreate(pos));
      relationshipManager.attachPathToCoordinates(newPath.id, coords.map(c => c.id));
      if (onCoordinatesChange) {
        onCoordinatesChange(coordinateRegistry.getAll());
      }
    }
    
    setPlacedPaths([...placedPaths, newPath]);
    
    // Exit path creation mode
    setPathCreationMode({
      isActive: false,
      type: null,
      startPosition: null,
      pathType: '',
      pathLabel: ''
    });
    
    // Dismiss toast
    if (toasterRef.current && pathCreationToastKeyRef.current) {
      toasterRef.current.dismiss(pathCreationToastKeyRef.current);
      pathCreationToastKeyRef.current = null;
    }
  }, [placedPaths, setPlacedPaths, coordinateRegistry, relationshipManager, onCoordinatesChange, calculateLinePoints]);

  // Handle path creation error
  const handlePathCreationError = useCallback((message: string) => {
    if (toasterRef.current) {
      toasterRef.current.show({
        message: message,
        intent: 'danger',
        timeout: 3000
      });
    }
  }, []);

  // Handle path creation cancel
  const handlePathCreationCancel = useCallback(() => {
    setPathCreationMode({
      isActive: false,
      type: null,
      startPosition: null,
      pathType: '',
      pathLabel: ''
    });
    if (toasterRef.current && pathCreationToastKeyRef.current) {
      toasterRef.current.dismiss(pathCreationToastKeyRef.current);
      pathCreationToastKeyRef.current = null;
    }
  }, []);

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
          onPathCreationComplete={handlePathCreationComplete}
          onPathCreationCancel={handlePathCreationCancel}
          onPathCreationError={handlePathCreationError}
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
            <MenuItem
              icon="target"
              text="Add Target"
              onClick={() => {
                if (contextMenuState.position) {
                  handleAddTargetFromMenu(contextMenuState.position);
                }
              }}
            />
            <MenuItem
              icon="path-search"
              text="Start Path"
            >
              <MenuItem
                icon="path-search"
                text="Line"
                onClick={() => {
                  if (contextMenuState.position) {
                    handleStartPathFromMenu(contextMenuState.position, 'path-line', 'Line');
                  }
                }}
              />
            </MenuItem>
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

      {/* Toaster for notifications */}
      <OverlayToaster ref={toasterRef} position="top" />
    </div>
  );
};

export default InfiniteGridCanvas;