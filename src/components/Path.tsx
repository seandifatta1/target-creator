import * as React from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

export interface PathProps {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  pathType: string;
  pathLabel: string;
  color?: string;
  lineWidth?: number;
}

const Path: React.FC<PathProps> = ({
  id,
  start,
  end,
  pathType,
  pathLabel,
  color = "#3498db",
  lineWidth = 3
}) => {
  // Validate that both start and end points are valid 3-element arrays
  if (!start || !end || 
      start.length !== 3 || end.length !== 3 ||
      !start.every(coord => typeof coord === 'number') ||
      !end.every(coord => typeof coord === 'number')) {
    return null;
  }

  return (
    <Line
      key={id}
      points={[
        new THREE.Vector3(start[0], start[1], start[2]),
        new THREE.Vector3(end[0], end[1], end[2])
      ]}
      color={color}
      lineWidth={lineWidth}
    />
  );
};

export default Path;
