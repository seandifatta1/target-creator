import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import App from './App';

const meta: Meta<typeof App> = {
  title: 'App/App',
  component: App,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof App>;

export const Default: Story = {};

