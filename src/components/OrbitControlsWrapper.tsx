import * as React from 'react';
import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useDragTargetContext } from '../hooks/DragTargetContext';

export interface OrbitControlsWrapperProps {
  waitingForPathEndpoint: boolean;
  onControlsReady?: (controls: any) => void;
}

/**
 * OrbitControlsWrapper manages camera controls and disables them
 * during drag operations or path endpoint placement.
 * 
 * Sets initial camera rotation angles for optimal viewing angle.
 */
export const OrbitControlsWrapper: React.FC<OrbitControlsWrapperProps> = ({
  waitingForPathEndpoint,
  onControlsReady,
}) => {
  const { isDragging } = useDragTargetContext();
  const shouldDisable = isDragging || waitingForPathEndpoint;
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (controlsRef.current) {
      if (onControlsReady) {
        onControlsReady(controlsRef.current);
      }
      // Set initial rotation angles: horizontal and vertical adjusted by 5%
      const horizontalAngle = (-15.75 * Math.PI) / 180; // -15.75 degrees (increased by 5% from -15)
      const verticalAngle = (19 * Math.PI) / 180; // 19 degrees (decreased by 5% from 20)

      // Set spherical coordinates
      // theta is horizontal angle (azimuth), phi is vertical angle (polar)
      // For OrbitControls, polar angle is measured from the positive Y axis
      controlsRef.current.setAzimuthalAngle(horizontalAngle);
      controlsRef.current.setPolarAngle(Math.PI / 2 - verticalAngle);
      controlsRef.current.update();
    }
  }, [onControlsReady]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={!shouldDisable}
      enableZoom={!shouldDisable}
      enableRotate={!shouldDisable}
      minDistance={1}
      maxDistance={100}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
};

