# InfiniteGrid Decomposition Plan

## Overview
The `InfiniteGrid.tsx` file is 1778 lines and contains multiple responsibilities. This plan outlines practical steps to decompose it into smaller, more testable, and maintainable pieces.

## Priority Order (Start Here)

### Phase 1: Extract Pure Utility Functions (Lowest Risk, High Value)
**Location**: `/src/utils/gridUtils.ts`

Extract these pure functions that have no dependencies on React or Three.js:
- `positionsEqual()` - Compare two 3D positions
- `generateGridPoints()` - Generate grid point positions
- `getValidLineEndpoints()` - Calculate valid line endpoints
- `calculateLinePoints()` - Interpolate points between start and end
- `calculateLineRotation()` - Calculate rotation for line segments (from path rendering)

**Benefits**: 
- Easy to unit test
- No React dependencies
- Reusable across components

### Phase 2: Extract Sub-Components (Medium Risk, High Value)
**Location**: `/src/components/`

1. **`GridPoint.tsx`** - Extract the GridPoint component (lines 21-95)
   - Already well-isolated
   - Needs its own test file and Storybook story

2. **`DragHandler.tsx`** - Extract DragHandler (lines 98-144)
   - Three.js specific component
   - Can be tested with React Three Fiber test utils

3. **`PathRenderer.tsx`** - Extract path rendering logic (lines 622-836)
   - Complex rendering logic that's hard to test in current form
   - Should accept path data and callbacks as props

4. **`OrbitControlsWrapper.tsx`** - Extract (lines 897-936)
   - Already relatively isolated

5. **`DragTooltip.tsx`** - Extract (lines 939-1003)
   - UI component that can be tested independently

### Phase 3: Extract Custom Hooks (Medium Risk, High Value)
**Location**: `/src/hooks/`

1. **`useGridPointState.ts`** - Manage grid point hover/selection state
   - Extract: `hoveredGridPoint`, `selectedGridPoint` state and handlers

2. **`usePathCreation.ts`** - Manage path creation mode
   - Extract: `pathCreationMode` state and all path creation handlers
   - Includes: `handlePathCreationComplete`, `handlePathCreationError`, `handlePathCreationCancel`
   - Includes: `calculateLinePoints` logic

3. **`useGridInteraction.ts`** - Handle grid point clicks and interactions
   - Extract: `handleGridPointClick`, `handleGridPointContextMenu`
   - Coordinate registration logic

4. **`useMousePosition.ts`** - Track mouse position globally
   - Extract: mouse position tracking logic (lines 343-367)

5. **`useObjectPlacement.ts`** - Handle object placement from drag operations
   - Extract: drop handling logic (lines 388-478)

6. **`useContextMenu.ts`** - Manage context menu state and handlers
   - Extract: context menu state and all handlers

7. **`useNamingModal.ts`** - Manage naming modal state
   - Extract: naming modal state and `handleNameSave`

### Phase 4: Extract Business Logic Services (Low Risk, High Value)
**Location**: `/src/services/` (if needed) or keep in hooks

1. **`PathCalculationService.ts`** - Pure path calculation logic
   - Move `calculateLinePoints`, `getValidLineEndpoints` here
   - Make it DI-friendly for testing

2. **`GridPointCalculationService.ts`** - Grid point generation
   - Move `generateGridPoints` here

### Phase 5: Split Main Component (Higher Risk, Do Last)
**Location**: `/src/components/`

1. **`InfiniteGridScene.tsx`** - The 3D scene (current `InfiniteGrid` component)
   - Contains all Three.js rendering
   - Should be a presentational component

2. **`InfiniteGridCanvas.tsx`** - The canvas wrapper (current `InfiniteGridCanvas`)
   - Contains UI overlays, modals, state management
   - Orchestrates the scene

## Testing Strategy

Each extracted piece should have:
1. **Unit tests** - For utilities and pure functions
2. **Component tests** - For React components
3. **Storybook stories** - For UI components (per project rules)
4. **Integration tests** - For hooks and complex interactions

## Dependency Injection Pattern

Follow the existing pattern in the codebase:
- Services accept interfaces (e.g., `ICoordinateRegistry`)
- Hooks accept optional instances for DI
- Components receive dependencies as props

## Example: First Extraction

See `src/utils/gridUtils.ts` for example of Phase 1 extraction.

