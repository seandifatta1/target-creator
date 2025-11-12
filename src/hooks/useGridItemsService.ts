/**
 * useGridItemsService - Hook for accessing GridItemsService with dependency injection
 * 
 * **How it's used in the app:**
 * This hook provides access to the GridItemsService throughout the application.
 * Components use this hook to create, read, update, and delete targets, paths, and
 * coordinates, and to query relationships between them. For example, when a user
 * places a target on the grid, the component calls `createTarget()` from this hook.
 * When the drawer needs to display target details, it uses `getTarget()` to retrieve
 * the target data.
 * 
 * **Dependency Injection:**
 * The `service` parameter is optional and allows injecting a mock or alternative
 * implementation for testing. If not provided, a new instance of GridItemsService
 * is created. This enables:
 * - Easier testing with mock services
 * - Flexibility to swap implementations (e.g., in-memory vs persistent storage)
 * - Better separation of concerns (hook handles React integration, service handles business logic)
 * 
 * @param service - Optional GridItemsService instance. If not provided, creates a new instance.
 * @returns Object containing the service instance and convenience methods
 * 
 * @example
 * ```typescript
 * const { service, createTarget, getTarget } = useGridItemsService();
 * 
 * // Create a target
 * const target = { id: 't1', label: 'My Target', pathId: 'p1' };
 * createTarget(target);
 * 
 * // Get a target
 * const retrieved = getTarget('t1');
 * ```
 */

import { useMemo } from 'react';
import { GridItemsService, IGridItemsService } from '../services/GridItemsService';

export function useGridItemsService(
  service?: IGridItemsService
): {
  service: IGridItemsService;
  // Target methods
  createTarget: (target: Parameters<IGridItemsService['createTarget']>[0]) => void;
  getTarget: (id: string) => ReturnType<IGridItemsService['getTarget']>;
  getAllTargets: () => ReturnType<IGridItemsService['getAllTargets']>;
  updateTarget: (id: string, updates: Parameters<IGridItemsService['updateTarget']>[1]) => void;
  deleteTarget: (id: string) => void;
  getTargetsByPath: (pathId: string) => ReturnType<IGridItemsService['getTargetsByPath']>;
  getTargetPath: (targetId: string) => ReturnType<IGridItemsService['getTargetPath']>;
  getTargetStartCoordinate: (targetId: string) => ReturnType<IGridItemsService['getTargetStartCoordinate']>;
  // Path methods
  createPath: (path: Parameters<IGridItemsService['createPath']>[0]) => void;
  getPath: (id: string) => ReturnType<IGridItemsService['getPath']>;
  getAllPaths: () => ReturnType<IGridItemsService['getAllPaths']>;
  updatePath: (id: string, updates: Parameters<IGridItemsService['updatePath']>[1]) => void;
  deletePath: (id: string) => void;
  getPathsByTarget: (targetId: string) => ReturnType<IGridItemsService['getPathsByTarget']>;
  getPathsByCoordinate: (coordinateId: string) => ReturnType<IGridItemsService['getPathsByCoordinate']>;
  addCoordinateToPath: (pathId: string, coordinate: Parameters<IGridItemsService['addCoordinateToPath']>[1]) => void;
  removeCoordinateFromPath: (pathId: string, coordinateId: string) => void;
  // Coordinate methods
  createCoordinate: (coordinate: Parameters<IGridItemsService['createCoordinate']>[0]) => void;
  getCoordinate: (id: string) => ReturnType<IGridItemsService['getCoordinate']>;
  getCoordinateByPosition: (position: Parameters<IGridItemsService['getCoordinateByPosition']>[0]) => ReturnType<IGridItemsService['getCoordinateByPosition']>;
  getAllCoordinates: () => ReturnType<IGridItemsService['getAllCoordinates']>;
  updateCoordinate: (id: string, updates: Parameters<IGridItemsService['updateCoordinate']>[1]) => void;
  deleteCoordinate: (id: string) => void;
  getCoordinatesByPath: (pathId: string) => ReturnType<IGridItemsService['getCoordinatesByPath']>;
  getTargetsByCoordinate: (coordinateId: string) => ReturnType<IGridItemsService['getTargetsByCoordinate']>;
} {
  const serviceInstance = useMemo(() => {
    return service || new GridItemsService();
  }, [service]);

  return {
    service: serviceInstance,
    // Target methods
    createTarget: (target) => serviceInstance.createTarget(target),
    getTarget: (id) => serviceInstance.getTarget(id),
    getAllTargets: () => serviceInstance.getAllTargets(),
    updateTarget: (id, updates) => serviceInstance.updateTarget(id, updates),
    deleteTarget: (id) => serviceInstance.deleteTarget(id),
    getTargetsByPath: (pathId) => serviceInstance.getTargetsByPath(pathId),
    getTargetPath: (targetId) => serviceInstance.getTargetPath(targetId),
    getTargetStartCoordinate: (targetId) => serviceInstance.getTargetStartCoordinate(targetId),
    // Path methods
    createPath: (path) => serviceInstance.createPath(path),
    getPath: (id) => serviceInstance.getPath(id),
    getAllPaths: () => serviceInstance.getAllPaths(),
    updatePath: (id, updates) => serviceInstance.updatePath(id, updates),
    deletePath: (id) => serviceInstance.deletePath(id),
    getPathsByTarget: (targetId) => serviceInstance.getPathsByTarget(targetId),
    getPathsByCoordinate: (coordinateId) => serviceInstance.getPathsByCoordinate(coordinateId),
    addCoordinateToPath: (pathId, coordinate) => serviceInstance.addCoordinateToPath(pathId, coordinate),
    removeCoordinateFromPath: (pathId, coordinateId) => serviceInstance.removeCoordinateFromPath(pathId, coordinateId),
    // Coordinate methods
    createCoordinate: (coordinate) => serviceInstance.createCoordinate(coordinate),
    getCoordinate: (id) => serviceInstance.getCoordinate(id),
    getCoordinateByPosition: (position) => serviceInstance.getCoordinateByPosition(position),
    getAllCoordinates: () => serviceInstance.getAllCoordinates(),
    updateCoordinate: (id, updates) => serviceInstance.updateCoordinate(id, updates),
    deleteCoordinate: (id) => serviceInstance.deleteCoordinate(id),
    getCoordinatesByPath: (pathId) => serviceInstance.getCoordinatesByPath(pathId),
    getTargetsByCoordinate: (coordinateId) => serviceInstance.getTargetsByCoordinate(coordinateId),
  };
}

