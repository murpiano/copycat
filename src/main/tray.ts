import { Menu, Tray } from 'electron';

export interface TrayCallbacks {
  onOpen: () => void;
  onPauseToggle: () => void;
  onQuit: () => void;
}

export function createTray(iconPath: string, callbacks: TrayCallbacks): Tray {
  const tray = new Tray(iconPath);
  tray.setToolTip('Copycat');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open', click: callbacks.onOpen },
      { label: 'Pause capture', type: 'checkbox', click: callbacks.onPauseToggle },
      { type: 'separator' },
      { label: 'Quit', click: callbacks.onQuit },
    ]),
  );
  tray.on('click', callbacks.onOpen);
  return tray;
}
