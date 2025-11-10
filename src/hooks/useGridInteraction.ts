import { useCallback } from 'react';
import { Position3D, getValidLineEndpoints } from '../utils/gridUtils';
import { ICoordinateRegistry } from '../services/CoordinateRegistry';
import { IRelationshipManager } from '../services/RelationshipManager';

export interface PlacedObject {
  id: string;
  position: Position3D;
  targetId: string;
  targetLabel: string;
  name?: string;
  iconEmoji?: string;
}

export interface PlacedPath {
  id: string;
  points: Position3D[];
  pathType: string;
  pathLabel: string;
  name?: string;
  litTiles: Position3D[];
}

export interface PathCreationMode {
  isActive: boolean;
  type: 'line' | 'curve' | null;
  startPosition: Position3D | null;
  pathType: string;
  pathLabel: string;
}

export interface UseGridInteractionOptions {
  gridSize: number;
  placedPaths: PlacedPath[];
  placedObjects: PlacedObject[];
  pathCreationMode?: PathCreationMode;
  coordinateRegistry?: ICoordinateRegistry;
  relationshipManager?: IRelationshipManager;
  onPlacedObjectsChange: (objects: PlacedObject[]) => void;
  onSelectItem: (item: {
    type: 'target' | 'path' | 'coordinate';
    id: string;
    targetId?: string;
    label?: string;
    name?: string;
    position?: Position3D;
    iconEmoji?: string;
    pathType?: string;
    points?: Position3D[];
  } | null) => void;
  onCoordinatesChange?: (coordinates: Array<{ id: string; position: Position3D; name?: string }>) => void;
  onPathCreationComplete?: (
    startPosition: Position3D,
    endPosition: Position3D,
    pathType: string,
    pathLabel: string
  ) => void;
  onPathCreationError?: (message: string) => void;
}

/**
 * Hook for managing grid point interactions.
 * Handles clicks, coordinate registration, path selection, and object placement.
 */
export function useGridInteraction(
  options: UseGridInteractionOptions
): {
  handleGridPointClick: (position: Position3D) => void;
} {
  const {
    gridSize,
    placedPaths,
    placedObjects,
    pathCreationMode,
    coordinateRegistry,
    relationshipManager,
    onPlacedObjectsChange,
    onSelectItem,
    onCoordinatesChange,
    onPathCreationComplete,
    onPathCreationError,
  } = options;

  const handleGridPointClick = useCallback(
    (position: Position3D) => {
      // Handle path creation mode
      if (pathCreationMode?.isActive && pathCreationMode.startPosition) {
        const startPos = pathCreationMode.startPosition;

        // Don't allow selecting the start position as endpoint
        if (
          position[0] === startPos[0] &&
          position[1] === startPos[1] &&
          position[2] === startPos[2]
        ) {
          if (onPathCreationError) {
            onPathCreationError('Cannot select the start point as the endpoint');
          }
          return;
        }

        if (pathCreationMode.type === 'line') {
          // Check if the clicked point is a valid endpoint
          const validEndpoints = getValidLineEndpoints(startPos, gridSize);
          const isValidEndpoint = validEndpoints.some(
            (ep) =>
              ep[0] === position[0] && ep[1] === position[1] && ep[2] === position[2]
          );

          if (isValidEndpoint && onPathCreationComplete) {
            // Complete the path creation
            onPathCreationComplete(
              startPos,
              position,
              pathCreationMode.pathType,
              pathCreationMode.pathLabel
            );
          } else if (onPathCreationError) {
            // Show error toast
            onPathCreationError(
              'Please select a valid endpoint. Valid endpoints are points directly through the start point (straight or diagonal).'
            );
          }
        }
        return;
      }

      // Check if this grid point is lit by a path - if so, select that path
      const pathWithThisTile = placedPaths.find(
        (path) =>
          path.litTiles &&
          path.litTiles.some(
            (tile) =>
              tile[0] === position[0] && tile[1] === position[1] && tile[2] === position[2]
          )
      );

      if (pathWithThisTile) {
        // This tile is lit by a path - select the path and open drawer
        // Pass litTiles as points for display purposes (since drawer expects points)
        onSelectItem({
          type: 'path',
          id: pathWithThisTile.id,
          pathType: pathWithThisTile.pathType,
          label: pathWithThisTile.pathLabel,
          name: pathWithThisTile.name,
          points: pathWithThisTile.litTiles || [], // Pass litTiles as points for drawer display
        });
        return;
      }

      // If not a lit tile, treat as coordinate click
      // Register coordinate if registry is available
      let coordinateId = `coord_${position[0]}_${position[1]}_${position[2]}`;
      let coordinateName: string | undefined = undefined;

      if (coordinateRegistry) {
        const coord = coordinateRegistry.getOrCreate(position);
        coordinateId = coord.id;
        coordinateName = coord.name;
        if (onCoordinatesChange) {
          onCoordinatesChange(coordinateRegistry.getAll());
        }
      }

      onSelectItem({
        type: 'coordinate',
        id: coordinateId,
        position: position,
        name: coordinateName,
      });

      // Add a new object at this grid point
      const newObject: PlacedObject = {
        id: `obj_${Date.now()}`,
        position: position,
        targetId: `target_${Date.now()}`,
        targetLabel: 'Target',
      };

      // Register coordinate and create relationship
      if (coordinateRegistry && relationshipManager) {
        const coord = coordinateRegistry.getOrCreate(position);
        relationshipManager.attachTargetToCoordinate(newObject.id, coord.id);
        if (onCoordinatesChange) {
          onCoordinatesChange(coordinateRegistry.getAll());
        }
      }

      onPlacedObjectsChange([...placedObjects, newObject]);
    },
    [
      gridSize,
      placedPaths,
      placedObjects,
      pathCreationMode,
      coordinateRegistry,
      relationshipManager,
      onPlacedObjectsChange,
      onSelectItem,
      onCoordinatesChange,
      onPathCreationComplete,
      onPathCreationError,
    ]
  );

  return {
    handleGridPointClick,
  };
}

