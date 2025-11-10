import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import InfiniteGridScene from './InfiniteGridScene';
import { DragTargetProvider } from '../hooks/DragTargetContext';

const meta: Meta<typeof InfiniteGridScene> = {
  title: 'Components/InfiniteGridScene',
  component: InfiniteGridScene,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
        <DragTargetProvider>
          <Canvas>
            <Story />
          </Canvas>
        </DragTargetProvider>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InfiniteGridScene>;

const defaultProps = {
  coordinateSettings: {
    system: 'Cartesian' as const,
    minUnit: 0.1,
  },
  onHoveredObjectChange: () => {},
  onPlacedObjectsChange: () => {},
  onPlacedPathsChange: () => {},
  placedObjects: [],
  placedPaths: [],
  openAnnotations: new Set<string>(),
  onToggleAnnotation: () => {},
  waitingForPathEndpoint: null,
  onWaitingForPathEndpointChange: () => {},
  onPathEndpointSnapPointChange: () => {},
  selectedItem: null,
  relatedItemIds: { targets: [], paths: [], coordinates: [] },
  onSelectItem: () => {},
  onOpenNamingModal: () => {},
};

export const Default: Story = {
  render: () => <InfiniteGridScene {...defaultProps} />,
};

export const WithObjects: Story = {
  render: () => (
    <InfiniteGridScene
      {...defaultProps}
      placedObjects={[
        {
          id: 'obj-1',
          position: [0, 0, 0],
          targetId: 'target-1',
          targetLabel: 'Test Target',
          iconEmoji: '🎯',
        },
        {
          id: 'obj-2',
          position: [2, 0, 0],
          targetId: 'target-2',
          targetLabel: 'Another Target',
          iconEmoji: '🚀',
        },
      ]}
    />
  ),
};

export const WithPaths: Story = {
  render: () => (
    <InfiniteGridScene
      {...defaultProps}
      placedPaths={[
        {
          id: 'path-1',
          points: [],
          pathType: 'path-line',
          pathLabel: 'Test Path',
          litTiles: [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
        },
      ]}
    />
  ),
};

export const WithPathCreationMode: Story = {
  render: () => (
    <InfiniteGridScene
      {...defaultProps}
      pathCreationMode={{
        isActive: true,
        type: 'line',
        startPosition: [0, 0, 0],
        pathType: 'path-line',
        pathLabel: 'New Path',
      }}
      onPathCreationComplete={() => {}}
      onPathCreationError={() => {}}
    />
  ),
};

