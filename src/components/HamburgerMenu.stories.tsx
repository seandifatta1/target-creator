import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import HamburgerMenu from './HamburgerMenu';

const meta: Meta<typeof HamburgerMenu> = {
  title: 'Components/HamburgerMenu',
  component: HamburgerMenu,
  args: {
    isOpen: true,
    items: [
      { id: 'home', label: 'Home' },
      { id: 'scenes', label: 'Scenes' },
      { id: 'settings', label: 'Settings' },
    ],
    header: <div>Target Creator</div>,
    footer: <div style={{ fontSize: 12, opacity: 0.7 }}>v1.0.0</div>,
  },
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof HamburgerMenu>;

export const Default: Story = {
  args: {
    onToggle: () => {},
  },
};


