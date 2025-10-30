import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import Target, { TargetProps } from './Target';
import { CoordinateSettings } from './SettingsModal';

// Mock coordinate settings
const defaultCoordinateSettings: CoordinateSettings = {
  system: 'Cartesian',
  minUnit: 0.1
};

const meta: Meta<typeof Target> = {
  title: 'Components/Target',
  component: Target,
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
    targetId: { control: 'text' },
    targetLabel: { control: 'text' },
    iconEmoji: { control: 'text' },
    isAnnotationOpen: { control: 'boolean' },
    position: { control: 'object' },
    coordinateSettings: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof Target>;

export const Default: Story = {
  args: {
    id: 'target-1',
    position: [0, 0, 0],
    targetId: 'target-1',
    targetLabel: 'Target 1',
    iconEmoji: '🎯',
    coordinateSettings: defaultCoordinateSettings,
    isAnnotationOpen: false,
    onToggleAnnotation: () => console.log('Toggle annotation'),
    onPointerOver: () => console.log('Pointer over'),
    onPointerOut: () => console.log('Pointer out'),
  },
};

export const WithAnnotation: Story = {
  args: {
    ...Default.args,
    isAnnotationOpen: true,
  },
};

export const DifferentIcon: Story = {
  args: {
    ...Default.args,
    iconEmoji: '🚀',
    targetLabel: 'Rocket Target',
  },
};

export const MultipleTargets: Story = {
  render: () => (
    <>
      <Target
        id="target-1"
        position={[0, 0, 0]}
        targetId="target-1"
        targetLabel="Target 1"
        iconEmoji="🎯"
        coordinateSettings={defaultCoordinateSettings}
        isAnnotationOpen={false}
        onToggleAnnotation={() => console.log('Toggle target 1')}
        onPointerOver={() => console.log('Pointer over target 1')}
        onPointerOut={() => console.log('Pointer out target 1')}
      />
      <Target
        id="target-2"
        position={[2, 0, 0]}
        targetId="target-2"
        targetLabel="Target 2"
        iconEmoji="🚀"
        coordinateSettings={defaultCoordinateSettings}
        isAnnotationOpen={true}
        onToggleAnnotation={() => console.log('Toggle target 2')}
        onPointerOver={() => console.log('Pointer over target 2')}
        onPointerOut={() => console.log('Pointer out target 2')}
      />
      <Target
        id="target-3"
        position={[-2, 0, 0]}
        targetId="target-3"
        targetLabel="Target 3"
        iconEmoji="⭐"
        coordinateSettings={defaultCoordinateSettings}
        isAnnotationOpen={false}
        onToggleAnnotation={() => console.log('Toggle target 3')}
        onPointerOver={() => console.log('Pointer over target 3')}
        onPointerOut={() => console.log('Pointer out target 3')}
      />
    </>
  ),
};

export const DifferentCoordinateSystems: Story = {
  render: () => (
    <>
      <Target
        id="cartesian-target"
        position={[0, 0, 0]}
        targetId="cartesian-target"
        targetLabel="Cartesian Target"
        iconEmoji="🎯"
        coordinateSettings={{ system: 'Cartesian', minUnit: 0.1 }}
        isAnnotationOpen={true}
        onToggleAnnotation={() => console.log('Toggle cartesian')}
        onPointerOver={() => console.log('Pointer over cartesian')}
        onPointerOut={() => console.log('Pointer out cartesian')}
      />
      <Target
        id="ned-target"
        position={[2, 0, 0]}
        targetId="ned-target"
        targetLabel="NED Target"
        iconEmoji="🧭"
        coordinateSettings={{ system: 'NED', minUnit: 0.1 }}
        isAnnotationOpen={true}
        onToggleAnnotation={() => console.log('Toggle NED')}
        onPointerOver={() => console.log('Pointer over NED')}
        onPointerOut={() => console.log('Pointer out NED')}
      />
      <Target
        id="spherical-target"
        position={[-2, 0, 0]}
        targetId="spherical-target"
        targetLabel="Spherical Target"
        iconEmoji="🌐"
        coordinateSettings={{ system: 'Spherical', minUnit: 0.1 }}
        isAnnotationOpen={true}
        onToggleAnnotation={() => console.log('Toggle spherical')}
        onPointerOver={() => console.log('Pointer over spherical')}
        onPointerOut={() => console.log('Pointer out spherical')}
      />
    </>
  ),
};
