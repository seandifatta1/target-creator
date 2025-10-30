import * as React from 'react';
import './Toolbar.css';

interface ToolbarProps {
  title?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  title = "Target Creator", 
  onMenuToggle,
  isMenuOpen = false 
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        {onMenuToggle && (
          <button 
            className="toolbar-menu-toggle"
            onClick={onMenuToggle}
            aria-label="Toggle navigation menu"
          >
            <div className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}>
              <span />
              <span />
              <span />
            </div>
          </button>
        )}
        <h1 className="toolbar-title">{title}</h1>
      </div>
      
      <div className="toolbar-center">
        {/* Future: Search bar, breadcrumbs, etc. */}
      </div>
      
      <div className="toolbar-right">
        <button className="toolbar-button" title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
          </svg>
        </button>
        <button className="toolbar-button" title="Help">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
