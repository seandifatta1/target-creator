import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import Path, { PathProps } from './Path';

const meta: Meta<typeof Path> = {
  title: 'Components/Path',
  component: Path,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas camera={{ position: [5, 5, 5], fov: 75 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
  argTypes: {
    id: { control: 'text' },
    pathType: { control: 'text' },
    pathLabel: { control: 'text' },
    color: { control: 'color' },
    lineWidth: { control: { type: 'range', min: 1, max: 10, step: 1 } },
    start: { control: 'object' },
    end: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof Path>;

export const Default: Story = {
  args: {
    id: 'path-1',
    start: [0, 0, 0],
    end: [2, 0, 0],
    pathType: 'line',
    pathLabel: 'Line Path',
    color: '#3498db',
    lineWidth: 3,
  },
};

export const Vertical: Story = {
  args: {
    ...Default.args,
    id: 'path-vertical',
    start: [0, 0, 0],
    end: [0, 3, 0],
    pathLabel: 'Vertical Path',
    color: '#e74c3c',
  },
};

export const Diagonal: Story = {
  args: {
    ...Default.args,
    id: 'path-diagonal',
    start: [0, 0, 0],
    end: [2, 2, 2],
    pathLabel: 'Diagonal Path',
    color: '#2ecc71',
  },
};

export const ThickLine: Story = {
  args: {
    ...Default.args,
    id: 'path-thick',
    start: [0, 0, 0],
    end: [3, 0, 0],
    pathLabel: 'Thick Path',
    color: '#9b59b6',
    lineWidth: 8,
  },
};

export const MultiplePaths: Story = {
  render: () => (
    <>
      <Path
        id="path-1"
        start={[0, 0, 0]}
        end={[2, 0, 0]}
        pathType="line"
        pathLabel="Horizontal Line"
        color="#3498db"
        lineWidth={3}
      />
      <Path
        id="path-2"
        start={[0, 1, 0]}
        end={[0, 1, 2]}
        pathType="line"
        pathLabel="Vertical Line"
        color="#e74c3c"
        lineWidth={3}
      />
      <Path
        id="path-3"
        start={[0, 2, 0]}
        end={[2, 2, 2]}
        pathType="line"
        pathLabel="Diagonal Line"
        color="#2ecc71"
        lineWidth={3}
      />
      <Path
        id="path-4"
        start={[-2, 0, 0]}
        end={[-2, 2, 0]}
        pathType="line"
        pathLabel="Back Vertical"
        color="#f39c12"
        lineWidth={5}
      />
    </>
  ),
};

export const DifferentColors: Story = {
  render: () => (
    <>
      <Path
        id="red-path"
        start={[0, 0, 0]}
        end={[1, 0, 0]}
        pathType="line"
        pathLabel="Red Path"
        color="#e74c3c"
        lineWidth={3}
      />
      <Path
        id="green-path"
        start={[0, 1, 0]}
        end={[1, 1, 0]}
        pathType="line"
        pathLabel="Green Path"
        color="#2ecc71"
        lineWidth={3}
      />
      <Path
        id="blue-path"
        start={[0, 2, 0]}
        end={[1, 2, 0]}
        pathType="line"
        pathLabel="Blue Path"
        color="#3498db"
        lineWidth={3}
      />
      <Path
        id="purple-path"
        start={[0, 3, 0]}
        end={[1, 3, 0]}
        pathType="line"
        pathLabel="Purple Path"
        color="#9b59b6"
        lineWidth={3}
      />
    </>
  ),
};

export const InvalidPath: Story = {
  args: {
    ...Default.args,
    id: 'invalid-path',
    start: [0, 0, 0],
    end: [0, 0, 0], // Same start and end - should not render
    pathLabel: 'Invalid Path (Same Points)',
    color: '#e74c3c',
  },
};
