import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { PathRenderer } from './PathRenderer';
import { Position3D } from '../utils/gridUtils';

const meta: Meta<typeof PathRenderer> = {
  title: 'Components/PathRenderer',
  component: PathRenderer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas camera={{ position: [5, 5, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PathRenderer>;

const singleTilePath = {
  id: 'path-single',
  pathType: 'line',
  pathLabel: 'Single Tile Path',
  litTiles: [[0, 0, 0]] as Position3D[],
};

const multiTilePath = {
  id: 'path-multi',
  pathType: 'line',
  pathLabel: 'Multi Tile Path',
  litTiles: [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
  ] as Position3D[],
};

export const Default: Story = {
  args: {
    path: multiTilePath,
    isSelected: false,
    isRelated: false,
    onSelect: () => {},
    onContextMenu: () => {},
  },
};

export const SingleTile: Story = {
  args: {
    path: singleTilePath,
    isSelected: false,
    isRelated: false,
    onSelect: () => {},
    onContextMenu: () => {},
  },
};

export const Selected: Story = {
  args: {
    path: multiTilePath,
    isSelected: true,
    isRelated: false,
    onSelect: () => {},
    onContextMenu: () => {},
  },
};

export const Related: Story = {
  args: {
    path: multiTilePath,
    isSelected: false,
    isRelated: true,
    onSelect: () => {},
    onContextMenu: () => {},
  },
};

export const DiagonalPath: Story = {
  args: {
    path: {
      id: 'path-diagonal',
      pathType: 'line',
      pathLabel: 'Diagonal Path',
      litTiles: [
        [0, 0, 0],
        [1, 0, 1],
        [2, 0, 2],
      ] as Position3D[],
    },
    isSelected: false,
    isRelated: false,
    onSelect: () => {},
    onContextMenu: () => {},
  },
};

