import type {
  AppSettings,
  ClipboardItem,
  CreateItemInput,
  GetItemsQuery,
  HotkeyResult,
  UpdateItemInput,
} from '../../shared/types';
import type { ItemsRepo } from '../storage/items-repo';
import type { TagsRepo } from '../storage/tags-repo';

export interface IpcDeps {
  itemsRepo: ItemsRepo;
  tagsRepo: TagsRepo;
  copyToClipboard: (item: ClipboardItem) => void;
  pasteActive: (item: ClipboardItem) => void;
  readSettings: () => AppSettings;
  applyHotkey: (accelerator: string) => HotkeyResult;
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
  const item = deps.itemsRepo.insertItem({
    type: 'text',
    content: input.content,
    sourceApp: null,
  });
  if (input.title) deps.itemsRepo.updateItem(item.id, { title: input.title });
  for (const tag of input.tags) deps.tagsRepo.addTagToItem(item.id, tag);
  return deps.itemsRepo.getById(item.id) ?? item;
}

export async function handleGetSettings(deps: IpcDeps): Promise<AppSettings> {
  return deps.readSettings();
}

export async function handleSetHotkey(
  deps: IpcDeps,
  accelerator: string,
): Promise<HotkeyResult> {
  return deps.applyHotkey(accelerator);
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
}
