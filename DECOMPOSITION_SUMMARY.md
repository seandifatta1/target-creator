# InfiniteGrid Decomposition - Practical Summary

## What I've Created

I've created example extractions to demonstrate the decomposition pattern:

### 1. **Utility Functions** (`src/utils/gridUtils.ts`)
- ✅ `positionsEqual()` - Compare 3D positions
- ✅ `generateGridPoints()` - Generate grid positions
- ✅ `getValidLineEndpoints()` - Calculate valid line endpoints
- ✅ `calculateLinePoints()` - Interpolate points between start/end
- ✅ Full test suite (`gridUtils_test.ts`)

**Why start here**: These are pure functions with no dependencies, making them the easiest and safest to extract and test.

### 2. **GridPoint Component** (`src/components/GridPoint.tsx`)
- ✅ Extracted from lines 21-95 of InfiniteGrid.tsx
- ✅ Test file (`GridPoint_test.tsx`)
- ✅ Storybook story (`GridPoint.stories.tsx`)

**Why extract this**: It's already well-isolated and can be tested independently.

### 3. **useMousePosition Hook** (`src/hooks/useMousePosition.ts`)
- ✅ Extracted mouse position tracking logic
- ✅ Test file (`useMousePosition_test.ts`)

**Why extract this**: Reusable across components and easy to test in isolation.

## Next Steps (In Order)

### Immediate (Low Risk)
1. **Update InfiniteGrid.tsx** to use the extracted utilities:
   ```typescript
   import { positionsEqual, generateGridPoints, getValidLineEndpoints, calculateLinePoints } from '../utils/gridUtils';
   import { GridPoint } from './GridPoint';
   import { useMousePosition } from '../hooks/useMousePosition';
   ```

2. **Extract DragHandler** (`src/components/DragHandler.tsx`)
   - Lines 98-144
   - Already isolated, just needs to be moved

3. **Extract OrbitControlsWrapper** (`src/components/OrbitControlsWrapper.tsx`)
   - Lines 897-936
   - Already isolated

### Short Term (Medium Risk)
4. **Extract PathRenderer** (`src/components/PathRenderer.tsx`)
   - Lines 622-836
   - Complex but self-contained rendering logic
   - Accepts path data and callbacks as props

5. **Extract DragTooltip** (`src/components/DragTooltip.tsx`)
   - Lines 939-1003
   - UI component that can be tested independently

6. **Create usePathCreation hook** (`src/hooks/usePathCreation.ts`)
   - Extract path creation mode state and handlers
   - Use `calculateLinePoints` from utils

7. **Create useGridInteraction hook** (`src/hooks/useGridInteraction.ts`)
   - Extract grid point click handlers
   - Coordinate registration logic

### Medium Term (Higher Risk)
8. **Split InfiniteGrid into two components**:
   - `InfiniteGridScene.tsx` - 3D rendering (presentational)
   - `InfiniteGridCanvas.tsx` - UI orchestration (container)

## Testing Strategy

Each extraction should follow this pattern:
1. **Unit tests** for pure functions (like `gridUtils_test.ts`)
2. **Component tests** for React components (like `GridPoint_test.tsx`)
3. **Storybook stories** for UI components (like `GridPoint.stories.tsx`)
4. **Integration tests** for hooks and complex interactions

## Dependency Injection Pattern

Follow existing patterns in the codebase:
- Services accept interfaces (e.g., `ICoordinateRegistry`)
- Hooks accept optional instances for DI
- Components receive dependencies as props

## Benefits Achieved

✅ **Testability**: Pure functions can be unit tested without React/Three.js
✅ **Reusability**: Utilities and hooks can be used across components
✅ **Readability**: Smaller, focused files are easier to understand
✅ **Maintainability**: Changes are isolated to specific files
✅ **Type Safety**: Shared types (like `Position3D`) ensure consistency

## Migration Strategy

1. Extract utilities first (done ✅)
2. Extract isolated components (GridPoint done ✅)
3. Extract hooks for state management
4. Refactor InfiniteGrid to use extracted pieces
5. Split remaining large components

This incremental approach minimizes risk and allows testing at each step.

