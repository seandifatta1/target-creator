import * as React from 'react';
import './HamburgerMenu.css';

export interface HamburgerMenuItem {
  id: string;
  label: string;
  onClick?: () => void;
}

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  width?: number;
  collapsedWidth?: number;
  items?: HamburgerMenuItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onToggle,
  width = 280,
  collapsedWidth = 60,
  items = [],
  header,
  footer
}) => {
  const currentWidth = isOpen ? width : collapsedWidth;

  return (
    <aside
      className={`hamburger-sidebar ${isOpen ? 'expanded' : 'collapsed'}`}
      style={{ width: currentWidth }}
    >
      <div className="hamburger-content">
        {isOpen && (
          <>
            {header && <div className="hamburger-header">{header}</div>}

            <nav className="hamburger-nav">
              {items.map(item => (
                <button key={item.id} className="hamburger-item" onClick={item.onClick}>
                  {item.label}
                </button>
              ))}
            </nav>

            {footer && <div className="hamburger-footer">{footer}</div>}
          </>
        )}
      </div>
    </aside>
  );
};

export default HamburgerMenu;
