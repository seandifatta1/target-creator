import * as React from 'react';
import { Text } from '@react-three/drei';
import { Html } from '@react-three/drei';
import { Button, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CoordinateSettings } from './SettingsModal';

export interface TargetProps {
  id: string;
  position: [number, number, number];
  targetId: string;
  targetLabel: string;
  iconEmoji?: string;
  coordinateSettings: CoordinateSettings;
  isAnnotationOpen: boolean;
  isRelated?: boolean;
  onToggleAnnotation: (id: string) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick?: () => void;
  onContextMenu?: (e: any) => void;
}

// Annotation component for targets
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
            <Button 
              className="annotation-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close annotation"
              icon={<Icon icon={IconNames.CROSS} />}
              minimal
              small
            />
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

const Target: React.FC<TargetProps> = ({
  id,
  position,
  targetId,
  targetLabel,
  iconEmoji = '🎯',
  coordinateSettings,
  isAnnotationOpen,
  isRelated = false,
  onToggleAnnotation,
  onPointerOver,
  onPointerOut,
  onClick,
  onContextMenu
}) => {
  // Position icon slightly above the grid point (0.5 units up)
  const iconPosition: [number, number, number] = [position[0], position[1] + 0.5, position[2]];
  
  // Use purple color for related items, white for normal
  const textColor = isRelated ? "#9b59b6" : "#ffffff";
  const outlineColor = isRelated ? "#9b59b6" : "#000000";
  const outlineWidth = isRelated ? 0.05 : 0.02;

  return (
    <group>
      {/* Icon text that always faces the camera */}
      <Text
        position={iconPosition}
        fontSize={isRelated ? 0.9 : 0.8}
        color={textColor}
        outlineColor={outlineColor}
        outlineWidth={outlineWidth}
        anchorX="center"
        anchorY="middle"
        onPointerOver={() => {
          // Only set hovered if annotation is closed
          if (!isAnnotationOpen) {
            onPointerOver();
          }
        }}
        onPointerOut={onPointerOut}
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
      >
        {iconEmoji}
      </Text>
      
      {/* Persistent annotation */}
      <TargetAnnotation
        position={position}
        label={targetLabel}
        coordinateSettings={coordinateSettings}
        isOpen={isAnnotationOpen}
        onClose={() => onToggleAnnotation(id)}
        onPointerOver={() => {
          // Suppress hover tooltip when annotation is hovered
          if (isAnnotationOpen) {
            onPointerOver();
          }
        }}
        onPointerOut={() => {}}
      />
    </group>
  );
};

export default Target;
