import { create } from 'zustand';
import type {
  AppSettings,
  ClipboardItem,
  CreateItemInput,
  HotkeyResult,
  ItemType,
  NavKey,
  SidebarEntry,
  UpdateItemInput,
  UpdateSettingsInput,
} from '../../shared/types';
import { DEFAULT_NAV_ORDER } from '../../shared/config';

export type { NavKey, SidebarEntry };

const NAV_TYPE: Partial<Record<NavKey, ItemType>> = {
  images: 'image',
  files: 'file',
};

const CATEGORIES_STORAGE_KEY = 'copycat.categories';

function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveCategories(categories: string[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // Storage is unavailable (private mode, cleared site data) — categories
    // stay in memory for this session only.
  }
}

interface ClipboardState {
  items: ClipboardItem[];
  search: string;
  nav: NavKey;
  categories: string[];
  activeCategory: string | null;
  /** Card shown full-size in the popup, or null when the popup is closed. */
  expandedId: number | null;
  /** Card open in the edit dialog, or null when the dialog is closed. */
  editingId: number | null;
  /** True while the dialog is composing a new card instead of editing one. */
  composing: boolean;
  settingsOpen: boolean;
  settings: AppSettings | null;
  /** Sidebar drag-to-reorder; the rest of the UI is inert while it runs. */
  navReorderMode: boolean;
  /** Draft order held while dragging, written out only when the user confirms. */
  navOrder: SidebarEntry[];
  navOrderDirty: boolean;
  /** Drag-to-reorder mode; only reachable from starred and category views. */
  reorderMode: boolean;
  /** Card order as it stood before this reorder session, for Cancel. */
  itemOrderSnapshot: number[] | null;
  itemOrderDirty: boolean;
  isOrderedView: () => boolean;
  fetchItems: () => Promise<void>;
  setSearch: (value: string) => void;
  setNav: (nav: NavKey) => void;
  addCategory: (name: string) => void;
  selectCategory: (name: string | null) => void;
  expandItem: (id: number | null) => void;
  editItem: (id: number | null) => void;
  composeItem: (on: boolean) => void;
  createItem: (input: CreateItemInput) => Promise<void>;
  openSettings: (on: boolean) => void;
  loadSettings: () => Promise<void>;
  setHotkey: (accelerator: string) => Promise<HotkeyResult>;
  setHotkeyCapture: (capturing: boolean) => Promise<void>;
  updateSettings: (input: UpdateSettingsInput) => Promise<void>;
  startNavReorder: () => void;
  moveNav: (dragKey: SidebarEntry, overKey: SidebarEntry) => void;
  moveCategory: (dragName: string, overName: string) => void;
  commitNavOrder: () => Promise<void>;
  cancelNavOrder: () => void;
  hideWindow: () => Promise<void>;
  toggleReorderMode: () => void;
  cancelItemReorder: () => Promise<void>;
  moveItem: (dragId: number, overId: number) => void;
  persistOrder: () => Promise<void>;
  copyItem: (id: number) => Promise<void>;
  pasteItem: (id: number) => Promise<void>;
  toggleStar: (id: number) => Promise<void>;
  addTag: (id: number, tag: string) => Promise<void>;
  removeTag: (id: number, tag: string) => Promise<void>;
  setTags: (id: number, tags: string[]) => Promise<void>;
  updateItem: (id: number, input: UpdateItemInput) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  subscribeToNewItems: () => () => void;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],
  search: '',
  nav: 'history',
  categories: loadCategories(),
  activeCategory: null,
  expandedId: null,
  editingId: null,
  composing: false,
  settingsOpen: false,
  settings: null,
  navReorderMode: false,
  navOrder: [...DEFAULT_NAV_ORDER],
  navOrderDirty: false,
  reorderMode: false,
  itemOrderSnapshot: null,
  itemOrderDirty: false,

  isOrderedView() {
    const { nav, activeCategory } = get();
    // "Все" is the raw history, newest first; the filtered views are the ones
    // worth arranging by hand.
    return activeCategory !== null || nav !== 'history';
  },

  async fetchItems() {
    const { search, nav, activeCategory } = get();
    // One view at a time: a category shows everything filed under it, images
    // and files included, instead of inheriting the nav tab's type filter.
    const scope =
      activeCategory !== null
        ? { tags: [activeCategory] }
        : { type: NAV_TYPE[nav], onlyStarred: nav === 'starred' || undefined };
    const items = await window.copycat.getItems({
      search: search || undefined,
      ...scope,
      ordered: get().isOrderedView() || undefined,
    });
    set({ items });
  },

  setSearch(value) {
    set({ search: value });
    void get().fetchItems();
  },

  setNav(nav) {
    set({ nav, activeCategory: null, reorderMode: false, search: '' });
    void get().fetchItems();
  },

  addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed || get().categories.includes(trimmed)) return;
    const categories = [...get().categories, trimmed];
    saveCategories(categories);
    set({ categories });
  },

  selectCategory(name) {
    set({ activeCategory: name, reorderMode: false, search: '' });
    void get().fetchItems();
  },

  expandItem(id) {
    set({ expandedId: id });
  },

  editItem(id) {
    set({ editingId: id });
  },

  composeItem(on) {
    set({ composing: on });
  },

  async createItem(input) {
    await window.copycat.createItem(input);
    set({ composing: false });
    await get().fetchItems();
  },

  openSettings(on) {
    set({ settingsOpen: on });
    if (on && !get().settings) void get().loadSettings();
  },

  async loadSettings() {
    const settings = await window.copycat.getSettings();
    set({ settings, navOrder: settings.navOrder });
  },

  async updateSettings(input) {
    const settings = await window.copycat.updateSettings(input);
    set({ settings, navOrder: settings.navOrder });
  },

  startNavReorder() {
    // The settings dialog gets out of the way: the sidebar is what is edited.
    set({ navReorderMode: true, settingsOpen: false, navOrderDirty: false });
  },

  moveNav(dragKey, overKey) {
    if (dragKey === overKey) return;
    const order = [...get().navOrder];
    const from = order.indexOf(dragKey);
    const to = order.indexOf(overKey);
    if (from === -1 || to === -1) return;
    order.splice(to, 0, ...order.splice(from, 1));
    set({ navOrder: order, navOrderDirty: true });
  },

  moveCategory(dragName, overName) {
    if (dragName === overName) return;
    const categories = [...get().categories];
    const from = categories.indexOf(dragName);
    const to = categories.indexOf(overName);
    if (from === -1 || to === -1) return;
    categories.splice(to, 0, ...categories.splice(from, 1));
    saveCategories(categories);
    set({ categories, navOrderDirty: true });
  },

  async commitNavOrder() {
    await get().updateSettings({ navOrder: get().navOrder });
    set({ navReorderMode: false, navOrderDirty: false });
  },

  cancelNavOrder() {
    // Categories live in local storage and were already written as they moved,
    // so only the sidebar entries roll back to what was last saved.
    set({
      navReorderMode: false,
      navOrderDirty: false,
      navOrder: get().settings?.navOrder ?? [...DEFAULT_NAV_ORDER],
    });
  },

  async hideWindow() {
    await window.copycat.hideWindow();
  },

  async setHotkey(accelerator) {
    const result = await window.copycat.setHotkey(accelerator);
    if (result.ok) {
      const settings = get().settings;
      if (settings) set({ settings: { ...settings, hotkey: accelerator } });
    }
    return result;
  },

  async setHotkeyCapture(capturing) {
    await window.copycat.setHotkeyCapture(capturing);
  },

  toggleReorderMode() {
    if (!get().isOrderedView()) return;
    const entering = !get().reorderMode;
    set({
      reorderMode: entering,
      // Snapshot only on entry: each drag already commits to storage, so
      // Cancel needs the order from before this session to undo them.
      itemOrderSnapshot: entering ? get().items.map((item) => item.id) : null,
      itemOrderDirty: false,
    });
  },

  async cancelItemReorder() {
    const snapshot = get().itemOrderSnapshot;
    set({ reorderMode: false, itemOrderSnapshot: null, itemOrderDirty: false });
    if (!snapshot) return;
    await window.copycat.reorderItems(snapshot);
    await get().fetchItems();
  },

  moveItem(dragId, overId) {
    if (dragId === overId) return;
    const items = [...get().items];
    const from = items.findIndex((item) => item.id === dragId);
    const to = items.findIndex((item) => item.id === overId);
    if (from === -1 || to === -1) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    set({ items, itemOrderDirty: true });
  },

  async persistOrder() {
    await window.copycat.reorderItems(get().items.map((item) => item.id));
  },

  async copyItem(id) {
    await window.copycat.copyItem(id);
  },

  async pasteItem(id) {
    await window.copycat.pasteItem(id);
  },

  async toggleStar(id) {
    await window.copycat.toggleStar(id);
    await get().fetchItems();
  },

  async addTag(id, tag) {
    await window.copycat.addTag(id, tag);
    await get().fetchItems();
  },

  async removeTag(id, tag) {
    await window.copycat.removeTag(id, tag);
    await get().fetchItems();
  },

  async setTags(id, tags) {
    await window.copycat.setTags(id, tags);
    await get().fetchItems();
  },

  async updateItem(id, input) {
    await window.copycat.updateItem(id, input);
    await get().fetchItems();
  },

  async deleteItem(id) {
    await window.copycat.deleteItem(id);
    if (get().expandedId === id) set({ expandedId: null });
    if (get().editingId === id) set({ editingId: null });
    await get().fetchItems();
  },

  subscribeToNewItems() {
    return window.copycat.onItemAdded(() => {
      // A capture landing mid-drag would reshuffle the cards under the cursor.
      if (get().reorderMode) return;
      void get().fetchItems();
    });
  },
}));
