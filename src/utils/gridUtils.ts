/**
 * Pure utility functions for grid calculations and position operations.
 * These functions have no dependencies on React or Three.js, making them easy to test.
 */

export type Position3D = [number, number, number];

/**
 * Check if two 3D positions are equal
 */
export function positionsEqual(
  pos1: Position3D,
  pos2: Position3D | null
): boolean {
  if (!pos2) return false;
  return pos1[0] === pos2[0] && pos1[1] === pos2[1] && pos1[2] === pos2[2];
}

/**
 * Generate all grid point positions for a given grid size.
 * Grid extends from -gridSize/2 to +gridSize/2 in X and Z directions.
 * Y is always 0 (grid plane).
 */
export function generateGridPoints(gridSize: number): Position3D[] {
  const points: Position3D[] = [];
  
  for (let x = -gridSize / 2; x <= gridSize / 2; x++) {
    for (let z = -gridSize / 2; z <= gridSize / 2; z++) {
      points.push([x, 0, z]);
    }
  }
  
  return points;
}

/**
 * Calculate valid endpoints for a line path from a start position.
 * Valid endpoints are points that lie on a straight line (horizontal, vertical, or diagonal)
 * from the start position.
 */
export function getValidLineEndpoints(
  startPos: Position3D,
  gridSize: number
): Position3D[] {
  // Round start position to integers to ensure proper comparison with grid points
  const startX = Math.round(startPos[0]);
  const startY = Math.round(startPos[1]);
  const startZ = Math.round(startPos[2]);
  
  const validPoints: Position3D[] = [];
  const gridHalf = gridSize / 2;
  
  // Generate all points in the grid
  for (let x = -gridHalf; x <= gridHalf; x++) {
    for (let z = -gridHalf; z <= gridHalf; z++) {
      const y = 0; // Grid is on y=0 plane
      
      // Skip the start position itself
      if (x === startX && z === startZ) continue;
      
      // Check if point is on a straight line (horizontal, vertical, or diagonal)
      const dx = x - startX;
      const dz = z - startZ;
      
      // Valid if: horizontal (dz === 0), vertical (dx === 0), or diagonal (|dx| === |dz|)
      const isHorizontal = dz === 0;
      const isVertical = dx === 0;
      const isDiagonal = Math.abs(dx) === Math.abs(dz);
      
      if (isHorizontal || isVertical || isDiagonal) {
        validPoints.push([x, y, z]);
      }
    }
  }
  
  return validPoints;
}

/**
 * Calculate all points on a line between start and end positions.
 * Uses interpolation to generate intermediate points.
 * Returns deduplicated array ensuring start and end are included.
 */
export function calculateLinePoints(
  start: Position3D,
  end: Position3D
): Position3D[] {
  const [startX, startY, startZ] = start;
  const [endX, endY, endZ] = end;
  
  // Validate inputs
  if (
    !Number.isFinite(startX) ||
    !Number.isFinite(startY) ||
    !Number.isFinite(startZ) ||
    !Number.isFinite(endX) ||
    !Number.isFinite(endY) ||
    !Number.isFinite(endZ)
  ) {
    console.warn('Invalid start or end position for line calculation', {
      start,
      end,
    });
    return [start, end]; // Return at least start and end
  }
  
  const points: Position3D[] = [];
  const dx = endX - startX;
  const dz = endZ - startZ;
  
  // Calculate the number of steps needed (use the larger of dx or dz)
  const steps = Math.max(Math.abs(dx), Math.abs(dz));
  
  if (steps === 0) {
    // Start and end are the same
    return [start];
  }
  
  // Ensure steps is at least 1 to avoid division by zero
  const safeSteps = Math.max(1, steps);
  
  // Interpolate between start and end
  for (let i = 0; i <= safeSteps; i++) {
    const t = safeSteps > 0 ? i / safeSteps : 0;
    const x = Math.round(startX + dx * t);
    const z = Math.round(startZ + dz * t);
    const y = 0; // Grid is on y=0 plane
    
    // Validate calculated point
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      points.push([x, y, z]);
    }
  }
  
  // Ensure we have at least start and end points
  if (points.length === 0) {
    return [start, end];
  }
  
  // Ensure start and end are included
  const hasStart = points.some(
    (p) => p[0] === startX && p[1] === startY && p[2] === startZ
  );
  const hasEnd = points.some(
    (p) => p[0] === endX && p[1] === endY && p[2] === endZ
  );
  
  if (!hasStart) points.unshift(start);
  if (!hasEnd) points.push(end);
  
  // Deduplicate consecutive identical points
  const deduplicated: Position3D[] = [];
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const prev = deduplicated[deduplicated.length - 1];
    
    if (
      !prev ||
      prev[0] !== current[0] ||
      prev[1] !== current[1] ||
      prev[2] !== current[2]
    ) {
      deduplicated.push(current);
    }
  }
  
  // Ensure we have at least 2 points for a valid line
  if (deduplicated.length < 2) {
    return [start, end];
  }
  
  return deduplicated;
}

