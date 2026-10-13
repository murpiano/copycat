import type { IpcMain } from 'electron';
import { clipboard } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import type { ClipboardItem, GetItemsQuery } from '../../shared/types';
import type { ItemsRepo } from '../storage/items-repo';
import type { TagsRepo } from '../storage/tags-repo';
import {
  handleGetItems,
  handleCopyItem,
  handlePasteItem,
  handleToggleStar,
  handleAddTag,
  handleRemoveTag,
  handleDeleteItem,
  type IpcDeps,
} from './handlers';

export interface RegisterIpcDeps {
  itemsRepo: ItemsRepo;
  tagsRepo: TagsRepo;
}

function copyItemToClipboard(item: ClipboardItem): void {
  if (item.type === 'text') clipboard.writeText(item.content);
  else if (item.type === 'file') clipboard.writeText(JSON.parse(item.content).join('\n'));
  // images: clipboard.writeImage requires loading the PNG from disk; deferred to Task 10 polish.
}

export function registerIpcHandlers(ipcMain: IpcMain, deps: RegisterIpcDeps): void {
  const ipcDeps: IpcDeps = {
    itemsRepo: deps.itemsRepo,
    tagsRepo: deps.tagsRepo,
    copyToClipboard: copyItemToClipboard,
    pasteActive: copyItemToClipboard,
  };

  ipcMain.handle(IPC.GET_ITEMS, (_e, query: GetItemsQuery) => handleGetItems(ipcDeps, query));
  ipcMain.handle(IPC.COPY_ITEM, (_e, id: number) => handleCopyItem(ipcDeps, id));
  ipcMain.handle(IPC.PASTE_ITEM, (_e, id: number) => handlePasteItem(ipcDeps, id));
  ipcMain.handle(IPC.TOGGLE_STAR, (_e, id: number) => handleToggleStar(ipcDeps, id));
  ipcMain.handle(IPC.ADD_TAG, (_e, id: number, tag: string) => handleAddTag(ipcDeps, id, tag));
  ipcMain.handle(IPC.REMOVE_TAG, (_e, id: number, tag: string) =>
    handleRemoveTag(ipcDeps, id, tag),
  );
  ipcMain.handle(IPC.DELETE_ITEM, (_e, id: number) => handleDeleteItem(ipcDeps, id));
}
