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
  items?: HamburgerMenuItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onToggle,
  width = 280,
  items = [],
  header,
  footer
}) => {
  return (
    <div className="hamburger-root" style={{ width: isOpen ? width : 0 }}>
      <button
        aria-label="Toggle navigation menu"
        className={`hamburger-toggle ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span />
        <span />
        <span />
      </button>

      <aside
        className={`hamburger-drawer ${isOpen ? 'visible' : ''}`}
        style={{ width }}
      >
        <div className="hamburger-content">
          {header && <div className="hamburger-header">{header}</div>}

          <nav className="hamburger-nav">
            {items.map(item => (
              <button key={item.id} className="hamburger-item" onClick={item.onClick}>
                {item.label}
              </button>
            ))}
          </nav>

          {footer && <div className="hamburger-footer">{footer}</div>}
        </div>
      </aside>
    </div>
  );
};

export default HamburgerMenu;


