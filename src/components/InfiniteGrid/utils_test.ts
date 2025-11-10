import {
  validatePathEndpoint,
  createPathData,
  shouldShowPathCreationToast,
  createPathCreationToastConfig,
  PathCreationMode,
} from './utils';
import { Position3D } from '../../utils/gridUtils';

describe('pathCreationLogic', () => {
  describe('validatePathEndpoint', () => {
    it('should reject same start and end position', () => {
      const result = validatePathEndpoint([0, 0, 0], [0, 0, 0], 20);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('start point');
    });

    it('should accept valid horizontal endpoint', () => {
      const result = validatePathEndpoint([0, 0, 0], [2, 0, 0], 20);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid vertical endpoint', () => {
      const result = validatePathEndpoint([0, 0, 0], [0, 0, 2], 20);
      expect(result.isValid).toBe(true);
    });

    it('should accept valid diagonal endpoint', () => {
      const result = validatePathEndpoint([0, 0, 0], [2, 0, 2], 20);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid endpoint (not on line)', () => {
      // [1, 0, 2] is invalid because |dx| = 1, |dz| = 2, so |dx| !== |dz| (not diagonal)
      // and it's not horizontal (dz !== 0) or vertical (dx !== 0)
      const result = validatePathEndpoint([0, 0, 0], [1, 0, 2], 20);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid endpoint');
    });
  });

  describe('createPathData', () => {
    it('should create path data with calculated points', () => {
      const pathData = createPathData(
        [0, 0, 0],
        [2, 0, 0],
        'path-line',
        'Test Path',
        'My Path'
      );

      expect(pathData.pathType).toBe('path-line');
      expect(pathData.pathLabel).toBe('Test Path');
      expect(pathData.name).toBe('My Path');
      expect(pathData.litTiles.length).toBeGreaterThan(0);
      expect(pathData.litTiles).toContainEqual([0, 0, 0]);
      expect(pathData.litTiles).toContainEqual([2, 0, 0]);
    });

    it('should create path without name if not provided', () => {
      const pathData = createPathData([0, 0, 0], [2, 0, 0], 'path-line', 'Test Path');
      expect(pathData.name).toBeUndefined();
    });
  });

  describe('shouldShowPathCreationToast', () => {
    it('should return true for active mode with start position', () => {
      const mode: PathCreationMode = {
        isActive: true,
        type: 'line',
        startPosition: [0, 0, 0],
        pathType: 'path-line',
        pathLabel: 'Test',
      };
      expect(shouldShowPathCreationToast(mode)).toBe(true);
    });

    it('should return false for inactive mode', () => {
      const mode: PathCreationMode = {
        isActive: false,
        type: null,
        startPosition: null,
        pathType: '',
        pathLabel: '',
      };
      expect(shouldShowPathCreationToast(mode)).toBe(false);
    });

    it('should return false for active mode without start position', () => {
      const mode: PathCreationMode = {
        isActive: true,
        type: 'line',
        startPosition: null,
        pathType: 'path-line',
        pathLabel: 'Test',
      };
      expect(shouldShowPathCreationToast(mode)).toBe(false);
    });
  });

  describe('createPathCreationToastConfig', () => {
    it('should create toast config with correct message', () => {
      const onDismiss = jest.fn();
      const onCancel = jest.fn();
      const config = createPathCreationToastConfig('Test Path', onDismiss, onCancel);

      expect(config.message).toContain('Test Path');
      expect(config.intent).toBe('primary');
      expect(config.timeout).toBe(0);
      expect(config.onDismiss).toBe(onDismiss);
      expect(config.action?.onClick).toBe(onCancel);
    });
  });
});

