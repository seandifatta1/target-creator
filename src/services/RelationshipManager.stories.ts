import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { RelationshipManager, IRelationshipManager, RelatedItem } from './RelationshipManager';
import { CoordinateRegistry, Coordinate } from './CoordinateRegistry';

const meta: Meta<typeof RelationshipManager> = {
  title: 'Services/RelationshipManager',
  component: RelationshipManager,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RelationshipManager>;

export const BasicRelationships: Story = {
  render: () => {
    const registry = new CoordinateRegistry();
    const manager = new RelationshipManager();

    // Create coordinates
    const coord1 = registry.getOrCreate([0, 0, 0]);
    const coord2 = registry.getOrCreate([1, 1, 1]);
    const coord3 = registry.getOrCreate([2, 2, 2]);

    // Create relationships
    manager.attachTargetToCoordinate('target-1', coord1.id);
    manager.attachTargetToCoordinate('target-2', coord2.id);
    manager.attachPathToCoordinates('path-1', [coord1.id, coord2.id]);
    manager.attachPathToCoordinates('path-2', [coord2.id, coord3.id]);

    const coord1Targets = manager.getCoordinateTargets(coord1.id);
    const coord1Paths = manager.getCoordinatePaths(coord1.id);
    const target1Coords = manager.getTargetCoordinates('target-1');
    const path1Coords = manager.getPathCoordinates('path-1');

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>Basic Relationships</h2>
        <div style={{ marginTop: '20px' }}>
          <h3>Setup:</h3>
          <ul>
            <li>Target 1 attached to Coordinate 1</li>
            <li>Target 2 attached to Coordinate 2</li>
            <li>Path 1 includes Coordinates 1 and 2</li>
            <li>Path 2 includes Coordinates 2 and 3</li>
          </ul>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>Lookups:</h3>
          <ul>
            <li>Coordinate 1 targets: {JSON.stringify(coord1Targets)}</li>
            <li>Coordinate 1 paths: {JSON.stringify(coord1Paths)}</li>
            <li>Target 1 coordinates: {JSON.stringify(target1Coords)}</li>
            <li>Path 1 coordinates: {JSON.stringify(path1Coords)}</li>
          </ul>
        </div>
      </div>
    );
  },
};

export const RelationshipCounts: Story = {
  render: () => {
    const registry = new CoordinateRegistry();
    const manager = new RelationshipManager();

    // Create coordinates
    const coord1 = registry.getOrCreate([0, 0, 0]);
    const coord2 = registry.getOrCreate([1, 1, 1]);
    const coord3 = registry.getOrCreate([2, 2, 2]);

    // Create relationships
    manager.attachTargetToCoordinate('target-1', coord1.id);
    manager.attachTargetToCoordinate('target-2', coord1.id); // Two targets at coord1
    manager.attachPathToCoordinates('path-1', [coord1.id, coord2.id]);
    manager.attachPathToCoordinates('path-2', [coord1.id, coord3.id]); // Two paths through coord1

    const coord1Counts = manager.getRelationshipCounts('coordinate', coord1.id);
    const target1Counts = manager.getRelationshipCounts('target', 'target-1');
    const path1Counts = manager.getRelationshipCounts('path', 'path-1');

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>Relationship Counts</h2>
        <div style={{ marginTop: '20px' }}>
          <h3>Coordinate 1 Counts:</h3>
          <pre>{JSON.stringify(coord1Counts, null, 2)}</pre>
          <p>2 targets, 2 paths, 0 coordinates (coordinate can't relate to itself)</p>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>Target 1 Counts:</h3>
          <pre>{JSON.stringify(target1Counts, null, 2)}</pre>
          <p>0 targets, 0 paths, 1 coordinate</p>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>Path 1 Counts:</h3>
          <pre>{JSON.stringify(path1Counts, null, 2)}</pre>
          <p>2 targets (at those coordinates), 0 paths, 2 coordinates</p>
        </div>
      </div>
    );
  },
};

export const RelatedItems: Story = {
  render: () => {
    const registry = new CoordinateRegistry();
    const manager = new RelationshipManager();

    // Create coordinates with names
    const coord1 = registry.getOrCreate([0, 0, 0]);
    registry.updateName(coord1.id, 'Origin');
    const coord2 = registry.getOrCreate([1, 1, 1]);
    registry.updateName(coord2.id, 'Point A');
    const coord3 = registry.getOrCreate([2, 2, 2]);
    registry.updateName(coord3.id, 'Point B');

    // Create relationships
    manager.attachTargetToCoordinate('target-1', coord1.id);
    manager.attachTargetToCoordinate('target-2', coord2.id);
    manager.attachPathToCoordinates('path-1', [coord1.id, coord2.id]);
    manager.attachPathToCoordinates('path-2', [coord2.id, coord3.id]);

    const coordinates = registry.getAll();
    const targets = [
      { id: 'target-1', name: 'Target Alpha' },
      { id: 'target-2', name: 'Target Beta' },
    ];
    const paths = [
      { id: 'path-1', name: 'Path One' },
      { id: 'path-2', name: 'Path Two' },
    ];

    const coord1Related = manager.getRelatedItems('coordinate', coord1.id, coordinates, targets, paths);
    const target1Related = manager.getRelatedItems('target', 'target-1', coordinates, targets, paths);
    const path1Related = manager.getRelatedItems('path', 'path-1', coordinates, targets, paths);

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>Related Items</h2>
        <div style={{ marginTop: '20px' }}>
          <h3>Coordinate 1 (Origin) Related Items:</h3>
          <pre>{JSON.stringify(coord1Related, null, 2)}</pre>
          <p>Should show: Target Alpha (at coord1), Path One (includes coord1)</p>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>Target 1 (Target Alpha) Related Items:</h3>
          <pre>{JSON.stringify(target1Related, null, 2)}</pre>
          <p>Should show: Origin (coordinate), Path One (through coordinate)</p>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>Path 1 (Path One) Related Items:</h3>
          <pre>{JSON.stringify(path1Related, null, 2)}</pre>
          <p>Should show: Origin, Point A (coordinates), Target Alpha (at Origin), Target Beta (at Point A)</p>
        </div>
      </div>
    );
  },
};

export const WithActions: Story = {
  render: () => {
    const registry = new CoordinateRegistry();
    const manager = new RelationshipManager();
    const onAttachTarget = fn();
    const onAttachPath = fn();
    const onDetachTarget = fn();
    const onRemoveTarget = fn();

    // Create some coordinates
    const coord1 = registry.getOrCreate([0, 0, 0]);
    const coord2 = registry.getOrCreate([1, 1, 1]);
    const coord3 = registry.getOrCreate([2, 2, 2]);

    const handleAttachTarget = (targetId: string, coordId: string) => {
      onAttachTarget(targetId, coordId);
      manager.attachTargetToCoordinate(targetId, coordId);
    };

    const handleAttachPath = (pathId: string, coordIds: string[]) => {
      onAttachPath(pathId, coordIds);
      manager.attachPathToCoordinates(pathId, coordIds);
    };

    const handleDetachTarget = (targetId: string, coordId: string) => {
      onDetachTarget(targetId, coordId);
      manager.detachTargetFromCoordinate(targetId, coordId);
    };

    const handleRemoveTarget = (targetId: string) => {
      onRemoveTarget(targetId);
      manager.removeTargetRelationships(targetId);
    };

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h2>Relationship Manager with Actions</h2>
        <div style={{ marginTop: '20px' }}>
          <h3>Available Coordinates:</h3>
          <ul>
            <li>{coord1.id} - {JSON.stringify(coord1.position)}</li>
            <li>{coord2.id} - {JSON.stringify(coord2.position)}</li>
            <li>{coord3.id} - {JSON.stringify(coord3.position)}</li>
          </ul>
        </div>
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => handleAttachTarget('target-1', coord1.id)} 
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Attach Target 1 to Coord 1
          </button>
          <button 
            onClick={() => handleAttachTarget('target-2', coord2.id)} 
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Attach Target 2 to Coord 2
          </button>
          <button 
            onClick={() => handleAttachPath('path-1', [coord1.id, coord2.id])} 
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Attach Path 1 to Coords 1,2
          </button>
          <button 
            onClick={() => handleDetachTarget('target-1', coord1.id)} 
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Detach Target 1
          </button>
          <button 
            onClick={() => handleRemoveTarget('target-2')} 
            style={{ padding: '8px 16px' }}
          >
            Remove Target 2 Relationships
          </button>
        </div>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p>Check the Actions panel to see function calls!</p>
        </div>
      </div>
    );
  },
};

