import * as React from 'react';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

export type Position3D = [number, number, number];

export interface GridPointProps {
  position: Position3D;
  onClick: () => void;
  onContextMenu?: (e: any) => void;
  isPermanentlyLit?: boolean;
  isHovered?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  isStartPosition?: boolean;
  isValidEndpoint?: boolean;
}

/**
 * GridPoint component renders a single grid point in the 3D scene.
 * Handles visual states: default (blue), hovered (red), start position (red),
 * valid endpoint (white/glowing), and permanently lit (red).
 */
export const GridPoint: React.FC<GridPointProps> = ({
  position,
  onClick,
  onContextMenu,
  isPermanentlyLit = false,
  isHovered = false,
  onPointerOver,
  onPointerOut,
  isStartPosition = false,
  isValidEndpoint = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      let scale = 1;
      if (isHovered) scale = 1.2;
      else if (isStartPosition || isValidEndpoint) scale = 1.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  // Determine color: start position (red), valid endpoint (white/glowing), permanently lit (red), hovered (red), or default (blue)
  let color = '#4c9eff';
  let opacity = 0.7;

  if (isStartPosition) {
    color = '#ff6b6b';
    opacity = 1.0;
  } else if (isValidEndpoint) {
    color = '#ffffff';
    opacity = 0.9;
  } else if (isPermanentlyLit) {
    color = '#ff6b6b';
    opacity = 1.0;
  } else if (isHovered) {
    color = '#ff6b6b';
    opacity = 0.7;
  }

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[0.8, 0.8, 0.8]}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) {
          onClick();
        }
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        if (onContextMenu) {
          onContextMenu(e);
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (onPointerOver) {
          onPointerOver();
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (onPointerOut) {
          onPointerOut();
        }
      }}
    >
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        emissive={isValidEndpoint ? '#ffffff' : '#000000'}
        emissiveIntensity={isValidEndpoint ? 0.5 : 0}
      />
    </Box>
  );
};

