import { renderHook, act } from '@testing-library/react';
import { usePathCreation } from './usePathCreation';
import { Position3D } from '../../../utils/gridUtils';

// Mock OverlayToaster
jest.mock('@blueprintjs/core', () => ({
  OverlayToaster: {
    create: jest.fn(),
  },
}));

describe('usePathCreation', () => {
  const mockSetPlacedPaths = jest.fn();
  const mockOnCoordinatesChange = jest.fn();
  const mockToaster = {
    show: jest.fn(() => 'toast-key'),
    dismiss: jest.fn(),
  };
  const mockToasterRef: React.RefObject<OverlayToaster | null> = { current: mockToaster as any };

  const defaultOptions = {
    toasterRef: mockToasterRef,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with inactive path creation mode', () => {
    const { result } = renderHook(() =>
      usePathCreation([], mockSetPlacedPaths, defaultOptions)
    );

    expect(result.current.pathCreationMode.isActive).toBe(false);
    expect(result.current.pathCreationMode.startPosition).toBeNull();
  });

  it('should start path creation mode', () => {
    const { result } = renderHook(() =>
      usePathCreation([], mockSetPlacedPaths, defaultOptions)
    );

    act(() => {
      result.current.startPathCreation([0, 0, 0], 'path-line', 'Test Path');
    });

    expect(result.current.pathCreationMode.isActive).toBe(true);
    expect(result.current.pathCreationMode.startPosition).toEqual([0, 0, 0]);
    expect(result.current.pathCreationMode.pathType).toBe('path-line');
    expect(mockToaster.show).toHaveBeenCalled();
  });

  it('should complete path creation', () => {
    const { result } = renderHook(() =>
      usePathCreation([], mockSetPlacedPaths, defaultOptions)
    );

    // Start path creation
    act(() => {
      result.current.startPathCreation([0, 0, 0], 'path-line', 'Test Path');
    });

    // Complete path creation
    act(() => {
      result.current.completePathCreation([0, 0, 0], [2, 0, 0], 'path-line', 'Test Path');
    });

    expect(result.current.pathCreationMode.isActive).toBe(false);
    expect(mockSetPlacedPaths).toHaveBeenCalled();
    expect(mockToaster.dismiss).toHaveBeenCalled();
  });

  it('should cancel path creation', () => {
    const { result } = renderHook(() =>
      usePathCreation([], mockSetPlacedPaths, defaultOptions)
    );

    // Start path creation
    act(() => {
      result.current.startPathCreation([0, 0, 0], 'path-line', 'Test Path');
    });

    // Cancel path creation
    act(() => {
      result.current.cancelPathCreation();
    });

    expect(result.current.pathCreationMode.isActive).toBe(false);
    expect(mockToaster.dismiss).toHaveBeenCalled();
  });

  it('should show path creation error', () => {
    const { result } = renderHook(() =>
      usePathCreation([], mockSetPlacedPaths, defaultOptions)
    );

    act(() => {
      result.current.showPathCreationError('Test error message');
    });

    expect(mockToaster.show).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error message',
        intent: 'danger',
      })
    );
  });
});

