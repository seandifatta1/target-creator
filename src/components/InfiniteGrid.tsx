import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import SettingsModal, { CoordinateSettings, CoordinateSystem } from './SettingsModal';
import CoordinateAxes from './CoordinateAxes';
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
const InfiniteGrid: React.FC<{ coordinateSettings: CoordinateSettings }> = ({ coordinateSettings }) => {
  const [gridSize] = useState(20); // Grid extends from -10 to +10 in each direction
  const [placedObjects, setPlacedObjects] = useState<Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string }>>([]);
  const [selectedGridPoint, setSelectedGridPoint] = useState<[number, number, number] | null>(null);
  const { isDragging, dragData, snapPoint, updateSnapPoint, endDrag } = useDragTargetContext();

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
          const newObject = {
            id: `obj_${Date.now()}`,
            position: result.snapPoint,
            targetId: result.dragData.id,
            targetLabel: result.dragData.label
          };
          setPlacedObjects(prev => [...prev, newObject]);
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
      {placedObjects.map((obj) => (
        <Sphere
          key={obj.id}
          position={obj.position}
          args={[0.3, 16, 16]}
        >
          <meshStandardMaterial color="#ff6b6b" />
        </Sphere>
      ))}

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
}> = ({ snapPoint, coordinateSettings }) => {
  const { isDragging, dragData } = useDragTargetContext();
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDragging]);

  if (!isDragging || !snapPoint) return null;

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
        <div className="tooltip-header">{dragData?.label || 'Target'}</div>
        <div className="tooltip-coords">
          X: {formatCoordinate(snapPoint[0])}, 
          Y: {formatCoordinate(snapPoint[1])}, 
          Z: {formatCoordinate(snapPoint[2])}
        </div>
        <div className="tooltip-grid">
          Grid: [{snapPoint[0]}, {snapPoint[1]}, {snapPoint[2]}]
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
  const { snapPoint } = useDragTargetContext();

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
        <InfiniteGrid coordinateSettings={coordinateSettings} />
        <OrbitControlsWrapper />
      </Canvas>

      {/* Drag Tooltip */}
      <DragTooltip snapPoint={snapPoint} coordinateSettings={coordinateSettings} />

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
