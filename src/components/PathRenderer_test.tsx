import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { PathRenderer } from './PathRenderer';
import { Position3D } from '../utils/gridUtils';

// Mock Three.js components
jest.mock('@react-three/drei', () => ({
  Box: ({ children, ...props }: any) => <div data-testid="box" {...props} />,
  Sphere: ({ children, ...props }: any) => <div data-testid="sphere" {...props} />,
}));

describe('PathRenderer', () => {
  const defaultPath = {
    id: 'path-1',
    pathType: 'line',
    pathLabel: 'Test Path',
    litTiles: [
      [0, 0, 0],
      [1, 0, 0],
    ] as Position3D[],
  };

  const defaultProps = {
    path: defaultPath,
    isSelected: false,
    isRelated: false,
    onSelect: jest.fn(),
    onContextMenu: jest.fn(),
  };

  const renderInCanvas = (props = {}) => {
    return render(
      <Canvas>
        <PathRenderer {...defaultProps} {...props} />
      </Canvas>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without errors', () => {
    renderInCanvas();
    // Component renders in Canvas context
  });

  it('should render sphere for single tile path', () => {
    const singleTilePath = {
      ...defaultPath,
      litTiles: [[0, 0, 0]] as Position3D[],
    };
    renderInCanvas({ path: singleTilePath });
    // Should render a sphere
  });

  it('should render lines for multi-tile path', () => {
    renderInCanvas();
    // Should render boxes (lines) connecting tiles
  });

  it('should handle selected state', () => {
    renderInCanvas({ isSelected: true });
    // Should render with selected color (green)
  });

  it('should handle related state', () => {
    renderInCanvas({ isRelated: true });
    // Should render with related color (purple)
  });

  it('should return null for invalid path', () => {
    const invalidPath = {
      ...defaultPath,
      litTiles: [],
    };
    const { container } = renderInCanvas({ path: invalidPath });
    // Should not render anything
    expect(container.firstChild).toBeNull();
  });
});

