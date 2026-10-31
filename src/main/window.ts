import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import type { WindowBounds } from '../shared/types';

const ICON_PATH = path.join(__dirname, '../../resources/large/large.png');

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

export interface MainWindowOptions {
  /** Where the window sat last time, or null for a first run. */
  bounds: WindowBounds | null;
  onBoundsChange: (bounds: WindowBounds) => void;
}

/** A saved position is useless if that monitor is gone; centre it instead. */
function isOnScreen(bounds: WindowBounds): boolean {
  return screen.getAllDisplays().some(({ workArea }) => {
    const right = workArea.x + workArea.width;
    const bottom = workArea.y + workArea.height;
    // The title area has to land on a display, not just any pixel of the window.
    return (
      bounds.x + bounds.width > workArea.x &&
      bounds.x < right &&
      bounds.y + 40 > workArea.y &&
      bounds.y < bottom
    );
  });
}

export function createMainWindow({ bounds, onBoundsChange }: MainWindowOptions): BrowserWindow {
  const restored = bounds && isOnScreen(bounds) ? bounds : null;
  const win = new BrowserWindow({
    ...(restored ? { x: restored.x, y: restored.y } : {}),
    width: restored?.width ?? 900,
    height: restored?.height ?? 600,
    minWidth: 600,
    minHeight: 400,
    // The overlay is frameless by design, but a frameless window under WSLg has
    // no decoration the compositor can move or resize, so dev gets a real frame.
    frame: DEV_WINDOW,
    resizable: true,
    show: false,
    icon: ICON_PATH,
    webPreferences: {
      preload: `${__dirname}/../preload/index.js`,
    },
  });
  win.loadURL(
    process.env.ELECTRON_RENDERER_URL ?? `file://${__dirname}/../renderer/index.html`,
  );
  // Remembering the spot the user dragged the window to, so it opens there
  // again after a restart. 'moved' and 'resized' fire once the drag is over.
  const remember = (): void => {
    if (win.isDestroyed() || win.isMinimized()) return;
    onBoundsChange(win.getBounds());
  };
  win.on('moved', remember);
  win.on('resized', remember);

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
