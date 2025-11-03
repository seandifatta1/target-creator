import * as React from 'react';
import { Drawer as BPDrawer, Button, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './Drawer.css';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children, title }) => {
  return (
    <BPDrawer
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      size="60vh"
      className="custom-drawer"
      icon={title ? undefined : <Icon icon={IconNames.MENU_CLOSED} />}
      title={title}
      canOutsideClickClose
      canEscapeKeyClose
    >
      <div className="drawer-content">
        {children}
      </div>
    </BPDrawer>
  );
};

export default Drawer;

