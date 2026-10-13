import path from 'node:path';
import { app, globalShortcut, ipcMain } from 'electron';
import { createMainWindow, showWindow, toggleWindow } from './window';
import { createTray } from './tray';
import { registerHotkey } from './hotkey';
import { createDb } from './storage/db';
import { createTagsRepo } from './storage/tags-repo';
import { createItemsRepo } from './storage/items-repo';
import { ClipboardWatcher } from './clipboard/watcher';
import { ElectronClipboardReader } from './clipboard/electron-reader';
import { createCapturePipeline } from './clipboard/capture-pipeline';
import { registerIpcHandlers } from './ipc/register';
import { IPC } from '../shared/ipc-channels';
import { DEFAULT_HOTKEY, DEFAULT_RETENTION_LIMIT } from '../shared/config';

app.whenReady().then(() => {
  const userDataDir = app.getPath('userData');
  const db = createDb(path.join(userDataDir, 'db.sqlite'));
  const tagsRepo = createTagsRepo(db);
  const itemsRepo = createItemsRepo(db, tagsRepo);

  const win = createMainWindow();

  const pipeline = createCapturePipeline({
    itemsRepo,
    previewsDir: path.join(userDataDir, 'previews'),
    retentionLimit: DEFAULT_RETENTION_LIMIT,
    onItemAdded: (item) => win.webContents.send(IPC.ITEM_ADDED, item),
  });
  const watcher = new ClipboardWatcher(new ElectronClipboardReader(), pipeline);
  watcher.start();

  registerIpcHandlers(ipcMain, { itemsRepo, tagsRepo });

  createTray(path.join(__dirname, '../../resources/tray-icon.png'), {
    onOpen: () => showWindow(win),
    onPauseToggle: () => {
      // simple pause/resume toggle via watcher start/stop
      watcher.stop();
    },
    onQuit: () => app.quit(),
  });

  registerHotkey(DEFAULT_HOTKEY, () => toggleWindow(win));
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // keep running in the tray; do not quit on window close
});
