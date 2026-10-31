import { contextBridge, ipcRenderer } from 'electron';
import { pathToFileURL } from 'node:url';
import { IPC } from '../shared/ipc-channels';
import type {
  ClipboardItem,
  CopycatAPI,
  CreateItemInput,
  GetItemsQuery,
  UpdateItemInput,
  UpdateSettingsInput,
} from '../shared/types';

const api: CopycatAPI = {
  getItems: (query: GetItemsQuery) => ipcRenderer.invoke(IPC.GET_ITEMS, query),
  createItem: (input: CreateItemInput) => ipcRenderer.invoke(IPC.CREATE_ITEM, input),
  copyItem: (id: number) => ipcRenderer.invoke(IPC.COPY_ITEM, id),
  pasteItem: (id: number) => ipcRenderer.invoke(IPC.PASTE_ITEM, id),
  toggleStar: (id: number) => ipcRenderer.invoke(IPC.TOGGLE_STAR, id),
  addTag: (id: number, tag: string) => ipcRenderer.invoke(IPC.ADD_TAG, id, tag),
  removeTag: (id: number, tag: string) => ipcRenderer.invoke(IPC.REMOVE_TAG, id, tag),
  setTags: (id: number, tags: string[]) => ipcRenderer.invoke(IPC.SET_TAGS, id, tags),
  updateItem: (id: number, input: UpdateItemInput) =>
    ipcRenderer.invoke(IPC.UPDATE_ITEM, id, input),
  reorderItems: (ids: number[]) => ipcRenderer.invoke(IPC.REORDER_ITEMS, ids),
  deleteItem: (id: number) => ipcRenderer.invoke(IPC.DELETE_ITEM, id),
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
  setHotkey: (accelerator: string) => ipcRenderer.invoke(IPC.SET_HOTKEY, accelerator),
  setHotkeyCapture: (capturing: boolean) =>
    ipcRenderer.invoke(IPC.SET_HOTKEY_CAPTURE, capturing),
  onHotkeyCaptureCanceled: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on(IPC.HOTKEY_CAPTURE_CANCELED, listener);
    return () => ipcRenderer.removeListener(IPC.HOTKEY_CAPTURE_CANCELED, listener);
  },
  toFileUrl: (filePath: string) => pathToFileURL(filePath).href,
  updateSettings: (input: UpdateSettingsInput) =>
    ipcRenderer.invoke(IPC.UPDATE_SETTINGS, input),
  hideWindow: () => ipcRenderer.invoke(IPC.HIDE_WINDOW),
  onItemAdded: (cb: (item: ClipboardItem) => void) => {
    const listener = (_e: unknown, item: ClipboardItem) => cb(item);
    ipcRenderer.on(IPC.ITEM_ADDED, listener);
    return () => ipcRenderer.removeListener(IPC.ITEM_ADDED, listener);
  },
};

contextBridge.exposeInMainWorld('copycat', api);
