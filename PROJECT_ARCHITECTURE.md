# Project Architecture Documentation

## Overview

This document describes the project structure, component organization, and testing strategies used in the target-creator application.

## File Organization Principles

### Component Structure

**Components with multiple files** should live in a folder with the same name as the component.

```
ComponentName/
  ├── ComponentName.tsx          # Main component file
  ├── ComponentName.stories.tsx   # Storybook stories
  ├── ComponentName_test.tsx      # Component tests
  ├── ComponentName.css           # Component styles
  ├── ComponentSubComponent.tsx   # Sub-components (if needed)
  ├── utils.ts                   # Component-specific utilities
  ├── helpers.ts                 # Component-specific helpers
  └── hooks/
      ├── useComponentHook.ts    # Component-specific hooks
      └── useComponentHook_test.ts
```

**Example:**
```
InfiniteGrid/
  ├── InfiniteGrid.tsx           # Main container component
  ├── InfiniteGridScene.tsx      # 3D scene component
  ├── InfiniteGrid.stories.tsx
  ├── InfiniteGrid_test.tsx
  ├── InfiniteGrid.css
  ├── utils.ts                   # Grid-specific utilities
  └── hooks/
      ├── usePathCreation.ts     # Path creation logic
      ├── usePathCreation_test.ts
      └── useGridInteraction.ts  # Grid interaction logic
```

### Utility Functions

- **Component-specific utilities** live at the root of the component folder
  - Example: `InfiniteGrid/utils.ts` or `InfiniteGrid/helpers.ts`
- **Project-level utilities** (`/src/utils`) are only for code used across multiple unrelated components
  - Example: `gridUtils.ts` if used by InfiniteGrid, PathRenderer, and other components

### Hooks Organization

- **Component-specific hooks** live in the component's folder
  - Example: `InfiniteGrid/hooks/usePathCreation.ts`
- **Project-level hooks** (`/src/hooks`) are only for hooks used across multiple unrelated components
  - Example: `useMousePosition` if used by DragTooltip, InfiniteGrid, and other components

### Recursive Structure

This structure applies **recursively** through the app. If a sub-component also has multiple files, it should have its own folder structure.

## Testing Strategy

### Hook Testing (MUST follow all strategies from HOOK_TESTING_BEST_PRACTICES.md)

#### Layer 1: Extract Pure Logic Functions
- Extract business logic from hooks into pure, testable functions
- Place in component-specific utils (e.g., `ComponentName/utils.ts`)
- Test with standard Jest (no `renderHook` or `act` needed)

#### Layer 2: Test Hook Integration
- Use `renderHook` from `@testing-library/react` to test React-specific behavior
- Test state updates, callbacks, and effects
- Mock dependencies via dependency injection

#### Layer 3: Component Integration Tests
- Test hooks within actual components using React Testing Library
- Verify user interactions and component behavior

#### Layer 4: Storybook for Visual Testing
- Create wrapper components that use the hook
- Visualize hook behavior and state changes

### Component Testing
- Each component should have a corresponding Jest test file
- Test files named `<component-name>_test.tsx`
- Storybook stories for visual testing and documentation

## Current Project Structure

### Components (`/src/components`)
- Flat structure (needs reorganization)
- Components with multiple files should be moved to folders

### Hooks (`/src/hooks`)
- Mix of project-level and component-specific hooks
- Needs analysis to determine which should move to component folders

### Utils (`/src/utils`)
- Mix of project-level and component-specific utilities
- Needs analysis to determine which should move to component folders

## Dependency Injection Pattern

- All hooks and utilities should support dependency injection
- Pass dependencies as parameters rather than importing directly
- Makes testing easier and code more modular

## Best Practices

1. **Start with component-specific organization**
   - Keep code close to where it's used
   - Only promote to project-level when truly shared

2. **Extract pure logic functions**
   - Makes testing easier
   - No React dependencies
   - Fast unit tests

3. **Use dependency injection**
   - Testable in isolation
   - Easy to mock
   - Flexible architecture

4. **Document with Storybook**
   - Visual testing
   - Interactive documentation
   - Component showcase

