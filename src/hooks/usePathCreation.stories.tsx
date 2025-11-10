import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef } from 'react';
import { Button, OverlayToaster } from '@blueprintjs/core';
import { usePathCreation } from './usePathCreation';
import { PathData } from '../utils/pathCreationLogic';

/**
 * Demo component that wraps usePathCreation hook for Storybook visualization
 */
const PathCreationDemo: React.FC = () => {
  const [paths, setPaths] = useState<PathData[]>([]);
  const toasterRef = useRef<OverlayToaster | null>(null);

  const {
    pathCreationMode,
    startPathCreation,
    completePathCreation,
    cancelPathCreation,
    showPathCreationError,
  } = usePathCreation(paths, setPaths, { toasterRef });

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h3>Path Creation Hook Demo</h3>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
        <p><strong>Status:</strong> {pathCreationMode.isActive ? '🟢 Active' : '⚪ Inactive'}</p>
        {pathCreationMode.isActive && (
          <>
            <p><strong>Type:</strong> {pathCreationMode.type || 'None'}</p>
            <p><strong>Start:</strong> {pathCreationMode.startPosition ? `[${pathCreationMode.startPosition.join(', ')}]` : 'None'}</p>
            <p><strong>Path Type:</strong> {pathCreationMode.pathType || 'None'}</p>
            <p><strong>Path Label:</strong> {pathCreationMode.pathLabel || 'None'}</p>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Button
          intent="primary"
          onClick={() => startPathCreation([0, 0, 0], 'path-line', 'Test Path', 'My Path')}
          disabled={pathCreationMode.isActive}
        >
          Start Path Creation
        </Button>
        <Button
          intent="success"
          onClick={() => completePathCreation([0, 0, 0], [2, 0, 0], 'path-line', 'Test Path')}
          disabled={!pathCreationMode.isActive}
        >
          Complete Path
        </Button>
        <Button
          intent="warning"
          onClick={cancelPathCreation}
          disabled={!pathCreationMode.isActive}
        >
          Cancel
        </Button>
        <Button
          intent="danger"
          onClick={() => showPathCreationError('Test error message')}
        >
          Show Error
        </Button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Created Paths ({paths.length})</h4>
        {paths.length === 0 ? (
          <p style={{ color: '#666' }}>No paths created yet</p>
        ) : (
          <ul>
            {paths.map((path) => (
              <li key={path.id}>
                {path.name || path.pathLabel} - {path.litTiles.length} tiles
              </li>
            ))}
          </ul>
        )}
      </div>

      <OverlayToaster ref={toasterRef} position="top" />
    </div>
  );
};

const meta: Meta<typeof PathCreationDemo> = {
  title: 'Hooks/usePathCreation',
  component: PathCreationDemo,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PathCreationDemo>;

export const Default: Story = {};

export const WithExistingPaths: Story = {
  render: () => {
    const [paths] = useState<PathData[]>([
      {
        id: 'path-1',
        points: [],
        pathType: 'path-line',
        pathLabel: 'Existing Path',
        litTiles: [[0, 0, 0], [1, 0, 0]],
      },
    ]);
    const toasterRef = useRef<OverlayToaster | null>(null);

    const {
      pathCreationMode,
      startPathCreation,
      completePathCreation,
      cancelPathCreation,
    } = usePathCreation(paths, () => {}, { toasterRef });

    return (
      <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
        <h3>Path Creation with Existing Paths</h3>
        <p>Existing paths: {paths.length}</p>
        <Button onClick={() => startPathCreation([2, 0, 0], 'path-line', 'New Path')}>
          Start New Path
        </Button>
        <OverlayToaster ref={toasterRef} position="top" />
      </div>
    );
  },
};

