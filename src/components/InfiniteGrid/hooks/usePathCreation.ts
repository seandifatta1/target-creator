import { useState, useCallback, useRef } from 'react';
import { OverlayToaster } from '@blueprintjs/core';
import { Position3D } from '../../../utils/gridUtils';
import { createPathData } from '../utils';
import { ICoordinateRegistry } from '../../../services/CoordinateRegistry';
import { IRelationshipManager } from '../../../services/RelationshipManager';

export interface PathCreationMode {
  isActive: boolean;
  type: 'line' | 'curve' | null;
  startPosition: Position3D | null;
  pathType: string;
  pathLabel: string;
  pathName?: string;
}

export interface PathData {
  id: string;
  points: Position3D[];
  pathType: string;
  pathLabel: string;
  name?: string;
  litTiles: Position3D[];
}

export interface UsePathCreationOptions {
  coordinateRegistry?: ICoordinateRegistry;
  relationshipManager?: IRelationshipManager;
  onCoordinatesChange?: (coordinates: Array<{ id: string; position: Position3D; name?: string }>) => void;
  toasterRef?: React.RefObject<OverlayToaster | null>;
}

/**
 * usePathCreation - Hook for managing path creation mode and related operations
 * 
 * **How it's used in the app:**
 * This hook is used by the InfiniteGrid component to manage the entire path creation workflow.
 * When a user right-clicks a grid point and selects "Create Path" from the context menu, this hook
 * enters path creation mode. The user then sees a toast notification and can click another grid point
 * to set the endpoint. This hook validates the endpoint, creates the path data, registers coordinates,
 * creates relationships, and updates the application state. It's the central state management for the
 * path creation feature that allows users to create straight or diagonal paths between two points on
 * the 3D grid.
 * 
 * **Dependency Injection:**
 * The hook accepts optional dependencies through the `options` parameter:
 * - `coordinateRegistry`: Injected to allow testing with mock registries and to enable different
 *   coordinate management strategies. This enables easier unit testing and flexibility.
 * - `relationshipManager`: Injected to allow testing with mock managers and to enable different
 *   relationship tracking strategies. This enables easier unit testing and flexibility.
 * - `onCoordinatesChange`: Injected callback to notify parent components when coordinates change.
 *   This enables separation of concerns - the hook manages path creation, parent manages coordinate updates.
 * - `toasterRef`: Injected to allow testing without actual toast rendering and to enable different
 *   notification strategies. This enables easier unit testing and flexibility.
 * 
 * @param placedPaths - Current array of placed paths in the grid
 * @param setPlacedPaths - State setter function for updating placed paths
 * @param options - Optional configuration object with dependencies
 * @returns Object containing path creation mode state and handler functions
 * 
 * @example
 * ```typescript
 * const {
 *   pathCreationMode,
 *   startPathCreation,
 *   completePathCreation,
 *   cancelPathCreation,
 *   showPathCreationError
 * } = usePathCreation(placedPaths, setPlacedPaths, {
 *   coordinateRegistry,
 *   relationshipManager,
 *   onCoordinatesChange,
 *   toasterRef
 * });
 * 
 * // Start path creation when user selects "Create Path"
 * startPathCreation([0, 0, 0], 'path-line', 'Main Corridor');
 * ```
 */
export function usePathCreation(
  placedPaths: PathData[],
  setPlacedPaths: (paths: PathData[]) => void,
  options: UsePathCreationOptions = {}
): {
  pathCreationMode: PathCreationMode;
  setPathCreationMode: React.Dispatch<React.SetStateAction<PathCreationMode>>;
  startPathCreation: (
    position: Position3D,
    pathType: string,
    pathLabel: string,
    pathName?: string
  ) => void;
  completePathCreation: (
    startPosition: Position3D,
    endPosition: Position3D,
    pathType: string,
    pathLabel: string
  ) => void;
  cancelPathCreation: () => void;
  showPathCreationError: (message: string) => void;
} {
  const { coordinateRegistry, relationshipManager, onCoordinatesChange, toasterRef } = options;

  const [pathCreationMode, setPathCreationMode] = useState<PathCreationMode>({
    isActive: false,
    type: null,
    startPosition: null,
    pathType: '',
    pathLabel: '',
    pathName: undefined,
  });

  const pathCreationToastKeyRef = useRef<string | null>(null);

  const startPathCreation = useCallback(
    (position: Position3D, pathType: string, pathLabel: string, pathName?: string) => {
      setPathCreationMode({
        isActive: true,
        type: pathType === 'path-line' ? 'line' : 'curve',
        startPosition: position,
        pathType: pathType,
        pathLabel: pathLabel,
        pathName: pathName,
      });

      // Show toast notification
      if (toasterRef?.current) {
        const toastKey = toasterRef.current.show({
          message: `Path creation mode: ${pathLabel}. Select an endpoint. Click this toast to exit path creation mode.`,
          intent: 'primary',
          timeout: 0, // Don't auto-dismiss
          onDismiss: () => {
            setPathCreationMode({
              isActive: false,
              type: null,
              startPosition: null,
              pathType: '',
              pathLabel: '',
              pathName: undefined,
            });
            pathCreationToastKeyRef.current = null;
          },
          action: {
            text: 'Cancel',
            onClick: () => {
              setPathCreationMode({
                isActive: false,
                type: null,
                startPosition: null,
                pathType: '',
                pathLabel: '',
              });
              if (toasterRef.current && pathCreationToastKeyRef.current) {
                toasterRef.current.dismiss(pathCreationToastKeyRef.current);
              }
              pathCreationToastKeyRef.current = null;
            },
          },
        });
        pathCreationToastKeyRef.current = toastKey;
      }
    },
    [toasterRef]
  );

  const completePathCreation = useCallback(
    (
      startPosition: Position3D,
      endPosition: Position3D,
      pathType: string,
      pathLabel: string
    ) => {
      // Create path data using extracted pure function
      const newPath: PathData = createPathData(
        startPosition,
        endPosition,
        pathType,
        pathLabel,
        pathCreationMode.pathName
      );
      // Override ID to use timestamp
      newPath.id = `path_${Date.now()}`;

      // Register coordinates and create relationships
      if (coordinateRegistry && relationshipManager) {
        const coords = newPath.litTiles.map((pos) => coordinateRegistry.getOrCreate(pos));
        relationshipManager.attachPathToCoordinates(
          newPath.id,
          coords.map((c) => c.id)
        );
        if (onCoordinatesChange) {
          onCoordinatesChange(coordinateRegistry.getAll());
        }
      }

      setPlacedPaths([...placedPaths, newPath]);

      // Exit path creation mode
      setPathCreationMode({
        isActive: false,
        type: null,
        startPosition: null,
        pathType: '',
        pathLabel: '',
        pathName: undefined,
      });

      // Dismiss toast
      if (toasterRef?.current && pathCreationToastKeyRef.current) {
        toasterRef.current.dismiss(pathCreationToastKeyRef.current);
        pathCreationToastKeyRef.current = null;
      }
    },
    [
      placedPaths,
      setPlacedPaths,
      coordinateRegistry,
      relationshipManager,
      onCoordinatesChange,
      pathCreationMode.pathName,
      toasterRef,
    ]
  );

  const cancelPathCreation = useCallback(() => {
    setPathCreationMode({
      isActive: false,
      type: null,
      startPosition: null,
      pathType: '',
      pathLabel: '',
      pathName: undefined,
    });
    if (toasterRef?.current && pathCreationToastKeyRef.current) {
      toasterRef.current.dismiss(pathCreationToastKeyRef.current);
      pathCreationToastKeyRef.current = null;
    }
  }, [toasterRef]);

  const showPathCreationError = useCallback(
    (message: string) => {
      if (toasterRef?.current) {
        toasterRef.current.show({
          message: message,
          intent: 'danger',
          timeout: 3000,
        });
      }
    },
    [toasterRef]
  );

  return {
    pathCreationMode,
    setPathCreationMode,
    startPathCreation,
    completePathCreation,
    cancelPathCreation,
    showPathCreationError,
  };
}

