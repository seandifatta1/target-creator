import { calculateLinePoints, getValidLineEndpoints, Position3D } from '../../utils/gridUtils';

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
 * validatePathEndpoint - Validates if a clicked grid point is a valid endpoint for path creation
 * 
 * **How it's used in the app:**
 * This function is called when a user is in path creation mode and clicks on a grid point
 * to select an endpoint. For example, when a user right-clicks a grid point and selects
 * "Create Path", then clicks another grid point, this function validates whether that second
 * click is a valid endpoint. It's part of the path creation flow that allows users to create
 * straight or diagonal paths between two points on the 3D grid.
 * 
 * **Dependency Injection:**
 * This is a pure function with no dependencies - it only uses the provided parameters.
 * This design enables:
 * - Easy unit testing without React or Three.js dependencies
 * - Fast execution without side effects
 * - Reusability across different contexts
 * - Clear separation of validation logic from UI logic
 * 
 * @param startPos - The starting position of the path (3D coordinates)
 * @param endPos - The potential endpoint position to validate (3D coordinates)
 * @param gridSize - The size of the grid (used to calculate valid endpoints)
 * @returns Object with `isValid` boolean and optional `error` message string
 * 
 * @example
 * ```typescript
 * const result = validatePathEndpoint([0, 0, 0], [2, 0, 0], 20);
 * if (result.isValid) {
 *   // Proceed with path creation
 * } else {
 *   // Show error message to user
 *   showError(result.error);
 * }
 * ```
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
 * createPathData - Creates a complete path data object from start and end positions
 * 
 * **How it's used in the app:**
 * This function is called when a user completes path creation by clicking a valid endpoint.
 * For example, when a user selects a start point, then clicks a valid endpoint, this function
 * calculates all the grid points that the path should light up and creates the path data structure.
 * It's part of the path creation flow that transforms user interactions into path data that can
 * be rendered on the 3D grid and stored in the application state.
 * 
 * **Dependency Injection:**
 * This is a pure function that uses `calculateLinePoints` from project-level `gridUtils`.
 * The dependency on `gridUtils` is acceptable because:
 * - `gridUtils` is a shared utility used across multiple components
 * - The function remains pure and testable
 * - The calculation logic is centralized and reusable
 * 
 * @param startPos - The starting position of the path (3D coordinates)
 * @param endPos - The ending position of the path (3D coordinates)
 * @param pathType - The type of path (e.g., 'path-line', 'path-curve')
 * @param pathLabel - The display label for the path
 * @param pathName - Optional user-defined name for the path
 * @returns Complete PathData object with calculated litTiles array
 * 
 * @example
 * ```typescript
 * const pathData = createPathData(
 *   [0, 0, 0],
 *   [5, 0, 0],
 *   'path-line',
 *   'Main Corridor',
 *   'Corridor A'
 * );
 * // pathData.litTiles contains all points between start and end
 * ```
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
 * shouldShowPathCreationToast - Determines if a toast notification should be displayed for path creation mode
 * 
 * **How it's used in the app:**
 * This function is called when the path creation mode state changes to determine whether to show
 * a toast notification to the user. For example, when a user right-clicks a grid point and selects
 * "Create Path", the app enters path creation mode. This function checks if the mode is active and
 * has a start position, which indicates that a toast should be shown to guide the user to select
 * an endpoint. It's part of the user feedback system that helps users understand what action they
 * need to take next in the path creation workflow.
 * 
 * **Dependency Injection:**
 * This is a pure function with no dependencies - it only uses the provided PathCreationMode object.
 * This design enables:
 * - Easy unit testing without React or UI dependencies
 * - Fast execution without side effects
 * - Clear separation of UI logic (when to show) from business logic (what to show)
 * - Reusability in different UI contexts
 * 
 * @param mode - The current path creation mode state object
 * @returns Boolean indicating whether a toast should be shown
 * 
 * @example
 * ```typescript
 * const shouldShow = shouldShowPathCreationToast(pathCreationMode);
 * if (shouldShow && toasterRef.current) {
 *   toasterRef.current.show(createPathCreationToastConfig(...));
 * }
 * ```
 */
export function shouldShowPathCreationToast(
  mode: PathCreationMode
): boolean {
  return mode.isActive && mode.startPosition !== null;
}

/**
 * createPathCreationToastConfig - Creates the configuration object for path creation toast notifications
 * 
 * **How it's used in the app:**
 * This function is called when entering path creation mode to create the toast notification that
 * appears at the top of the screen. For example, when a user right-clicks a grid point and selects
 * "Create Path", this function generates the toast configuration that displays "Path creation mode:
 * [Path Label]. Select an endpoint. Click this toast to exit path creation mode." The toast includes
 * a Cancel button that allows users to exit path creation mode. It's part of the user guidance system
 * that provides clear instructions during the path creation workflow.
 * 
 * **Dependency Injection:**
 * The `onDismiss` and `onCancel` callbacks are injected as parameters rather than being hardcoded.
 * This design enables:
 * - Easy testing by passing mock functions
 * - Flexibility to customize behavior in different contexts
 * - Separation of toast configuration (what to show) from toast behavior (what happens on actions)
 * - Reusability across different toast implementations
 * 
 * @param pathLabel - The display label for the path being created (e.g., "Main Corridor")
 * @param onDismiss - Callback function called when the toast is dismissed by clicking it
 * @param onCancel - Callback function called when the Cancel button is clicked
 * @returns Toast configuration object compatible with Blueprint.js OverlayToaster
 * 
 * @example
 * ```typescript
 * const toastConfig = createPathCreationToastConfig(
 *   'Main Corridor',
 *   () => setPathCreationMode({ isActive: false, ... }),
 *   () => cancelPathCreation()
 * );
 * toasterRef.current?.show(toastConfig);
 * ```
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

