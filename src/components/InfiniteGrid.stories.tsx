import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import InfiniteGridCanvas from './InfiniteGrid';
import { DragTargetProvider } from '../hooks/DragTargetContext';

const meta: Meta<typeof InfiniteGridCanvas> = {
  title: 'Components/InfiniteGrid',
  component: InfiniteGridCanvas,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <DragTargetProvider>
        <Story />
      </DragTargetProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InfiniteGridCanvas>;

export const Default: Story = {
  render: () => <InfiniteGridCanvas />,
};


