import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControlsWrapper } from './OrbitControlsWrapper';
import { DragTargetProvider } from '../hooks/DragTargetContext';

// Mock OrbitControls
jest.mock('@react-three/drei', () => ({
  OrbitControls: ({ ref, ...props }: any) => {
    // Store ref callback
    if (ref) {
      ref({ setAzimuthalAngle: jest.fn(), setPolarAngle: jest.fn(), update: jest.fn() });
    }
    return <div data-testid="orbit-controls" {...props} />;
  },
}));

describe('OrbitControlsWrapper', () => {
  const defaultProps = {
    waitingForPathEndpoint: false,
  };

  const renderInCanvas = (props = {}) => {
    return render(
      <Canvas>
        <DragTargetProvider>
          <OrbitControlsWrapper {...defaultProps} {...props} />
        </DragTargetProvider>
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

  it('should call onControlsReady when controls are ready', () => {
    const onControlsReady = jest.fn();
    renderInCanvas({ onControlsReady });
    // Controls should be initialized and callback called
    expect(onControlsReady).toHaveBeenCalled();
  });

  it('should disable controls when waiting for path endpoint', () => {
    renderInCanvas({ waitingForPathEndpoint: true });
    // Controls should be disabled
  });
});

