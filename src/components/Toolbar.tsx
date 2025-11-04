import * as React from 'react';
import { Navbar, NavbarGroup, NavbarHeading, Button, Icon, Popover, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './Toolbar.css';

interface ToolbarProps {
  title?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
  onExport?: () => void;
  onImport?: () => void;
  onSettings?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  title = "Target Creator", 
  onMenuToggle,
  isMenuOpen = false,
  onExport,
  onImport,
  onSettings
}) => {
  const fileMenu = (
    <Menu>
      <MenuItem
        icon={<Icon icon={IconNames.EXPORT} />}
        text="Export..."
        onClick={onExport}
      />
      <MenuItem
        icon={<Icon icon={IconNames.IMPORT} />}
        text="Import..."
        onClick={onImport}
      />
      <MenuDivider />
      <MenuItem
        icon={<Icon icon={IconNames.DOCUMENT} />}
        text="Save Project..."
        disabled
        title="Coming soon"
      />
      <MenuItem
        icon={<Icon icon={IconNames.FOLDER_OPEN} />}
        text="Load Project..."
        disabled
        title="Coming soon"
      />
      <MenuItem
        icon={<Icon icon={IconNames.NEW_OBJECT} />}
        text="New Project"
        disabled
        title="Coming soon"
      />
    </Menu>
  );

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
        <Popover content={fileMenu} position="bottom-right">
          <Button 
            className="toolbar-button" 
            icon={<Icon icon={IconNames.DOCUMENT} />}
            minimal
            small
            title="File"
            rightIcon={<Icon icon={IconNames.CARET_DOWN} />}
          >
            File
          </Button>
        </Popover>
        <Button 
          className="toolbar-button" 
          icon={<Icon icon={IconNames.COG} />}
          minimal
          small
          title="Settings"
          onClick={onSettings}
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
