import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Button, Icon, Collapse } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import SettingsModal, { CoordinateSettings, CoordinateSystem } from './SettingsModal';
import CoordinateAxes from './CoordinateAxes';
import Target from './Target';
import Path from './Path';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import './InfiniteGrid.css';

// Grid point component
const GridPoint: React.FC<{ 
  position: [number, number, number]; 
  onClick: () => void;
  isPermanentlyLit?: boolean;
}> = ({ position, onClick, isPermanentlyLit = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1);
    }
  });

  // Determine color: permanently lit (red), hovered (red), or default (blue)
  const color = isPermanentlyLit || hovered ? "#ff6b6b" : "#4c9eff";

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[0.8, 0.8, 0.8]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial 
        color={color}
        transparent 
        opacity={isPermanentlyLit ? 1.0 : 0.7}
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
  onPlacedObjectsChange: (objects: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; iconEmoji?: string }>) => void;
  onPlacedPathsChange: (paths: Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; litTiles: [number, number, number][] }>) => void;
  placedObjects: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; iconEmoji?: string }>;
  placedPaths: Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; litTiles: [number, number, number][] }>;
  openAnnotations: Set<string>;
  onToggleAnnotation: (id: string) => void;
  waitingForPathEndpoint: { id: string; pathType: string; pathLabel: string } | null;
  onWaitingForPathEndpointChange: (state: { id: string; pathType: string; pathLabel: string } | null) => void;
  onPathEndpointSnapPointChange: (point: [number, number, number] | null) => void;
  selectedItem: { type: 'target'; id: string } | { type: 'path'; id: string } | null;
  onSelectItem: (item: { type: 'target'; id: string; targetId: string; label: string; position: [number, number, number]; iconEmoji?: string } | { type: 'path'; id: string; pathType: string; label: string; points: [number, number, number][] } | null) => void;
}> = ({ coordinateSettings, onHoveredObjectChange, onPlacedObjectsChange, onPlacedPathsChange, placedObjects, placedPaths, openAnnotations, onToggleAnnotation, waitingForPathEndpoint, onWaitingForPathEndpointChange, onPathEndpointSnapPointChange, selectedItem, onSelectItem }) => {
  const [gridSize] = useState(20); // Grid extends from -10 to +10 in each direction
  const [selectedGridPoint, setSelectedGridPoint] = useState<[number, number, number] | null>(null);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [pathEndpointSnapPoint, setPathEndpointSnapPoint] = useState<[number, number, number] | null>(null);
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

  const handleGridPointClick = useCallback((position: [number, number, number]) => {
    // Commented out - no path endpoint logic
    // // If waiting for path endpoint, add the point to the existing path
    // if (waitingForPathEndpoint) {
    //   // Validate position
    //   if (position && position.length === 3) {
    //     // Add the new point to the existing path's points array and light up the tile
    //     const updatedPaths = placedPaths.map(path => {
    //       if (path.id === waitingForPathEndpoint.id) {
    //         const newPoint: [number, number, number] = [position[0], position[1], position[2]];
    //         // Check if this tile is already lit (avoid duplicates)
    //         const isAlreadyLit = path.litTiles.some(tile => 
    //           tile[0] === newPoint[0] && tile[1] === newPoint[1] && tile[2] === newPoint[2]
    //         );
    //         return {
    //           ...path,
    //           points: [...path.points, newPoint],
    //           litTiles: isAlreadyLit ? path.litTiles : [...path.litTiles, newPoint]
    //         };
    //       }
    //       return path;
    //     });
    //     onPlacedPathsChange(updatedPaths);
    //     // Continue waiting for more points (user can add as many as they want)
    //     // Remove the waiting state only when they click elsewhere or press escape
    //   }
    //   return;
    // }

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
        points: pathWithThisTile.litTiles || [] // Pass litTiles as points for drawer display
      });
      return;
    }

    // If not a lit tile, clear selection and proceed with normal grid point logic
    setSelectedGridPoint(position);
    onSelectItem(null);
    
    // Add a new object at this grid point
    const newObject = {
      id: `obj_${Date.now()}`,
      position: position,
      targetId: `target_${Date.now()}`,
      targetLabel: 'Target'
    };
    
    onPlacedObjectsChange([...placedObjects, newObject]);
  }, [placedPaths, placedObjects, onPlacedObjectsChange, onSelectItem]);

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
                litTiles: [point] // Light up the tile that was hovered over
              };
              
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
        
        return (
          <GridPoint
            key={`${position[0]}-${position[2]}`}
            position={position}
            onClick={() => {
              handleGridPointClick(position);
            }}
            isPermanentlyLit={isLitByPath}
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

      {/* Commented out - no path rendering */}
      {/* {placedPaths.map((path) => {
        // Validate path before rendering
        if (!path || !path.points || !Array.isArray(path.points) || path.points.length === 0) {
          console.warn(`Invalid path data:`, path);
          return null;
        }
        
        const isSelected = selectedItem?.type === 'path' && selectedItem.id === path.id;
        
        return (
          <Path
            key={path.id}
            id={path.id}
            points={path.points}
            pathType={path.pathType}
            pathLabel={path.pathLabel}
            color={isSelected ? "#00ff00" : "#3498db"}
            lineWidth={isSelected ? 4 : 3}
            onClick={() => {
              onSelectItem({
                type: 'path',
                id: path.id,
                pathType: path.pathType,
                label: path.pathLabel,
                points: path.points
              });
            }}
          />
        );
      })} */}

      {/* Placed objects */}
      {placedObjects.map((obj) => {
        const annotationIsOpen = openAnnotations.has(obj.id);
        const isSelected = selectedItem?.type === 'target' && selectedItem.id === obj.id;
        
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
                position: obj.position,
                iconEmoji: obj.iconEmoji
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
  placedObjects: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; iconEmoji?: string }>;
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
  selectedItem: { type: 'target'; id: string } | { type: 'path'; id: string } | null;
  onSelectItem: (item: { type: 'target'; id: string; targetId: string; label: string; position: [number, number, number]; iconEmoji?: string } | { type: 'path'; id: string; pathType: string; label: string; points: [number, number, number][] } | null) => void;
}

const InfiniteGridCanvas: React.FC<InfiniteGridCanvasProps> = ({ selectedItem, onSelectItem }) => {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([10.94, 10.94, 10.94]); // Zoomed out another 5% from [10.42,10.42,10.42]
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false); // Default to collapsed
  const controlsRef = useRef<any>(null);
  const [coordinateSettings, setCoordinateSettings] = useState<CoordinateSettings>({
    system: 'Cartesian',
    minUnit: 0.1
  });
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [placedObjects, setPlacedObjects] = useState<Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; iconEmoji?: string }>>([]);
  const [placedPaths, setPlacedPaths] = useState<Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; litTiles: [number, number, number][] }>>([]);
  const [openAnnotations, setOpenAnnotations] = useState<Set<string>>(new Set());
  const [waitingForPathEndpoint, setWaitingForPathEndpoint] = useState<{ id: string; pathType: string; pathLabel: string } | null>(null);
  const [pathEndpointSnapPoint, setPathEndpointSnapPoint] = useState<[number, number, number] | null>(null);
  const { snapPoint } = useDragTargetContext();

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
          onSelectItem={onSelectItem}
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
    </div>
  );
};

export default InfiniteGridCanvas;