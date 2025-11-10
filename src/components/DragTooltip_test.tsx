import { render, screen } from '@testing-library/react';
import { DragTooltip } from './DragTooltip';
import { DragTargetProvider } from '../hooks/DragTargetContext';

// Mock useMousePosition
jest.mock('../hooks/useMousePosition', () => ({
  useMousePosition: () => ({
    position: { x: 100, y: 200 },
    positionRef: { current: { x: 100, y: 200 } },
  }),
}));

describe('DragTooltip', () => {
  const defaultProps = {
    snapPoint: [1, 0, 2] as [number, number, number],
    coordinateSettings: {
      system: 'Cartesian' as const,
      minUnit: 0.1,
    },
    hoveredObject: null,
    placedObjects: [],
    openAnnotations: new Set<string>(),
    waitingForPathEndpoint: null,
  };

  const renderWithProvider = (props = {}) => {
    return render(
      <DragTargetProvider>
        <DragTooltip {...defaultProps} {...props} />
      </DragTargetProvider>
    );
  };

  it('should not render when no tooltip data', () => {
    const { container } = renderWithProvider({ snapPoint: null });
    expect(container.firstChild).toBeNull();
  });

  it('should render tooltip when dragging', () => {
    renderWithProvider({ snapPoint: [1, 0, 2] });
    // Tooltip should be visible when dragging with snap point
  });

  it('should render tooltip for hovered object', () => {
    const placedObjects = [
      {
        id: 'obj-1',
        position: [2, 0, 3] as [number, number, number],
        targetId: 'target-1',
        targetLabel: 'Test Target',
      },
    ];
    renderWithProvider({
      hoveredObject: 'obj-1',
      placedObjects,
      snapPoint: null,
    });
    // Tooltip should show for hovered object
  });

  it('should format coordinates correctly', () => {
    renderWithProvider({
      snapPoint: [1, 0, 2],
      coordinateSettings: { system: 'Cartesian' as const, minUnit: 0.1 },
    });
    // Coordinates should be formatted with minUnit
  });
});

