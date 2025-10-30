import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import SettingsModal, { CoordinateSettings, CoordinateSystem } from './SettingsModal';
import CoordinateAxes from './CoordinateAxes';
import Target from './Target';
import Path from './Path';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import './InfiniteGrid.css';

// Grid point component
const GridPoint: React.FC<{ position: [number, number, number]; onClick: () => void }> = ({ position, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1);
    }
  });

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
        color={hovered ? "#ff6b6b" : "#4c9eff"} 
        transparent 
        opacity={0.7}
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
  openAnnotations: Set<string>;
  onToggleAnnotation: (id: string) => void;
  waitingForPathEndpoint: { id: string; start: [number, number, number]; pathType: string; pathLabel: string } | null;
  onWaitingForPathEndpointChange: (state: { id: string; start: [number, number, number]; pathType: string; pathLabel: string } | null) => void;
  onPathEndpointSnapPointChange: (point: [number, number, number] | null) => void;
}> = ({ coordinateSettings, onHoveredObjectChange, onPlacedObjectsChange, openAnnotations, onToggleAnnotation, waitingForPathEndpoint, onWaitingForPathEndpointChange, onPathEndpointSnapPointChange }) => {
  const [gridSize] = useState(20); // Grid extends from -10 to +10 in each direction
  const [placedObjects, setPlacedObjects] = useState<Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; iconEmoji?: string }>>([]);
  const [placedPaths, setPlacedPaths] = useState<Array<{ id: string; start: [number, number, number]; end: [number, number, number]; pathType: string; pathLabel: string }>>([]);
  const [selectedGridPoint, setSelectedGridPoint] = useState<[number, number, number] | null>(null);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [pathEndpointSnapPoint, setPathEndpointSnapPoint] = useState<[number, number, number] | null>(null);
  const { isDragging, dragData, snapPoint, updateSnapPoint, endDrag } = useDragTargetContext();

  // Create a combined snap point that works for both dragging and path endpoint placement
  const currentSnapPoint = isDragging ? snapPoint : (waitingForPathEndpoint ? pathEndpointSnapPoint : null);

  // Notify parent of changes
  useEffect(() => {
    onPlacedObjectsChange(placedObjects);
  }, [placedObjects, onPlacedObjectsChange]);

  useEffect(() => {
    onHoveredObjectChange(hoveredObject);
  }, [hoveredObject, onHoveredObjectChange]);

  // Clear path endpoint snap point when not waiting
  useEffect(() => {
    if (!waitingForPathEndpoint) {
      setPathEndpointSnapPoint(null);
      onPathEndpointSnapPointChange(null);
    }
  }, [waitingForPathEndpoint, onPathEndpointSnapPointChange]);

  // Notify parent of path endpoint snap point changes
  useEffect(() => {
    onPathEndpointSnapPointChange(pathEndpointSnapPoint);
  }, [pathEndpointSnapPoint, onPathEndpointSnapPointChange]);

  // Handle Escape key to cancel path placement
  useEffect(() => {
    if (!waitingForPathEndpoint) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onWaitingForPathEndpointChange(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [waitingForPathEndpoint, onWaitingForPathEndpointChange]);

  const handleGridPointClick = useCallback((position: [number, number, number]) => {
    // If waiting for path endpoint, update the existing path's endpoint
    if (waitingForPathEndpoint) {
      // Validate position and start point
      if (position && position.length === 3 && 
          waitingForPathEndpoint.start && 
          waitingForPathEndpoint.start.length === 3) {
        // Update the existing path's endpoint
        setPlacedPaths(prev => prev.map(path => {
          if (path.id === waitingForPathEndpoint.id) {
            return {
              ...path,
              end: [position[0], position[1], position[2]] as [number, number, number]
            };
          }
          return path;
        }));
      }
      onWaitingForPathEndpointChange(null);
      return;
    }

    setSelectedGridPoint(position);
    
    // Add a new object at this grid point
    const newObject = {
      id: `obj_${Date.now()}`,
      position: position,
      targetId: `target_${Date.now()}`,
      targetLabel: 'Target'
    };
    
    setPlacedObjects(prev => [...prev, newObject]);
  }, [waitingForPathEndpoint, onWaitingForPathEndpointChange]);

  // Handle drop
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        const result = endDrag();
        if (result && result.snapPoint) {
          // Check if this is a path item
          if (result.dragData.id.startsWith('path-')) {
            // For paths, immediately create a line with endpoint adjacent to start point
            if (result.snapPoint && result.snapPoint.length === 3) {
              const start: [number, number, number] = [
                result.snapPoint[0], 
                result.snapPoint[1], 
                result.snapPoint[2]
              ];
              // Set endpoint to adjacent point (1 unit in +X direction)
              const end: [number, number, number] = [
                start[0] + 1,
                start[1],
                start[2]
              ];
              
              // Create the path immediately
              const newPath = {
                id: `path_${Date.now()}`,
                start: start,
                end: end,
                pathType: result.dragData.id,
                pathLabel: result.dragData.label
              };
              
              // Add path to state
              setPlacedPaths((prev: Array<{ id: string; start: [number, number, number]; end: [number, number, number]; pathType: string; pathLabel: string }>) => [...prev, newPath]);
              
              // Then enter mode to allow user to adjust endpoint if desired
              onWaitingForPathEndpointChange({
                id: newPath.id,
                start: start,
                pathType: result.dragData.id,
                pathLabel: result.dragData.label
              });
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
            setPlacedObjects(prev => [...prev, newObject]);
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
  }, [isDragging, endDrag, onToggleAnnotation, onWaitingForPathEndpointChange]);

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
          } else if (waitingForPathEndpoint) {
            setPathEndpointSnapPoint(point);
          }
        }}
        alwaysTrack={!!waitingForPathEndpoint}
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
      {generateGridPoints().map((position, index) => (
        <GridPoint
          key={`${position[0]}-${position[2]}`}
          position={position}
          onClick={() => handleGridPointClick(position)}
        />
      ))}

      {/* Snap point indicator */}
      {currentSnapPoint && (
        <Sphere
          position={currentSnapPoint}
          args={[0.4, 16, 16]}
        >
          <meshStandardMaterial color="#00ff00" transparent opacity={0.6} />
        </Sphere>
      )}

      {/* Temporary path line preview while waiting for endpoint */}
      {waitingForPathEndpoint && 
       waitingForPathEndpoint.start && 
       waitingForPathEndpoint.start.length === 3 && (() => {
        // Use existing path's end if available, otherwise use snap point
        const existingPath = placedPaths.find(p => p.id === waitingForPathEndpoint.id);
        const previewEnd = existingPath?.end || pathEndpointSnapPoint;
        
        if (!previewEnd || previewEnd.length !== 3) return null;
        
        return (
          <Line
            points={[
              new THREE.Vector3(
                waitingForPathEndpoint.start[0],
                waitingForPathEndpoint.start[1],
                waitingForPathEndpoint.start[2]
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
      })()}

      {/* Placed paths */}
      {placedPaths.map((path) => (
        <Path
          key={path.id}
          id={path.id}
          start={path.start}
          end={path.end}
          pathType={path.pathType}
          pathLabel={path.pathLabel}
          color="#3498db"
          lineWidth={3}
        />
      ))}

      {/* Placed objects */}
      {placedObjects.map((obj) => {
        const annotationIsOpen = openAnnotations.has(obj.id);
        
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
const OrbitControlsWrapper: React.FC<{ waitingForPathEndpoint: boolean }> = ({ waitingForPathEndpoint }) => {
  const { isDragging } = useDragTargetContext();
  const shouldDisable = isDragging || waitingForPathEndpoint;
  
  return (
    <OrbitControls
      enablePan={!shouldDisable}
      enableZoom={!shouldDisable}
      enableRotate={!shouldDisable}
      minDistance={5}
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
  waitingForPathEndpoint: { id: string; start: [number, number, number]; pathType: string; pathLabel: string } | null;
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
const InfiniteGridCanvas: React.FC = () => {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([15, 15, 15]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [coordinateSettings, setCoordinateSettings] = useState<CoordinateSettings>({
    system: 'Cartesian',
    minUnit: 0.1
  });
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [placedObjects, setPlacedObjects] = useState<Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; iconEmoji?: string }>>([]);
  const [openAnnotations, setOpenAnnotations] = useState<Set<string>>(new Set());
  const [waitingForPathEndpoint, setWaitingForPathEndpoint] = useState<{ id: string; start: [number, number, number]; pathType: string; pathLabel: string } | null>(null);
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
      {/* Controls overlay */}
      <div className="grid-controls">
        <h3>Infinite 3D Grid</h3>
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
          <button onClick={() => setCameraPosition([15, 15, 15])}>
            Reset Camera
          </button>
          <button 
            className="settings-button"
            onClick={() => setIsSettingsOpen(true)}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: cameraPosition, fov: 75 }}
        style={{ width: '100%', height: '100%' }}
      >
        <InfiniteGrid 
          coordinateSettings={coordinateSettings}
          onHoveredObjectChange={setHoveredObject}
          onPlacedObjectsChange={setPlacedObjects}
          openAnnotations={openAnnotations}
          onToggleAnnotation={handleToggleAnnotation}
          waitingForPathEndpoint={waitingForPathEndpoint}
          onWaitingForPathEndpointChange={setWaitingForPathEndpoint}
          onPathEndpointSnapPointChange={setPathEndpointSnapPoint}
        />
        <OrbitControlsWrapper waitingForPathEndpoint={!!waitingForPathEndpoint} />
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