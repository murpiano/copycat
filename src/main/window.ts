import { BrowserWindow } from 'electron';

// Escape hatch for compositors that never focus a new window (WSLg): the
// blur-hide below would fire immediately and the overlay could never be seen.
// Unset in real builds, where the overlay hides on blur as designed.
export const DEV_WINDOW = process.env.COPYCAT_DEV_WINDOW === '1';

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
    minWidth: 600,
    minHeight: 400,
    // The overlay is frameless by design, but a frameless window under WSLg has
    // no decoration the compositor can move or resize, so dev gets a real frame.
    frame: DEV_WINDOW,
    resizable: true,
    show: false,
    webPreferences: {
      preload: `${__dirname}/../preload/index.js`,
    },
  });
  win.loadURL(
    process.env.ELECTRON_RENDERER_URL ?? `file://${__dirname}/../renderer/index.html`,
  );
  if (!DEV_WINDOW) win.on('blur', () => win.hide());
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
