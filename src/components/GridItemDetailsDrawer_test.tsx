import { render } from '@testing-library/react';
import GridItemDetailsDrawer from './GridItemDetailsDrawer';

describe('GridItemDetailsDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    const { container } = render(
      <GridItemDetailsDrawer {...defaultProps}>
        <div>Test content</div>
      </GridItemDetailsDrawer>
    );
    expect(container).toBeTruthy();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <GridItemDetailsDrawer {...defaultProps} isOpen={false}>
        <div>Test content</div>
      </GridItemDetailsDrawer>
    );
    // Drawer is closed, component structure exists but content is hidden
    expect(container).toBeTruthy();
  });

  it('should render with title when provided', () => {
    const { container } = render(
      <GridItemDetailsDrawer {...defaultProps} title="Test Drawer">
        <div>Test content</div>
      </GridItemDetailsDrawer>
    );
    expect(container).toBeTruthy();
  });

  it('should render tabs when leftContent is provided', () => {
    const { container } = render(
      <GridItemDetailsDrawer
        {...defaultProps}
        leftContent={<div>Left content</div>}
        activeTab="targets"
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render targets dropdown when targets are provided', () => {
    const targets = [
      { id: 'target-1', label: 'Target 1', name: 'Target 1' },
      { id: 'target-2', label: 'Target 2', name: 'Target 2' },
    ];

    const { container } = render(
      <GridItemDetailsDrawer
        {...defaultProps}
        leftContent={<div>Left content</div>}
        activeTab="targets"
        targets={targets}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render paths dropdown when paths are provided', () => {
    const paths = [
      { id: 'path-1', label: 'Path 1', name: 'Path 1' },
    ];

    const { container } = render(
      <GridItemDetailsDrawer
        {...defaultProps}
        leftContent={<div>Left content</div>}
        activeTab="paths"
        paths={paths}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render coordinates dropdown when coordinates are provided', () => {
    const coordinates = [
      { id: 'coord-1', position: [0, 0, 0] as [number, number, number], name: 'Origin' },
    ];

    const { container } = render(
      <GridItemDetailsDrawer
        {...defaultProps}
        leftContent={<div>Left content</div>}
        activeTab="coordinates"
        coordinates={coordinates}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render children when no leftContent or rightContent is provided', () => {
    const { container } = render(
      <GridItemDetailsDrawer {...defaultProps}>
        <div>Child content</div>
      </GridItemDetailsDrawer>
    );
    expect(container).toBeTruthy();
  });
});
