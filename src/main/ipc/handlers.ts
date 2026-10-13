import type { ClipboardItem, GetItemsQuery } from '../../shared/types';
import type { ItemsRepo } from '../storage/items-repo';
import type { TagsRepo } from '../storage/tags-repo';

export interface IpcDeps {
  itemsRepo: ItemsRepo;
  tagsRepo: TagsRepo;
  copyToClipboard: (item: ClipboardItem) => void;
  pasteActive: (item: ClipboardItem) => void;
}

export async function handleGetItems(
  deps: IpcDeps,
  query: GetItemsQuery,
): Promise<ClipboardItem[]> {
  return deps.itemsRepo.getItems(query);
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

export async function handleDeleteItem(deps: IpcDeps, id: number): Promise<void> {
  deps.itemsRepo.deleteItem(id);
}
