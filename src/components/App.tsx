import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import Toolbar from './Toolbar';
import HamburgerMenu, { HamburgerMenuItem } from './HamburgerMenu';
import InfiniteGridCanvas from './InfiniteGrid';
import GridItemDetailsDrawer from './GridItemDetailsDrawer';
import ExportWizard from './ExportWizard';
import ImportDialog from './ImportDialog';
import SettingsModal, { CoordinateSettings } from './SettingsModal';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import { useCoordinateRegistry } from '../hooks/useCoordinateRegistry';
import { useRelationshipManager } from '../hooks/useRelationshipManager';
import { Coordinate } from '../services/CoordinateRegistry';
import { RelatedItem } from '../services/RelationshipManager';
import './App.css';

export type SelectedItem = 
  | { type: 'target'; id: string; targetId: string; label: string; name?: string; position: [number, number, number]; iconEmoji?: string }
  | { type: 'path'; id: string; pathType: string; label: string; name?: string; points: [number, number, number][] }
  | { type: 'coordinate'; id: string; position: [number, number, number]; name?: string }
  | null;

const App: React.FC = () => {
  const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);
  const [isRightMenuOpen, setIsRightMenuOpen] = useState(true); // Open by default
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [activeTab, setActiveTab] = useState<'targets' | 'paths' | 'coordinates'>('targets');
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>();
  const [selectedPathId, setSelectedPathId] = useState<string | undefined>();
  const [selectedCoordinateId, setSelectedCoordinateId] = useState<string | undefined>();
  
  // State for placed objects and paths (will be lifted from InfiniteGridCanvas)
  const [placedObjects, setPlacedObjects] = useState<Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>>([]);
  const [placedPaths, setPlacedPaths] = useState<Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; name?: string; litTiles: [number, number, number][] }>>([]);
  const [coordinates, setCoordinates] = useState<Array<{ id: string; position: [number, number, number]; name?: string }>>([]);
  
  // Dialog states
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [coordinateSettings, setCoordinateSettings] = useState<CoordinateSettings>({
    system: 'Cartesian',
    minUnit: 0.1
  });
  
  // Business logic services
  const { registry: coordinateRegistry, getAll: getAllCoordinates, updateName: updateCoordinateName } = useCoordinateRegistry();
  const { manager: relationshipManager, getRelatedItems, getRelationshipCounts, attachTargetToCoordinate, attachPathToCoordinates, detachTargetFromCoordinate, detachPathFromCoordinate } = useRelationshipManager();
  
  // Sync coordinates from registry
  useEffect(() => {
    setCoordinates(coordinateRegistry.getAll());
  }, [coordinateRegistry, coordinates.length]);
  
  const { isDragging } = useDragTargetContext();
  
  // Get selected item IDs for export
  const getSelectedItemIds = () => {
    if (!selectedItem) return { targets: [], paths: [], coordinates: [] };
    
    if (selectedItem.type === 'target') {
      return { targets: [selectedItem.id], paths: [], coordinates: [] };
    } else if (selectedItem.type === 'path') {
      return { targets: [], paths: [selectedItem.id], coordinates: [] };
    } else if (selectedItem.type === 'coordinate') {
      return { targets: [], paths: [], coordinates: [selectedItem.id] };
    }
    return { targets: [], paths: [], coordinates: [] };
  };
  
  // Handle import
  const handleImport = (importData: any) => {
    // Import targets
    if (importData.targets && Array.isArray(importData.targets)) {
      const newTargets = importData.targets.map((t: any) => ({
        id: t.id || `obj_${Date.now()}_${Math.random()}`,
        position: t.position || [0, 0, 0],
        targetId: t.targetId || t.id || 'target',
        targetLabel: t.targetLabel || t.label || 'Imported Target',
        name: t.name,
        iconEmoji: t.iconEmoji || '🎯'
      }));
      setPlacedObjects([...placedObjects, ...newTargets]);
      
      // Create relationships for imported targets
      if (importData.relationships?.targetToCoordinate && relationshipManager) {
        importData.relationships.targetToCoordinate.forEach((rel: any) => {
          const target = newTargets.find(t => t.id === rel.targetId);
          if (target) {
            const coord = coordinateRegistry.getOrCreate(target.position);
            relationshipManager.attachTargetToCoordinate(target.id, coord.id);
          }
        });
      }
    }
    
    // Import paths
    if (importData.paths && Array.isArray(importData.paths)) {
      const newPaths = importData.paths.map((p: any) => ({
        id: p.id || `path_${Date.now()}_${Math.random()}`,
        points: [],
        pathType: p.pathType || 'path-line',
        pathLabel: p.pathLabel || p.label || 'Imported Path',
        name: p.name,
        litTiles: p.litTiles || p.points || []
      }));
      setPlacedPaths([...placedPaths, ...newPaths]);
      
      // Create relationships for imported paths
      if (importData.relationships?.pathToCoordinates && relationshipManager) {
        importData.relationships.pathToCoordinates.forEach((rel: any) => {
          const path = newPaths.find(p => p.id === rel.pathId);
          if (path && rel.coordinateIds) {
            const coordIds = rel.coordinateIds.map((coordId: string) => {
              // Find or create coordinates
              const coord = coordinates.find(c => c.id === coordId);
              if (coord) return coord.id;
              // If coordinate not found, create from path points
              if (path.litTiles && path.litTiles.length > 0) {
                return path.litTiles.map(pos => coordinateRegistry.getOrCreate(pos).id);
              }
              return [];
            }).flat();
            relationshipManager.attachPathToCoordinates(path.id, coordIds);
          }
        });
      }
    }
    
    // Update coordinates
    setCoordinates([...coordinateRegistry.getAll()]);
  };

  const leftMenuItems: HamburgerMenuItem[] = [
    { id: 'scenes', label: 'Scenes', onClick: () => console.log('Scenes clicked') },
    { id: 'targets', label: 'Targets', onClick: () => console.log('Targets clicked') },
    { id: 'settings', label: 'Settings', onClick: () => console.log('Settings clicked') },
  ];

  // Available targets and paths for context menu (from target/path browser)
  const availableTargets = [
    { id: 'target-1', label: 'Target 1', iconEmoji: '🎯' },
    { id: 'target-2', label: 'Target 2', iconEmoji: '🎯' },
    { id: 'target-3', label: 'Target 3', iconEmoji: '🎯' },
    { id: 'target-4', label: 'Target 4', iconEmoji: '🎯' },
    { id: 'target-5', label: 'Target 5', iconEmoji: '🎯' },
  ];

  const availablePaths = [
    { id: 'path-line', label: 'Line', pathType: 'path-line' },
  ];

  const rightMenuItems: HamburgerMenuItem[] = [
    {
      id: 'target-browser',
      label: 'Target browser',
      children: availableTargets.map(target => ({
        id: target.id,
        label: target.label,
        icon: <span>{target.iconEmoji}</span>,
        onClick: () => console.log(`${target.label} clicked`)
      })),
    },
    {
      id: 'path-browser',
      label: 'Path browser',
      children: availablePaths.map(path => ({
        id: path.id,
        label: path.label,
        icon: <span>📏</span>,
        onClick: () => console.log(`${path.label} clicked`)
      })),
    },
  ];

  return (
    <div className="app-container">
      <Toolbar 
        title="Target Creator"
        onMenuToggle={() => setIsLeftMenuOpen(!isLeftMenuOpen)}
        isMenuOpen={isLeftMenuOpen}
        onExport={() => setIsExportWizardOpen(true)}
        onImport={() => setIsImportDialogOpen(true)}
        onSettings={() => setIsSettingsModalOpen(true)}
      />
      <div className="app-body">
        <HamburgerMenu
          isOpen={isLeftMenuOpen}
          position="left"
          onToggle={() => setIsLeftMenuOpen(!isLeftMenuOpen)}
          items={leftMenuItems}
          header={<div className="menu-header">Target Creator</div>}
          footer={<div className="menu-footer">v1.0.0</div>}
        />
        <div className={`app-content ${isLeftMenuOpen ? 'left-menu-open' : ''} ${isRightMenuOpen ? 'right-menu-open' : ''} ${isDragging ? 'dragging' : ''}`}>
          <InfiniteGridCanvas 
            selectedItem={selectedItem}
            relatedItemIds={selectedItem && relationshipManager ? (() => {
              const relatedItems = relationshipManager.getRelatedItems(
                selectedItem.type,
                selectedItem.id,
                coordinates,
                placedObjects,
                placedPaths
              );
              return {
                targets: relatedItems.filter(item => item.type === 'target').map(item => item.id),
                paths: relatedItems.filter(item => item.type === 'path').map(item => item.id),
                coordinates: relatedItems.filter(item => item.type === 'coordinate').map(item => item.id)
              };
            })() : { targets: [], paths: [], coordinates: [] }}
            onSelectItem={(item) => {
              setSelectedItem(item);
              // Set active tab and selected IDs based on item type
              if (item) {
                if (item.type === 'target') {
                  setSelectedTargetId(item.id);
                  setSelectedPathId(undefined);
                  setSelectedCoordinateId(undefined);
                  setActiveTab('targets');
                } else if (item.type === 'path') {
                  setActiveTab('paths');
                  setSelectedPathId(item.id);
                } else if (item.type === 'coordinate') {
                  setActiveTab('coordinates');
                  setSelectedCoordinateId(item.id);
                }
              }
            }}
            coordinateRegistry={coordinateRegistry}
            relationshipManager={relationshipManager}
            onCoordinatesChange={(coords) => setCoordinates(coords)}
            onPlacedObjectsChange={setPlacedObjects}
            onPlacedPathsChange={setPlacedPaths}
            placedObjects={placedObjects}
            placedPaths={placedPaths}
            availableTargets={availableTargets}
            availablePaths={availablePaths}
          />
        </div>
        <HamburgerMenu
          isOpen={isRightMenuOpen}
          position="right"
          onToggle={() => setIsRightMenuOpen(!isRightMenuOpen)}
          items={rightMenuItems}
          initiallyExpanded={['target-browser', 'path-browser']}
        />
      </div>
      
      {/* Bottom Drawer */}
      <GridItemDetailsDrawer
        isOpen={selectedItem !== null}
        onClose={() => {
          setSelectedItem(null);
          setSelectedTargetId(undefined);
          setSelectedPathId(undefined);
          setSelectedCoordinateId(undefined);
        }}
        title={selectedItem ? (selectedItem.name || (selectedItem.type === 'coordinate' ? `[${selectedItem.position[0]}, ${selectedItem.position[1]}, ${selectedItem.position[2]}]` : selectedItem.label)) : undefined}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedTargetId={selectedItem?.type === 'target' ? selectedItem.id : selectedTargetId}
        selectedPathId={selectedPathId}
        selectedCoordinateId={selectedCoordinateId}
        placedPaths={placedPaths}
        onTargetSelect={(id) => {
          setSelectedTargetId(id);
          setActiveTab('targets');
        }}
        onPathSelect={(id) => {
          setSelectedPathId(id);
          setActiveTab('paths');
        }}
        onCoordinateSelect={(id) => {
          setSelectedCoordinateId(id);
          setActiveTab('coordinates');
        }}
      />
      
      {/* Export Wizard */}
      <ExportWizard
        isOpen={isExportWizardOpen}
        onClose={() => setIsExportWizardOpen(false)}
        targets={placedObjects}
        paths={placedPaths}
        coordinates={coordinates}
        relationshipManager={relationshipManager}
        coordinateSystem={coordinateSettings.system}
        selectedItemIds={getSelectedItemIds()}
      />
      
      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImport}
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={coordinateSettings}
        onSettingsChange={setCoordinateSettings}
      />
    </div>
  );
};

export default App;
