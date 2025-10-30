import type { Meta, StoryObj } from '@storybook/react';
import Toolbar from './Toolbar';

const meta: Meta<typeof Toolbar> = {
  title: 'Components/Toolbar',
  component: Toolbar,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
  args: {
    title: 'Target Creator',
  },
};

export const WithMenuToggle: Story = {
  args: {
    title: 'Target Creator',
    onMenuToggle: () => console.log('Menu toggled'),
    isMenuOpen: false,
  },
};

export const MenuOpen: Story = {
  args: {
    title: 'Target Creator',
    onMenuToggle: () => console.log('Menu toggled'),
    isMenuOpen: true,
  },
};
