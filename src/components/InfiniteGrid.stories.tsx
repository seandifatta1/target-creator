import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import InfiniteGridCanvas from './InfiniteGrid';

const meta: Meta<typeof InfiniteGridCanvas> = {
  title: 'Components/InfiniteGrid',
  component: InfiniteGridCanvas,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof InfiniteGridCanvas>;

export const Default: Story = {
  render: () => <InfiniteGridCanvas />,
};


