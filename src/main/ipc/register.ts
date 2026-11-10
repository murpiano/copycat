import { spawnSync } from 'node:child_process';
import type { IpcMain } from 'electron';
import { BrowserWindow, clipboard, dialog, shell } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import type {
  AppSettings,
  ClipboardItem,
  CreateItemInput,
  GetItemsQuery,
  HotkeyResult,
  UpdateItemInput,
  UpdateSettingsInput,
  ClearHistoryInput,
} from '../../shared/types';
import type { ItemsRepo } from '../storage/items-repo';
import type { TagsRepo } from '../storage/tags-repo';
import { hashContent } from '../clipboard/hash';
import { setNativeDialogOpen } from '../window';
import { AUDIO_EXTS, DOCUMENT_EXTS, IMAGE_EXTS, VIDEO_EXTS, firstPath, kindFromPath, type FileGroup } from '../../shared/file-kind';
import { cleanupUnusedPreviews } from '../clipboard/capture-pipeline';
import { buildCFDropBuffer } from '../clipboard/file-drop';
import {
  handleGetItems,
  handleCreateItem,
  handleGetSettings,
  handleSetHotkey,
  handleUpdateSettings,
  handleHideWindow,
  handleCopyItem,
  handlePasteItem,
  handleToggleStar,
  handleAddTag,
  handleRemoveTag,
  handleSetTags,
  handleUpdateItem,
  handleReorderItems,
  handleDeleteItem,
  handleClearHistory,
  handleRelinkItem,
  type IpcDeps,
} from './handlers';

function writeFilePathsToClipboard(paths: string[]): void {
  if (process.platform === 'win32') {
    const result = spawnSync(
      'powershell.exe',
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-STA',
        '-Command',
        '$paths = ConvertFrom-Json -InputObject $env:COPYCAT_CLIPBOARD_PATHS; Set-Clipboard -LiteralPath $paths',
      ],
      {
        env: { ...process.env, COPYCAT_CLIPBOARD_PATHS: JSON.stringify(paths) },
        windowsHide: true,
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error('PowerShell failed to copy file paths to clipboard');
    return;
  }

  clipboard.writeBuffer('CF_HDROP', buildCFDropBuffer(paths));
}

export interface RegisterIpcDeps {
  itemsRepo: ItemsRepo;
  tagsRepo: TagsRepo;
  readSettings: () => AppSettings;
  applyHotkey: (accelerator: string) => HotkeyResult;
  setHotkeyCapture: (capturing: boolean) => void;
  writeSettings: (input: UpdateSettingsInput) => AppSettings;
  hideWindow: () => void;
  /**
   * Tells the ClipboardWatcher to treat the given content hash as already
   * seen, so our own clipboard writes below don't get re-captured as new
   * history entries on the watcher's next poll.
   */
  markSelfWrite: (hash: string) => void;
  previewsDir: string;
  /** Re-points the file-move tracker's watchers at the current item set. */
  refreshLocations?: () => void;
}

function copyItemToClipboard(item: ClipboardItem, markSelfWrite: (hash: string) => void): void {
  if (item.type === 'text') {
    markSelfWrite(hashContent(item.content));
    clipboard.writeText(item.content);
  } else if (item.type === 'file') {
    const paths: string[] = JSON.parse(item.content);
    markSelfWrite(hashContent(paths.join('|')));
    writeFilePathsToClipboard(paths);
  } else if (item.type === 'image') {
    const paths = [item.content];
    markSelfWrite(hashContent(paths.join('|')));
    writeFilePathsToClipboard(paths);
  }
}

export function registerIpcHandlers(ipcMain: IpcMain, deps: RegisterIpcDeps): void {
  const copyToClipboard = (item: ClipboardItem): void =>
    copyItemToClipboard(item, deps.markSelfWrite);
  const ipcDeps: IpcDeps = {
    itemsRepo: deps.itemsRepo,
    tagsRepo: deps.tagsRepo,
    copyToClipboard,
    pasteActive: copyToClipboard,
    readSettings: deps.readSettings,
    applyHotkey: deps.applyHotkey,
    writeSettings: deps.writeSettings,
    hideWindow: deps.hideWindow,
    cleanupPreviews: () => cleanupUnusedPreviews(deps.previewsDir, deps.itemsRepo),
    refreshLocations: deps.refreshLocations,
  };

  ipcMain.handle(IPC.GET_ITEMS, (_e, query: GetItemsQuery) => handleGetItems(ipcDeps, query));
  ipcMain.handle(IPC.CREATE_ITEM, (_e, input: CreateItemInput) =>
    handleCreateItem(ipcDeps, input),
  );
  ipcMain.handle(IPC.PICK_OBJECT, async (_e, mode: 'file' | 'folder', group?: FileGroup) => {
    const english = deps.readSettings().language === 'en';
    const options: Electron.OpenDialogOptions = {
      properties: mode === 'folder' ? ['openDirectory'] : ['openFile'],
      filters: mode === 'file' && group === 'images'
        ? [{ name: english ? 'Images' : 'Изображения', extensions: [...IMAGE_EXTS] }]
        : mode === 'file' && group === 'audio'
          ? [{ name: english ? 'Audio' : 'Аудио', extensions: [...AUDIO_EXTS] }]
          : mode === 'file' && group === 'video'
            ? [{ name: english ? 'Video' : 'Видео', extensions: [...VIDEO_EXTS] }]
            : mode === 'file' && group === 'documents'
              ? [{ name: english ? 'Documents' : 'Документы', extensions: [...DOCUMENT_EXTS] }]
              : undefined,
    };
    const owner = BrowserWindow.getFocusedWindow();
    setNativeDialogOpen(true);
    try {
      const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options);
      if (result.canceled || !result.filePaths[0]) return null;
      const selectedPath = result.filePaths[0];
      return { path: selectedPath, kind: kindFromPath(selectedPath, mode === 'folder') };
    } finally {
      setNativeDialogOpen(false);
    }
  });
  ipcMain.handle(IPC.OPEN_ITEM, async (_e, id: number) => {
    if (!Number.isSafeInteger(id)) throw new Error('Invalid item id');
    const item = deps.itemsRepo.getById(id);
    if (!item || item.type === 'text') throw new Error('Item is not an object');
    const path = firstPath(item.content);
    if (!path) throw new Error('Object path is empty');
    const error = await shell.openPath(path);
    if (error) {
      deps.itemsRepo.setMissing(id, Date.now());
      deps.refreshLocations?.();
      throw new Error(error);
    }
  });
  ipcMain.handle(IPC.GET_SETTINGS, () => handleGetSettings(ipcDeps));
  ipcMain.handle(IPC.SET_HOTKEY, (_e, accelerator: string) =>
    handleSetHotkey(ipcDeps, accelerator),
  );
  ipcMain.handle(IPC.SET_HOTKEY_CAPTURE, (_e, capturing: boolean) =>
    deps.setHotkeyCapture(capturing),
  );
  ipcMain.handle(IPC.UPDATE_SETTINGS, (_e, input: UpdateSettingsInput) =>
    handleUpdateSettings(ipcDeps, input),
  );
  ipcMain.handle(IPC.HIDE_WINDOW, () => handleHideWindow(ipcDeps));
  ipcMain.handle(IPC.COPY_ITEM, (_e, id: number) => handleCopyItem(ipcDeps, id));
  ipcMain.handle(IPC.PASTE_ITEM, (_e, id: number) => handlePasteItem(ipcDeps, id));
  ipcMain.handle(IPC.TOGGLE_STAR, (_e, id: number) => handleToggleStar(ipcDeps, id));
  ipcMain.handle(IPC.ADD_TAG, (_e, id: number, tag: string) => handleAddTag(ipcDeps, id, tag));
  ipcMain.handle(IPC.REMOVE_TAG, (_e, id: number, tag: string) =>
    handleRemoveTag(ipcDeps, id, tag),
  );
  ipcMain.handle(IPC.DELETE_CATEGORY, (_e, name: string) => {
    if (typeof name !== 'string' || !name.trim()) throw new Error('Invalid category');
    deps.tagsRepo.deleteCategory(name);
  });
  ipcMain.handle(IPC.SET_TAGS, (_e, id: number, tags: string[]) =>
    handleSetTags(ipcDeps, id, tags),
  );
  ipcMain.handle(IPC.UPDATE_ITEM, (_e, id: number, input: UpdateItemInput) =>
    handleUpdateItem(ipcDeps, id, input),
  );
  ipcMain.handle(IPC.REORDER_ITEMS, (_e, ids: number[]) => handleReorderItems(ipcDeps, ids));
  ipcMain.handle(IPC.DELETE_ITEM, (_e, id: number) => handleDeleteItem(ipcDeps, id));
  ipcMain.handle(IPC.CLEAR_HISTORY, (_e, input: ClearHistoryInput) => handleClearHistory(ipcDeps, input));
  ipcMain.handle(IPC.RELINK_ITEM, (_e, id: number, newPath: string) =>
    handleRelinkItem(ipcDeps, id, newPath),
  );
  ipcMain.handle(IPC.OPEN_EXTERNAL, (_e, url: string) => {
    if (!/^https:\/\/github\.com\/murpiano(\/|$)/.test(url)) return;
    return shell.openExternal(url);
  });
}
