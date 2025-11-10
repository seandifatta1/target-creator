import * as React from 'react';
import { Line, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export interface PathProps {
  id: string;
  points?: [number, number, number][]; // Array of points - can be single or multiple
  start?: [number, number, number]; // Start point (convenience prop)
  end?: [number, number, number]; // End point (convenience prop)
  pathType: string;
  pathLabel: string;
  color?: string;
  lineWidth?: number;
  onClick?: () => void;
}

const Path: React.FC<PathProps> = ({
  id,
  points: pointsProp,
  start,
  end,
  pathType,
  pathLabel,
  color = "#3498db",
  lineWidth = 3,
  onClick
}) => {
  // Convert start/end to points if provided
  // points prop takes precedence over start/end
  let points: [number, number, number][] = pointsProp || [];
  
  if (points.length === 0) {
    if (start && end) {
      // If start and end are provided, use them as points
      points = [start, end];
    } else if (start && !end) {
      // If only start is provided, use it as a single point
      points = [start];
    }
  }
  
  // Validate points array
  if (!points || points.length === 0 || 
      !points.every(point => 
        point && point.length === 3 && 
        point.every(coord => typeof coord === 'number')
      )) {
    return null;
  }

  // Single point: render as a sphere
  if (points.length === 1) {
    const point = points[0];
    return (
      <group>
        <Sphere
          position={[point[0], point[1], point[2]]}
          args={[0.3, 16, 16]}
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
          <meshStandardMaterial color={color} />
        </Sphere>
      </group>
    );
  }

  // Multiple points: render lines connecting them and clickable boxes
  // Ensure we have at least 2 points for Line component
  if (points.length < 2) {
    return null;
  }

  const clickableBoxes: React.ReactNode[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const midpoint = new THREE.Vector3(
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2
    );
    const length = new THREE.Vector3(
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2]
    ).length();

    clickableBoxes.push(
      <Box
        key={`box-${i}`}
        position={[midpoint.x, midpoint.y, midpoint.z]}
        args={[Math.max(length, 0.5), 0.5, 0.5]}
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
    );
  }

  // Convert points to Vector3 for rendering (only if we have 2+ points)
  // Double-check that we have valid points before rendering
  const vectorPoints = points
    .filter(p => p && Array.isArray(p) && p.length === 3 && p.every(coord => typeof coord === 'number' && !isNaN(coord)))
    .map(p => new THREE.Vector3(p[0], p[1], p[2]));

  // Final safety check - ensure we have at least 2 valid points
  if (vectorPoints.length < 2) {
    console.warn(`Path ${id} has insufficient valid points: ${vectorPoints.length}`, points);
    return null;
  }

  return (
    <group>
      <Line
        key={id}
        points={vectorPoints}
        color={color}
        lineWidth={lineWidth}
      />
      {clickableBoxes}
    </group>
  );
};

export default Path;
