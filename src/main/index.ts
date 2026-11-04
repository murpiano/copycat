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
import { createTray, updateTrayMenu } from './tray';
import { registerContextMenu } from './context-menu';
import { refreshUpdateTooltip, startAutoUpdates } from './updater';
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
  registerContextMenu(win, () => settingsStore.get().language === 'en' ? 'en' : 'ru');

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
      hideWindow(win);
      return;
    }
    toggleWindow(win);
  };

  const trayCallbacks = {
    onOpen: () => showWindow(win),
    onPauseToggle: () => {
      paused = !paused;
      if (paused) watcher.stop();
      else watcher.start();
    },
    onQuit: () => app.quit(),
  };

  registerIpcHandlers(ipcMain, {
    itemsRepo,
    tagsRepo,
    previewsDir: path.join(userDataDir, 'previews'),
    markSelfWrite: (hash) => watcher.markSelfWrite(hash),
    readSettings: () => settingsStore.get(),
    setHotkeyCapture: (capturing) => {
      hotkeyCaptureActive = capturing;
    },
    writeSettings: (input) => {
      const next = settingsStore.update(input);
      if (tray && input.language !== undefined) {
        const language = next.language === 'en' ? 'en' : 'ru';
        updateTrayMenu(tray, trayCallbacks, language, paused);
        refreshUpdateTooltip(tray, language);
      }
      return next;
    },
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

  tray = createTray(path.join(__dirname, process.platform === 'win32' ? '../../resources/small/small.ico' : '../../resources/small/small.png'), trayCallbacks, settingsStore.get().language === 'en' ? 'en' : 'ru');

  registerHotkey(settingsStore.get().hotkey, toggle);

  startAutoUpdates(() => tray, () => settingsStore.get().language === 'en' ? 'en' : 'ru');
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
