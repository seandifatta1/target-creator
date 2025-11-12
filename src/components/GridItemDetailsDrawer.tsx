import * as React from 'react';
import { Drawer as BPDrawer, Button, Icon, Tabs, Tab, HTMLSelect, HTMLTable } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useGridItemsService } from '../hooks/useGridItemsService';
import type { IGridItemsService } from '../services/GridItemsService';
import type { Target, Path, Coordinate } from '../types/gridItems';
import './GridItemDetailsDrawer.css';

export interface GridItemDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  // New props for split layout
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  activeTab?: 'targets' | 'paths' | 'coordinates';
  onTabChange?: (tab: 'targets' | 'paths' | 'coordinates') => void;
  // Selected item ID - when a target is selected, display its details
  selectedTargetId?: string;
  selectedPathId?: string;
  selectedCoordinateId?: string;
  onTargetSelect?: (id: string) => void;
  onPathSelect?: (id: string) => void;
  onCoordinateSelect?: (id: string) => void;
  // Optional service for dependency injection (testing/storybook)
  service?: IGridItemsService;
}

/**
 * GridItemDetailsDrawer - Bottom drawer component for displaying grid item details and navigation
 * 
 * **How it's used in the app:**
 * This component appears at the bottom of the screen when a user selects an item
 * (target, path, or coordinate) from the 3D grid. For example, when a user clicks
 * on a target object in the grid, the drawer slides up from the bottom showing
 * details about that target, related items, and tabs for navigating between targets,
 * paths, and coordinates. It's part of the item inspection system that allows users
 * to view and manage details about placed objects in the grid.
 * 
 * **Dependency Injection:**
 * All callbacks and data are injected through props:
 * - `onClose`: Injected callback to allow parent to control drawer visibility.
 *   This enables separation of concerns - drawer handles UI, parent manages state.
 * - `onTabChange`: Injected callback to notify parent when tabs change.
 *   This enables parent to sync tab state with other UI elements.
 * - `onTargetSelect`, `onPathSelect`, `onCoordinateSelect`: Injected callbacks
 *   for item selection. This enables parent to handle selection logic and update
 *   the 3D grid accordingly.
 * - All data arrays (targets, paths, coordinates): Injected to allow testing with
 *   mock data and to enable different data sources. This enables easier testing
 *   and flexibility to swap data providers.
 */
const GridItemDetailsDrawer: React.FC<GridItemDetailsDrawerProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  leftContent,
  rightContent,
  activeTab = 'targets',
  onTabChange,
  selectedTargetId,
  selectedPathId,
  selectedCoordinateId,
  onTargetSelect,
  onPathSelect,
  onCoordinateSelect,
  service
}) => {
  const { 
    getTarget, 
    getTargetPath, 
    getCoordinatesByPath,
    getPath,
    getCoordinate,
    getPathsByCoordinate,
    getTargetsByCoordinate
  } = useGridItemsService(service);
  const [internalTab, setInternalTab] = React.useState<'targets' | 'paths' | 'coordinates'>(activeTab);

  React.useEffect(() => {
    setInternalTab(activeTab);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    const newTab = tabId as 'targets' | 'paths' | 'coordinates';
    setInternalTab(newTab);
    onTabChange?.(newTab);
  };

  // Get data based on what's selected
  const target: Target | null = selectedTargetId ? getTarget(selectedTargetId) : null;
  const selectedPath: Path | null = selectedPathId ? getPath(selectedPathId) : null;
  const selectedCoordinate: Coordinate | null = selectedCoordinateId ? getCoordinate(selectedCoordinateId) : null;
  
  // Get related data
  const path = target ? getTargetPath(target.id) : selectedPath;
  const coordinates: Coordinate[] = path ? getCoordinatesByPath(path.id) : [];
  
  // For coordinate selection, get paths and targets that go through it
  const pathsThroughCoordinate: Path[] = selectedCoordinate && selectedCoordinate.id 
    ? getPathsByCoordinate(selectedCoordinate.id) 
    : [];
  const targetsThroughCoordinate: Target[] = selectedCoordinate && selectedCoordinate.id 
    ? getTargetsByCoordinate(selectedCoordinate.id) 
    : [];

  // Render target properties in left panel
  const renderTargetProperties = () => {
    if (!target) {
      return (
        <div className="drawer-target-details-empty">
          <p>No target selected</p>
        </div>
      );
    }

    return (
      <div className="drawer-target-properties">
        <h3 className="drawer-target-properties-title">Target Properties</h3>
        <div className="drawer-target-properties-content">
          <div className="drawer-property-item">
            <span className="drawer-property-label">ID:</span>
            <span className="drawer-property-value">{target.id}</span>
          </div>
          <div className="drawer-property-item">
            <span className="drawer-property-label">Label:</span>
            <span className="drawer-property-value">{target.label}</span>
          </div>
          <div className="drawer-property-item">
            <span className="drawer-property-label">Path ID:</span>
            <span className="drawer-property-value">{target.pathId}</span>
          </div>
          {path && (
            <>
              <div className="drawer-property-item">
                <span className="drawer-property-label">Path Label:</span>
                <span className="drawer-property-value">{path.label}</span>
              </div>
              <div className="drawer-property-item">
                <span className="drawer-property-label">Start Coordinate:</span>
                <span className="drawer-property-value">
                  {coordinates.length > 0 
                    ? `[${coordinates[0].position[0]}, ${coordinates[0].position[1]}, ${coordinates[0].position[2]}]`
                    : 'N/A'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render path properties in left panel
  const renderPathProperties = () => {
    if (!selectedPath) {
      return (
        <div className="drawer-target-details-empty">
          <p>No path selected</p>
        </div>
      );
    }

    const pathTarget = getTarget(selectedPath.targetId);

    return (
      <div className="drawer-target-properties">
        <h3 className="drawer-target-properties-title">Path Properties</h3>
        <div className="drawer-target-properties-content">
          <div className="drawer-property-item">
            <span className="drawer-property-label">ID:</span>
            <span className="drawer-property-value">{selectedPath.id}</span>
          </div>
          <div className="drawer-property-item">
            <span className="drawer-property-label">Label:</span>
            <span className="drawer-property-value">{selectedPath.label}</span>
          </div>
          <div className="drawer-property-item">
            <span className="drawer-property-label">Target ID:</span>
            <span className="drawer-property-value">{selectedPath.targetId}</span>
          </div>
          {pathTarget && (
            <div className="drawer-property-item">
              <span className="drawer-property-label">Target Label:</span>
              <span className="drawer-property-value">{pathTarget.label}</span>
            </div>
          )}
          <div className="drawer-property-item">
            <span className="drawer-property-label">Coordinates Count:</span>
            <span className="drawer-property-value">{selectedPath.coordinates.length}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render coordinate properties in left panel
  const renderCoordinateProperties = () => {
    if (!selectedCoordinate) {
      return (
        <div className="drawer-target-details-empty">
          <p>No coordinate selected</p>
        </div>
      );
    }

    return (
      <div className="drawer-target-properties">
        <h3 className="drawer-target-properties-title">Coordinate Properties</h3>
        <div className="drawer-target-properties-content">
          {selectedCoordinate.id && (
            <div className="drawer-property-item">
              <span className="drawer-property-label">ID:</span>
              <span className="drawer-property-value">{selectedCoordinate.id}</span>
            </div>
          )}
          <div className="drawer-property-item">
            <span className="drawer-property-label">Label:</span>
            <span className="drawer-property-value">{selectedCoordinate.label}</span>
          </div>
          <div className="drawer-property-item">
            <span className="drawer-property-label">Position:</span>
            <span className="drawer-property-value">
              [{selectedCoordinate.position[0]}, {selectedCoordinate.position[1]}, {selectedCoordinate.position[2]}]
            </span>
          </div>
          <div className="drawer-property-item">
            <span className="drawer-property-label">Paths Count:</span>
            <span className="drawer-property-value">{pathsThroughCoordinate.length}</span>
          </div>
          <div className="drawer-property-item">
            <span className="drawer-property-label">Targets Count:</span>
            <span className="drawer-property-value">{targetsThroughCoordinate.length}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render coordinates table in right panel
  const renderCoordinatesTable = () => {
    const coordsToShow = coordinates.length > 0 ? coordinates : (selectedCoordinate ? [selectedCoordinate] : []);
    
    if (coordsToShow.length === 0) {
      return (
        <div className="drawer-coordinates-empty">
          <p>No coordinates available</p>
        </div>
      );
    }

    return (
      <div className="drawer-coordinates-table-container">
        <h3 className="drawer-coordinates-table-title">Coordinates</h3>
        <HTMLTable striped className="drawer-coordinates-table">
          <thead>
            <tr>
              <th>Index</th>
              <th>X</th>
              <th>Y</th>
              <th>Z</th>
              <th>Label</th>
            </tr>
          </thead>
          <tbody>
            {coordsToShow.map((coord, index) => (
              <tr key={coord.id || `coord-${index}`}>
                <td>{index + 1}</td>
                <td>{coord.position[0]}</td>
                <td>{coord.position[1]}</td>
                <td>{coord.position[2]}</td>
                <td>{coord.label || '-'}</td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
      </div>
    );
  };

  // Determine content to show
  const showTargetDetails = selectedTargetId && target;
  const showPathDetails = selectedPathId && selectedPath;
  const showCoordinateDetails = selectedCoordinateId && selectedCoordinate;
  
  let leftPanelContent = leftContent;
  let rightPanelContent = rightContent;
  
  if (!leftPanelContent) {
    if (showTargetDetails) {
      leftPanelContent = renderTargetProperties();
    } else if (showPathDetails) {
      leftPanelContent = renderPathProperties();
    } else if (showCoordinateDetails) {
      leftPanelContent = renderCoordinateProperties();
    } else {
      leftPanelContent = children;
    }
  }
  
  if (!rightPanelContent) {
    if (showTargetDetails || showPathDetails) {
      rightPanelContent = renderCoordinatesTable();
    } else if (showCoordinateDetails) {
      // For coordinate, show paths that go through it
      rightPanelContent = pathsThroughCoordinate.length > 0 ? (
        <div className="drawer-coordinates-table-container">
          <h3 className="drawer-coordinates-table-title">Paths Through This Coordinate</h3>
          <HTMLTable striped className="drawer-coordinates-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Label</th>
                <th>Target ID</th>
              </tr>
            </thead>
            <tbody>
              {pathsThroughCoordinate.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.label}</td>
                  <td>{p.targetId}</td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </div>
      ) : (
        <div className="drawer-coordinates-empty">
          <p>No paths go through this coordinate</p>
        </div>
      );
    }
  }

  return (
    <BPDrawer
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      size="60vh"
      className="custom-drawer"
      icon={title ? undefined : <Icon icon={IconNames.MENU_CLOSED} />}
      title={title}
      canOutsideClickClose
      canEscapeKeyClose
    >
      <div className="drawer-content">
        {leftPanelContent || rightPanelContent ? (
          <div className="drawer-split-layout">
            {/* Left side - Target properties */}
            <div className="drawer-left-panel">
              {leftPanelContent}
            </div>
            
            {/* Right side - Coordinates table */}
            {rightPanelContent && (
              <div className="drawer-right-panel">
                {rightPanelContent}
              </div>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </BPDrawer>
  );
};

export default GridItemDetailsDrawer;

