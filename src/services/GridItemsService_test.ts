/**
 * GridItemsService Test Suite
 * 
 * Comprehensive tests for the core backend service that manages
 * Targets, Paths, and Coordinates and their relationships.
 */

import { GridItemsService, IGridItemsService } from './GridItemsService';
import type { Target, Path, Coordinate } from '../types/gridItems';

describe('GridItemsService', () => {
  let service: IGridItemsService;

  beforeEach(() => {
    service = new GridItemsService();
  });

  describe('Target Operations', () => {
    describe('createTarget', () => {
      it('should create a target when path exists', () => {
        // Create a path first
        const path: Path = {
          id: 'path-1',
          label: 'Test Path',
          targetId: 'target-1',
          coordinates: [],
        };
        const target: Target = {
          id: 'target-1',
          label: 'Test Target',
          pathId: 'path-1',
        };

        // Create path first (we'll need to handle circular dependency)
        // For now, let's create coordinate and path properly
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        path.coordinates = [coord];
        path.targetId = target.id; // Set target ID
        service.createPath(path);
        
        // Now update target to reference path
        target.pathId = path.id;
        service.createTarget(target);

        const result = service.getTarget('target-1');
        expect(result).toEqual(target);
      });

      it('should throw error when creating target with non-existent path', () => {
        const target: Target = {
          id: 'target-1',
          label: 'Test Target',
          pathId: 'non-existent-path',
        };

        expect(() => service.createTarget(target)).toThrow(
          'Cannot create target: path non-existent-path does not exist'
        );
      });
    });

    describe('getTarget', () => {
      it('should return target when it exists', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = {
          id: 'target-1',
          label: 'Test Target',
          pathId: 'path-1',
        };
        const path: Path = {
          id: 'path-1',
          label: 'Test Path',
          targetId: target.id,
          coordinates: [coord],
        };
        service.createPath(path);
        service.createTarget(target);

        const result = service.getTarget('target-1');
        expect(result).toEqual(target);
      });

      it('should return null when target does not exist', () => {
        const result = service.getTarget('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('getAllTargets', () => {
      it('should return all targets', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);

        const target1: Target = { id: 'target-1', label: 'Target 1', pathId: 'path-1' };
        const target2: Target = { id: 'target-2', label: 'Target 2', pathId: 'path-2' };
        
        const path1: Path = { id: 'path-1', label: 'Path 1', targetId: target1.id, coordinates: [coord] };
        const path2: Path = { id: 'path-2', label: 'Path 2', targetId: target2.id, coordinates: [coord] };
        
        service.createPath(path1);
        service.createPath(path2);
        service.createTarget(target1);
        service.createTarget(target2);

        const result = service.getAllTargets();
        expect(result).toHaveLength(2);
        expect(result).toContainEqual(target1);
        expect(result).toContainEqual(target2);
      });
    });

    describe('updateTarget', () => {
      it('should update target label', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Old Label', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path 1', targetId: target.id, coordinates: [coord] };
        service.createPath(path);
        service.createTarget(target);

        service.updateTarget('target-1', { label: 'New Label' });
        const result = service.getTarget('target-1');
        expect(result?.label).toBe('New Label');
      });

      it('should update target pathId when new path exists', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path1: Path = { id: 'path-1', label: 'Path 1', targetId: target.id, coordinates: [coord] };
        const path2: Path = { id: 'path-2', label: 'Path 2', targetId: 'target-2', coordinates: [coord] };
        
        service.createPath(path1);
        service.createPath(path2);
        service.createTarget(target);

        service.updateTarget('target-1', { pathId: 'path-2' });
        const result = service.getTarget('target-1');
        expect(result?.pathId).toBe('path-2');
      });

      it('should throw error when updating to non-existent path', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path 1', targetId: target.id, coordinates: [coord] };
        service.createPath(path);
        service.createTarget(target);

        expect(() => service.updateTarget('target-1', { pathId: 'non-existent' })).toThrow(
          'Cannot update target: path non-existent does not exist'
        );
      });
    });

    describe('deleteTarget', () => {
      it('should delete target', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path 1', targetId: target.id, coordinates: [coord] };
        service.createPath(path);
        service.createTarget(target);

        service.deleteTarget('target-1');
        const result = service.getTarget('target-1');
        expect(result).toBeNull();
      });
    });

    describe('getTargetsByPath', () => {
      it('should return all targets for a path', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target1: Target = { id: 'target-1', label: 'Target 1', pathId: 'path-1' };
        const target2: Target = { id: 'target-2', label: 'Target 2', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path 1', targetId: target1.id, coordinates: [coord] };
        
        service.createPath(path);
        service.createTarget(target1);
        service.createTarget(target2);

        const result = service.getTargetsByPath('path-1');
        expect(result).toHaveLength(2);
        expect(result).toContainEqual(target1);
        expect(result).toContainEqual(target2);
      });
    });

    describe('getTargetPath', () => {
      it('should return path for target', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path 1', targetId: target.id, coordinates: [coord] };
        
        service.createPath(path);
        service.createTarget(target);

        const result = service.getTargetPath('target-1');
        expect(result).toEqual(path);
      });
    });

    describe('getTargetStartCoordinate', () => {
      it('should return first coordinate of target path', () => {
        const coord1: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        const coord2: Coordinate = {
          id: 'coord-2',
          label: 'Coord 2',
          position: [1, 1, 1],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord1);
        service.createCoordinate(coord2);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path 1', targetId: target.id, coordinates: [coord1, coord2] };
        
        service.createPath(path);
        service.createTarget(target);

        const result = service.getTargetStartCoordinate('target-1');
        expect(result).toEqual(coord1);
      });

      it('should return null when path has no coordinates', () => {
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path 1', targetId: target.id, coordinates: [] };
        
        service.createPath(path);
        service.createTarget(target);

        const result = service.getTargetStartCoordinate('target-1');
        expect(result).toBeNull();
      });
    });
  });

  describe('Path Operations', () => {
    describe('createPath', () => {
      it('should create a path when target exists', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path', targetId: target.id, coordinates: [coord] };
        
        service.createPath(path);
        service.createTarget(target);

        const result = service.getPath('path-1');
        expect(result).toEqual(path);
      });

      it('should allow creating path with non-existent target (circular dependency handling)', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const path: Path = {
          id: 'path-1',
          label: 'Path',
          targetId: 'non-existent-target',
          coordinates: [coord],
        };

        // Should not throw - we allow paths to be created before targets
        // The target will update the path's targetId when created
        expect(() => service.createPath(path)).not.toThrow();
        
        const result = service.getPath('path-1');
        expect(result).toBeDefined();
      });

      it('should auto-create coordinates without IDs', () => {
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const coord: Coordinate = {
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        const path: Path = { id: 'path-1', label: 'Path', targetId: target.id, coordinates: [coord] };
        
        service.createPath(path);
        service.createTarget(target);

        const result = service.getPath('path-1');
        expect(result?.coordinates).toHaveLength(1);
        expect(result?.coordinates[0].id).toBeDefined();
      });
    });

    describe('getPath', () => {
      it('should return path when it exists', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path', targetId: target.id, coordinates: [coord] };
        
        service.createPath(path);
        service.createTarget(target);

        const result = service.getPath('path-1');
        expect(result).toEqual(path);
      });

      it('should return null when path does not exist', () => {
        const result = service.getPath('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('getAllPaths', () => {
      it('should return all paths', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target1: Target = { id: 'target-1', label: 'Target 1', pathId: 'path-1' };
        const target2: Target = { id: 'target-2', label: 'Target 2', pathId: 'path-2' };
        const path1: Path = { id: 'path-1', label: 'Path 1', targetId: target1.id, coordinates: [coord] };
        const path2: Path = { id: 'path-2', label: 'Path 2', targetId: target2.id, coordinates: [coord] };
        
        service.createPath(path1);
        service.createPath(path2);
        service.createTarget(target1);
        service.createTarget(target2);

        const result = service.getAllPaths();
        expect(result).toHaveLength(2);
        expect(result).toContainEqual(path1);
        expect(result).toContainEqual(path2);
      });
    });

    describe('updatePath', () => {
      it('should update path label', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Old Label', targetId: target.id, coordinates: [coord] };
        
        service.createPath(path);
        service.createTarget(target);

        service.updatePath('path-1', { label: 'New Label' });
        const result = service.getPath('path-1');
        expect(result?.label).toBe('New Label');
      });
    });

    describe('deletePath', () => {
      it('should delete path and associated targets', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path', targetId: target.id, coordinates: [coord] };
        
        service.createPath(path);
        service.createTarget(target);

        service.deletePath('path-1');
        
        expect(service.getPath('path-1')).toBeNull();
        expect(service.getTarget('target-1')).toBeNull();
      });
    });

    describe('getPathsByTarget', () => {
      it('should return all paths for a target', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path1: Path = { id: 'path-1', label: 'Path 1', targetId: target.id, coordinates: [coord] };
        const path2: Path = { id: 'path-2', label: 'Path 2', targetId: target.id, coordinates: [coord] };
        
        service.createPath(path1);
        service.createPath(path2);
        service.createTarget(target);

        const result = service.getPathsByTarget('target-1');
        expect(result).toHaveLength(2);
        expect(result).toContainEqual(path1);
        expect(result).toContainEqual(path2);
      });
    });

    describe('addCoordinateToPath', () => {
      it('should add coordinate to path', () => {
        const coord1: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        const coord2: Coordinate = {
          id: 'coord-2',
          label: 'Coord 2',
          position: [1, 1, 1],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord1);
        service.createCoordinate(coord2);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path', targetId: target.id, coordinates: [coord1] };
        
        service.createPath(path);
        service.createTarget(target);

        service.addCoordinateToPath('path-1', coord2);
        const result = service.getPath('path-1');
        expect(result?.coordinates).toHaveLength(2);
        expect(result?.coordinates).toContainEqual(coord2);
      });
    });

    describe('removeCoordinateFromPath', () => {
      it('should remove coordinate from path', () => {
        const coord1: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        const coord2: Coordinate = {
          id: 'coord-2',
          label: 'Coord 2',
          position: [1, 1, 1],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord1);
        service.createCoordinate(coord2);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path', targetId: target.id, coordinates: [coord1, coord2] };
        
        service.createPath(path);
        service.createTarget(target);

        service.removeCoordinateFromPath('path-1', 'coord-2');
        const result = service.getPath('path-1');
        expect(result?.coordinates).toHaveLength(1);
        expect(result?.coordinates).not.toContainEqual(coord2);
      });
    });
  });

  describe('Coordinate Operations', () => {
    describe('createCoordinate', () => {
      it('should create coordinate', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);

        const result = service.getCoordinate('coord-1');
        expect(result).toEqual(coord);
      });

      it('should create coordinate without ID', () => {
        const coord: Coordinate = {
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);

        const result = service.getCoordinateByPosition([0, 0, 0]);
        expect(result).toEqual(coord);
      });
    });

    describe('getCoordinate', () => {
      it('should return coordinate when it exists', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);

        const result = service.getCoordinate('coord-1');
        expect(result).toEqual(coord);
      });

      it('should return null when coordinate does not exist', () => {
        const result = service.getCoordinate('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('getCoordinateByPosition', () => {
      it('should return coordinate by position', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [5, 10, 15],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);

        const result = service.getCoordinateByPosition([5, 10, 15]);
        expect(result).toEqual(coord);
      });

      it('should return null when position does not exist', () => {
        const result = service.getCoordinateByPosition([999, 999, 999]);
        expect(result).toBeNull();
      });
    });

    describe('getAllCoordinates', () => {
      it('should return all coordinates', () => {
        const coord1: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        const coord2: Coordinate = {
          id: 'coord-2',
          label: 'Coord 2',
          position: [1, 1, 1],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord1);
        service.createCoordinate(coord2);

        const result = service.getAllCoordinates();
        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result.some(c => c.id === 'coord-1')).toBe(true);
        expect(result.some(c => c.id === 'coord-2')).toBe(true);
      });
    });

    describe('updateCoordinate', () => {
      it('should update coordinate', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Old Label',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);

        service.updateCoordinate('coord-1', { label: 'New Label' });
        const result = service.getCoordinate('coord-1');
        expect(result?.label).toBe('New Label');
      });
    });

    describe('deleteCoordinate', () => {
      it('should delete coordinate and remove from paths', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path', targetId: target.id, coordinates: [coord] };
        
        service.createPath(path);
        service.createTarget(target);

        service.deleteCoordinate('coord-1');
        
        expect(service.getCoordinate('coord-1')).toBeNull();
        const updatedPath = service.getPath('path-1');
        expect(updatedPath?.coordinates).not.toContainEqual(coord);
      });
    });

    describe('getCoordinatesByPath', () => {
      it('should return all coordinates for a path', () => {
        const coord1: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        const coord2: Coordinate = {
          id: 'coord-2',
          label: 'Coord 2',
          position: [1, 1, 1],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord1);
        service.createCoordinate(coord2);
        
        const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
        const path: Path = { id: 'path-1', label: 'Path', targetId: target.id, coordinates: [coord1, coord2] };
        
        service.createPath(path);
        service.createTarget(target);

        const result = service.getCoordinatesByPath('path-1');
        expect(result).toHaveLength(2);
        expect(result).toContainEqual(coord1);
        expect(result).toContainEqual(coord2);
      });
    });

    describe('getTargetsByCoordinate', () => {
      it('should return all targets that go through a coordinate', () => {
        const coord: Coordinate = {
          id: 'coord-1',
          label: 'Coord 1',
          position: [0, 0, 0],
          paths: [],
          targets: [],
        };
        service.createCoordinate(coord);
        
        const target1: Target = { id: 'target-1', label: 'Target 1', pathId: 'path-1' };
        const target2: Target = { id: 'target-2', label: 'Target 2', pathId: 'path-2' };
        const path1: Path = { id: 'path-1', label: 'Path 1', targetId: target1.id, coordinates: [coord] };
        const path2: Path = { id: 'path-2', label: 'Path 2', targetId: target2.id, coordinates: [coord] };
        
        service.createPath(path1);
        service.createPath(path2);
        service.createTarget(target1);
        service.createTarget(target2);

        const result = service.getTargetsByCoordinate('coord-1');
        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result.some(t => t.id === 'target-1')).toBe(true);
        expect(result.some(t => t.id === 'target-2')).toBe(true);
      });
    });
  });

  describe('Relationship Integrity', () => {
    it('should maintain bidirectional relationships', () => {
      // Create coordinates
      const coord1: Coordinate = {
        id: 'coord-1',
        label: 'Coord 1',
        position: [0, 0, 0],
        paths: [],
        targets: [],
      };
      const coord2: Coordinate = {
        id: 'coord-2',
        label: 'Coord 2',
        position: [1, 1, 1],
        paths: [],
        targets: [],
      };
      service.createCoordinate(coord1);
      service.createCoordinate(coord2);
      
      // Create target and path
      const target: Target = { id: 'target-1', label: 'Target', pathId: 'path-1' };
      const path: Path = { id: 'path-1', label: 'Path', targetId: target.id, coordinates: [coord1, coord2] };
      
      service.createPath(path);
      service.createTarget(target);

      // Verify relationships
      const targetPath = service.getTargetPath('target-1');
      expect(targetPath).toEqual(path);
      
      const pathCoords = service.getCoordinatesByPath('path-1');
      expect(pathCoords).toHaveLength(2);
      
      const coordTargets = service.getTargetsByCoordinate('coord-1');
      expect(coordTargets.some(t => t.id === 'target-1')).toBe(true);
    });
  });
});

