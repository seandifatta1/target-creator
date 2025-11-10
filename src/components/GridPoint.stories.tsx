import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { GridPoint } from './GridPoint';

const meta: Meta<typeof GridPoint> = {
  title: 'Components/GridPoint',
  component: GridPoint,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas camera={{ position: [5, 5, 5] }}>
          <ambientLight intensity={0.5} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GridPoint>;

export const Default: Story = {
  args: {
    position: [0, 0, 0],
    onClick: () => {},
  },
};

export const Hovered: Story = {
  args: {
    position: [0, 0, 0],
    onClick: () => {},
    isHovered: true,
  },
};

export const StartPosition: Story = {
  args: {
    position: [0, 0, 0],
    onClick: () => {},
    isStartPosition: true,
  },
};

export const ValidEndpoint: Story = {
  args: {
    position: [0, 0, 0],
    onClick: () => {},
    isValidEndpoint: true,
  },
};

export const PermanentlyLit: Story = {
  args: {
    position: [0, 0, 0],
    onClick: () => {},
    isPermanentlyLit: true,
  },
};

export const MultipleStates: Story = {
  render: () => (
    <>
      <GridPoint position={[-2, 0, 0]} onClick={() => {}} />
      <GridPoint position={[-1, 0, 0]} onClick={() => {}} isHovered />
      <GridPoint position={[0, 0, 0]} onClick={() => {}} isStartPosition />
      <GridPoint position={[1, 0, 0]} onClick={() => {}} isValidEndpoint />
      <GridPoint position={[2, 0, 0]} onClick={() => {}} isPermanentlyLit />
    </>
  ),
};

