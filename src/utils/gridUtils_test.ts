import {
  positionsEqual,
  generateGridPoints,
  getValidLineEndpoints,
  calculateLinePoints,
  Position3D,
} from './gridUtils';

describe('gridUtils', () => {
  describe('positionsEqual', () => {
    it('should return true for equal positions', () => {
      expect(positionsEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('should return false for different positions', () => {
      expect(positionsEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('should return false for null position', () => {
      expect(positionsEqual([1, 2, 3], null)).toBe(false);
    });
  });

  describe('generateGridPoints', () => {
    it('should generate correct number of points for grid size 2', () => {
      const points = generateGridPoints(2);
      // Grid size 2: -1, 0, 1 in each direction = 3x3 = 9 points
      expect(points.length).toBe(9);
    });

    it('should generate points with y=0', () => {
      const points = generateGridPoints(2);
      points.forEach((point) => {
        expect(point[1]).toBe(0);
      });
    });

    it('should include origin point', () => {
      const points = generateGridPoints(2);
      expect(points).toContainEqual([0, 0, 0]);
    });
  });

  describe('getValidLineEndpoints', () => {
    it('should return valid horizontal endpoints', () => {
      const endpoints = getValidLineEndpoints([0, 0, 0], 4);
      // Should include all points on x-axis (z=0)
      expect(endpoints).toContainEqual([1, 0, 0]);
      expect(endpoints).toContainEqual([-1, 0, 0]);
      expect(endpoints).toContainEqual([2, 0, 0]);
    });

    it('should return valid vertical endpoints', () => {
      const endpoints = getValidLineEndpoints([0, 0, 0], 4);
      // Should include all points on z-axis (x=0)
      expect(endpoints).toContainEqual([0, 0, 1]);
      expect(endpoints).toContainEqual([0, 0, -1]);
    });

    it('should return valid diagonal endpoints', () => {
      const endpoints = getValidLineEndpoints([0, 0, 0], 4);
      // Should include diagonal points where |dx| === |dz|
      expect(endpoints).toContainEqual([1, 0, 1]);
      expect(endpoints).toContainEqual([-1, 0, -1]);
      expect(endpoints).toContainEqual([2, 0, 2]);
    });

    it('should not include start position', () => {
      const endpoints = getValidLineEndpoints([0, 0, 0], 4);
      expect(endpoints).not.toContainEqual([0, 0, 0]);
    });
  });

  describe('calculateLinePoints', () => {
    it('should return start and end for same position', () => {
      const points = calculateLinePoints([0, 0, 0], [0, 0, 0]);
      expect(points).toEqual([[0, 0, 0]]);
    });

    it('should calculate horizontal line points', () => {
      const points = calculateLinePoints([0, 0, 0], [3, 0, 0]);
      expect(points).toContainEqual([0, 0, 0]);
      expect(points).toContainEqual([3, 0, 0]);
      expect(points.length).toBeGreaterThan(2);
    });

    it('should calculate diagonal line points', () => {
      const points = calculateLinePoints([0, 0, 0], [2, 0, 2]);
      expect(points).toContainEqual([0, 0, 0]);
      expect(points).toContainEqual([2, 0, 2]);
    });

    it('should deduplicate consecutive identical points', () => {
      const points = calculateLinePoints([0, 0, 0], [1, 0, 0]);
      // Should not have duplicate consecutive points
      for (let i = 0; i < points.length - 1; i++) {
        expect(points[i]).not.toEqual(points[i + 1]);
      }
    });

    it('should handle invalid inputs gracefully', () => {
      const points = calculateLinePoints(
        [NaN, 0, 0] as Position3D,
        [1, 0, 0]
      );
      // Should return at least start and end
      expect(points.length).toBeGreaterThanOrEqual(2);
    });
  });
});

