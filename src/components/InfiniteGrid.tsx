import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Sphere, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import SettingsModal, { CoordinateSettings, CoordinateSystem } from './SettingsModal';
import CoordinateAxes from './CoordinateAxes';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import './InfiniteGrid.css';

// Annotation component for placed objects
const TargetAnnotation: React.FC<{
  position: [number, number, number];
  label: string;
  coordinateSettings: CoordinateSettings;
  isOpen: boolean;
  onClose: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}> = ({ position, label, coordinateSettings, isOpen, onClose, onPointerOver, onPointerOut }) => {
  if (!isOpen) return null;

  const formatCoordinate = (coord: number) => {
   



 return (coord * coordinateSettings.minUnit).toFixed(1);
  };

  // Position annotation above the target (1 unit up)
  const annotationPosition: [number, number, number] = [position[0], position[1] + 1, position[2]];

  return (
    <Html
      position={annotationPosition}
      center
      distanceFactor={10}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="target-annotation"
        onMouseEnter={onPointerOver}
        onMouseLeave={onPointerOut}
      >
        <div className="tooltip-content">
          <div className="tooltip-header-row">
            <div className="tooltip-header">{label}</div>
            <button 
              className="annotation-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close annotation"
            >
              ×
            </button>
          </div>
          <div className="tooltip-coords">
            X: {formatCoordinate(position[0])}, 
            Y: {formatCoordinate(position[1])}, 
            Z: {formatCoordinate(position[2])}
          </div>
          <div className="tooltip-grid">
            Grid: [{position[0]}, {position[1]}, {position[2]}]
          </div>
        </div>
      </div>
    </Html>
  );
};

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
const DragHandler: React.FC<{ gridSize: number; onSnapPointUpdate: (point: [number, number, number] | null) => void }> = ({ 
  gridSize, 
  onSnapPointUpdate 
}) => {
  const { camera, raycaster, pointer, gl } = useThree();
  const { isDragging } = useDragTargetContext();

  useFrame(() => {
    if (!isDragging) {
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
}> = ({ coordinateSettings, onHoveredObjectChange, onPlacedObjectsChange, openAnnotations, onToggleAnnotation }) => {
  const [gridSize] = useState(20); // Grid extends from -10 to +10 in each direction
  const [placedObjects, setPlacedObjects] = useState<Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; iconEmoji?: string }>>([]);
  const [selectedGridPoint, setSelectedGridPoint] = useState<[number, number, number] | null>(null);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const { isDragging, dragData, snapPoint, updateSnapPoint, endDrag } = useDragTargetContext();

  // Notify parent of changes
  useEffect(() => {
    onPlacedObjectsChange(placedObjects);
  }, [placedObjects, onPlacedObjectsChange]);

  useEffect(() => {
    onHoveredObjectChange(hoveredObject);
  }, [hoveredObject, onHoveredObjectChange]);

  const handleGridPointClick = useCallback((position: [number, number, number]) => {
    setSelectedGridPoint(position);
    
    // Add a new object at this grid point
    const newObject = {
      id: `obj_${Date.now()}`,
      position: position,
      targetId: `target_${Date.now()}`,
      targetLabel: 'Target'
    };
    
    setPlacedObjects(prev => [...prev, newObject]);
  }, []);

  // Handle drop
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        const result = endDrag();
        if (result && result.snapPoint) {
          // Place object at snapped grid point
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
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, endDrag]);

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
      <DragHandler gridSize={gridSize} onSnapPointUpdate={updateSnapPoint} />

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
      {isDragging && snapPoint && (
        <Sphere
          position={snapPoint}
          args={[0.4, 16, 16]}
        >
          <meshStandardMaterial color="#00ff00" transparent opacity={0.6} />
        </Sphere>
      )}

      {/* Placed objects */}
      {placedObjects.map((obj) => {
        // Position icon slightly above the grid point (0.5 units up)
        const iconPosition: [number, number, number] = [obj.position[0], obj.position[1] + 0.5, obj.position[2]];
        const iconEmoji = obj.iconEmoji || '🎯';
        const annotationIsOpen = openAnnotations.has(obj.id);
        
        return (
          <group key={obj.id}>
            {/* Icon text that always faces the camera */}
            <Text
              position={iconPosition}
              fontSize={0.8}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              onPointerOver={() => {
                // Only set hovered if annotation is closed
                if (!annotationIsOpen) {
                  setHoveredObject(obj.id);
                }
              }}
              onPointerOut={() => setHoveredObject(null)}
            >
              {iconEmoji}
            </Text>
            
            {/* Persistent annotation */}
            <TargetAnnotation
              position={obj.position}
              label={obj.targetLabel}
              coordinateSettings={coordinateSettings}
              isOpen={annotationIsOpen}
              onClose={() => onToggleAnnotation(obj.id)}
              onPointerOver={() => {
                // Suppress hover tooltip when annotation is hovered
                if (annotationIsOpen) {
                  setHoveredObject(null);
                }
              }}
              onPointerOut={() => {}}
            />
          </group>
        );
      })}

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
    </>
  );
};

// OrbitControls wrapper that disables controls while dragging
const OrbitControlsWrapper: React.FC = () => {
  const { isDragging } = useDragTargetContext();
  
  return (
    <OrbitControls
      enablePan={!isDragging}
      enableZoom={!isDragging}
      enableRotate={!isDragging}
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
}> = ({ snapPoint, coordinateSettings, hoveredObject, placedObjects, openAnnotations }) => {
  const { isDragging, dragData } = useDragTargetContext();
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (isDragging || hoveredObject) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isDragging, hoveredObject]);

  // Show tooltip for dragged item or hovered placed object (only if annotation is closed)
  const tooltipData = isDragging && snapPoint
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
        />
        <OrbitControlsWrapper />
      </Canvas>

      {/* Drag Tooltip */}
      <DragTooltip 
        snapPoint={snapPoint}
        coordinateSettings={coordinateSettings}
        hoveredObject={hoveredObject}
        placedObjects={placedObjects}
        openAnnotations={openAnnotations}
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
