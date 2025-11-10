import * as React from 'react';
import { Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Position3D } from '../utils/gridUtils';

export interface PathData {
  id: string;
  pathType: string;
  pathLabel: string;
  name?: string;
  litTiles: Position3D[];
}

export interface PathRendererProps {
  path: PathData;
  isSelected: boolean;
  isRelated: boolean;
  onSelect: () => void;
  onContextMenu: () => void;
}

/**
 * PathRenderer component renders a single path as 3D geometry.
 * 
 * For single-tile paths: renders a sphere
 * For multi-tile paths: renders connected boxes (lines) between tiles
 * 
 * Handles selection and related item highlighting with color changes.
 */
export const PathRenderer: React.FC<PathRendererProps> = ({
  path,
  isSelected,
  isRelated,
  onSelect,
  onContextMenu,
}) => {
  // Validate path has lit tiles
  if (!path || !path.litTiles || !Array.isArray(path.litTiles) || path.litTiles.length === 0) {
    return null;
  }

  // Filter out any invalid tiles
  const validTiles = path.litTiles.filter(
    (tile) =>
      tile &&
      Array.isArray(tile) &&
      tile.length === 3 &&
      Number.isFinite(tile[0]) &&
      Number.isFinite(tile[1]) &&
      Number.isFinite(tile[2])
  );

  if (validTiles.length === 0) {
    return null;
  }

  // If only one tile, render a small sphere at that position
  if (validTiles.length === 1) {
    const tile = validTiles[0];
    // Color priority: selected (green) > related (purple) > normal (white)
    const sphereColor = isSelected ? '#00ff00' : isRelated ? '#9b59b6' : '#ffffff';

    return (
      <Sphere
        key={path.id}
        position={[tile[0], tile[1] + 0.5, tile[2]]}
        args={[isRelated ? 0.45 : 0.4, 16, 16]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          onContextMenu();
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
  // Color priority: selected (green) > related (purple) > normal (white)
  const lineColor = isSelected ? '#00ff00' : isRelated ? '#9b59b6' : '#ffffff';
  const lineWidth = isSelected ? 8 : isRelated ? 7 : 6;

  for (let i = 0; i < validTiles.length - 1; i++) {
    const start = validTiles[i];
    const end = validTiles[i + 1];

    // Validate points before creating line
    if (
      !start ||
      !end ||
      !Array.isArray(start) ||
      !Array.isArray(end) ||
      start.length !== 3 ||
      end.length !== 3 ||
      !Number.isFinite(start[0]) ||
      !Number.isFinite(start[1]) ||
      !Number.isFinite(start[2]) ||
      !Number.isFinite(end[0]) ||
      !Number.isFinite(end[1]) ||
      !Number.isFinite(end[2])
    ) {
      console.warn(`Invalid path segment at index ${i} for path ${path.id}`, { start, end });
      continue;
    }

    // Create line between tiles
    const startVec = new THREE.Vector3(start[0], start[1] + 0.5, start[2]);
    const endVec = new THREE.Vector3(end[0], end[1] + 0.5, end[2]);

    // Ensure vectors are valid (check if components are finite)
    if (
      !Number.isFinite(startVec.x) ||
      !Number.isFinite(startVec.y) ||
      !Number.isFinite(startVec.z) ||
      !Number.isFinite(endVec.x) ||
      !Number.isFinite(endVec.y) ||
      !Number.isFinite(endVec.z)
    ) {
      console.warn(`Invalid vector for path segment at index ${i} for path ${path.id}`);
      continue;
    }

    // Ensure start and end vectors are different (Line component requires distinct points)
    if (startVec.distanceTo(endVec) < 0.001) {
      console.warn(
        `Start and end vectors are too close for path segment at index ${i} for path ${path.id}`
      );
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
          onSelect();
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          onContextMenu();
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
    console.warn(`Path ${path.id} has no valid line segments after validation`, {
      validTiles,
      path,
    });
    return null;
  }

  return (
    <group key={path.id}>
      {lines}
      {clickableBoxes}
    </group>
  );
};

