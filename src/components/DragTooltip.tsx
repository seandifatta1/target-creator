import * as React from 'react';
import { useState, useEffect } from 'react';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import { useMousePosition } from '../hooks/useMousePosition';
import { CoordinateSettings } from './SettingsModal';
import { Position3D } from '../utils/gridUtils';

export interface PlacedObject {
  id: string;
  position: Position3D;
  targetId: string;
  targetLabel: string;
  name?: string;
  iconEmoji?: string;
}

export interface DragTooltipProps {
  snapPoint: Position3D | null;
  coordinateSettings: CoordinateSettings;
  hoveredObject: string | null;
  placedObjects: PlacedObject[];
  openAnnotations: Set<string>;
  waitingForPathEndpoint: { id: string; pathType: string; pathLabel: string } | null;
}

/**
 * DragTooltip component displays a tooltip showing position information
 * when dragging items, hovering over objects, or waiting for path endpoints.
 */
export const DragTooltip: React.FC<DragTooltipProps> = ({
  snapPoint,
  coordinateSettings,
  hoveredObject,
  placedObjects,
  openAnnotations,
  waitingForPathEndpoint,
}) => {
  const { isDragging, dragData } = useDragTargetContext();
  const { position: mousePosition } = useMousePosition();

  // Show tooltip for dragged item, path endpoint, or hovered placed object
  const tooltipData =
    waitingForPathEndpoint && snapPoint
      ? { label: waitingForPathEndpoint.pathLabel, position: snapPoint }
      : isDragging && snapPoint
      ? { label: dragData?.label || 'Target', position: snapPoint }
      : hoveredObject && !openAnnotations.has(hoveredObject)
      ? (() => {
          const obj = placedObjects.find((o) => o.id === hoveredObject);
          return obj ? { label: obj.targetLabel, position: obj.position } : null;
        })()
      : null;

  if (!tooltipData) return null;

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
        <div className="tooltip-header">{tooltipData.label}</div>
        <div className="tooltip-coords">
          X: {formatCoordinate(tooltipData.position[0])}, Y:{' '}
          {formatCoordinate(tooltipData.position[1])}, Z:{' '}
          {formatCoordinate(tooltipData.position[2])}
        </div>
        <div className="tooltip-grid">
          Grid: [{tooltipData.position[0]}, {tooltipData.position[1]},{' '}
          {tooltipData.position[2]}]
        </div>
      </div>
    </div>
  );
};

