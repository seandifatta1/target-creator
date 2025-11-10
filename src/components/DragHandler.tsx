import * as React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDragTargetContext } from '../hooks/DragTargetContext';

export type Position3D = [number, number, number];

export interface DragHandlerProps {
  gridSize: number;
  onSnapPointUpdate: (point: Position3D | null) => void;
  alwaysTrack?: boolean;
}

/**
 * DragHandler component tracks mouse position and calculates snap points
 * on the grid plane (y=0) during drag operations.
 * 
 * It uses raycasting to find the intersection point with the grid plane
 * and snaps to the nearest grid point within the active zone.
 */
export const DragHandler: React.FC<DragHandlerProps> = ({
  gridSize,
  onSnapPointUpdate,
  alwaysTrack = false,
}) => {
  const { camera, raycaster, pointer } = useThree();
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
    if (
      snapX >= -gridHalf &&
      snapX <= gridHalf &&
      snapZ >= -gridHalf &&
      snapZ <= gridHalf
    ) {
      onSnapPointUpdate([snapX, snapY, snapZ]);
    } else {
      onSnapPointUpdate(null);
    }
  });

  return null;
};

