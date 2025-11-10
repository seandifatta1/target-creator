import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { DragHandler } from './DragHandler';
import { DragTargetProvider } from '../hooks/DragTargetContext';

const meta: Meta<typeof DragHandler> = {
  title: 'Components/DragHandler',
  component: DragHandler,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas camera={{ position: [5, 5, 5] }}>
          <ambientLight intensity={0.5} />
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
type Story = StoryObj<typeof DragHandler>;

export const Default: Story = {
  args: {
    gridSize: 20,
    onSnapPointUpdate: () => {},
  },
};

export const AlwaysTrack: Story = {
  args: {
    gridSize: 20,
    onSnapPointUpdate: () => {},
    alwaysTrack: true,
  },
};

