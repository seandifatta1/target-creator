import { useState, useCallback } from 'react';
import { ICoordinateRegistry, CoordinateRegistry, Coordinate } from '../services/CoordinateRegistry';

/**
 * Hook for managing coordinate registry.
 * Supports dependency injection for testing.
 */
export function useCoordinateRegistry(
  registry?: ICoordinateRegistry
): {
  registry: ICoordinateRegistry;
  getOrCreate: (position: [number, number, number]) => Coordinate;
  getById: (id: string) => Coordinate | undefined;
  getByPosition: (position: [number, number, number]) => Coordinate | undefined;
  getAll: () => Coordinate[];
  updateName: (id: string, name: string) => void;
  remove: (id: string) => boolean;
  getByPositions: (positions: [number, number, number][]) => Coordinate[];
} {
  const [instance] = useState<ICoordinateRegistry>(() => 
    registry || new CoordinateRegistry()
  );

  const getOrCreate = useCallback(
    (position: [number, number, number]) => instance.getOrCreate(position),
    [instance]
  );

  const getById = useCallback(
    (id: string) => instance.getById(id),
    [instance]
  );

  const getByPosition = useCallback(
    (position: [number, number, number]) => instance.getByPosition(position),
    [instance]
  );

  const getAll = useCallback(
    () => instance.getAll(),
    [instance]
  );

  const updateName = useCallback(
    (id: string, name: string) => instance.updateName(id, name),
    [instance]
  );

  const remove = useCallback(
    (id: string) => instance.remove(id),
    [instance]
  );

  const getByPositions = useCallback(
    (positions: [number, number, number][]) => instance.getByPositions(positions),
    [instance]
  );

  return {
    registry: instance,
    getOrCreate,
    getById,
    getByPosition,
    getAll,
    updateName,
    remove,
    getByPositions,
  };
}

