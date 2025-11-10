import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import InfiniteGridCanvas from './InfiniteGrid';
import { DragTargetProvider } from '../../hooks/DragTargetContext';

const meta: Meta<typeof InfiniteGridCanvas> = {
  title: 'Components/InfiniteGrid',
  component: InfiniteGridCanvas,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
        <DragTargetProvider>
          <Story />
        </DragTargetProvider>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InfiniteGridCanvas>;

export const Default: Story = {
  render: () => <InfiniteGridCanvas />,
};


