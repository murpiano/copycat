import { BrowserWindow } from 'electron';

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    show: false,
    webPreferences: {
      preload: `${__dirname}/../preload/index.js`,
    },
  });
  win.loadURL(
    process.env.ELECTRON_RENDERER_URL ?? `file://${__dirname}/../renderer/index.html`,
  );
  win.on('blur', () => win.hide());
  return win;
}

export function showWindow(win: BrowserWindow): void {
  win.show();
  win.focus();
}

export function hideWindow(win: BrowserWindow): void {
  win.hide();
}

export function toggleWindow(win: BrowserWindow): void {
  if (win.isVisible()) hideWindow(win);
  else showWindow(win);
}
