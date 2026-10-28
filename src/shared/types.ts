export type ItemType = 'text' | 'image' | 'file';

export interface ClipboardItem {
  id: number;
  type: ItemType;
  /** User-set card name; null means the card shows the type's default label. */
  title: string | null;
  content: string;
  sourceApp: string | null;
  createdAt: number;
  /** Manual position inside the ordered views; null means never reordered. */
  sortOrder: number | null;
  starred: boolean;
  pinned: boolean;
  tags: string[];
}

export interface GetItemsQuery {
  search?: string;
  type?: ItemType;
  tags?: string[];
  onlyStarred?: boolean;
  /** Starred and category views honour the manual order set by drag-and-drop. */
  ordered?: boolean;
}

export interface UpdateItemInput {
  title?: string | null;
  content?: string;
}

export interface CopycatAPI {
  getItems(query: GetItemsQuery): Promise<ClipboardItem[]>;
  copyItem(id: number): Promise<void>;
  pasteItem(id: number): Promise<void>;
  toggleStar(id: number): Promise<void>;
  addTag(id: number, tag: string): Promise<void>;
  removeTag(id: number, tag: string): Promise<void>;
  setTags(id: number, tags: string[]): Promise<void>;
  updateItem(id: number, input: UpdateItemInput): Promise<void>;
  reorderItems(ids: number[]): Promise<void>;
  deleteItem(id: number): Promise<void>;
  onItemAdded(cb: (item: ClipboardItem) => void): () => void;
}

declare global {
  interface Window {
    copycat: CopycatAPI;
  }
}
