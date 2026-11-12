import { Menu, nativeImage, Tray } from 'electron';
import type { Language } from '../shared/types';

/** macOS menu-bar icons are tiny (~22pt); handing Tray the full-resolution
 * source image would render oversized, so it is scaled down first. Windows
 * and Linux keep getting their own already-sized .ico/.png file untouched. */
function trayIcon(iconPath: string) {
  if (process.platform !== 'darwin') return iconPath;
  return nativeImage.createFromPath(iconPath).resize({ width: 22, height: 22 });
}

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
  const tray = new Tray(trayIcon(iconPath));
  tray.setToolTip('Copycat');
  updateTrayMenu(tray, callbacks, language);
  tray.on('click', callbacks.onOpen);
  return tray;
}
