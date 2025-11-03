/**
 * Relationship Manager Service
 * 
 * Manages many-to-many relationships between Targets, Paths, and Coordinates.
 * Supports bidirectional lookups and relationship queries.
 */

import { Coordinate } from './CoordinateRegistry';

export type ItemType = 'target' | 'path' | 'coordinate';
export type ItemId = string;

export interface RelatedItem {
  type: ItemType;
  id: ItemId;
  name?: string;
}

export interface IRelationshipManager {
  /**
   * Attach a target to a coordinate (one-to-one relationship).
   * If the target was previously attached to another coordinate, that relationship is removed.
   */
  attachTargetToCoordinate(targetId: ItemId, coordinateId: ItemId): void;

  /**
   * Attach a path to one or more coordinates (one-to-many relationship).
   */
  attachPathToCoordinates(pathId: ItemId, coordinateIds: ItemId[]): void;

  /**
   * Remove a target's attachment to a coordinate.
   */
  detachTargetFromCoordinate(targetId: ItemId, coordinateId: ItemId): void;

  /**
   * Remove a path's attachment to a coordinate.
   */
  detachPathFromCoordinate(pathId: ItemId, coordinateId: ItemId): void;

  /**
   * Remove all relationships for a target.
   */
  removeTargetRelationships(targetId: ItemId): void;

  /**
   * Remove all relationships for a path.
   */
  removePathRelationships(pathId: ItemId): void;

  /**
   * Get all coordinates related to a target.
   */
  getTargetCoordinates(targetId: ItemId): ItemId[];

  /**
   * Get all coordinates related to a path.
   */
  getPathCoordinates(pathId: ItemId): ItemId[];

  /**
   * Get all targets related to a coordinate.
   */
  getCoordinateTargets(coordinateId: ItemId): ItemId[];

  /**
   * Get all paths related to a coordinate.
   */
  getCoordinatePaths(coordinateId: ItemId): ItemId[];

  /**
   * Get all related items for a given item, with optional metadata.
   */
  getRelatedItems(
    itemType: ItemType,
    itemId: ItemId,
    coordinates: Coordinate[],
    targets: Array<{ id: string; name?: string }>,
    paths: Array<{ id: string; name?: string }>
  ): RelatedItem[];

  /**
   * Get relationship counts for a given item.
   */
  getRelationshipCounts(
    itemType: ItemType,
    itemId: ItemId
  ): { targets: number; paths: number; coordinates: number };
}

export class RelationshipManager implements IRelationshipManager {
  // Target -> Coordinate (one-to-one)
  private targetToCoordinate: Map<ItemId, ItemId> = new Map();
  
  // Coordinate -> Targets (reverse lookup)
  private coordinateToTargets: Map<ItemId, Set<ItemId>> = new Map();

  // Path -> Coordinates (one-to-many)
  private pathToCoordinates: Map<ItemId, Set<ItemId>> = new Map();

  // Coordinate -> Paths (reverse lookup)
  private coordinateToPaths: Map<ItemId, Set<ItemId>> = new Map();

  attachTargetToCoordinate(targetId: ItemId, coordinateId: ItemId): void {
    // Remove existing relationship if any
    const existingCoord = this.targetToCoordinate.get(targetId);
    if (existingCoord) {
      this.detachTargetFromCoordinate(targetId, existingCoord);
    }

    // Set new relationship
    this.targetToCoordinate.set(targetId, coordinateId);

    // Update reverse lookup
    if (!this.coordinateToTargets.has(coordinateId)) {
      this.coordinateToTargets.set(coordinateId, new Set());
    }
    this.coordinateToTargets.get(coordinateId)!.add(targetId);
  }

  attachPathToCoordinates(pathId: ItemId, coordinateIds: ItemId[]): void {
    // Remove existing relationships
    const existingCoords = this.pathToCoordinates.get(pathId);
    if (existingCoords) {
      existingCoords.forEach(coordId => {
        this.detachPathFromCoordinate(pathId, coordId);
      });
    }

    // Set new relationships
    const coordSet = new Set(coordinateIds);
    this.pathToCoordinates.set(pathId, coordSet);

    // Update reverse lookups
    coordSet.forEach(coordId => {
      if (!this.coordinateToPaths.has(coordId)) {
        this.coordinateToPaths.set(coordId, new Set());
      }
      this.coordinateToPaths.get(coordId)!.add(pathId);
    });
  }

  detachTargetFromCoordinate(targetId: ItemId, coordinateId: ItemId): void {
    this.targetToCoordinate.delete(targetId);
    
    const targets = this.coordinateToTargets.get(coordinateId);
    if (targets) {
      targets.delete(targetId);
      if (targets.size === 0) {
        this.coordinateToTargets.delete(coordinateId);
      }
    }
  }

  detachPathFromCoordinate(pathId: ItemId, coordinateId: ItemId): void {
    const coords = this.pathToCoordinates.get(pathId);
    if (coords) {
      coords.delete(coordinateId);
      if (coords.size === 0) {
        this.pathToCoordinates.delete(pathId);
      }
    }

    const paths = this.coordinateToPaths.get(coordinateId);
    if (paths) {
      paths.delete(pathId);
      if (paths.size === 0) {
        this.coordinateToPaths.delete(coordinateId);
      }
    }
  }

  removeTargetRelationships(targetId: ItemId): void {
    const coordId = this.targetToCoordinate.get(targetId);
    if (coordId) {
      this.detachTargetFromCoordinate(targetId, coordId);
    }
  }

  removePathRelationships(pathId: ItemId): void {
    const coordIds = this.pathToCoordinates.get(pathId);
    if (coordIds) {
      coordIds.forEach(coordId => {
        this.detachPathFromCoordinate(pathId, coordId);
      });
    }
  }

  getTargetCoordinates(targetId: ItemId): ItemId[] {
    const coordId = this.targetToCoordinate.get(targetId);
    return coordId ? [coordId] : [];
  }

  getPathCoordinates(pathId: ItemId): ItemId[] {
    const coords = this.pathToCoordinates.get(pathId);
    return coords ? Array.from(coords) : [];
  }

  getCoordinateTargets(coordinateId: ItemId): ItemId[] {
    const targets = this.coordinateToTargets.get(coordinateId);
    return targets ? Array.from(targets) : [];
  }

  getCoordinatePaths(coordinateId: ItemId): ItemId[] {
    const paths = this.coordinateToPaths.get(coordinateId);
    return paths ? Array.from(paths) : [];
  }

  getRelatedItems(
    itemType: ItemType,
    itemId: ItemId,
    coordinates: Coordinate[],
    targets: Array<{ id: string; name?: string }>,
    paths: Array<{ id: string; name?: string }>
  ): RelatedItem[] {
    const related: RelatedItem[] = [];

    if (itemType === 'target') {
      // Get coordinate for this target
      const coordIds = this.getTargetCoordinates(itemId);
      coordIds.forEach(coordId => {
        const coord = coordinates.find(c => c.id === coordId);
        if (coord) {
          related.push({ type: 'coordinate', id: coord.id, name: coord.name });
        }
      });

      // Get paths that share the same coordinate
      coordIds.forEach(coordId => {
        const pathIds = this.getCoordinatePaths(coordId);
        pathIds.forEach(pathId => {
          const path = paths.find(p => p.id === pathId);
          if (path) {
            related.push({ type: 'path', id: path.id, name: path.name });
          }
        });
      });
    } else if (itemType === 'path') {
      // Get coordinates for this path
      const coordIds = this.getPathCoordinates(itemId);
      coordIds.forEach(coordId => {
        const coord = coordinates.find(c => c.id === coordId);
        if (coord) {
          related.push({ type: 'coordinate', id: coord.id, name: coord.name });
        }
      });

      // Get targets at those coordinates
      coordIds.forEach(coordId => {
        const targetIds = this.getCoordinateTargets(coordId);
        targetIds.forEach(targetId => {
          const target = targets.find(t => t.id === targetId);
          if (target) {
            related.push({ type: 'target', id: target.id, name: target.name });
          }
        });
      });
    } else if (itemType === 'coordinate') {
      // Get targets at this coordinate
      const targetIds = this.getCoordinateTargets(itemId);
      targetIds.forEach(targetId => {
        const target = targets.find(t => t.id === targetId);
        if (target) {
          related.push({ type: 'target', id: target.id, name: target.name });
        }
      });

      // Get paths that include this coordinate
      const pathIds = this.getCoordinatePaths(itemId);
      pathIds.forEach(pathId => {
        const path = paths.find(p => p.id === pathId);
        if (path) {
          related.push({ type: 'path', id: path.id, name: path.name });
        }
      });
    }

    // Remove duplicates
    const seen = new Set<string>();
    return related.filter(item => {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  getRelationshipCounts(
    itemType: ItemType,
    itemId: ItemId
  ): { targets: number; paths: number; coordinates: number } {
    if (itemType === 'target') {
      return {
        targets: 0,
        paths: 0,
        coordinates: this.getTargetCoordinates(itemId).length
      };
    } else if (itemType === 'path') {
      const coordIds = this.getPathCoordinates(itemId);
      const targetIds = new Set<ItemId>();
      coordIds.forEach(coordId => {
        this.getCoordinateTargets(coordId).forEach(tid => targetIds.add(tid));
      });
      return {
        targets: targetIds.size,
        paths: 0,
        coordinates: coordIds.length
      };
    } else {
      // coordinate
      return {
        targets: this.getCoordinateTargets(itemId).length,
        paths: this.getCoordinatePaths(itemId).length,
        coordinates: 0
      };
    }
  }
}

