import * as React from 'react';
import { useState } from 'react';
import { Dialog, Button, InputGroup, Label, Divider, Icon, Breadcrumbs, RadioGroup, Radio } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './PathBuilder.css';

interface PathBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (path: {
    pathType: string;
    pathLabel: string;
    name?: string;
  }) => void;
  position: [number, number, number];
}

type BuilderStep = 1 | 2 | 3;

const PathBuilder: React.FC<PathBuilderProps> = ({
  isOpen,
  onClose,
  onComplete,
  position
}) => {
  const [currentStep, setCurrentStep] = useState<BuilderStep>(1);
  const [pathType, setPathType] = useState<string>('path-line');
  const [pathLabel, setPathLabel] = useState<string>('Line');
  const [pathName, setPathName] = useState<string>('');

  const steps = [
    { step: 1, label: 'Path Type' },
    { step: 2, label: 'Details' },
    { step: 3, label: 'Review' }
  ];

  const breadcrumbs = steps.map((s, index) => ({
    text: s.label,
    onClick: () => {
      if (index + 1 < currentStep) {
        setCurrentStep(index + 1 as BuilderStep);
      }
    },
    className: index + 1 === currentStep ? 'active' : index + 1 < currentStep ? 'completed' : ''
  }));

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as BuilderStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as BuilderStep);
    }
  };

  const handleComplete = () => {
    onComplete({
      pathType,
      pathLabel,
      name: pathName || undefined
    });
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setPathType('path-line');
    setPathLabel('Line');
    setPathName('');
    onClose();
  };

  const pathTypes = [
    { value: 'path-line', label: 'Line', description: 'Straight line connecting two points' }
    // Future: Add more path types like curve, bezier, etc.
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Path"
      className="path-builder-dialog"
      icon={<Icon icon={IconNames.ADD} />}
      canOutsideClickClose
      canEscapeKeyClose
    >
      <div className="path-builder-content">
        <Breadcrumbs
          items={breadcrumbs}
          className="path-builder-breadcrumbs"
        />

        <Divider />

        {/* Step 1: Path Type */}
        {currentStep === 1 && (
          <div className="builder-step-content">
            <h3>Select Path Type</h3>
            <div className="builder-option-group">
              <RadioGroup
                selectedValue={pathType}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setPathType(value);
                  const selected = pathTypes.find(pt => pt.value === value);
                  if (selected) {
                    setPathLabel(selected.label);
                  }
                }}
              >
                {pathTypes.map(pt => (
                  <Radio key={pt.value} value={pt.value}>
                    <div>
                      <strong>{pt.label}</strong>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                        {pt.description}
                      </div>
                    </div>
                  </Radio>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 2 && (
          <div className="builder-step-content">
            <h3>Path Details</h3>
            <div className="builder-option-group">
              <Label>
                Path Label:
                <InputGroup
                  value={pathLabel}
                  onChange={(e) => setPathLabel(e.target.value)}
                  placeholder="Enter path label"
                  fill
                />
              </Label>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                This is the display label for the path
              </p>
            </div>

            <div className="builder-option-group" style={{ marginTop: '20px' }}>
              <Label>
                Name (Optional):
                <InputGroup
                  value={pathName}
                  onChange={(e) => setPathName(e.target.value)}
                  placeholder="Enter custom name"
                  fill
                />
              </Label>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                Optional: Assign a custom name to this path
              </p>
            </div>

            <div className="builder-option-group" style={{ marginTop: '20px' }}>
              <Label>
                Start Position:
                <InputGroup
                  value={`[${position[0]}, ${position[1]}, ${position[2]}]`}
                  disabled
                  fill
                />
              </Label>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                Path will start from this coordinate
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="builder-step-content">
            <h3>Review</h3>
            <div className="builder-review-summary">
              <div className="review-item">
                <Label>Path Type:</Label>
                <span>{pathLabel}</span>
              </div>
              <div className="review-item">
                <Label>Path Label:</Label>
                <span>{pathLabel}</span>
              </div>
              <div className="review-item">
                <Label>Name:</Label>
                <span>{pathName || '(No name)'}</span>
              </div>
              <div className="review-item">
                <Label>Start Position:</Label>
                <span>[{position[0]}, {position[1]}, {position[2]}]</span>
              </div>
              <div className="review-item" style={{ paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <Label style={{ color: '#9b59b6' }}>Next Step:</Label>
                <span style={{ color: '#9b59b6' }}>After creating, click on another grid point to set the endpoint</span>
              </div>
            </div>
          </div>
        )}

        <Divider style={{ marginTop: '20px' }} />

        <div className="builder-footer">
          <Button onClick={handleClose}>Cancel</Button>
          <div>
            <Button
              onClick={handleBack}
              disabled={currentStep === 1}
              style={{ marginRight: '10px' }}
            >
              Back
            </Button>
            {currentStep < 3 ? (
              <Button intent="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button intent="primary" onClick={handleComplete} icon={IconNames.TICK}>
                Create Path
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default PathBuilder;




