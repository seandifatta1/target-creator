import { useState, useEffect, useRef } from 'react';

export interface MousePosition {
  x: number;
  y: number;
}

/**
 * Hook to track global mouse position.
 * Useful for positioning tooltips, context menus, and other UI elements
 * that need to follow the cursor.
 * 
 * @returns Current mouse position and a ref that's updated synchronously
 */
export function useMousePosition(): {
  position: MousePosition;
  positionRef: React.MutableRefObject<MousePosition>;
} {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });
  const mousePositionRef = useRef<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setMousePosition(pos);
      mousePositionRef.current = pos;
    };

    // Also capture on contextmenu to get exact right-click position
    const handleContextMenu = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      mousePositionRef.current = pos;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return {
    position: mousePosition,
    positionRef: mousePositionRef,
  };
}

