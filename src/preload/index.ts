import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';
import type { ClipboardItem, CopycatAPI, GetItemsQuery } from '../shared/types';

const api: CopycatAPI = {
  getItems: (query: GetItemsQuery) => ipcRenderer.invoke(IPC.GET_ITEMS, query),
  copyItem: (id: number) => ipcRenderer.invoke(IPC.COPY_ITEM, id),
  pasteItem: (id: number) => ipcRenderer.invoke(IPC.PASTE_ITEM, id),
  toggleStar: (id: number) => ipcRenderer.invoke(IPC.TOGGLE_STAR, id),
  addTag: (id: number, tag: string) => ipcRenderer.invoke(IPC.ADD_TAG, id, tag),
  removeTag: (id: number, tag: string) => ipcRenderer.invoke(IPC.REMOVE_TAG, id, tag),
  deleteItem: (id: number) => ipcRenderer.invoke(IPC.DELETE_ITEM, id),
  onItemAdded: (cb: (item: ClipboardItem) => void) => {
    const listener = (_e: unknown, item: ClipboardItem) => cb(item);
    ipcRenderer.on(IPC.ITEM_ADDED, listener);
    return () => ipcRenderer.removeListener(IPC.ITEM_ADDED, listener);
  },
};

contextBridge.exposeInMainWorld('copycat', api);
