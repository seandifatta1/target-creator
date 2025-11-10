import type { Meta, StoryObj } from '@storybook/react';
import { DragTooltip } from './DragTooltip';
import { DragTargetProvider } from '../hooks/DragTargetContext';

const meta: Meta<typeof DragTooltip> = {
  title: 'Components/DragTooltip',
  component: DragTooltip,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <DragTargetProvider>
          <Story />
        </DragTargetProvider>
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DragTooltip>;

export const WithSnapPoint: Story = {
  args: {
    snapPoint: [2, 0, 3],
    coordinateSettings: {
      system: 'Cartesian',
      minUnit: 0.1,
    },
    hoveredObject: null,
    placedObjects: [],
    openAnnotations: new Set(),
    waitingForPathEndpoint: null,
  },
};

export const WithHoveredObject: Story = {
  args: {
    snapPoint: null,
    coordinateSettings: {
      system: 'Cartesian',
      minUnit: 0.1,
    },
    hoveredObject: 'obj-1',
    placedObjects: [
      {
        id: 'obj-1',
        position: [1, 0, 2],
        targetId: 'target-1',
        targetLabel: 'Hovered Target',
      },
    ],
    openAnnotations: new Set(),
    waitingForPathEndpoint: null,
  },
};

export const WaitingForPathEndpoint: Story = {
  args: {
    snapPoint: [3, 0, 4],
    coordinateSettings: {
      system: 'Cartesian',
      minUnit: 0.1,
    },
    hoveredObject: null,
    placedObjects: [],
    openAnnotations: new Set(),
    waitingForPathEndpoint: {
      id: 'path-1',
      pathType: 'line',
      pathLabel: 'Line Path',
    },
  },
};

