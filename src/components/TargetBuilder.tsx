import * as React from 'react';
import { useState } from 'react';
import { Dialog, Button, InputGroup, Label, Divider, Icon, Breadcrumbs, Breadcrumb } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './TargetBuilder.css';

interface TargetBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (target: {
    targetId: string;
    targetLabel: string;
    iconEmoji?: string;
    name?: string;
  }) => void;
  position: [number, number, number];
}

type BuilderStep = 1 | 2 | 3;

const TargetBuilder: React.FC<TargetBuilderProps> = ({
  isOpen,
  onClose,
  onComplete,
  position
}) => {
  const [currentStep, setCurrentStep] = useState<BuilderStep>(1);
  const [targetLabel, setTargetLabel] = useState<string>('Target');
  const [targetName, setTargetName] = useState<string>('');
  const [iconEmoji, setIconEmoji] = useState<string>('🎯');
  const [targetId, setTargetId] = useState<string>(`target_${Date.now()}`);

  const steps = [
    { step: 1, label: 'Basic Info' },
    { step: 2, label: 'Customization' },
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
      targetId,
      targetLabel,
      iconEmoji,
      name: targetName || undefined
    });
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setTargetLabel('Target');
    setTargetName('');
    setIconEmoji('🎯');
    setTargetId(`target_${Date.now()}`);
    onClose();
  };

  const commonEmojis = ['🎯', '📍', '🚩', '⭐', '🔴', '🟢', '🔵', '🟡', '⚫', '⚪', '🏠', '🏢', '🏭', '🚀', '✈️', '🚁'];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Target"
      className="target-builder-dialog"
      icon={<Icon icon={IconNames.ADD} />}
      canOutsideClickClose
      canEscapeKeyClose
    >
      <div className="target-builder-content">
        <Breadcrumbs
          items={breadcrumbs}
          className="target-builder-breadcrumbs"
        />

        <Divider />

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="builder-step-content">
            <h3>Basic Information</h3>
            <div className="builder-option-group">
              <Label>
                Target Label:
                <InputGroup
                  value={targetLabel}
                  onChange={(e) => setTargetLabel(e.target.value)}
                  placeholder="Enter target label"
                  fill
                />
              </Label>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                This is the display label for the target
              </p>
            </div>

            <div className="builder-option-group" style={{ marginTop: '20px' }}>
              <Label>
                Target ID:
                <InputGroup
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="Enter target ID"
                  fill
                />
              </Label>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                Unique identifier for this target
              </p>
            </div>

            <div className="builder-option-group" style={{ marginTop: '20px' }}>
              <Label>
                Position:
                <InputGroup
                  value={`[${position[0]}, ${position[1]}, ${position[2]}]`}
                  disabled
                  fill
                />
              </Label>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                Target will be placed at this coordinate
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Customization */}
        {currentStep === 2 && (
          <div className="builder-step-content">
            <h3>Customization</h3>
            <div className="builder-option-group">
              <Label>
                Icon Emoji:
                <InputGroup
                  value={iconEmoji}
                  onChange={(e) => setIconEmoji(e.target.value)}
                  placeholder="🎯"
                  fill
                />
              </Label>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                Choose an emoji to represent this target
              </p>
              <div className="emoji-picker" style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {commonEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setIconEmoji(emoji)}
                    className={`emoji-button ${iconEmoji === emoji ? 'selected' : ''}`}
                    style={{
                      fontSize: '24px',
                      width: '40px',
                      height: '40px',
                      border: iconEmoji === emoji ? '2px solid #9b59b6' : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      background: iconEmoji === emoji ? 'rgba(155, 89, 182, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="builder-option-group" style={{ marginTop: '20px' }}>
              <Label>
                Name (Optional):
                <InputGroup
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="Enter custom name"
                  fill
                />
              </Label>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                Optional: Assign a custom name to this target
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
                <Label>Target Label:</Label>
                <span>{targetLabel}</span>
              </div>
              <div className="review-item">
                <Label>Target ID:</Label>
                <span>{targetId}</span>
              </div>
              <div className="review-item">
                <Label>Icon:</Label>
                <span style={{ fontSize: '24px' }}>{iconEmoji}</span>
              </div>
              <div className="review-item">
                <Label>Name:</Label>
                <span>{targetName || '(No name)'}</span>
              </div>
              <div className="review-item">
                <Label>Position:</Label>
                <span>[{position[0]}, {position[1]}, {position[2]}]</span>
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
                Create Target
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default TargetBuilder;



