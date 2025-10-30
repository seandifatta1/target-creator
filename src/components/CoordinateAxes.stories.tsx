import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import CoordinateAxes from './CoordinateAxes';

const meta: Meta<typeof CoordinateAxes> = {
  title: 'Components/CoordinateAxes',
  component: CoordinateAxes,
  args: {
    coordinateSystem: 'Cartesian',
    minUnit: 0.1,
    gridSize: 20,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof CoordinateAxes>;

function Scene(args: React.ComponentProps<typeof CoordinateAxes>) {
  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 60 }} style={{ height: '80vh', background: '#0f172a' }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Grid args={[100, 100]} cellSize={args.minUnit} infiniteGrid fadeDistance={50} />
      <CoordinateAxes {...args} />
      <OrbitControls />
    </Canvas>
  );
}

export const Cartesian: Story = {
  render: (args) => <Scene {...args} />,
};

export const NED: Story = {
  args: { coordinateSystem: 'NED' },
  render: (args) => <Scene {...args} />,
};

export const Spherical: Story = {
  args: { coordinateSystem: 'Spherical' },
  render: (args) => <Scene {...args} />,
};


