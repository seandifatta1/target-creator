import * as React from 'react';
import { useState } from 'react';
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
        <button
          className={`hamburger-item ${isExpanded ? 'expanded' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              item.onClick?.();
            }
          }}
        >
          <span className="hamburger-item-label">{item.label}</span>
          {hasChildren && (
            <span className="hamburger-item-arrow">{isExpanded ? '▼' : '▶'}</span>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="hamburger-item-children">
            {item.children!.map(child => (
              <DraggableTargetItem key={child.id} item={child} />
            ))}
          </div>
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
              {items.map(item => renderItem(item))}
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
    <button
      className={`hamburger-item-child ${itemIsDragging ? 'dragging' : ''}`}
      onClick={(e) => {
        if (!itemIsDragging && item.onClick) {
          item.onClick();
        }
      }}
      onMouseDown={handleMouseDown}
      draggable={false}
    >
      {item.icon && <span className="hamburger-item-icon">{item.icon}</span>}
      <span className="hamburger-item-label">{item.label}</span>
    </button>
  );
};

export default HamburgerMenu;
