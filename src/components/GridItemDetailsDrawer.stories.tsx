import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import GridItemDetailsDrawer from './GridItemDetailsDrawer';
import { GridItemsService } from '../services/GridItemsService';
import type { Target, Path, Coordinate } from '../types/gridItems';

const meta: Meta<typeof GridItemDetailsDrawer> = {
  title: 'Components/GridItemDetailsDrawer',
  component: GridItemDetailsDrawer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof GridItemDetailsDrawer>;

// Helper function to create a service with test data
const createTestService = (): GridItemsService => {
  const service = new GridItemsService();
  
  // Create coordinates
  const coord1: Coordinate = {
    id: 'coord-1',
    label: 'Origin',
    position: [0, 0, 0],
    paths: [],
    targets: [],
  };
  const coord2: Coordinate = {
    id: 'coord-2',
    label: 'Midpoint',
    position: [5, 0, 5],
    paths: [],
    targets: [],
  };
  const coord3: Coordinate = {
    id: 'coord-3',
    label: 'Destination',
    position: [10, 0, 10],
    paths: [],
    targets: [],
  };
  const coord4: Coordinate = {
    id: 'coord-4',
    label: 'Side Point',
    position: [3, 0, 3],
    paths: [],
    targets: [],
  };
  
  service.createCoordinate(coord1);
  service.createCoordinate(coord2);
  service.createCoordinate(coord3);
  service.createCoordinate(coord4);
  
  // Create path
  const path: Path = {
    id: 'path-1',
    label: 'Main Corridor',
    targetId: 'target-1',
    coordinates: [coord1, coord2, coord3],
  };
  service.createPath(path);
  
  // Create another path
  const path2: Path = {
    id: 'path-2',
    label: 'Side Path',
    targetId: 'target-2',
    coordinates: [coord1, coord4],
  };
  service.createPath(path2);
  
  // Create targets
  const target1: Target = {
    id: 'target-1',
    label: 'Main Target',
    pathId: 'path-1',
  };
  service.createTarget(target1);
  
  const target2: Target = {
    id: 'target-2',
    label: 'Secondary Target',
    pathId: 'path-2',
  };
  service.createTarget(target2);
  
  return service;
};

export const empty: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <GridItemDetailsDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Item Details"
      >
        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
          <p>No item selected</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Select an item from the grid to view details</p>
        </div>
      </GridItemDetailsDrawer>
    );
  },
};

export const close: Story = {
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

export const targetSelected: Story = {
  name: 'target selected',
  render: () => {
    const service = React.useMemo(() => createTestService(), []);
    return (
      <GridItemDetailsDrawer
        isOpen={true}
        onClose={() => {}}
        title="Main Target"
        selectedTargetId="target-1"
        service={service}
      />
    );
  },
};

export const pathSelected: Story = {
  name: 'path selected',
  render: () => {
    const service = React.useMemo(() => createTestService(), []);
    return (
      <GridItemDetailsDrawer
        isOpen={true}
        onClose={() => {}}
        title="Main Corridor"
        selectedPathId="path-1"
        service={service}
      />
    );
  },
};

export const coordinateSelected: Story = {
  name: 'coordinate selected',
  render: () => {
    const service = React.useMemo(() => createTestService(), []);
    return (
      <GridItemDetailsDrawer
        isOpen={true}
        onClose={() => {}}
        title="Origin"
        selectedCoordinateId="coord-1"
        service={service}
      />
    );
  },
};

