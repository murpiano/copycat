import path from 'node:path';
import { app, globalShortcut, ipcMain, Tray } from 'electron';
import {
  createMainWindow,
  showWindow,
  hideWindow,
  toggleWindow,
  setQuitting,
  DEV_WINDOW,
} from './window';
import { createTray } from './tray';
import { registerContextMenu } from './context-menu';
import { startAutoUpdates } from './updater';
import { registerHotkey, rebindHotkey } from './hotkey';
import { createSettingsStore } from './settings-store';
import { createDb } from './storage/db';
import { createTagsRepo } from './storage/tags-repo';
import { createItemsRepo } from './storage/items-repo';
import { ClipboardWatcher } from './clipboard/watcher';
import { ElectronClipboardReader } from './clipboard/electron-reader';
import { createCapturePipeline } from './clipboard/capture-pipeline';
import { registerIpcHandlers } from './ipc/register';
import { IPC } from '../shared/ipc-channels';
import { DEFAULT_RETENTION_LIMIT } from '../shared/config';

// Kept at module scope so it is never garbage-collected (Electron Tray
// instances are destroyed if no reference is held).
let tray: Tray | null = null;
let paused = false;
let hotkeyCaptureActive = false;

app.whenReady().then(() => {
  const userDataDir = app.getPath('userData');
  const settingsStore = createSettingsStore(path.join(userDataDir, 'settings.json'));
  const db = createDb(path.join(userDataDir, 'db.sqlite'));
  const tagsRepo = createTagsRepo(db);
  const itemsRepo = createItemsRepo(db, tagsRepo);

  const win = createMainWindow({
    bounds: settingsStore.get().windowBounds,
    onBoundsChange: (windowBounds) => settingsStore.update({ windowBounds }),
  });
  if (DEV_WINDOW) showWindow(win);
  registerContextMenu(win);

  const pipeline = createCapturePipeline({
    itemsRepo,
    previewsDir: path.join(userDataDir, 'previews'),
    retentionLimit: DEFAULT_RETENTION_LIMIT,
    onItemAdded: (item) => {
      if (!win.isDestroyed()) win.webContents.send(IPC.ITEM_ADDED, item);
    },
  });
  const watcher = new ClipboardWatcher(new ElectronClipboardReader(), pipeline);
  watcher.start();

  const toggle = (): void => {
    if (hotkeyCaptureActive) {
      hotkeyCaptureActive = false;
      if (!win.isDestroyed()) win.webContents.send(IPC.HOTKEY_CAPTURE_CANCELED);
    }
    toggleWindow(win);
  };

  registerIpcHandlers(ipcMain, {
    itemsRepo,
    tagsRepo,
    markSelfWrite: (hash) => watcher.markSelfWrite(hash),
    readSettings: () => settingsStore.get(),
    setHotkeyCapture: (capturing) => {
      hotkeyCaptureActive = capturing;
    },
    writeSettings: (input) => settingsStore.update(input),
    hideWindow: () => hideWindow(win),
    applyHotkey: (accelerator) => {
      const result = rebindHotkey(settingsStore.get().hotkey, accelerator, toggle);
      if (result.ok) {
        settingsStore.setHotkey(accelerator);
        hotkeyCaptureActive = false;
      }
      return result;
    },
  });

  tray = createTray(path.join(__dirname, '../../resources/small/small.png'), {
    onOpen: () => showWindow(win),
    onPauseToggle: () => {
      paused = !paused;
      if (paused) watcher.stop();
      else watcher.start();
    },
    onQuit: () => app.quit(),
  });

  registerHotkey(settingsStore.get().hotkey, toggle);

  startAutoUpdates(() => tray);
});

app.on('before-quit', () => {
  setQuitting(true);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // keep running in the tray; do not quit on window close
});
