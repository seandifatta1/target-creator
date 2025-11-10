import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import GridItemDetailsDrawer from './GridItemDetailsDrawer';

const meta: Meta<typeof GridItemDetailsDrawer> = {
  title: 'Components/GridItemDetailsDrawer',
  component: GridItemDetailsDrawer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GridItemDetailsDrawer>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <GridItemDetailsDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Item Details"
      >
        <div style={{ padding: '20px' }}>
          <p>Default drawer content</p>
        </div>
      </GridItemDetailsDrawer>
    );
  },
};

export const WithTabs: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'targets' | 'paths' | 'coordinates'>('targets');
    const [selectedTargetId, setSelectedTargetId] = useState<string>('');
    const [selectedPathId, setSelectedPathId] = useState<string>('');
    const [selectedCoordinateId, setSelectedCoordinateId] = useState<string>('');

    const targets = [
      { id: 'target-1', label: 'Main Target', name: 'Main Target' },
      { id: 'target-2', label: 'Secondary Target', name: 'Secondary Target' },
    ];

    const paths = [
      { id: 'path-1', label: 'Main Corridor', name: 'Main Corridor' },
      { id: 'path-2', label: 'Side Path', name: 'Side Path' },
    ];

    const coordinates = [
      { id: 'coord-1', position: [0, 0, 0] as [number, number, number], name: 'Origin' },
      { id: 'coord-2', position: [5, 0, 5] as [number, number, number], name: 'Corner' },
    ];

    return (
      <GridItemDetailsDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        targets={targets}
        paths={paths}
        coordinates={coordinates}
        selectedTargetId={selectedTargetId}
        selectedPathId={selectedPathId}
        selectedCoordinateId={selectedCoordinateId}
        onTargetSelect={setSelectedTargetId}
        onPathSelect={setSelectedPathId}
        onCoordinateSelect={setSelectedCoordinateId}
        leftContent={
          <div style={{ padding: '20px' }}>
            <h3>Item Details</h3>
            <p>Selected item details appear here</p>
          </div>
        }
      />
    );
  },
};

export const WithSplitLayout: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'targets' | 'paths' | 'coordinates'>('targets');

    return (
      <GridItemDetailsDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        targets={[
          { id: 'target-1', label: 'Target 1', name: 'Target 1' },
          { id: 'target-2', label: 'Target 2', name: 'Target 2' },
        ]}
        paths={[
          { id: 'path-1', label: 'Path 1', name: 'Path 1' },
        ]}
        coordinates={[
          { id: 'coord-1', position: [0, 0, 0] as [number, number, number] },
        ]}
        leftContent={
          <div style={{ padding: '20px' }}>
            <h3>Selected Item</h3>
            <p>Details about the selected item appear in this left panel.</p>
            <p>This panel shows information about targets, paths, or coordinates.</p>
          </div>
        }
      />
    );
  },
};

export const Closed: Story = {
  render: () => {
    return (
      <GridItemDetailsDrawer
        isOpen={false}
        onClose={() => {}}
        title="Closed Drawer"
      >
        <div style={{ padding: '20px' }}>
          <p>This drawer is closed</p>
        </div>
      </GridItemDetailsDrawer>
    );
  },
};

