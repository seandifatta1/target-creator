import * as React from 'react';
import { useState } from 'react';
import { Dialog, Button, RadioGroup, Radio, Label, Divider, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './ItemBuilderWizard.css';

export type ItemType = 'target' | 'path';

interface ItemBuilderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: ItemType;
  position: [number, number, number];
  availableItems: Array<{ id: string; label: string; iconEmoji?: string; pathType?: string }>;
  onSelectExisting: (item: { id: string; label: string; iconEmoji?: string; pathType?: string }) => void;
  onCreateNew: () => void;
}

/**
 * ItemBuilderWizard - Wizard for selecting existing items or creating new ones
 * 
 * **How it's used in the app:**
 * This wizard appears when a user clicks "Add Target" or "Add Path" from the context menu.
 * It allows users to either select from existing targets/paths or create a new one.
 * For example, when a user right-clicks a grid point and selects "Add Target", this wizard
 * shows all available target types. They can select an existing one to place immediately,
 * or choose "Create New" to open the TargetBuilder for custom creation.
 * 
 * **Dependency Injection:**
 * All callbacks and data are injected through props:
 * - `onSelectExisting`: Injected callback to handle selection of existing items.
 *   This enables the parent to place the selected item at the specified position.
 * - `onCreateNew`: Injected callback to open the builder for creating new items.
 *   This enables the parent to show the TargetBuilder or PathBuilder.
 * - `availableItems`: Injected list of available items. This enables flexibility
 *   to show different items based on context and easier testing with mock data.
 * 
 * @param isOpen - Whether the wizard is open
 * @param onClose - Callback to close the wizard
 * @param itemType - Type of item ('target' or 'path')
 * @param position - Position where the item will be placed
 * @param availableItems - List of available items to choose from
 * @param onSelectExisting - Callback when an existing item is selected
 * @param onCreateNew - Callback when "Create New" is selected
 */
const ItemBuilderWizard: React.FC<ItemBuilderWizardProps> = ({
  isOpen,
  onClose,
  itemType,
  position,
  availableItems,
  onSelectExisting,
  onCreateNew
}) => {
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new'>('existing');
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  const handleNext = () => {
    if (selectedOption === 'existing' && selectedItemId) {
      const item = availableItems.find(i => i.id === selectedItemId);
      if (item) {
        onSelectExisting(item);
        handleClose();
      }
    } else if (selectedOption === 'new') {
      onCreateNew();
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedOption('existing');
    setSelectedItemId('');
    onClose();
  };

  const canProceed = selectedOption === 'new' || (selectedOption === 'existing' && selectedItemId !== '');

  const title = itemType === 'target' ? 'Add Target' : 'Add Path';
  const icon = itemType === 'target' ? IconNames.TARGET : 'path-search';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      className="item-builder-wizard-dialog"
      icon={<Icon icon={icon} />}
      canOutsideClickClose
      canEscapeKeyClose
    >
      <div className="item-builder-wizard-content">
        <div className="item-builder-wizard-step">
          <Label>Choose an option:</Label>
          <RadioGroup
            selectedValue={selectedOption}
            onChange={(e) => {
              setSelectedOption(e.currentTarget.value as 'existing' | 'new');
              setSelectedItemId('');
            }}
          >
            <Radio 
              label={`Select from existing ${itemType === 'target' ? 'targets' : 'paths'}`}
              value="existing"
            />
            <Radio 
              label={`Create new ${itemType}`}
              value="new"
            />
          </RadioGroup>

          {selectedOption === 'existing' && (
            <div className="item-builder-wizard-items" style={{ marginTop: '20px' }}>
              <Label>Available {itemType === 'target' ? 'targets' : 'paths'}:</Label>
              {availableItems.length > 0 ? (
                <RadioGroup
                  selectedValue={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.currentTarget.value)}
                >
                  {availableItems.map(item => (
                    <Radio
                      key={item.id}
                      value={item.id}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.iconEmoji && <span>{item.iconEmoji}</span>}
                        <span>{item.label}</span>
                        {item.pathType && (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                            ({item.pathType})
                          </span>
                        )}
                      </div>
                    </Radio>
                  ))}
                </RadioGroup>
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '10px' }}>
                  No {itemType === 'target' ? 'targets' : 'paths'} available
                </p>
              )}
            </div>
          )}

          {selectedOption === 'new' && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(155, 89, 182, 0.1)', borderRadius: '8px' }}>
              <p style={{ color: '#e2e8f0', margin: 0 }}>
                You will be taken through the {itemType} creation process to customize your new {itemType}.
              </p>
            </div>
          )}
        </div>

        <Divider style={{ marginTop: '20px' }} />

        <div className="item-builder-wizard-footer">
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            intent="primary"
            onClick={handleNext}
            disabled={!canProceed}
            icon={selectedOption === 'new' ? IconNames.ADD : IconNames.TICK}
          >
            {selectedOption === 'new' ? 'Create' : 'Select'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ItemBuilderWizard;

