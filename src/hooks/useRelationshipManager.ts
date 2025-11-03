import { useState, useCallback } from 'react';
import { IRelationshipManager, RelationshipManager, RelatedItem } from '../services/RelationshipManager';
import { Coordinate } from '../services/CoordinateRegistry';

/**
 * Hook for managing relationships.
 * Supports dependency injection for testing.
 */
export function useRelationshipManager(
  manager?: IRelationshipManager
): {
  manager: IRelationshipManager;
  attachTargetToCoordinate: (targetId: string, coordinateId: string) => void;
  attachPathToCoordinates: (pathId: string, coordinateIds: string[]) => void;
  detachTargetFromCoordinate: (targetId: string, coordinateId: string) => void;
  detachPathFromCoordinate: (pathId: string, coordinateId: string) => void;
  removeTargetRelationships: (targetId: string) => void;
  removePathRelationships: (pathId: string) => void;
  getTargetCoordinates: (targetId: string) => string[];
  getPathCoordinates: (pathId: string) => string[];
  getCoordinateTargets: (coordinateId: string) => string[];
  getCoordinatePaths: (coordinateId: string) => string[];
  getRelatedItems: (
    itemType: 'target' | 'path' | 'coordinate',
    itemId: string,
    coordinates: Coordinate[],
    targets: Array<{ id: string; name?: string }>,
    paths: Array<{ id: string; name?: string }>
  ) => RelatedItem[];
  getRelationshipCounts: (
    itemType: 'target' | 'path' | 'coordinate',
    itemId: string
  ) => { targets: number; paths: number; coordinates: number };
} {
  const [instance] = useState<IRelationshipManager>(() =>
    manager || new RelationshipManager()
  );

  const attachTargetToCoordinate = useCallback(
    (targetId: string, coordinateId: string) => instance.attachTargetToCoordinate(targetId, coordinateId),
    [instance]
  );

  const attachPathToCoordinates = useCallback(
    (pathId: string, coordinateIds: string[]) => instance.attachPathToCoordinates(pathId, coordinateIds),
    [instance]
  );

  const detachTargetFromCoordinate = useCallback(
    (targetId: string, coordinateId: string) => instance.detachTargetFromCoordinate(targetId, coordinateId),
    [instance]
  );

  const detachPathFromCoordinate = useCallback(
    (pathId: string, coordinateId: string) => instance.detachPathFromCoordinate(pathId, coordinateId),
    [instance]
  );

  const removeTargetRelationships = useCallback(
    (targetId: string) => instance.removeTargetRelationships(targetId),
    [instance]
  );

  const removePathRelationships = useCallback(
    (pathId: string) => instance.removePathRelationships(pathId),
    [instance]
  );

  const getTargetCoordinates = useCallback(
    (targetId: string) => instance.getTargetCoordinates(targetId),
    [instance]
  );

  const getPathCoordinates = useCallback(
    (pathId: string) => instance.getPathCoordinates(pathId),
    [instance]
  );

  const getCoordinateTargets = useCallback(
    (coordinateId: string) => instance.getCoordinateTargets(coordinateId),
    [instance]
  );

  const getCoordinatePaths = useCallback(
    (coordinateId: string) => instance.getCoordinatePaths(coordinateId),
    [instance]
  );

  const getRelatedItems = useCallback(
    (
      itemType: 'target' | 'path' | 'coordinate',
      itemId: string,
      coordinates: Coordinate[],
      targets: Array<{ id: string; name?: string }>,
      paths: Array<{ id: string; name?: string }>
    ) => instance.getRelatedItems(itemType, itemId, coordinates, targets, paths),
    [instance]
  );

  const getRelationshipCounts = useCallback(
    (
      itemType: 'target' | 'path' | 'coordinate',
      itemId: string
    ) => instance.getRelationshipCounts(itemType, itemId),
    [instance]
  );

  return {
    manager: instance,
    attachTargetToCoordinate,
    attachPathToCoordinates,
    detachTargetFromCoordinate,
    detachPathFromCoordinate,
    removeTargetRelationships,
    removePathRelationships,
    getTargetCoordinates,
    getPathCoordinates,
    getCoordinateTargets,
    getCoordinatePaths,
    getRelatedItems,
    getRelationshipCounts,
  };
}

