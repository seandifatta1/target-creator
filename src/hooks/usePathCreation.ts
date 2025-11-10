import { useState, useCallback, useRef } from 'react';
import { OverlayToaster } from '@blueprintjs/core';
import { calculateLinePoints, Position3D } from '../utils/gridUtils';
import { ICoordinateRegistry } from '../services/CoordinateRegistry';
import { IRelationshipManager } from '../services/RelationshipManager';

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
 * Hook for managing path creation mode and related operations.
 * Handles path creation state, validation, completion, and error handling.
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
      // Calculate all points on the line between start and end
      const allPositions = calculateLinePoints(startPosition, endPosition);
      const newPath: PathData = {
        id: `path_${Date.now()}`,
        points: [],
        pathType: pathType,
        pathLabel: pathLabel,
        name: pathCreationMode.pathName,
        litTiles: allPositions,
      };

      // Register coordinates and create relationships
      if (coordinateRegistry && relationshipManager) {
        const coords = allPositions.map((pos) => coordinateRegistry.getOrCreate(pos));
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

