import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsModal, { type CoordinateSettings } from './SettingsModal';

const meta: Meta<typeof SettingsModal> = {
  title: 'Components/SettingsModal',
  component: SettingsModal,
  args: {
    isOpen: true,
    settings: { system: 'Cartesian', minUnit: 0.1 } as CoordinateSettings,
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof SettingsModal>;

export const Default: Story = {
  args: {
    onClose: () => {},
    onSettingsChange: () => {},
  },
};

export const NED: Story = {
  args: {
    onClose: () => {},
    onSettingsChange: () => {},
    settings: { system: 'NED', minUnit: 0.1 },
  },
};

export const Spherical: Story = {
  args: {
    onClose: () => {},
    onSettingsChange: () => {},
    settings: { system: 'Spherical', minUnit: 0.1 },
  },
};


