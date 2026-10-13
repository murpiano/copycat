import { BrowserWindow } from 'electron';

// Set from the app's 'before-quit' handler so the close guard below lets a
// real quit through instead of trapping the window in a hide loop forever.
let isQuitting = false;

export function setQuitting(value: boolean): void {
  isQuitting = value;
}

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
  win.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    win.hide();
  });
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
