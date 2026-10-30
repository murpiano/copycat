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

/** A card the user types in by hand instead of copying from the clipboard. */
export interface CreateItemInput {
  title: string | null;
  content: string;
  tags: string[];
}

export type NavKey = 'history' | 'starred' | 'images' | 'files';

/** A sidebar row: the four nav tabs, plus the "Категории" entry itself,
 * which can be dragged anywhere among them like any other row. */
export type SidebarEntry = NavKey | 'categories';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppSettings {
  /** Electron accelerator that opens the window, e.g. "CommandOrControl+Shift+V". */
  hotkey: string;
  /** Opens the sidebar's category selector on start instead of collapsed. */
  categoriesExpanded: boolean;
  /** Sidebar entries in the order the user dragged them into. */
  navOrder: SidebarEntry[];
  /** Where the window was left, so it comes back there after a restart. */
  windowBounds: WindowBounds | null;
}

/** Any subset of the settings; omitted keys keep their stored value. */
export type UpdateSettingsInput = Partial<Omit<AppSettings, 'hotkey'>>;

export interface HotkeyResult {
  ok: boolean;
  /** Set when the accelerator was rejected, so the dialog can say why. */
  reason?: string;
}

export interface CopycatAPI {
  getItems(query: GetItemsQuery): Promise<ClipboardItem[]>;
  createItem(input: CreateItemInput): Promise<ClipboardItem>;
  copyItem(id: number): Promise<void>;
  pasteItem(id: number): Promise<void>;
  toggleStar(id: number): Promise<void>;
  addTag(id: number, tag: string): Promise<void>;
  removeTag(id: number, tag: string): Promise<void>;
  setTags(id: number, tags: string[]): Promise<void>;
  updateItem(id: number, input: UpdateItemInput): Promise<void>;
  reorderItems(ids: number[]): Promise<void>;
  deleteItem(id: number): Promise<void>;
  getSettings(): Promise<AppSettings>;
  setHotkey(accelerator: string): Promise<HotkeyResult>;
  updateSettings(input: UpdateSettingsInput): Promise<AppSettings>;
  hideWindow(): Promise<void>;
  onItemAdded(cb: (item: ClipboardItem) => void): () => void;
}

declare global {
  interface Window {
    copycat: CopycatAPI;
  }
}
