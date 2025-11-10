import { renderHook, act } from '@testing-library/react';
import { useGridInteraction } from './useGridInteraction';
import { Position3D } from '../utils/gridUtils';

// Mock services
const mockCoordinateRegistry = {
  getOrCreate: jest.fn((pos: Position3D) => ({
    id: `coord_${pos[0]}_${pos[1]}_${pos[2]}`,
    position: pos,
    name: undefined,
  })),
  getAll: jest.fn(() => []),
  getById: jest.fn(),
  getByPosition: jest.fn(),
  updateName: jest.fn(),
  remove: jest.fn(),
  getByPositions: jest.fn(),
};

const mockRelationshipManager = {
  attachTargetToCoordinate: jest.fn(),
  attachPathToCoordinates: jest.fn(),
  detachTargetFromCoordinate: jest.fn(),
  detachPathFromCoordinate: jest.fn(),
  removeTargetRelationships: jest.fn(),
  removePathRelationships: jest.fn(),
  getTargetCoordinates: jest.fn(),
  getPathCoordinates: jest.fn(),
  getCoordinateTargets: jest.fn(),
  getCoordinatePaths: jest.fn(),
  getRelatedItems: jest.fn(),
  getRelationshipCounts: jest.fn(),
};

describe('useGridInteraction', () => {
  const mockOnPlacedObjectsChange = jest.fn();
  const mockOnSelectItem = jest.fn();
  const mockOnCoordinatesChange = jest.fn();
  const mockOnPathCreationComplete = jest.fn();
  const mockOnPathCreationError = jest.fn();

  const defaultOptions = {
    gridSize: 20,
    placedPaths: [],
    placedObjects: [],
    onPlacedObjectsChange: mockOnPlacedObjectsChange,
    onSelectItem: mockOnSelectItem,
    onCoordinatesChange: mockOnCoordinatesChange,
    coordinateRegistry: mockCoordinateRegistry,
    relationshipManager: mockRelationshipManager,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle grid point click and place object', () => {
    const { result } = renderHook(() => useGridInteraction(defaultOptions));

    act(() => {
      result.current.handleGridPointClick([1, 0, 2]);
    });

    expect(mockOnSelectItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'coordinate',
        position: [1, 0, 2],
      })
    );
    expect(mockOnPlacedObjectsChange).toHaveBeenCalled();
    expect(mockCoordinateRegistry.getOrCreate).toHaveBeenCalledWith([1, 0, 2]);
  });

  it('should select path when clicking on lit tile', () => {
    const placedPaths = [
      {
        id: 'path-1',
        pathType: 'line',
        pathLabel: 'Test Path',
        litTiles: [[1, 0, 2]] as Position3D[],
      },
    ];

    const { result } = renderHook(() =>
      useGridInteraction({
        ...defaultOptions,
        placedPaths,
      })
    );

    act(() => {
      result.current.handleGridPointClick([1, 0, 2]);
    });

    expect(mockOnSelectItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'path',
        id: 'path-1',
      })
    );
    expect(mockOnPlacedObjectsChange).not.toHaveBeenCalled();
  });

  it('should handle path creation mode', () => {
    const pathCreationMode = {
      isActive: true,
      type: 'line' as const,
      startPosition: [0, 0, 0] as Position3D,
      pathType: 'path-line',
      pathLabel: 'Test Path',
    };

    const { result } = renderHook(() =>
      useGridInteraction({
        ...defaultOptions,
        pathCreationMode,
        onPathCreationComplete: mockOnPathCreationComplete,
        onPathCreationError: mockOnPathCreationError,
      })
    );

    act(() => {
      result.current.handleGridPointClick([2, 0, 0]); // Valid endpoint (horizontal line)
    });

    expect(mockOnPathCreationComplete).toHaveBeenCalledWith(
      [0, 0, 0],
      [2, 0, 0],
      'path-line',
      'Test Path'
    );
  });

  it('should show error for invalid path endpoint', () => {
    const pathCreationMode = {
      isActive: true,
      type: 'line' as const,
      startPosition: [0, 0, 0] as Position3D,
      pathType: 'path-line',
      pathLabel: 'Test Path',
    };

    const { result } = renderHook(() =>
      useGridInteraction({
        ...defaultOptions,
        pathCreationMode,
        onPathCreationError: mockOnPathCreationError,
      })
    );

    act(() => {
      result.current.handleGridPointClick([1, 0, 1]); // Invalid endpoint (not on line)
    });

    expect(mockOnPathCreationError).toHaveBeenCalled();
  });

  it('should prevent selecting start position as endpoint', () => {
    const pathCreationMode = {
      isActive: true,
      type: 'line' as const,
      startPosition: [0, 0, 0] as Position3D,
      pathType: 'path-line',
      pathLabel: 'Test Path',
    };

    const { result } = renderHook(() =>
      useGridInteraction({
        ...defaultOptions,
        pathCreationMode,
        onPathCreationError: mockOnPathCreationError,
      })
    );

    act(() => {
      result.current.handleGridPointClick([0, 0, 0]); // Same as start position
    });

    expect(mockOnPathCreationError).toHaveBeenCalledWith(
      'Cannot select the start point as the endpoint'
    );
  });
});

