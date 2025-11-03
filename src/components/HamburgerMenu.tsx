import * as React from 'react';
import { useState } from 'react';
import { Menu, MenuItem, MenuDivider, Icon, Collapse, Button } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useDragTargetContext } from '../hooks/DragTargetContext';
import './HamburgerMenu.css';

export interface HamburgerMenuItem {
  id: string;
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  children?: HamburgerMenuItem[];
}

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  width?: number;
  collapsedWidth?: number;
  items?: HamburgerMenuItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'left' | 'right';
  initiallyExpanded?: string[];
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onToggle,
  width = 280,
  collapsedWidth = 60,
  items = [],
  header,
  footer,
  position = 'left',
  initiallyExpanded = []
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(initiallyExpanded));
  const currentWidth = isOpen ? width : collapsedWidth;

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderItem = (item: HamburgerMenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <div key={item.id} className="hamburger-item-wrapper">
        <MenuItem
          className={`hamburger-item ${isExpanded ? 'expanded' : ''}`}
          text={item.label}
          icon={item.icon && React.isValidElement(item.icon) ? item.icon : item.icon && typeof item.icon === 'string' ? <span>{item.icon}</span> : undefined}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              item.onClick?.();
            }
          }}
          labelElement={hasChildren ? <Icon icon={isExpanded ? IconNames.CHEVRON_DOWN : IconNames.CHEVRON_RIGHT} /> : undefined}
        />
        {hasChildren && (
          <Collapse isOpen={isExpanded}>
            <div className="hamburger-item-children">
              {item.children!.map(child => (
                <DraggableTargetItem key={child.id} item={child} />
              ))}
            </div>
          </Collapse>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`hamburger-sidebar ${isOpen ? 'expanded' : 'collapsed'} ${position}`}
      style={{ width: currentWidth }}
    >
      <div className="hamburger-content">
        {isOpen && (
          <>
            {header && <div className="hamburger-header">{header}</div>}

            <nav className="hamburger-nav">
              <Menu className="hamburger-menu">
                {items.map(item => renderItem(item))}
              </Menu>
            </nav>

            {footer && <div className="hamburger-footer">{footer}</div>}
          </>
        )}
      </div>
    </aside>
  );
};

// Draggable target item component
const DraggableTargetItem: React.FC<{ item: HamburgerMenuItem }> = ({ item }) => {
  const { startDrag, isDragging, dragData } = useDragTargetContext();
  const itemIsDragging = isDragging && dragData?.id === item.id;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag({
      id: item.id,
      label: item.label,
      icon: item.icon,
    });
  };

  return (
    <MenuItem
      className={`hamburger-item-child ${itemIsDragging ? 'dragging' : ''}`}
      text={item.label}
      icon={item.icon && React.isValidElement(item.icon) ? item.icon : item.icon && typeof item.icon === 'string' ? <span>{item.icon}</span> : undefined}
      onClick={(e) => {
        if (!itemIsDragging && item.onClick) {
          item.onClick();
        }
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

export default HamburgerMenu;
