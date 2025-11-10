import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import App from './App';
import { DragTargetProvider } from '../hooks/DragTargetContext';

const meta: Meta<typeof App> = {
  title: 'App/App',
  component: App,
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
type Story = StoryObj<typeof App>;

export const Default: Story = {};

