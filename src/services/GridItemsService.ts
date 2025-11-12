/**
 * GridItemsService - Core service for managing Targets, Paths, and Coordinates
 * 
 * **How it's used in the app:**
 * This service is the core backend feature that manages all grid items and their
 * relationships. It handles CRUD operations for targets, paths, and coordinates,
 * and maintains the relational integrity between them. For example, when a target
 * is created, it must be associated with a path. When a path is deleted, all
 * associated targets must be handled appropriately.
 * 
 * **Dependency Injection:**
 * This service is designed to be dependency-injected to allow:
 * - Easier testing with mock implementations
 * - Flexibility to swap implementations (e.g., in-memory vs persistent storage)
 * - Better separation of concerns (service handles business logic, components handle UI)
 * 
 * **Core Operations:**
 * - Create, read, update, delete for all grid item types
 * - Relationship management (target ↔ path, path ↔ coordinates, coordinate ↔ paths/targets)
 * - Query operations (get targets by path, get paths by coordinate, etc.)
 * - Derived data (get targets for a coordinate, get start coordinate for a target)
 */

import type { Target, Path, Coordinate } from '../types/gridItems';

export interface IGridItemsService {
  // Target operations
  createTarget(target: Target): void;
  getTarget(id: string): Target | null;
  getAllTargets(): Target[];
  updateTarget(id: string, updates: Partial<Omit<Target, 'id'>>): void;
  deleteTarget(id: string): void;
  getTargetsByPath(pathId: string): Target[];
  getTargetPath(targetId: string): Path | null;
  getTargetStartCoordinate(targetId: string): Coordinate | null;

  // Path operations
  createPath(path: Path): void;
  getPath(id: string): Path | null;
  getAllPaths(): Path[];
  updatePath(id: string, updates: Partial<Omit<Path, 'id'>>): void;
  deletePath(id: string): void;
  getPathsByTarget(targetId: string): Path[];
  getPathsByCoordinate(coordinateId: string): Path[];
  addCoordinateToPath(pathId: string, coordinate: Coordinate): void;
  removeCoordinateFromPath(pathId: string, coordinateId: string): void;

  // Coordinate operations
  createCoordinate(coordinate: Coordinate): void;
  getCoordinate(id: string): Coordinate | null;
  getCoordinateByPosition(position: [number, number, number]): Coordinate | null;
  getAllCoordinates(): Coordinate[];
  updateCoordinate(id: string, updates: Partial<Omit<Coordinate, 'id'>>): void;
  deleteCoordinate(id: string): void;
  getCoordinatesByPath(pathId: string): Coordinate[];
  getTargetsByCoordinate(coordinateId: string): Target[];
}

export class GridItemsService implements IGridItemsService {
  private targets: Map<string, Target> = new Map();
  private paths: Map<string, Path> = new Map();
  private coordinates: Map<string, Coordinate> = new Map();
  private coordinateByPosition: Map<string, Coordinate> = new Map(); // Key: "x,y,z"

  // Helper to create position key
  private positionKey(position: [number, number, number]): string {
    return `${position[0]},${position[1]},${position[2]}`;
  }

  // Helper to update coordinate's paths and targets arrays
  private updateCoordinateRelationships(coordinateId: string): void {
    const coordinate = this.coordinates.get(coordinateId);
    if (!coordinate) return;

    // Find all paths that contain this coordinate
    const pathsThroughCoordinate: Path[] = [];
    for (const path of this.paths.values()) {
      if (path.coordinates.some(c => c.id === coordinateId || 
        (c.position[0] === coordinate.position[0] &&
         c.position[1] === coordinate.position[1] &&
         c.position[2] === coordinate.position[2]))) {
        pathsThroughCoordinate.push(path);
      }
    }

    // Find all targets that use paths through this coordinate
    const targetsThroughCoordinate: Target[] = [];
    for (const path of pathsThroughCoordinate) {
      const target = this.targets.get(path.targetId);
      if (target) {
        targetsThroughCoordinate.push(target);
      }
    }

    // Update coordinate
    coordinate.paths = pathsThroughCoordinate;
    coordinate.targets = targetsThroughCoordinate;
  }

  // Target operations
  createTarget(target: Target): void {
    // Validate path exists
    const path = this.paths.get(target.pathId);
    if (!path) {
      throw new Error(`Cannot create target: path ${target.pathId} does not exist`);
    }
    // Update path's targetId to match this target
    path.targetId = target.id;
    this.targets.set(target.id, target);
  }

  getTarget(id: string): Target | null {
    return this.targets.get(id) || null;
  }

  getAllTargets(): Target[] {
    return Array.from(this.targets.values());
  }

  updateTarget(id: string, updates: Partial<Omit<Target, 'id'>>): void {
    const target = this.targets.get(id);
    if (!target) {
      throw new Error(`Target ${id} not found`);
    }

    // If pathId is being updated, validate new path exists
    if (updates.pathId !== undefined && !this.paths.has(updates.pathId)) {
      throw new Error(`Cannot update target: path ${updates.pathId} does not exist`);
    }

    Object.assign(target, updates);
  }

  deleteTarget(id: string): void {
    this.targets.delete(id);
  }

  getTargetsByPath(pathId: string): Target[] {
    return Array.from(this.targets.values()).filter(t => t.pathId === pathId);
  }

  getTargetPath(targetId: string): Path | null {
    const target = this.targets.get(targetId);
    if (!target) return null;
    return this.paths.get(target.pathId) || null;
  }

  getTargetStartCoordinate(targetId: string): Coordinate | null {
    const path = this.getTargetPath(targetId);
    if (!path || path.coordinates.length === 0) return null;
    return path.coordinates[0];
  }

  // Path operations
  createPath(path: Path): void {
    // Note: We allow creating a path with a targetId that doesn't exist yet
    // The target will be validated when it's created and will update the path's targetId
    // This handles the circular dependency between Target and Path

    // Validate all coordinates exist or create them
    const validatedCoordinates: Coordinate[] = [];
    for (const coord of path.coordinates) {
      if (coord.id) {
        const existing = this.coordinates.get(coord.id);
        if (existing) {
          validatedCoordinates.push(existing);
        } else {
          // Coordinate with ID doesn't exist, create it
          this.createCoordinate(coord);
          validatedCoordinates.push(coord);
        }
      } else {
        // Coordinate without ID - check by position
        const existing = this.getCoordinateByPosition(coord.position);
        if (existing) {
          validatedCoordinates.push(existing);
        } else {
          // Create new coordinate
          const newCoord: Coordinate = {
            ...coord,
            id: `coord-${Date.now()}-${Math.random()}`,
          };
          this.createCoordinate(newCoord);
          validatedCoordinates.push(newCoord);
        }
      }
    }

    const pathWithValidatedCoords: Path = {
      ...path,
      coordinates: validatedCoordinates,
    };

    this.paths.set(path.id, pathWithValidatedCoords);

    // Update coordinate relationships
    for (const coord of validatedCoordinates) {
      if (coord.id) {
        this.updateCoordinateRelationships(coord.id);
      }
    }
  }

  getPath(id: string): Path | null {
    return this.paths.get(id) || null;
  }

  getAllPaths(): Path[] {
    return Array.from(this.paths.values());
  }

  updatePath(id: string, updates: Partial<Omit<Path, 'id'>>): void {
    const path = this.paths.get(id);
    if (!path) {
      throw new Error(`Path ${id} not found`);
    }

    // If targetId is being updated, validate new target exists
    if (updates.targetId !== undefined && !this.targets.has(updates.targetId)) {
      throw new Error(`Cannot update path: target ${updates.targetId} does not exist`);
    }

    // If coordinates are being updated, validate them
    if (updates.coordinates !== undefined) {
      const validatedCoordinates: Coordinate[] = [];
      for (const coord of updates.coordinates) {
        if (coord.id) {
          const existing = this.coordinates.get(coord.id);
          if (existing) {
            validatedCoordinates.push(existing);
          } else {
            this.createCoordinate(coord);
            validatedCoordinates.push(coord);
          }
        } else {
          const existing = this.getCoordinateByPosition(coord.position);
          if (existing) {
            validatedCoordinates.push(existing);
          } else {
            const newCoord: Coordinate = {
              ...coord,
              id: `coord-${Date.now()}-${Math.random()}`,
            };
            this.createCoordinate(newCoord);
            validatedCoordinates.push(newCoord);
          }
        }
      }
      updates.coordinates = validatedCoordinates;
    }

    Object.assign(path, updates);

    // Update coordinate relationships if coordinates changed
    if (updates.coordinates !== undefined) {
      for (const coord of path.coordinates) {
        if (coord.id) {
          this.updateCoordinateRelationships(coord.id);
        }
      }
    }
  }

  deletePath(id: string): void {
    const path = this.paths.get(id);
    if (!path) return;

    // Delete all targets that use this path
    const targetsToDelete = this.getTargetsByPath(id);
    for (const target of targetsToDelete) {
      this.deleteTarget(target.id);
    }

    this.paths.delete(id);

    // Update coordinate relationships
    for (const coord of path.coordinates) {
      if (coord.id) {
        this.updateCoordinateRelationships(coord.id);
      }
    }
  }

  getPathsByTarget(targetId: string): Path[] {
    return Array.from(this.paths.values()).filter(p => p.targetId === targetId);
  }

  getPathsByCoordinate(coordinateId: string): Path[] {
    const coordinate = this.coordinates.get(coordinateId);
    if (!coordinate) return [];

    return Array.from(this.paths.values()).filter(path =>
      path.coordinates.some(c =>
        c.id === coordinateId ||
        (c.position[0] === coordinate.position[0] &&
         c.position[1] === coordinate.position[1] &&
         c.position[2] === coordinate.position[2])
      )
    );
  }

  addCoordinateToPath(pathId: string, coordinate: Coordinate): void {
    const path = this.paths.get(pathId);
    if (!path) {
      throw new Error(`Path ${pathId} not found`);
    }

    // Ensure coordinate exists
    if (coordinate.id && !this.coordinates.has(coordinate.id)) {
      this.createCoordinate(coordinate);
    } else if (!coordinate.id) {
      const existing = this.getCoordinateByPosition(coordinate.position);
      if (!existing) {
        const newCoord: Coordinate = {
          ...coordinate,
          id: `coord-${Date.now()}-${Math.random()}`,
        };
        this.createCoordinate(newCoord);
        coordinate = newCoord;
      } else {
        coordinate = existing;
      }
    }

    path.coordinates.push(coordinate);
    if (coordinate.id) {
      this.updateCoordinateRelationships(coordinate.id);
    }
  }

  removeCoordinateFromPath(pathId: string, coordinateId: string): void {
    const path = this.paths.get(pathId);
    if (!path) {
      throw new Error(`Path ${pathId} not found`);
    }

    path.coordinates = path.coordinates.filter(c => c.id !== coordinateId);
    this.updateCoordinateRelationships(coordinateId);
  }

  // Coordinate operations
  createCoordinate(coordinate: Coordinate): void {
    if (coordinate.id) {
      this.coordinates.set(coordinate.id, coordinate);
    }
    const key = this.positionKey(coordinate.position);
    this.coordinateByPosition.set(key, coordinate);
  }

  getCoordinate(id: string): Coordinate | null {
    return this.coordinates.get(id) || null;
  }

  getCoordinateByPosition(position: [number, number, number]): Coordinate | null {
    const key = this.positionKey(position);
    return this.coordinateByPosition.get(key) || null;
  }

  getAllCoordinates(): Coordinate[] {
    // Return unique coordinates (by position if no ID)
    const seen = new Set<string>();
    const result: Coordinate[] = [];

    for (const coord of this.coordinates.values()) {
      const key = coord.id || this.positionKey(coord.position);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(coord);
      }
    }

    // Also include coordinates from position map that might not have IDs
    for (const coord of this.coordinateByPosition.values()) {
      const key = coord.id || this.positionKey(coord.position);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(coord);
      }
    }

    return result;
  }

  updateCoordinate(id: string, updates: Partial<Omit<Coordinate, 'id'>>): void {
    const coordinate = this.coordinates.get(id);
    if (!coordinate) {
      throw new Error(`Coordinate ${id} not found`);
    }

    // If position is being updated, update the position map
    if (updates.position) {
      const oldKey = this.positionKey(coordinate.position);
      this.coordinateByPosition.delete(oldKey);
      const newKey = this.positionKey(updates.position);
      this.coordinateByPosition.set(newKey, { ...coordinate, ...updates });
    }

    Object.assign(coordinate, updates);
    this.updateCoordinateRelationships(id);
  }

  deleteCoordinate(id: string): void {
    const coordinate = this.coordinates.get(id);
    if (!coordinate) return;

    // Remove from position map
    const key = this.positionKey(coordinate.position);
    this.coordinateByPosition.delete(key);

    // Remove from all paths
    for (const path of this.paths.values()) {
      path.coordinates = path.coordinates.filter(c => c.id !== id);
    }

    this.coordinates.delete(id);
  }

  getCoordinatesByPath(pathId: string): Coordinate[] {
    const path = this.paths.get(pathId);
    if (!path) return [];
    return path.coordinates;
  }

  getTargetsByCoordinate(coordinateId: string): Target[] {
    const coordinate = this.coordinates.get(coordinateId);
    if (!coordinate) return [];

    // Get all paths through this coordinate
    const paths = this.getPathsByCoordinate(coordinateId);
    
    // Get all targets that use those paths
    const targetIds = new Set<string>();
    for (const path of paths) {
      targetIds.add(path.targetId);
    }

    return Array.from(targetIds)
      .map(id => this.targets.get(id))
      .filter((t): t is Target => t !== undefined);
  }
}

