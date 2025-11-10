import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControlsWrapper } from './OrbitControlsWrapper';
import { DragTargetProvider } from '../hooks/DragTargetContext';
import { Box } from '@react-three/drei';

const meta: Meta<typeof OrbitControlsWrapper> = {
  title: 'Components/OrbitControlsWrapper',
  component: OrbitControlsWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas camera={{ position: [5, 5, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Box position={[0, 0, 0]}>
            <meshStandardMaterial color="orange" />
          </Box>
          <DragTargetProvider>
            <Story />
          </DragTargetProvider>
        </Canvas>
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OrbitControlsWrapper>;

export const Default: Story = {
  args: {
    waitingForPathEndpoint: false,
    onControlsReady: () => {},
  },
};

export const WaitingForPathEndpoint: Story = {
  args: {
    waitingForPathEndpoint: true,
    onControlsReady: () => {},
  },
};

