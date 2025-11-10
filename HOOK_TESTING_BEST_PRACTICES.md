# React Hook Testing Best Practices

## Overview

There are several standard approaches to testing React hooks, each with different trade-offs. The best practice is to use a **layered testing strategy** that combines multiple techniques.

## Strategy 1: Layered Testing (Recommended)

### Layer 1: Extract Pure Logic Functions
Extract business logic from hooks into pure, testable functions that don't depend on React.

**Benefits:**
- Easy to unit test without React
- Fast execution
- No need for `renderHook` or `act`
- Can be tested with standard Jest

**Example:**

```typescript
// utils/pathCreationLogic.ts
export function validatePathEndpoint(
  startPos: Position3D,
  endPos: Position3D,
  gridSize: number
): { isValid: boolean; error?: string } {
  if (startPos[0] === endPos[0] && startPos[1] === endPos[1] && startPos[2] === endPos[2]) {
    return { isValid: false, error: 'Cannot select the start point as the endpoint' };
  }
  
  const validEndpoints = getValidLineEndpoints(startPos, gridSize);
  const isValid = validEndpoints.some(ep => 
    ep[0] === endPos[0] && ep[1] === endPos[1] && ep[2] === endPos[2]
  );
  
  return { 
    isValid, 
    error: isValid ? undefined : 'Please select a valid endpoint' 
  };
}

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
    pathType,
    pathLabel,
    name: pathName,
    litTiles: allPositions,
  };
}
```

**Test:**
```typescript
// utils/pathCreationLogic_test.ts
describe('validatePathEndpoint', () => {
  it('should reject same start and end position', () => {
    const result = validatePathEndpoint([0, 0, 0], [0, 0, 0], 20);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('start point');
  });
  
  it('should accept valid horizontal endpoint', () => {
    const result = validatePathEndpoint([0, 0, 0], [2, 0, 0], 20);
    expect(result.isValid).toBe(true);
  });
});
```

### Layer 2: Test Hook Integration
Test the hook itself using `@testing-library/react-hooks` (or `renderHook` from `@testing-library/react`).

**Benefits:**
- Tests React-specific behavior (state updates, effects, refs)
- Tests hook return values and callbacks
- Verifies hook lifecycle

**Example:**

```typescript
// hooks/usePathCreation_test.ts
describe('usePathCreation', () => {
  it('should start path creation and show toast', () => {
    const { result } = renderHook(() => 
      usePathCreation([], mockSetPlacedPaths, { toasterRef: mockToasterRef })
    );
    
    act(() => {
      result.current.startPathCreation([0, 0, 0], 'path-line', 'Test');
    });
    
    expect(result.current.pathCreationMode.isActive).toBe(true);
    expect(mockToaster.show).toHaveBeenCalled();
  });
});
```

### Layer 3: Component Integration Tests
Test the hook within actual components using React Testing Library.

**Benefits:**
- Tests real component behavior
- Catches integration issues
- Tests user interactions

**Example:**

```typescript
// components/InfiniteGrid_test.tsx
describe('InfiniteGrid with usePathCreation', () => {
  it('should create path when clicking valid endpoints', () => {
    render(<InfiniteGrid {...props} />);
    
    // Start path creation
    fireEvent.click(screen.getByTestId('grid-point-0-0-0'));
    // ... trigger path creation mode
    
    // Complete path
    fireEvent.click(screen.getByTestId('grid-point-2-0-0'));
    
    expect(screen.getByText('Path created')).toBeInTheDocument();
  });
});
```

## Strategy 2: Storybook for Visual Testing

### Create Hook Stories with Wrapper Components

For hooks that have visual effects, create Storybook stories with wrapper components:

```typescript
// hooks/usePathCreation.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { usePathCreation } from './usePathCreation';
import { Button } from '@blueprintjs/core';

const PathCreationDemo: React.FC = () => {
  const [paths, setPaths] = useState([]);
  const toasterRef = useRef(null);
  
  const {
    pathCreationMode,
    startPathCreation,
    completePathCreation,
    cancelPathCreation,
  } = usePathCreation(paths, setPaths, { toasterRef });
  
  return (
    <div>
      <p>Mode: {pathCreationMode.isActive ? 'Active' : 'Inactive'}</p>
      <Button onClick={() => startPathCreation([0, 0, 0], 'path-line', 'Test')}>
        Start Path
      </Button>
      <Button onClick={() => completePathCreation([0, 0, 0], [2, 0, 0], 'path-line', 'Test')}>
        Complete Path
      </Button>
      <Button onClick={cancelPathCreation}>Cancel</Button>
    </div>
  );
};

const meta: Meta<typeof PathCreationDemo> = {
  title: 'Hooks/usePathCreation',
  component: PathCreationDemo,
};

export default meta;
```

## Strategy 3: Dependency Injection Pattern

Make hooks testable by accepting dependencies as parameters:

```typescript
// ✅ Good: DI-friendly
export function usePathCreation(
  placedPaths: PathData[],
  setPlacedPaths: (paths: PathData[]) => void,
  options: UsePathCreationOptions = {} // Dependencies injected
) {
  const { toasterRef, coordinateRegistry, relationshipManager } = options;
  // ...
}

// ❌ Bad: Hard to test
export function usePathCreation() {
  const toasterRef = useRef(OverlayToaster.create()); // Hard-coded dependency
  // ...
}
```

## Recommended Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          (Few, critical user flows)
                 /______\
                /        \
               /Integration\        (Component + Hook integration)
              /____________\
             /              \
            /   Unit Tests   \     (Pure functions + Hook behavior)
           /__________________\
```

### Distribution:
- **70% Unit Tests**: Pure functions + Hook behavior tests
- **20% Integration Tests**: Component + Hook integration
- **10% E2E Tests**: Critical user flows

## Best Practices Summary

### ✅ DO:

1. **Extract pure logic functions** from hooks
   - Test business logic separately
   - No React dependencies
   - Fast, simple tests

2. **Use `renderHook` for hook behavior**
   - Test state updates
   - Test callbacks
   - Test effects

3. **Use dependency injection**
   - Pass dependencies as parameters
   - Easy to mock
   - Testable in isolation

4. **Test edge cases**
   - Null/undefined handling
   - Error conditions
   - Boundary values

5. **Test cleanup**
   - Verify event listeners removed
   - Verify refs cleared
   - Verify timers cleared

### ❌ DON'T:

1. **Don't test implementation details**
   - Don't test internal state directly
   - Test through public API (returned values/callbacks)

2. **Don't over-mock**
   - Mock external dependencies
   - Don't mock React hooks (use real ones)

3. **Don't test React itself**
   - React is already tested
   - Focus on your logic

4. **Don't skip integration tests**
   - Unit tests alone aren't enough
   - Test how pieces work together

## Example: Refactored Hook with Extracted Logic

```typescript
// utils/pathCreationLogic.ts - Pure functions
export function validatePathEndpoint(...) { ... }
export function createPathData(...) { ... }
export function shouldShowToast(mode: PathCreationMode): boolean { ... }

// hooks/usePathCreation.ts - Hook with extracted logic
import { validatePathEndpoint, createPathData } from '../utils/pathCreationLogic';

export function usePathCreation(...) {
  const startPathCreation = useCallback((position, pathType, pathLabel, pathName) => {
    // Use extracted logic
    const shouldShow = shouldShowToast({ isActive: true, ... });
    if (shouldShow && toasterRef?.current) {
      // Show toast
    }
    setPathCreationMode({ ... });
  }, []);
  
  const completePathCreation = useCallback((startPos, endPos, pathType, pathLabel) => {
    // Validate using extracted function
    const validation = validatePathEndpoint(startPos, endPos, gridSize);
    if (!validation.isValid) {
      showError(validation.error);
      return;
    }
    
    // Create path using extracted function
    const newPath = createPathData(startPos, endPos, pathType, pathLabel, pathName);
    setPlacedPaths([...placedPaths, newPath]);
  }, []);
  
  return { ... };
}
```

## Testing Tools

1. **@testing-library/react-hooks** (or `renderHook` from `@testing-library/react`)
   - For testing hook behavior

2. **@testing-library/react**
   - For component integration tests

3. **Jest**
   - For pure function unit tests

4. **Storybook**
   - For visual testing and documentation

5. **MSW (Mock Service Worker)**
   - For mocking API calls in hooks

## Conclusion

The best approach is a **combination**:
1. Extract pure logic → Unit test with Jest
2. Test hook behavior → Use `renderHook`
3. Test component integration → Use React Testing Library
4. Visual testing → Use Storybook with wrapper components

This gives you:
- Fast unit tests (pure functions)
- Comprehensive hook tests (React behavior)
- Integration confidence (component tests)
- Visual documentation (Storybook)

