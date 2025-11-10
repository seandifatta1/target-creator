import { calculateLinePoints, getValidLineEndpoints, Position3D } from './gridUtils';

export interface PathData {
  id: string;
  points: Position3D[];
  pathType: string;
  pathLabel: string;
  name?: string;
  litTiles: Position3D[];
}

export interface PathCreationMode {
  isActive: boolean;
  type: 'line' | 'curve' | null;
  startPosition: Position3D | null;
  pathType: string;
  pathLabel: string;
  pathName?: string;
}

/**
 * Validates if an endpoint is valid for path creation.
 * Pure function - no side effects, easy to test.
 */
export function validatePathEndpoint(
  startPos: Position3D,
  endPos: Position3D,
  gridSize: number
): { isValid: boolean; error?: string } {
  // Don't allow selecting the start position as endpoint
  if (
    startPos[0] === endPos[0] &&
    startPos[1] === endPos[1] &&
    startPos[2] === endPos[2]
  ) {
    return {
      isValid: false,
      error: 'Cannot select the start point as the endpoint',
    };
  }

  // Check if the clicked point is a valid endpoint
  const validEndpoints = getValidLineEndpoints(startPos, gridSize);
  const isValid = validEndpoints.some(
    (ep) =>
      ep[0] === endPos[0] && ep[1] === endPos[1] && ep[2] === endPos[2]
  );

  if (!isValid) {
    return {
      isValid: false,
      error:
        'Please select a valid endpoint. Valid endpoints are points directly through the start point (straight or diagonal).',
    };
  }

  return { isValid: true };
}

/**
 * Creates a new path data object from start and end positions.
 * Pure function - no side effects, easy to test.
 */
export function createPathData(
  startPos: Position3D,
  endPos: Position3D,
  pathType: string,
  pathLabel: string,
  pathName?: string
): PathData {
  const allPositions = calculateLinePoints(startPos, endPos);
  return {
    id: `path_${Date.now()}`,
    points: [],
    pathType: pathType,
    pathLabel: pathLabel,
    name: pathName,
    litTiles: allPositions,
  };
}

/**
 * Determines if a toast should be shown for path creation.
 * Pure function - easy to test.
 */
export function shouldShowPathCreationToast(
  mode: PathCreationMode
): boolean {
  return mode.isActive && mode.startPosition !== null;
}

/**
 * Creates toast configuration for path creation mode.
 * Pure function - easy to test.
 */
export function createPathCreationToastConfig(
  pathLabel: string,
  onDismiss: () => void,
  onCancel: () => void
) {
  return {
    message: `Path creation mode: ${pathLabel}. Select an endpoint. Click this toast to exit path creation mode.`,
    intent: 'primary' as const,
    timeout: 0, // Don't auto-dismiss
    onDismiss,
    action: {
      text: 'Cancel',
      onClick: onCancel,
    },
  };
}

