import * as React from 'react';
import { useState, useEffect } from 'react';
import { Dialog, Button, RadioGroup, Radio, NumericInput, Label, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './SettingsModal.css';

export type CoordinateSystem = 'NED' | 'Cartesian' | 'Spherical';

export interface CoordinateSettings {
  system: CoordinateSystem;
  minUnit: number; // in km for NED/Cartesian, degrees for Spherical
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CoordinateSettings;
  onSettingsChange: (settings: CoordinateSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<CoordinateSettings>(settings);

  // Sync local settings when prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSystemChange = (system: CoordinateSystem) => {
    const newSettings = {
      ...localSettings,
      system,
      minUnit: system === 'Spherical' ? 0.1 : 0.1 // degrees for spherical, km for others
    };
    setLocalSettings(newSettings);
  };

  const handleMinUnitChange = (minUnit: number) => {
    setLocalSettings({
      ...localSettings,
      minUnit
    });
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCancel}
      title="Coordinate System Settings"
      className="settings-dialog"
      icon={<Icon icon={IconNames.COG} />}
    >
      <div className="modal-body">
        <div className="setting-group">
          <Label className="setting-label">Coordinate System:</Label>
          <RadioGroup
            selectedValue={localSettings.system}
            onChange={(e) => handleSystemChange(e.currentTarget.value as CoordinateSystem)}
            className="coordinate-options"
          >
            <Radio value="NED" className="coordinate-option">
              <div className="option-label">
                <strong>NED</strong> (North-East-Down)
                <div className="option-description">
                  North (X), East (Y), Down (Z) - Aviation standard
                </div>
              </div>
            </Radio>
            <Radio value="Cartesian" className="coordinate-option">
              <div className="option-label">
                <strong>Cartesian</strong> (X-Y-Z)
                <div className="option-description">
                  Standard 3D Cartesian coordinates
                </div>
              </div>
            </Radio>
            <Radio value="Spherical" className="coordinate-option">
              <div className="option-label">
                <strong>Spherical</strong> (R-θ-φ)
                <div className="option-description">
                  Radius, Azimuth (θ), Elevation (φ)
                </div>
              </div>
            </Radio>
          </RadioGroup>
        </div>

        <div className="setting-group">
          <Label className="setting-label">
            Minimum Unit:
            <span className="unit-label">
              {localSettings.system === 'Spherical' ? 'degrees' : 'km'}
            </span>
          </Label>
          <div className="unit-input-group">
            <NumericInput
              value={localSettings.minUnit}
              onValueChange={(value) => handleMinUnitChange(value)}
              min={0.1}
              max={10}
              stepSize={0.1}
              minorStepSize={0.01}
              className="unit-input"
              rightElement={<span className="unit-suffix">{localSettings.system === 'Spherical' ? '°' : 'km'}</span>}
            />
          </div>
          <div className="unit-description">
            {localSettings.system === 'Spherical' 
              ? 'Minimum angular resolution for azimuth and elevation'
              : 'Minimum distance resolution for grid spacing'
            }
          </div>
        </div>

        <div className="coordinate-info">
          <h3>Current System Details:</h3>
          {localSettings.system === 'NED' && (
            <div className="system-details">
              <p><strong>NED (North-East-Down):</strong></p>
              <ul>
                <li>X-axis: North (positive = North)</li>
                <li>Y-axis: East (positive = East)</li>
                <li>Z-axis: Down (positive = Down)</li>
                <li>Units: Kilometers</li>
                <li>Common in aviation and navigation</li>
              </ul>
            </div>
          )}
          {localSettings.system === 'Cartesian' && (
            <div className="system-details">
              <p><strong>Cartesian (X-Y-Z):</strong></p>
              <ul>
                <li>X-axis: Horizontal</li>
                <li>Y-axis: Vertical</li>
                <li>Z-axis: Depth/Forward</li>
                <li>Units: Kilometers</li>
                <li>Standard 3D coordinate system</li>
              </ul>
            </div>
          )}
          {localSettings.system === 'Spherical' && (
            <div className="system-details">
              <p><strong>Spherical (R-θ-φ):</strong></p>
              <ul>
                <li>R: Radius from origin (km)</li>
                <li>θ: Azimuth angle (degrees, 0° = North)</li>
                <li>φ: Elevation angle (degrees, 0° = horizontal)</li>
                <li>Units: Kilometers + Degrees</li>
                <li>Useful for radar and tracking systems</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="modal-footer">
        <Button 
          className="cancel-button" 
          onClick={handleCancel}
          intent="none"
        >
          Cancel
        </Button>
        <Button 
          className="save-button" 
          onClick={handleSave}
          intent="primary"
        >
          Save Settings
        </Button>
      </div>
    </Dialog>
  );
};

export default SettingsModal;

