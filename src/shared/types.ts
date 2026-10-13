export type ItemType = 'text' | 'image' | 'file';

export interface ClipboardItem {
  id: number;
  type: ItemType;
  content: string;
  sourceApp: string | null;
  createdAt: number;
  starred: boolean;
  pinned: boolean;
  tags: string[];
}

export interface GetItemsQuery {
  search?: string;
  type?: ItemType;
  tags?: string[];
  onlyStarred?: boolean;
}

export interface CopycatAPI {
  getItems(query: GetItemsQuery): Promise<ClipboardItem[]>;
  copyItem(id: number): Promise<void>;
  pasteItem(id: number): Promise<void>;
  toggleStar(id: number): Promise<void>;
  addTag(id: number, tag: string): Promise<void>;
  removeTag(id: number, tag: string): Promise<void>;
  deleteItem(id: number): Promise<void>;
  onItemAdded(cb: (item: ClipboardItem) => void): () => void;
}

declare global {
  interface Window {
    copycat: CopycatAPI;
  }
}
