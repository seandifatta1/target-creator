import * as React from 'react';
import { useState } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Coordinate System Settings</h2>
          <button className="close-button" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <label className="setting-label">Coordinate System:</label>
            <div className="coordinate-options">
              <label className="coordinate-option">
                <input
                  type="radio"
                  name="coordinateSystem"
                  value="NED"
                  checked={localSettings.system === 'NED'}
                  onChange={() => handleSystemChange('NED')}
                />
                <span className="option-label">
                  <strong>NED</strong> (North-East-Down)
                  <div className="option-description">
                    North (X), East (Y), Down (Z) - Aviation standard
                  </div>
                </span>
              </label>

              <label className="coordinate-option">
                <input
                  type="radio"
                  name="coordinateSystem"
                  value="Cartesian"
                  checked={localSettings.system === 'Cartesian'}
                  onChange={() => handleSystemChange('Cartesian')}
                />
                <span className="option-label">
                  <strong>Cartesian</strong> (X-Y-Z)
                  <div className="option-description">
                    Standard 3D Cartesian coordinates
                  </div>
                </span>
              </label>

              <label className="coordinate-option">
                <input
                  type="radio"
                  name="coordinateSystem"
                  value="Spherical"
                  checked={localSettings.system === 'Spherical'}
                  onChange={() => handleSystemChange('Spherical')}
                />
                <span className="option-label">
                  <strong>Spherical</strong> (R-θ-φ)
                  <div className="option-description">
                    Radius, Azimuth (θ), Elevation (φ)
                  </div>
                </span>
              </label>
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              Minimum Unit:
              <span className="unit-label">
                {localSettings.system === 'Spherical' ? 'degrees' : 'km'}
              </span>
            </label>
            <div className="unit-input-group">
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={localSettings.minUnit}
                onChange={(e) => handleMinUnitChange(parseFloat(e.target.value))}
                className="unit-input"
              />
              <span className="unit-suffix">
                {localSettings.system === 'Spherical' ? '°' : 'km'}
              </span>
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
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

