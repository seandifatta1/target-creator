import * as React from 'react';
import { useState } from 'react';
import { Dialog, Button, Breadcrumbs, Breadcrumb, Checkbox, RadioGroup, Radio, HTMLSelect, Label, Divider, Icon, ProgressBar } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './ExportWizard.css';

export interface ExportData {
  targets: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>;
  paths: Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; name?: string; litTiles: [number, number, number][] }>;
  coordinates: Array<{ id: string; position: [number, number, number]; name?: string }>;
  relationships?: {
    targetToCoordinate: Array<{ targetId: string; coordinateId: string }>;
    pathToCoordinates: Array<{ pathId: string; coordinateIds: string[] }>;
  };
  metadata?: {
    exportDate: string;
    coordinateSystem: string;
    version: string;
  };
}

interface ExportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  targets: Array<{ id: string; position: [number, number, number]; targetId: string; targetLabel: string; name?: string; iconEmoji?: string }>;
  paths: Array<{ id: string; points: [number, number, number][]; pathType: string; pathLabel: string; name?: string; litTiles: [number, number, number][] }>;
  coordinates: Array<{ id: string; position: [number, number, number]; name?: string }>;
  relationshipManager?: any;
  coordinateSystem: string;
  selectedItemIds?: { targets: string[]; paths: string[]; coordinates: string[] };
}

type ExportStep = 1 | 2 | 3 | 4;
type ExportFormat = 'json' | 'csv' | 'xml' | 'geojson';

const ExportWizard: React.FC<ExportWizardProps> = ({
  isOpen,
  onClose,
  targets,
  paths,
  coordinates,
  relationshipManager,
  coordinateSystem,
  selectedItemIds
}) => {
  const [currentStep, setCurrentStep] = useState<ExportStep>(1);
  const [selectedData, setSelectedData] = useState({
    targets: true,
    paths: true,
    coordinates: true,
    relationships: true,
    metadata: true
  });
  const [selectionMode, setSelectionMode] = useState<'all' | 'selected'>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportCoordinateSystem, setExportCoordinateSystem] = useState<string>(coordinateSystem);
  const [fileName, setFileName] = useState<string>('target-creator-export');
  const [isExporting, setIsExporting] = useState(false);

  const steps = [
    { step: 1, label: 'Data Selection' },
    { step: 2, label: 'Format & Options' },
    { step: 3, label: 'Preview' },
    { step: 4, label: 'Export' }
  ];

  const breadcrumbs = steps.map((s, index) => ({
    text: s.label,
    onClick: () => {
      if (index + 1 < currentStep) {
        setCurrentStep(index + 1 as ExportStep);
      }
    },
    className: index + 1 === currentStep ? 'active' : index + 1 < currentStep ? 'completed' : ''
  }));

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as ExportStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as ExportStep);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      setCurrentStep(1);
      onClose();
    }
  };

  const getFilteredData = () => {
    if (selectionMode === 'selected' && selectedItemIds) {
      return {
        targets: targets.filter(t => selectedItemIds.targets.includes(t.id)),
        paths: paths.filter(p => selectedItemIds.paths.includes(p.id)),
        coordinates: coordinates.filter(c => selectedItemIds.coordinates.includes(c.id))
      };
    }
    return { targets, paths, coordinates };
  };

  const getRelationships = () => {
    if (!relationshipManager || !selectedData.relationships) return null;

    const filteredData = getFilteredData();
    const targetToCoordinate: Array<{ targetId: string; coordinateId: string }> = [];
    const pathToCoordinates: Array<{ pathId: string; coordinateIds: string[] }> = [];

    filteredData.targets.forEach(target => {
      const coordIds = relationshipManager.getTargetCoordinates(target.id);
      if (coordIds.length > 0) {
        targetToCoordinate.push({ targetId: target.id, coordinateId: coordIds[0] });
      }
    });

    filteredData.paths.forEach(path => {
      const coordIds = relationshipManager.getPathCoordinates(path.id);
      if (coordIds.length > 0) {
        pathToCoordinates.push({ pathId: path.id, coordinateIds: coordIds });
      }
    });

    return { targetToCoordinate, pathToCoordinates };
  };

  const generateExportData = (): ExportData => {
    const filteredData = getFilteredData();
    const relationships = getRelationships();

    const exportData: ExportData = {
      targets: selectedData.targets ? filteredData.targets : [],
      paths: selectedData.paths ? filteredData.paths : [],
      coordinates: selectedData.coordinates ? filteredData.coordinates : [],
    };

    if (selectedData.relationships && relationships) {
      exportData.relationships = relationships;
    }

    if (selectedData.metadata) {
      exportData.metadata = {
        exportDate: new Date().toISOString(),
        coordinateSystem: exportCoordinateSystem,
        version: '1.0.0'
      };
    }

    return exportData;
  };

  const exportToJSON = (data: ExportData) => {
    return JSON.stringify(data, null, 2);
  };

  const exportToCSV = (data: ExportData) => {
    let csv = '';
    
    if (data.targets.length > 0) {
      csv += 'Targets\n';
      csv += 'ID,Name,Target ID,Label,X,Y,Z\n';
      data.targets.forEach(t => {
        csv += `${t.id},${t.name || ''},${t.targetId},${t.targetLabel},${t.position[0]},${t.position[1]},${t.position[2]}\n`;
      });
      csv += '\n';
    }

    if (data.paths.length > 0) {
      csv += 'Paths\n';
      csv += 'ID,Name,Type,Label,Points\n';
      data.paths.forEach(p => {
        const pointsStr = p.litTiles?.map(pt => `[${pt[0]},${pt[1]},${pt[2]}]`).join(';') || '';
        csv += `${p.id},${p.name || ''},${p.pathType},${p.pathLabel},"${pointsStr}"\n`;
      });
      csv += '\n';
    }

    if (data.coordinates.length > 0) {
      csv += 'Coordinates\n';
      csv += 'ID,Name,X,Y,Z\n';
      data.coordinates.forEach(c => {
        csv += `${c.id},${c.name || ''},${c.position[0]},${c.position[1]},${c.position[2]}\n`;
      });
    }

    return csv;
  };

  const exportToXML = (data: ExportData) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<export>\n';
    
    if (data.metadata) {
      xml += '  <metadata>\n';
      xml += `    <exportDate>${data.metadata.exportDate}</exportDate>\n`;
      xml += `    <coordinateSystem>${data.metadata.coordinateSystem}</coordinateSystem>\n`;
      xml += `    <version>${data.metadata.version}</version>\n`;
      xml += '  </metadata>\n';
    }

    if (data.targets.length > 0) {
      xml += '  <targets>\n';
      data.targets.forEach(t => {
        xml += '    <target>\n';
        xml += `      <id>${t.id}</id>\n`;
        xml += `      <name>${t.name || ''}</name>\n`;
        xml += `      <targetId>${t.targetId}</targetId>\n`;
        xml += `      <label>${t.targetLabel}</label>\n`;
        xml += `      <position x="${t.position[0]}" y="${t.position[1]}" z="${t.position[2]}" />\n`;
        xml += '    </target>\n';
      });
      xml += '  </targets>\n';
    }

    if (data.paths.length > 0) {
      xml += '  <paths>\n';
      data.paths.forEach(p => {
        xml += '    <path>\n';
        xml += `      <id>${p.id}</id>\n`;
        xml += `      <name>${p.name || ''}</name>\n`;
        xml += `      <type>${p.pathType}</type>\n`;
        xml += `      <label>${p.pathLabel}</label>\n`;
        xml += '      <points>\n';
        p.litTiles?.forEach(pt => {
          xml += `        <point x="${pt[0]}" y="${pt[1]}" z="${pt[2]}" />\n`;
        });
        xml += '      </points>\n';
        xml += '    </path>\n';
      });
      xml += '  </paths>\n';
    }

    if (data.coordinates.length > 0) {
      xml += '  <coordinates>\n';
      data.coordinates.forEach(c => {
        xml += '    <coordinate>\n';
        xml += `      <id>${c.id}</id>\n`;
        xml += `      <name>${c.name || ''}</name>\n`;
        xml += `      <position x="${c.position[0]}" y="${c.position[1]}" z="${c.position[2]}" />\n`;
        xml += '    </coordinate>\n';
      });
      xml += '  </coordinates>\n';
    }

    xml += '</export>';
    return xml;
  };

  const exportToGeoJSON = (data: ExportData) => {
    const features: any[] = [];

    // Add targets as Point features
    data.targets.forEach(t => {
      features.push({
        type: 'Feature',
        properties: {
          id: t.id,
          name: t.name || '',
          targetId: t.targetId,
          label: t.targetLabel,
          type: 'target'
        },
        geometry: {
          type: 'Point',
          coordinates: [t.position[0], t.position[1], t.position[2]]
        }
      });
    });

    // Add paths as LineString features
    data.paths.forEach(p => {
      if (p.litTiles && p.litTiles.length > 0) {
        features.push({
          type: 'Feature',
          properties: {
            id: p.id,
            name: p.name || '',
            pathType: p.pathType,
            label: p.pathLabel,
            type: 'path'
          },
          geometry: {
            type: 'LineString',
            coordinates: p.litTiles.map(pt => [pt[0], pt[1], pt[2]])
          }
        });
      }
    });

    return JSON.stringify({
      type: 'FeatureCollection',
      features: features
    }, null, 2);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = generateExportData();
      let content = '';
      let mimeType = '';
      let extension = '';

      switch (exportFormat) {
        case 'json':
          content = exportToJSON(exportData);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'csv':
          content = exportToCSV(exportData);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'xml':
          content = exportToXML(exportData);
          mimeType = 'application/xml';
          extension = 'xml';
          break;
        case 'geojson':
          content = exportToGeoJSON(exportData);
          mimeType = 'application/geo+json';
          extension = 'geojson';
          break;
      }

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Close wizard after short delay
      setTimeout(() => {
        setIsExporting(false);
        handleClose();
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const filteredData = getFilteredData();
  const exportData = generateExportData();
  const itemCounts = {
    targets: exportData.targets.length,
    paths: exportData.paths.length,
    coordinates: exportData.coordinates.length,
    relationships: exportData.relationships ? 
      (exportData.relationships.targetToCoordinate.length + exportData.relationships.pathToCoordinates.length) : 0
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Export Data"
      className="export-wizard-dialog"
      icon={<Icon icon={IconNames.EXPORT} />}
      canOutsideClickClose={!isExporting}
      canEscapeKeyClose={!isExporting}
    >
      <div className="export-wizard-content">
        <Breadcrumbs
          items={breadcrumbs}
          className="export-wizard-breadcrumbs"
        />

        <Divider />

        {/* Step 1: Data Selection */}
        {currentStep === 1 && (
          <div className="export-step-content">
            <h3>Select Data to Export</h3>
            <div className="export-option-group">
              <Label>Selection Mode:</Label>
              <RadioGroup
                selectedValue={selectionMode}
                onChange={(e) => setSelectionMode(e.currentTarget.value as 'all' | 'selected')}
              >
                <Radio label={`All items (${targets.length} targets, ${paths.length} paths, ${coordinates.length} coordinates)`} value="all" />
                <Radio 
                  label={`Selected items only (${selectedItemIds?.targets.length || 0} targets, ${selectedItemIds?.paths.length || 0} paths, ${selectedItemIds?.coordinates.length || 0} coordinates)`} 
                  value="selected"
                  disabled={!selectedItemIds || (selectedItemIds.targets.length === 0 && selectedItemIds.paths.length === 0 && selectedItemIds.coordinates.length === 0)}
                />
              </RadioGroup>
            </div>

            <div className="export-option-group" style={{ marginTop: '20px' }}>
              <Label>Include in Export:</Label>
              <Checkbox
                label={`Targets (${filteredData.targets.length})`}
                checked={selectedData.targets}
                onChange={(e) => setSelectedData({ ...selectedData, targets: e.currentTarget.checked })}
              />
              <Checkbox
                label={`Paths (${filteredData.paths.length})`}
                checked={selectedData.paths}
                onChange={(e) => setSelectedData({ ...selectedData, paths: e.currentTarget.checked })}
              />
              <Checkbox
                label={`Coordinates (${filteredData.coordinates.length})`}
                checked={selectedData.coordinates}
                onChange={(e) => setSelectedData({ ...selectedData, coordinates: e.currentTarget.checked })}
              />
              <Checkbox
                label="Relationships"
                checked={selectedData.relationships}
                onChange={(e) => setSelectedData({ ...selectedData, relationships: e.currentTarget.checked })}
              />
              <Checkbox
                label="Metadata (export date, coordinate system, version)"
                checked={selectedData.metadata}
                onChange={(e) => setSelectedData({ ...selectedData, metadata: e.currentTarget.checked })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Format & Options */}
        {currentStep === 2 && (
          <div className="export-step-content">
            <h3>Format & Export Options</h3>
            <div className="export-option-group">
              <Label>Export Format:</Label>
              <HTMLSelect
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                fill
              >
                <option value="json">JSON (JavaScript Object Notation)</option>
                <option value="csv">CSV (Comma-Separated Values)</option>
                <option value="xml">XML (Extensible Markup Language)</option>
                <option value="geojson">GeoJSON (Geographic JSON)</option>
              </HTMLSelect>
            </div>

            <div className="export-option-group" style={{ marginTop: '20px' }}>
              <Label>Coordinate System for Export:</Label>
              <HTMLSelect
                value={exportCoordinateSystem}
                onChange={(e) => setExportCoordinateSystem(e.target.value)}
                fill
              >
                <option value="Cartesian">Cartesian (X-Y-Z)</option>
                <option value="NED">NED (North-East-Down)</option>
                <option value="Spherical">Spherical (R-θ-φ)</option>
              </HTMLSelect>
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                Note: Coordinates will be exported in the selected system. Conversion may be applied if different from current system.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 3 && (
          <div className="export-step-content">
            <h3>Preview Export</h3>
            <div className="export-preview">
              <div className="preview-summary">
                <h4>Export Summary</h4>
                <ul>
                  <li>Targets: {itemCounts.targets}</li>
                  <li>Paths: {itemCounts.paths}</li>
                  <li>Coordinates: {itemCounts.coordinates}</li>
                  {selectedData.relationships && <li>Relationships: {itemCounts.relationships}</li>}
                  <li>Format: {exportFormat.toUpperCase()}</li>
                  <li>Coordinate System: {exportCoordinateSystem}</li>
                </ul>
              </div>

              {itemCounts.targets === 0 && itemCounts.paths === 0 && itemCounts.coordinates === 0 && (
                <div className="preview-warning">
                  <Icon icon={IconNames.WARNING_SIGN} />
                  <span>No data selected for export. Please go back and select data to export.</span>
                </div>
              )}

              {exportFormat === 'json' && (
                <div className="preview-code">
                  <Label>Preview (JSON):</Label>
                  <pre>{JSON.stringify(exportData, null, 2).substring(0, 500)}...</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Export */}
        {currentStep === 4 && (
          <div className="export-step-content">
            <h3>Ready to Export</h3>
            <div className="export-option-group">
              <Label>File Name:</Label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="bp3-input"
                style={{ width: '100%' }}
                disabled={isExporting}
              />
            </div>

            {isExporting && (
              <div style={{ marginTop: '20px' }}>
                <ProgressBar intent="primary" />
                <p style={{ textAlign: 'center', marginTop: '10px' }}>Exporting...</p>
              </div>
            )}

            {!isExporting && (
              <div className="export-summary" style={{ marginTop: '20px' }}>
                <p>Click "Export" to download your file.</p>
              </div>
            )}
          </div>
        )}

        <Divider style={{ marginTop: '20px' }} />

        <div className="export-wizard-footer">
          <Button
            onClick={handleClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <div>
            <Button
              onClick={handleBack}
              disabled={currentStep === 1 || isExporting}
              style={{ marginRight: '10px' }}
            >
              Back
            </Button>
            {currentStep < 4 ? (
              <Button
                intent="primary"
                onClick={handleNext}
                disabled={isExporting || (itemCounts.targets === 0 && itemCounts.paths === 0 && itemCounts.coordinates === 0)}
              >
                Next
              </Button>
            ) : (
              <Button
                intent="primary"
                onClick={handleExport}
                disabled={isExporting || (itemCounts.targets === 0 && itemCounts.paths === 0 && itemCounts.coordinates === 0)}
                icon={IconNames.EXPORT}
              >
                Export
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ExportWizard;

