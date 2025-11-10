import React from 'react';
import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import InfiniteGridScene from './InfiniteGridScene';
import { DragTargetProvider } from '../../hooks/DragTargetContext';

// Mock Three.js components
jest.mock('@react-three/drei', () => ({
  Grid: () => null,
  Sphere: () => null,
}));

describe('InfiniteGridScene', () => {
  const defaultProps = {
    coordinateSettings: {
      system: 'Cartesian' as const,
      minUnit: 0.1,
    },
    onHoveredObjectChange: () => {},
    onPlacedObjectsChange: () => {},
    onPlacedPathsChange: () => {},
    placedObjects: [],
    placedPaths: [],
    openAnnotations: new Set<string>(),
    onToggleAnnotation: () => {},
    waitingForPathEndpoint: null,
    onWaitingForPathEndpointChange: () => {},
    onPathEndpointSnapPointChange: () => {},
    selectedItem: null,
    relatedItemIds: { targets: [], paths: [], coordinates: [] },
    onSelectItem: () => {},
    onOpenNamingModal: () => {},
  };

  const renderScene = (props = {}) => {
    return render(
      <DragTargetProvider>
        <Canvas>
          <InfiniteGridScene {...defaultProps} {...props} />
        </Canvas>
      </DragTargetProvider>
    );
  };

  it('should render without crashing', () => {
    renderScene();
  });

  it('should render with placed objects', () => {
    const placedObjects = [
      {
        id: 'obj-1',
        position: [0, 0, 0] as [number, number, number],
        targetId: 'target-1',
        targetLabel: 'Test Target',
      },
    ];
    renderScene({ placedObjects });
  });

  it('should render with placed paths', () => {
    const placedPaths = [
      {
        id: 'path-1',
        points: [],
        pathType: 'path-line',
        pathLabel: 'Test Path',
        litTiles: [[0, 0, 0], [1, 0, 0]],
      },
    ];
    renderScene({ placedPaths });
  });

  it('should handle path creation mode', () => {
    const pathCreationMode = {
      isActive: true,
      type: 'line' as const,
      startPosition: [0, 0, 0] as [number, number, number],
      pathType: 'path-line',
      pathLabel: 'Test Path',
    };
    renderScene({ pathCreationMode });
  });
});

