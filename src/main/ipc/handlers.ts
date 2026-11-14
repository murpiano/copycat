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
import fs from 'node:fs';
import { fileGroupOf, kindFromPath } from '../../shared/file-kind';
import type { ItemsRepo } from '../storage/items-repo';
import type { TagsRepo } from '../storage/tags-repo';

export interface IpcDeps {
  itemsRepo: ItemsRepo;
  tagsRepo: TagsRepo;
  copyToClipboard: (item: ClipboardItem) => void;
  pasteActive: (item: ClipboardItem) => void;
  readSettings: () => AppSettings;
  applyHotkey: (accelerator: string) => HotkeyResult;
  writeSettings: (input: UpdateSettingsInput) => AppSettings;
  hideWindow: () => void;
  cleanupPreviews?: () => void;
  /** Re-points the file-move tracker's watchers at the current item set. */
  refreshLocations?: () => void;
}

export async function handleGetItems(
  deps: IpcDeps,
  query: GetItemsQuery,
): Promise<ClipboardItem[]> {
  return deps.itemsRepo.getItems(query);
}

export async function handleCreateItem(
  deps: IpcDeps,
  input: CreateItemInput,
): Promise<ClipboardItem> {
  const type = input.type ?? 'text';
  let kind: ReturnType<typeof kindFromPath> = 'text';
  let content = input.content;
  if (type !== 'text') {
    const stat = fs.statSync(content);
    kind = kindFromPath(content, stat.isDirectory());
    if (type === 'image' && kind !== 'image') throw new Error('Selected object is not an image');
    if (input.expectedGroup && fileGroupOf({ type, kind, content }) !== input.expectedGroup) {
      throw new Error('Selected object does not match the current section');
    }
    if (type === 'file') content = JSON.stringify([content]);
  }
  const item = deps.itemsRepo.insertItem({
    type,
    content,
    sourceApp: null,
    kind,
  });
  if (input.title) deps.itemsRepo.updateItem(item.id, { title: input.title });
  for (const tag of input.tags) deps.tagsRepo.addTagToItem(item.id, tag);
  if (input.starred) deps.itemsRepo.toggleStar(item.id);
  deps.refreshLocations?.();
  return deps.itemsRepo.getById(item.id) ?? item;
}

export async function handleGetSettings(deps: IpcDeps): Promise<AppSettings> {
  return deps.readSettings();
}

export async function handleSetHotkey(deps: IpcDeps, accelerator: string): Promise<HotkeyResult> {
  return deps.applyHotkey(accelerator);
}

export async function handleUpdateSettings(
  deps: IpcDeps,
  input: UpdateSettingsInput,
): Promise<AppSettings> {
  return deps.writeSettings(input);
}

export async function handleHideWindow(deps: IpcDeps): Promise<void> {
  deps.hideWindow();
}

export async function handleCopyItem(deps: IpcDeps, id: number): Promise<void> {
  const item = deps.itemsRepo.getById(id);
  if (!item) return;
  deps.copyToClipboard(item);
}

export async function handlePasteItem(deps: IpcDeps, id: number): Promise<void> {
  const item = deps.itemsRepo.getById(id);
  if (!item) return;
  deps.pasteActive(item);
}

export async function handleToggleStar(deps: IpcDeps, id: number): Promise<void> {
  deps.itemsRepo.toggleStar(id);
}

export async function handleAddTag(deps: IpcDeps, id: number, tag: string): Promise<void> {
  deps.tagsRepo.addTagToItem(id, tag);
}

export async function handleRemoveTag(deps: IpcDeps, id: number, tag: string): Promise<void> {
  deps.tagsRepo.removeTagFromItem(id, tag);
}

export async function handleSetTags(deps: IpcDeps, id: number, tags: string[]): Promise<void> {
  const item = deps.itemsRepo.getById(id);
  if (!item) return;
  const next = new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean));
  for (const tag of item.tags) {
    if (!next.has(tag)) deps.tagsRepo.removeTagFromItem(id, tag);
  }
  for (const tag of next) {
    if (!item.tags.includes(tag)) deps.tagsRepo.addTagToItem(id, tag);
  }
}

export async function handleUpdateItem(
  deps: IpcDeps,
  id: number,
  input: UpdateItemInput,
): Promise<void> {
  deps.itemsRepo.updateItem(id, input);
}

export async function handleReorderItems(deps: IpcDeps, ids: number[]): Promise<void> {
  deps.itemsRepo.reorderItems(ids);
}

export async function handleDeleteItem(deps: IpcDeps, id: number): Promise<void> {
  deps.itemsRepo.deleteItem(id);
  deps.cleanupPreviews?.();
  deps.refreshLocations?.();
}

export async function handleClearHistory(deps: IpcDeps, input: ClearHistoryInput): Promise<void> {
  deps.itemsRepo.clearHistory(input);
  deps.cleanupPreviews?.();
  deps.refreshLocations?.();
}

export async function handleRelinkItem(deps: IpcDeps, id: number, newPath: string): Promise<void> {
  const item = deps.itemsRepo.getById(id);
  if (!item) throw new Error('Item not found');
  let stat;
  try {
    stat = fs.statSync(newPath);
  } catch {
    throw new Error('Selected path does not exist');
  }
  const kind = kindFromPath(newPath, stat.isDirectory());
  const content = item.type === 'file' ? JSON.stringify([newPath]) : newPath;
  deps.itemsRepo.relinkItem(id, content, kind);
  deps.refreshLocations?.();
}
