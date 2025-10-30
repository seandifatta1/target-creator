import * as React from 'react';
import { useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface CoordinateAxesProps {
  coordinateSystem: 'NED' | 'Cartesian' | 'Spherical';
  minUnit: number;
  gridSize: number;
}

const CoordinateAxes: React.FC<CoordinateAxesProps> = ({ 
  coordinateSystem, 
  minUnit, 
  gridSize 
}) => {
  const axesRef = useRef<THREE.Group>(null);

  const getAxisLabels = () => {
    switch (coordinateSystem) {
      case 'NED':
        return { x: 'North', y: 'East', z: 'Down' };
      case 'Cartesian':
        return { x: 'X', y: 'Y', z: 'Z' };
      case 'Spherical':
        return { x: 'R', y: 'θ', z: 'φ' };
      default:
        return { x: 'X', y: 'Y', z: 'Z' };
    }
  };

  const getAxisColors = () => {
    switch (coordinateSystem) {
      case 'NED':
        return { x: '#2ecc71', y: '#e74c3c', z: '#3498db' }; // Green, Red, Blue
      case 'Cartesian':
        return { x: '#e74c3c', y: '#2ecc71', z: '#3498db' }; // Red, Green, Blue
      case 'Spherical':
        return { x: '#f39c12', y: '#9b59b6', z: '#1abc9c' }; // Orange, Purple, Teal
      default:
        return { x: '#e74c3c', y: '#2ecc71', z: '#3498db' };
    }
  };

  const labels = getAxisLabels();
  const colors = getAxisColors();
  // Work in scene units: 1 scene unit = 1 grid cell. Value labels scale by minUnit
  const axisLength = gridSize;
  const gridBoundary = gridSize / 2;

  // Generate tick marks and labels at every cell boundary across the active zone
  const generateAllTicks = (axis: 'x' | 'y' | 'z') => {
    const ticks = [];
    for (let i = -gridBoundary; i <= gridBoundary; i += 1) {
      // Avoid printing a label directly at origin to reduce clutter
      const isOrigin = Math.abs(i) < 1e-6;

      if (axis === 'x') {
        // Place X ticks at both Z boundaries
        const tickNear: [number, number, number] = [i, 0, gridBoundary];
        const tickFar: [number, number, number] = [i, 0, -gridBoundary];
        const labelNear: [number, number, number] = [i, -0.8, gridBoundary + 0.3];
        const labelFar: [number, number, number] = [i, -0.8, -gridBoundary - 0.3];

        ticks.push(
          <group key={`tick-x-near-${i}`}>
            <mesh position={tickNear}>
              <boxGeometry args={[0.08, 0.25, 0.08]} />
              <meshBasicMaterial color={colors.x} />
            </mesh>
            {!isOrigin && (
              <Text position={labelNear} fontSize={0.28} color={colors.x} anchorX="center" anchorY="middle">
                {(i * minUnit).toFixed(1)}
              </Text>
            )}
          </group>
        );

        ticks.push(
          <group key={`tick-x-far-${i}`}>
            <mesh position={tickFar}>
              <boxGeometry args={[0.08, 0.25, 0.08]} />
              <meshBasicMaterial color={colors.x} />
            </mesh>
            {!isOrigin && (
              <Text position={labelFar} fontSize={0.28} color={colors.x} anchorX="center" anchorY="middle">
                {(i * minUnit).toFixed(1)}
              </Text>
            )}
          </group>
        );
      } else if (axis === 'z') {
        // Place Z ticks at both X boundaries
        const tickNear: [number, number, number] = [gridBoundary, 0, i];
        const tickFar: [number, number, number] = [-gridBoundary, 0, i];
        const labelNear: [number, number, number] = [gridBoundary + 0.3, -0.8, i];
        const labelFar: [number, number, number] = [-gridBoundary - 0.3, -0.8, i];

        ticks.push(
          <group key={`tick-z-near-${i}`}>
            <mesh position={tickNear}>
              <boxGeometry args={[0.08, 0.25, 0.08]} />
              <meshBasicMaterial color={colors.z} />
            </mesh>
            {!isOrigin && (
              <Text position={labelNear} fontSize={0.28} color={colors.z} anchorX="center" anchorY="middle">
                {(i * minUnit).toFixed(1)}
              </Text>
            )}
          </group>
        );

        ticks.push(
          <group key={`tick-z-far-${i}`}>
            <mesh position={tickFar}>
              <boxGeometry args={[0.08, 0.25, 0.08]} />
              <meshBasicMaterial color={colors.z} />
            </mesh>
            {!isOrigin && (
              <Text position={labelFar} fontSize={0.28} color={colors.z} anchorX="center" anchorY="middle">
                {(i * minUnit).toFixed(1)}
              </Text>
            )}
          </group>
        );
      } else {
        // Y axis remains centered through origin
        const tickPosition: [number, number, number] = [0, i, 0];
        const labelPosition: [number, number, number] = [-0.8, i, 0];
        ticks.push(
          <group key={`tick-y-${i}`}>
            <mesh position={tickPosition}>
              <boxGeometry args={[0.25, 0.08, 0.08]} />
              <meshBasicMaterial color={colors.y} />
            </mesh>
            {!isOrigin && (
              <Text position={labelPosition} fontSize={0.28} color={colors.y} anchorX="center" anchorY="middle">
                {(i * minUnit).toFixed(1)}
              </Text>
            )}
          </group>
        );
      }
    }
    return ticks;
  };

  return (
    <group ref={axesRef}>
      {/* X Axis */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, axisLength, 8]} />
        <meshBasicMaterial color={colors.x} />
      </mesh>
      
      {/* Y Axis */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, axisLength, 8]} />
        <meshBasicMaterial color={colors.y} />
      </mesh>
      
      {/* Z Axis */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, axisLength, 8]} />
        <meshBasicMaterial color={colors.z} />
      </mesh>

      {/* Axis Labels */}
      <Text
        position={[gridBoundary + 0.5, 0, 0]}
        fontSize={0.5}
        color={colors.x}
        anchorX="center"
        anchorY="middle"
      >
        {labels.x}
      </Text>
      
      <Text
        position={[0, gridBoundary + 0.5, 0]}
        fontSize={0.5}
        color={colors.y}
        anchorX="center"
        anchorY="middle"
      >
        {labels.y}
      </Text>
      
      <Text
        position={[0, 0, gridBoundary + 0.5]}
        fontSize={0.5}
        color={colors.z}
        anchorX="center"
        anchorY="middle"
      >
        {labels.z}
      </Text>

      {/* Ticks and labels at every cube boundary across the active zone */}
      {generateAllTicks('x')}
      {generateAllTicks('y')}
      {generateAllTicks('z')}

      {/* Origin marker */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        O
      </Text>
    </group>
  );
};

export default CoordinateAxes;
