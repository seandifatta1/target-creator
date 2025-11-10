# Implementation Plan: Hooks Updates & Project Structure

## Overview

This plan outlines the steps to:
1. Reorganize project structure according to component-based architecture
2. Update all hooks to follow HOOK_TESTING_BEST_PRACTICES.md strategies
3. Move component-specific code to component folders
4. Ensure proper testing at all layers

## Phase 1: Analyze Current Structure & Dependencies

### 1.1 Component Analysis
**Status**: ✅ Identified

Components that need folder organization:
- **InfiniteGrid** - Has InfiniteGridScene, needs folder structure
- **Other components** - Check if any have multiple related files

### 1.2 Hook Usage Analysis
**Status**: ✅ Completed

Hooks analysis results:
- `usePathCreation` - Used by: InfiniteGrid only → **Move to InfiniteGrid/hooks/**
- `useGridInteraction` - Used by: InfiniteGridScene only → **Move to InfiniteGrid/hooks/**
- `useMousePosition` - Used by: DragTooltip, InfiniteGridScene → **Keep project-level** (used by multiple components)
- `useCoordinateRegistry` - Used by: App → **Keep project-level** (used by App, likely shared)
- `useRelationshipManager` - Used by: App → **Keep project-level** (used by App, likely shared)
- `DragTargetContext` - Used by: Multiple components → **Keep project-level**

### 1.3 Utility Usage Analysis
**Status**: ✅ Completed

Utilities analysis results:
- `pathCreationLogic` - Used by: usePathCreation only → **Move to InfiniteGrid/utils/**
- `gridUtils` - Used by: InfiniteGridScene, PathRenderer, DragTooltip, hooks → **Keep project-level** (used by multiple components)

**Dependency Summary**:
- `gridUtils` is truly project-level (used by 5+ files)
- `pathCreationLogic` is component-specific (only used by usePathCreation)
- `usePathCreation` and `useGridInteraction` are component-specific (only used by InfiniteGrid)

## Phase 2: Reorganize InfiniteGrid Component

### 2.1 Create InfiniteGrid Folder Structure
```
InfiniteGrid/
  ├── InfiniteGrid.tsx              # Main container (move from src/components)
  ├── InfiniteGridScene.tsx         # 3D scene (move from src/components)
  ├── InfiniteGrid.stories.tsx       # Move from src/components
  ├── InfiniteGrid_test.tsx         # Move from src/components
  ├── InfiniteGrid.css              # Move from src/components
  ├── utils.ts                      # NEW: Component-specific utilities
  └── hooks/
      ├── usePathCreation.ts        # Move from src/hooks
      ├── usePathCreation_test.ts   # Move from src/hooks
      ├── usePathCreation.stories.tsx # Move from src/hooks
      ├── useGridInteraction.ts     # Move from src/hooks
      └── useGridInteraction_test.ts # Move from src/hooks
```

**Steps**:
1. Create `src/components/InfiniteGrid/` folder
2. Move files to new structure
3. Update all imports across codebase
4. Verify no broken references

### 2.2 Extract Pure Logic Functions
**File**: `InfiniteGrid/utils.ts`

Extract from hooks:
- From `usePathCreation`: Path creation validation, data creation logic
- From `useGridInteraction`: Grid point validation, coordinate registration helpers
- Move `pathCreationLogic.ts` functions here (or merge if appropriate)

**Pure functions to extract**:
```typescript
// From usePathCreation
- validatePathEndpoint()
- createPathData()
- shouldShowPathCreationToast()
- createPathCreationToastConfig()

// From useGridInteraction (if any pure logic exists)
- validateGridPointClick()
- createPlacedObject()
```

**Testing**: Create `InfiniteGrid/utils_test.ts` with Jest unit tests

## Phase 3: Add Documentation to All Functions

### 3.1 Documentation Requirements
**Status**: ⏳ To be implemented

All functions must have detailed documentation explaining:
1. **How the function is used in the app** - UX-level description
2. **Dependency injection explanation** - Why DI is used and benefits
3. **Parameters and return values** - Clear descriptions
4. **Usage examples** - Contextual examples

**Files to update**:
- All hook files
- All utility files
- All component files (especially complex ones)
- All service files

**Priority order**:
1. New files created during reorganization
2. Existing hooks
3. Existing utilities
4. Existing components

## Phase 4: Update Hook Testing (Following Best Practices)

### 4.1 Update usePathCreation Hook

**Current State**: 
- Has some tests with `renderHook`
- Uses `pathCreationLogic` from `src/utils` (needs to move)

**Required Updates**:
1. ✅ Extract pure logic to `InfiniteGrid/utils.ts`
2. ✅ Update hook to use local utils
3. ✅ Update tests to test pure functions separately
4. ✅ Ensure `renderHook` tests cover React behavior
5. ✅ Verify Storybook story exists (already has one)

**Files to update**:
- `InfiniteGrid/hooks/usePathCreation.ts` - Use local utils
- `InfiniteGrid/hooks/usePathCreation_test.ts` - Add pure function tests
- `InfiniteGrid/utils_test.ts` - Test extracted pure functions

### 4.2 Update useGridInteraction Hook

**Current State**:
- Has tests with `renderHook`
- May have pure logic to extract

**Required Updates**:
1. Extract any pure logic to `InfiniteGrid/utils.ts`
2. Update hook to use local utils
3. Update tests to test pure functions separately
4. Ensure `renderHook` tests cover React behavior
5. Create Storybook story (if missing)

**Files to update**:
- `InfiniteGrid/hooks/useGridInteraction.ts` - Extract pure logic
- `InfiniteGrid/hooks/useGridInteraction_test.ts` - Add pure function tests
- `InfiniteGrid/utils_test.ts` - Add extracted pure function tests

### 4.3 Verify Other Hooks

**Project-level hooks to verify**:
- `useMousePosition` - Check if needs pure logic extraction
- `useCoordinateRegistry` - Likely just wrapper, verify testing
- `useRelationshipManager` - Likely just wrapper, verify testing
- `DragTargetContext` - Verify testing strategy

## Phase 5: Update Project-Level Hooks/Utils

### 5.1 Determine Project-Level vs Component-Specific

**Criteria**: 
- Used by 3+ unrelated components → Project-level
- Used by 1-2 components → Component-specific

**Action**: Run usage analysis to confirm

### 5.2 Update Project-Level Hooks
- Ensure they follow testing best practices
- Extract pure logic if applicable
- Add Storybook stories if missing

## Phase 6: Update Imports & References

### 6.1 Update All Import Statements
- Update imports in `App.tsx`
- Update imports in other components
- Update imports in tests
- Update imports in stories

### 6.2 Verify No Broken References
- Run linter
- Run tests
- Check Storybook

## Phase 7: Documentation Updates

### 6.1 Update Documentation
- Update README if needed
- Update any architecture docs
- Ensure examples reflect new structure

## Implementation Order

### Priority 1: InfiniteGrid Reorganization (High Impact)
1. Create InfiniteGrid folder structure
2. Move files
3. Extract pure logic functions
4. Update imports

### Priority 2: Add Documentation (High Value)
1. Add documentation to all new files created
2. Add documentation to existing hooks
3. Add documentation to existing utilities

### Priority 3: Hook Testing Updates (High Value)
1. Update usePathCreation with pure logic extraction
2. Update useGridInteraction with pure logic extraction
3. Add missing tests
4. Verify Storybook stories

### Priority 4: Project-Level Analysis (Medium Priority)
1. Analyze hook/utility usage
2. Move component-specific code
3. Keep project-level code in `/src/hooks` and `/src/utils`

### Priority 5: Verification & Cleanup (Low Risk)
1. Update all imports
2. Run full test suite
3. Verify Storybook
4. Update documentation

## Success Criteria

✅ All components with multiple files are in folders
✅ All component-specific hooks are in component folders
✅ All component-specific utils are in component folders
✅ All functions have detailed documentation (UX-level usage + DI explanation)
✅ All hooks follow layered testing strategy:
   - Pure logic functions extracted and tested
   - Hook behavior tested with renderHook
   - Component integration tests exist
   - Storybook stories for visual testing
✅ All imports updated and working
✅ All tests passing
✅ No broken references

## Risk Mitigation

1. **Incremental changes**: Do one component at a time
2. **Test after each step**: Verify tests pass before moving on
3. **Keep backups**: Git commits after each phase
4. **Verify imports**: Use IDE refactoring tools where possible

## Estimated Effort

- Phase 1 (Analysis): 1-2 hours
- Phase 2 (InfiniteGrid Reorganization): 2-3 hours
- Phase 3 (Documentation): 2-3 hours
- Phase 4 (Hook Testing Updates): 3-4 hours
- Phase 5 (Project-Level Updates): 1-2 hours
- Phase 6 (Import Updates): 1-2 hours
- Phase 7 (Documentation Updates): 1 hour

**Total**: ~12-16 hours

