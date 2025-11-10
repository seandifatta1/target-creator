import { renderHook, act } from '@testing-library/react';
import { useMousePosition } from './useMousePosition';

describe('useMousePosition', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    jest.clearAllMocks();
  });

  it('should initialize with zero position', () => {
    const { result } = renderHook(() => useMousePosition());
    expect(result.current.position).toEqual({ x: 0, y: 0 });
    expect(result.current.positionRef.current).toEqual({ x: 0, y: 0 });
  });

  it('should update position on mouse move', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      const event = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      });
      window.dispatchEvent(event);
    });

    expect(result.current.position).toEqual({ x: 100, y: 200 });
    expect(result.current.positionRef.current).toEqual({ x: 100, y: 200 });
  });

  it('should update ref on context menu event', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      const event = new MouseEvent('contextmenu', {
        clientX: 150,
        clientY: 250,
      });
      window.dispatchEvent(event);
    });

    // Ref should be updated immediately
    expect(result.current.positionRef.current).toEqual({ x: 150, y: 250 });
  });

  it('should clean up event listeners on unmount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useMousePosition());

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'contextmenu',
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'contextmenu',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});

