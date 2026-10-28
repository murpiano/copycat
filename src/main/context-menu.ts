import { Menu, type BrowserWindow } from 'electron';

/**
 * Right-click "Копировать" for any text selection inside the renderer.
 * Chromium's default context menu is disabled app-wide, so this is the only
 * way to copy a hand-picked excerpt (partial copy) via the mouse.
 */
export function registerContextMenu(win: BrowserWindow): void {
  win.webContents.on('context-menu', (_event, params) => {
    if (!params.selectionText) return;
    Menu.buildFromTemplate([
      {
        label: 'Копировать',
        click: () => win.webContents.copy(),
      },
    ]).popup({ window: win });
  });
}
