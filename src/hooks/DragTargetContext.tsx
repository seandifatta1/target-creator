import * as React from 'react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface DragTargetData {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface DragTargetContextValue {
  isDragging: boolean;
  dragData: DragTargetData | null;
  snapPoint: [number, number, number] | null;
  startDrag: (data: DragTargetData) => void;
  updateSnapPoint: (point: [number, number, number] | null) => void;
  endDrag: () => { dragData: DragTargetData; snapPoint: [number, number, number] } | null;
}

const DragTargetContext = createContext<DragTargetContextValue | undefined>(undefined);

export const DragTargetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
    if (!dragData || !snapPoint) {
      setIsDragging(false);
      setDragData(null);
      setSnapPoint(null);
      return null;
    }
    const result = { dragData, snapPoint };
    setIsDragging(false);
    setDragData(null);
    setSnapPoint(null);
    return result;
  }, [dragData, snapPoint]);

  return (
    <DragTargetContext.Provider
      value={{
        isDragging,
        dragData,
        snapPoint,
        startDrag,
        updateSnapPoint,
        endDrag,
      }}
    >
      {children}
    </DragTargetContext.Provider>
  );
};

export const useDragTargetContext = () => {
  const context = useContext(DragTargetContext);
  if (!context) {
    throw new Error('useDragTargetContext must be used within DragTargetProvider');
  }
  return context;
};

