import * as React from 'react';
import { Dialog, Button, InputGroup, Label } from '@blueprintjs/core';
import './NameModal.css';

export interface NameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentName?: string;
  itemType: 'target' | 'path' | 'coordinate';
  itemLabel?: string;
}

const NameModal: React.FC<NameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentName,
  itemType,
  itemLabel
}) => {
  const [name, setName] = React.useState(currentName || '');

  React.useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
    }
  }, [isOpen, currentName]);

  const handleSave = () => {
    onSave(name);
    onClose();
  };

  const handleCancel = () => {
    setName(currentName || '');
    onClose();
  };

  const itemTypeLabel = itemType === 'target' ? 'Target' : itemType === 'path' ? 'Path' : 'Coordinate';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Name ${itemTypeLabel}`}
      className="name-modal"
      canOutsideClickClose
      canEscapeKeyClose
    >
      <div className="name-modal-content">
        {itemLabel && (
          <div className="name-modal-label">
            <Label>Current Label:</Label>
            <span className="name-modal-label-value">{itemLabel}</span>
          </div>
        )}
        <Label>
          Name:
          <InputGroup
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Enter ${itemTypeLabel.toLowerCase()} name...`}
            fill
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
          />
        </Label>
        <div className="name-modal-buttons">
          <Button
            intent="primary"
            onClick={handleSave}
            text="Save"
          />
          <Button
            onClick={handleCancel}
            text="Cancel"
          />
        </div>
      </div>
    </Dialog>
  );
};

export default NameModal;

