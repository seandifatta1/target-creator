import { useCallback } from 'react';
import { Position3D, getValidLineEndpoints, calculateLinePoints } from '../../../utils/gridUtils';
import { ICoordinateRegistry } from '../../../services/CoordinateRegistry';
import { IRelationshipManager } from '../../../services/RelationshipManager';

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
 * useGridInteraction - Hook for managing grid point click interactions
 * 
 * **How it's used in the app:**
 * This hook is used by the InfiniteGridScene component to handle all grid point click interactions.
 * When a user clicks on a blue grid point in the 3D scene, this hook determines what action to take:
 * - If in path creation mode: validates and completes path creation
 * - If clicking on a path-lit tile: selects that path and opens the drawer
 * - Otherwise: registers the coordinate, places a new target object, and creates relationships
 * It's the central interaction handler for the 3D grid that transforms user clicks into application
 * state changes, enabling users to place targets, create paths, and interact with the grid.
 * 
 * **Dependency Injection:**
 * The hook accepts dependencies through the `options` parameter:
 * - `coordinateRegistry`: Injected to allow testing with mock registries and to enable different
 *   coordinate management strategies. This enables easier unit testing and flexibility to swap
 *   implementations (e.g., in-memory vs persistent storage).
 * - `relationshipManager`: Injected to allow testing with mock managers and to enable different
 *   relationship tracking strategies. This enables easier unit testing and flexibility to swap
 *   implementations.
 * - `onPlacedObjectsChange`: Injected callback to notify parent components when objects are placed.
 *   This enables separation of concerns - the hook handles interaction logic, parent manages state.
 * - `onSelectItem`: Injected callback to notify parent components when items are selected.
 *   This enables separation of concerns - the hook handles selection logic, parent manages UI state.
 * - `onPathCreationComplete`: Injected callback for path creation completion. This enables the hook
 *   to work with different path creation strategies without being tightly coupled.
 * - `onPathCreationError`: Injected callback for path creation errors. This enables the hook to
 *   communicate errors without being tightly coupled to error handling UI.
 * 
 * @param options - Configuration object containing all dependencies and callbacks
 * @returns Object containing the grid point click handler function
 * 
 * @example
 * ```typescript
 * const { handleGridPointClick } = useGridInteraction({
 *   gridSize: 20,
 *   placedPaths,
 *   placedObjects,
 *   pathCreationMode,
 *   coordinateRegistry,
 *   relationshipManager,
 *   onPlacedObjectsChange,
 *   onSelectItem,
 *   onCoordinatesChange,
 *   onPathCreationComplete,
 *   onPathCreationError
 * });
 * 
 * // Use in GridPoint component
 * <GridPoint onClick={() => handleGridPointClick(position)} />
 * ```
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

        // Round positions to integers for comparison (grid points are integers)
        const roundedStartPos: Position3D = [
          Math.round(startPos[0]),
          Math.round(startPos[1]),
          Math.round(startPos[2])
        ];
        const roundedPosition: Position3D = [
          Math.round(position[0]),
          Math.round(position[1]),
          Math.round(position[2])
        ];

        // Don't allow selecting the start position as endpoint
        if (
          roundedPosition[0] === roundedStartPos[0] &&
          roundedPosition[1] === roundedStartPos[1] &&
          roundedPosition[2] === roundedStartPos[2]
        ) {
          if (onPathCreationError) {
            onPathCreationError('Cannot select the start point as the endpoint');
          }
          return;
        }

        if (pathCreationMode.type === 'line') {
          // Validate using the EXACT same logic that creates the path
          // If calculateLinePoints can generate the path, it's valid
          const calculatedPoints = calculateLinePoints(roundedStartPos, roundedPosition);
          
          // Check if the endpoint is in the calculated path (it should always be the last point)
          const endpointInPath = calculatedPoints.length > 0 && 
            calculatedPoints[calculatedPoints.length - 1][0] === roundedPosition[0] &&
            calculatedPoints[calculatedPoints.length - 1][1] === roundedPosition[1] &&
            calculatedPoints[calculatedPoints.length - 1][2] === roundedPosition[2];

          if (endpointInPath && onPathCreationComplete) {
            // Complete the path creation (use rounded positions)
            onPathCreationComplete(
              roundedStartPos,
              roundedPosition,
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
      // Round position for comparison (grid points are integers)
      const roundedPosition: Position3D = [
        Math.round(position[0]),
        Math.round(position[1]),
        Math.round(position[2])
      ];
      const pathWithThisTile = placedPaths.find(
        (path) =>
          path.litTiles &&
          path.litTiles.some(
            (tile) =>
              tile[0] === roundedPosition[0] && tile[1] === roundedPosition[1] && tile[2] === roundedPosition[2]
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

