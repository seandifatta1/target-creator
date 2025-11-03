import * as React from 'react';
import { Navbar, NavbarGroup, NavbarHeading, Button, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
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
    <Navbar className="custom-navbar">
      <NavbarGroup>
        {onMenuToggle && (
          <Button
            className="toolbar-menu-toggle"
            onClick={onMenuToggle}
            aria-label="Toggle navigation menu"
            icon={<Icon icon={isMenuOpen ? IconNames.MENU_OPEN : IconNames.MENU} />}
            minimal
            small
          />
        )}
        <NavbarHeading className="toolbar-title">
          {title}
        </NavbarHeading>
      </NavbarGroup>
      
      <NavbarGroup align="right">
        <Button 
          className="toolbar-button" 
          icon={<Icon icon={IconNames.COG} />}
          minimal
          small
          title="Settings"
        />
        <Button 
          className="toolbar-button" 
          icon={<Icon icon={IconNames.HELP} />}
          minimal
          small
          title="Help"
        />
      </NavbarGroup>
    </Navbar>
  );
};

export default Toolbar;
