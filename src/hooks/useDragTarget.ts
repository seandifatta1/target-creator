import { useState, useCallback } from 'react';

export interface DragTargetData {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export const useDragTarget = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<DragTargetData | null>(null);
  const [snapPoint, setSnapPoint] = useState<[number, number, number] | null>(null);

  const startDrag = useCallback((data: DragTargetData) => {
    setDragData(data);
    setIsDragging(true);
  }, []);

  const updateSnapPoint = useCallback((point: [number, number, number] | null) => {
    setSnapPoint(point);
  }, []);

  const endDrag = useCallback(() => {
    const result = snapPoint ? { dragData, snapPoint } : null;
    setIsDragging(false);
    setDragData(null);
    setSnapPoint(null);
    return result;
  }, [dragData, snapPoint]);

  return {
    isDragging,
    dragData,
    snapPoint,
    startDrag,
    updateSnapPoint,
    endDrag,
  };
};

