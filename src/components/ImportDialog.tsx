import * as React from 'react';
import { useState } from 'react';
import { Dialog, Button, FileInput, Icon, Divider, Label } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './ImportDialog.css';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setImportError('Please select a file to import');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const text = await selectedFile.text();
      let data: any;

      // Try to parse as JSON first
      try {
        data = JSON.parse(text);
      } catch (e) {
        setImportError('Invalid file format. Please import a valid JSON, CSV, XML, or GeoJSON file.');
        setIsImporting(false);
        return;
      }

      // Validate data structure
      if (!data.targets && !data.paths && !data.coordinates && !data.features) {
        setImportError('File does not appear to contain valid Target Creator data.');
        setIsImporting(false);
        return;
      }

      // Handle GeoJSON format
      if (data.type === 'FeatureCollection' && data.features) {
        const importData = {
          targets: [] as any[],
          paths: [] as any[],
          coordinates: [] as any[]
        };

        data.features.forEach((feature: any) => {
          if (feature.properties.type === 'target') {
            const coords = feature.geometry.coordinates;
            importData.targets.push({
              id: feature.properties.id || `target_${Date.now()}_${Math.random()}`,
              targetId: feature.properties.targetId || feature.properties.id,
              targetLabel: feature.properties.label || 'Imported Target',
              name: feature.properties.name,
              position: [coords[0], coords[1], coords[2] || 0],
              iconEmoji: '🎯'
            });
          } else if (feature.properties.type === 'path') {
            importData.paths.push({
              id: feature.properties.id || `path_${Date.now()}_${Math.random()}`,
              pathType: feature.properties.pathType || 'path-line',
              pathLabel: feature.properties.label || 'Imported Path',
              name: feature.properties.name,
              litTiles: feature.geometry.coordinates.map((coord: number[]) => [coord[0], coord[1], coord[2] || 0])
            });
          }
        });

        data = importData;
      }

      onImport(data);
      setIsImporting(false);
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Failed to import file. Please check the file format and try again.');
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null);
      setImportError(null);
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Data"
      className="import-dialog"
      icon={<Icon icon={IconNames.IMPORT} />}
      canOutsideClickClose={!isImporting}
      canEscapeKeyClose={!isImporting}
    >
      <div className="import-dialog-content">
        <div className="import-info">
          <p>Import targets, paths, and coordinates from a previously exported file.</p>
          <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
            Supported formats: JSON, CSV, XML, GeoJSON
          </p>
        </div>

        <Divider />

        <div className="import-file-section">
          <Label>
            Select File:
            <FileInput
              text={selectedFile ? selectedFile.name : 'Choose file...'}
              onInputChange={handleFileSelect}
              disabled={isImporting}
              fill
              buttonText="Browse"
            />
          </Label>

          {selectedFile && (
            <div className="file-info" style={{ marginTop: '10px' }}>
              <Icon icon={IconNames.DOCUMENT} />
              <span>{selectedFile.name}</span>
              <span style={{ color: '#888', marginLeft: '10px' }}>
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </span>
            </div>
          )}

          {importError && (
            <div className="import-error" style={{ marginTop: '15px' }}>
              <Icon icon={IconNames.ERROR} />
              <span>{importError}</span>
            </div>
          )}
        </div>

        <Divider />

        <div className="import-dialog-footer">
          <Button
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            intent="primary"
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            icon={IconNames.IMPORT}
            loading={isImporting}
          >
            Import
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ImportDialog;

