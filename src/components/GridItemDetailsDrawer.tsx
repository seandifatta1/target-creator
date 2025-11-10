import * as React from 'react';
import { Drawer as BPDrawer, Button, Icon, Tabs, Tab, HTMLSelect } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
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
  // Mock data for dropdowns
  targets?: Array<{ id: string; name?: string; label: string }>;
  paths?: Array<{ id: string; name?: string; label: string }>;
  coordinates?: Array<{ id: string; name?: string; position: [number, number, number] }>;
  selectedTargetId?: string;
  selectedPathId?: string;
  selectedCoordinateId?: string;
  onTargetSelect?: (id: string) => void;
  onPathSelect?: (id: string) => void;
  onCoordinateSelect?: (id: string) => void;
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
  targets = [],
  paths = [],
  coordinates = [],
  selectedTargetId,
  selectedPathId,
  selectedCoordinateId,
  onTargetSelect,
  onPathSelect,
  onCoordinateSelect
}) => {
  const [internalTab, setInternalTab] = React.useState<'targets' | 'paths' | 'coordinates'>(activeTab);

  React.useEffect(() => {
    setInternalTab(activeTab);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    const newTab = tabId as 'targets' | 'paths' | 'coordinates';
    setInternalTab(newTab);
    onTabChange?.(newTab);
  };

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
        {leftContent || rightContent ? (
          <div className="drawer-split-layout">
            {/* Left side - Item details */}
            <div className="drawer-left-panel">
              {leftContent || children}
            </div>
            
            {/* Vertical divider */}
            <div className="drawer-divider" />
            
            {/* Right side - Tabs with dropdowns */}
            <div className="drawer-right-panel">
              <Tabs
                id="drawer-tabs"
                selectedTabId={internalTab}
                onChange={handleTabChange}
                className="drawer-tabs"
              >
                <Tab id="targets" title="Targets" panel={
                  <div className="drawer-tab-content">
                    <div className="drawer-dropdown-container">
                      <label className="drawer-dropdown-label">Select Target:</label>
                      <HTMLSelect
                        value={selectedTargetId || ''}
                        onChange={(e) => onTargetSelect?.(e.currentTarget.value)}
                        fill
                      >
                        <option value="">Select...</option>
                        {targets.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name || t.label}
                          </option>
                        ))}
                      </HTMLSelect>
                    </div>
                    <div className="drawer-tab-details">
                      {/* Placeholder for selected target details */}
                      {selectedTargetId ? (
                        <div className="detail-section">
                          <p>Target details will appear here</p>
                        </div>
                      ) : (
                        <div className="detail-section">
                          <p>Select a target from the dropdown</p>
                        </div>
                      )}
                    </div>
                  </div>
                } />
                <Tab id="paths" title="Paths" panel={
                  <div className="drawer-tab-content">
                    <div className="drawer-dropdown-container">
                      <label className="drawer-dropdown-label">Select Path:</label>
                      <HTMLSelect
                        value={selectedPathId || ''}
                        onChange={(e) => onPathSelect?.(e.currentTarget.value)}
                        fill
                      >
                        <option value="">Select...</option>
                        {paths.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name || p.label}
                          </option>
                        ))}
                      </HTMLSelect>
                    </div>
                    <div className="drawer-tab-details">
                      {/* Placeholder for selected path details */}
                      {selectedPathId ? (
                        <div className="detail-section">
                          <p>Path details will appear here</p>
                        </div>
                      ) : (
                        <div className="detail-section">
                          <p>Select a path from the dropdown</p>
                        </div>
                      )}
                    </div>
                  </div>
                } />
                <Tab id="coordinates" title="Coordinates" panel={
                  <div className="drawer-tab-content">
                    <div className="drawer-dropdown-container">
                      <label className="drawer-dropdown-label">Select Coordinate:</label>
                      <HTMLSelect
                        value={selectedCoordinateId || ''}
                        onChange={(e) => onCoordinateSelect?.(e.currentTarget.value)}
                        fill
                      >
                        <option value="">Select...</option>
                        {coordinates.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name || `[${c.position[0]}, ${c.position[1]}, ${c.position[2]}]`}
                          </option>
                        ))}
                      </HTMLSelect>
                    </div>
                    <div className="drawer-tab-details">
                      {/* Placeholder for selected coordinate details */}
                      {selectedCoordinateId ? (
                        <div className="detail-section">
                          <p>Coordinate details will appear here</p>
                        </div>
                      ) : (
                        <div className="detail-section">
                          <p>Select a coordinate from the dropdown</p>
                        </div>
                      )}
                    </div>
                  </div>
                } />
              </Tabs>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </BPDrawer>
  );
};

export default GridItemDetailsDrawer;

