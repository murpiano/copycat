import { readFileSync } from 'node:fs';
import type { IpcMain } from 'electron';
import { clipboard, nativeImage } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import type { ClipboardItem, GetItemsQuery, UpdateItemInput } from '../../shared/types';
import type { ItemsRepo } from '../storage/items-repo';
import type { TagsRepo } from '../storage/tags-repo';
import { hashContent } from '../clipboard/hash';
import {
  handleGetItems,
  handleCopyItem,
  handlePasteItem,
  handleToggleStar,
  handleAddTag,
  handleRemoveTag,
  handleSetTags,
  handleUpdateItem,
  handleReorderItems,
  handleDeleteItem,
  type IpcDeps,
} from './handlers';

export interface RegisterIpcDeps {
  itemsRepo: ItemsRepo;
  tagsRepo: TagsRepo;
  /**
   * Tells the ClipboardWatcher to treat the given content hash as already
   * seen, so our own clipboard writes below don't get re-captured as new
   * history entries on the watcher's next poll.
   */
  markSelfWrite: (hash: string) => void;
}

function copyItemToClipboard(item: ClipboardItem, markSelfWrite: (hash: string) => void): void {
  if (item.type === 'text') {
    markSelfWrite(hashContent(item.content));
    clipboard.writeText(item.content);
  } else if (item.type === 'file') {
    const paths: string[] = JSON.parse(item.content);
    markSelfWrite(hashContent(paths.join('|')));
    clipboard.writeText(paths.join('\n'));
  } else if (item.type === 'image') {
    const pngBuffer = readFileSync(item.content);
    markSelfWrite(hashContent(pngBuffer));
    clipboard.writeImage(nativeImage.createFromPath(item.content));
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
  };

  ipcMain.handle(IPC.GET_ITEMS, (_e, query: GetItemsQuery) => handleGetItems(ipcDeps, query));
  ipcMain.handle(IPC.COPY_ITEM, (_e, id: number) => handleCopyItem(ipcDeps, id));
  ipcMain.handle(IPC.PASTE_ITEM, (_e, id: number) => handlePasteItem(ipcDeps, id));
  ipcMain.handle(IPC.TOGGLE_STAR, (_e, id: number) => handleToggleStar(ipcDeps, id));
  ipcMain.handle(IPC.ADD_TAG, (_e, id: number, tag: string) => handleAddTag(ipcDeps, id, tag));
  ipcMain.handle(IPC.REMOVE_TAG, (_e, id: number, tag: string) =>
    handleRemoveTag(ipcDeps, id, tag),
  );
  ipcMain.handle(IPC.SET_TAGS, (_e, id: number, tags: string[]) =>
    handleSetTags(ipcDeps, id, tags),
  );
  ipcMain.handle(IPC.UPDATE_ITEM, (_e, id: number, input: UpdateItemInput) =>
    handleUpdateItem(ipcDeps, id, input),
  );
  ipcMain.handle(IPC.REORDER_ITEMS, (_e, ids: number[]) => handleReorderItems(ipcDeps, ids));
  ipcMain.handle(IPC.DELETE_ITEM, (_e, id: number) => handleDeleteItem(ipcDeps, id));
}
