import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { CoordinateRegistry, ICoordinateRegistry, Coordinate } from './CoordinateRegistry';

const meta: Meta<typeof CoordinateRegistry> = {
  title: 'Services/CoordinateRegistry',
  component: CoordinateRegistry,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CoordinateRegistry>;

// Mock implementation for story actions
class MockCoordinateRegistry extends CoordinateRegistry {
  private onGetOrCreate = fn();
  private onUpdateName = fn();
  private onRemove = fn();

  getOrCreate(position: [number, number, number]): Coordinate {
    this.onGetOrCreate(position);
    return super.getOrCreate(position);
  }

  updateName(id: string, name: string): void {
    this.onUpdateName(id, name);
    super.updateName(id, name);
  }

  remove(id: string): boolean {
    this.onRemove(id);
    return super.remove(id);
  }
}

export const Default: Story = {
  render: () => {
    const registry = new CoordinateRegistry();
    const coord1 = registry.getOrCreate([0, 0, 0]);
    const coord2 = registry.getOrCreate([1, 1, 1]);
    const coord3 = registry.getOrCreate([0, 0, 0]); // Should return same as coord1

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>Coordinate Registry Demo</h2>
        <div style={{ marginTop: '20px' }}>
          <h3>Registered Coordinates:</h3>
          <ul>
            <li>Coord 1: ID={coord1.id}, Position={JSON.stringify(coord1.position)}, Name={coord1.name || 'unnamed'}</li>
            <li>Coord 2: ID={coord2.id}, Position={JSON.stringify(coord2.position)}, Name={coord2.name || 'unnamed'}</li>
            <li>Coord 3 (same as Coord 1): ID={coord3.id}, Position={JSON.stringify(coord3.position)}, Name={coord3.name || 'unnamed'}</li>
          </ul>
          <p><strong>Note:</strong> Coord 1 and Coord 3 have the same ID because they share the same position.</p>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>All Coordinates:</h3>
          <pre>{JSON.stringify(registry.getAll(), null, 2)}</pre>
        </div>
      </div>
    );
  },
};

export const WithNames: Story = {
  render: () => {
    const registry = new CoordinateRegistry();
    const coord1 = registry.getOrCreate([0, 0, 0]);
    const coord2 = registry.getOrCreate([1, 1, 1]);
    const coord3 = registry.getOrCreate([2, 2, 2]);

    registry.updateName(coord1.id, 'Origin');
    registry.updateName(coord2.id, 'Point A');
    registry.updateName(coord3.id, 'Point B');

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>Named Coordinates</h2>
        <div style={{ marginTop: '20px' }}>
          <h3>Coordinates with Names:</h3>
          <ul>
            <li>{coord1.name} - {coord1.id} - {JSON.stringify(coord1.position)}</li>
            <li>{coord2.name} - {coord2.id} - {JSON.stringify(coord2.position)}</li>
            <li>{coord3.name} - {coord3.id} - {JSON.stringify(coord3.position)}</li>
          </ul>
        </div>
      </div>
    );
  },
};

export const GetByPositions: Story = {
  render: () => {
    const registry = new CoordinateRegistry();
    
    // Create some coordinates
    registry.getOrCreate([0, 0, 0]);
    registry.getOrCreate([1, 1, 1]);
    registry.getOrCreate([2, 2, 2]);
    registry.getOrCreate([3, 3, 3]);

    // Get multiple by positions
    const positions: [number, number, number][] = [
      [0, 0, 0],
      [1, 1, 1],
      [5, 5, 5], // This one doesn't exist
      [2, 2, 2],
    ];

    const coords = registry.getByPositions(positions);

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>Get By Positions</h2>
        <div style={{ marginTop: '20px' }}>
          <h3>Requested Positions:</h3>
          <pre>{JSON.stringify(positions, null, 2)}</pre>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>Found Coordinates ({coords.length} of {positions.length}):</h3>
          <pre>{JSON.stringify(coords, null, 2)}</pre>
          <p><strong>Note:</strong> Position [5, 5, 5] doesn't exist, so it's not included.</p>
        </div>
      </div>
    );
  },
};

export const WithActions: Story = {
  render: () => {
    const registry = new MockCoordinateRegistry();
    const onGetOrCreate = fn();
    const onUpdateName = fn();
    const onRemove = fn();

    // Override methods to track calls
    const originalGetOrCreate = registry.getOrCreate.bind(registry);
    const originalUpdateName = registry.updateName.bind(registry);
    const originalRemove = registry.remove.bind(registry);

    registry.getOrCreate = (position: [number, number, number]) => {
      onGetOrCreate(position);
      return originalGetOrCreate(position);
    };

    registry.updateName = (id: string, name: string) => {
      onUpdateName(id, name);
      originalUpdateName(id, name);
    };

    registry.remove = (id: string) => {
      onRemove(id);
      return originalRemove(id);
    };

    const handleGetOrCreate = () => {
      registry.getOrCreate([Math.floor(Math.random() * 5), Math.floor(Math.random() * 5), Math.floor(Math.random() * 5)]);
    };

    const handleUpdateName = () => {
      const all = registry.getAll();
      if (all.length > 0) {
        const randomCoord = all[Math.floor(Math.random() * all.length)];
        registry.updateName(randomCoord.id, `Name ${Date.now()}`);
      }
    };

    const handleRemove = () => {
      const all = registry.getAll();
      if (all.length > 0) {
        const randomCoord = all[Math.floor(Math.random() * all.length)];
        registry.remove(randomCoord.id);
      }
    };

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>Coordinate Registry with Actions</h2>
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleGetOrCreate} style={{ marginRight: '10px', padding: '8px 16px' }}>
            Get or Create Random Coordinate
          </button>
          <button onClick={handleUpdateName} style={{ marginRight: '10px', padding: '8px 16px' }}>
            Update Random Coordinate Name
          </button>
          <button onClick={handleRemove} style={{ padding: '8px 16px' }}>
            Remove Random Coordinate
          </button>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>All Coordinates ({registry.getAll().length}):</h3>
          <pre>{JSON.stringify(registry.getAll(), null, 2)}</pre>
        </div>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p>Check the Actions panel to see function calls!</p>
        </div>
      </div>
    );
  },
  args: {
    // Story actions will be tracked in the Actions panel
  },
};

