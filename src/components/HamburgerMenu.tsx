import * as React from 'react';
import { useState } from 'react';
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
              <button
                key={child.id}
                className="hamburger-item-child"
                onClick={child.onClick}
              >
                {child.icon && <span className="hamburger-item-icon">{child.icon}</span>}
                <span className="hamburger-item-label">{child.label}</span>
              </button>
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

export default HamburgerMenu;
