import { Menu, Tray } from 'electron';
import type { Language } from '../shared/types';

export interface TrayCallbacks {
  onOpen: () => void;
  onPauseToggle: () => void;
  onQuit: () => void;
}

export function updateTrayMenu(tray: Tray, callbacks: TrayCallbacks, language: Language, paused = false): void {
  const english = language === 'en';
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: english ? 'Open' : 'Открыть', click: callbacks.onOpen },
      { label: english ? 'Pause capture' : 'Приостановить захват', type: 'checkbox', checked: paused, click: callbacks.onPauseToggle },
      { type: 'separator' },
      { label: english ? 'Quit' : 'Выход', click: callbacks.onQuit },
    ]),
  );
}

export function createTray(iconPath: string, callbacks: TrayCallbacks, language: Language): Tray {
  const tray = new Tray(iconPath);
  tray.setToolTip('Copycat');
  updateTrayMenu(tray, callbacks, language);
  tray.on('click', callbacks.onOpen);
  return tray;
}
