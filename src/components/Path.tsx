import * as React from 'react';
import { Line, Box } from '@react-three/drei';
import * as THREE from 'three';

export interface PathProps {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  pathType: string;
  pathLabel: string;
  color?: string;
  lineWidth?: number;
  onClick?: () => void;
}

const Path: React.FC<PathProps> = ({
  id,
  start,
  end,
  pathType,
  pathLabel,
  color = "#3498db",
  lineWidth = 3,
  onClick
}) => {
  // Validate that both start and end points are valid 3-element arrays
  if (!start || !end || 
      start.length !== 3 || end.length !== 3 ||
      !start.every(coord => typeof coord === 'number') ||
      !end.every(coord => typeof coord === 'number')) {
    return null;
  }

  // Calculate midpoint for clickable area
  const midpoint = new THREE.Vector3(
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  );
  
  // Calculate length for box
  const length = new THREE.Vector3(
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2]
  ).length();

  return (
    <group>
      <Line
        key={id}
        points={[
          new THREE.Vector3(start[0], start[1], start[2]),
          new THREE.Vector3(end[0], end[1], end[2])
        ]}
        color={color}
        lineWidth={lineWidth}
      />
      {/* Invisible clickable box for path selection - larger area for easier clicking */}
      <Box
        position={[midpoint.x, midpoint.y, midpoint.z]}
        args={[Math.max(length, 1), 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) {
            onClick();
          }
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
    </group>
  );
};

export default Path;
