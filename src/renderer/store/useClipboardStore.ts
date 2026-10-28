import { create } from 'zustand';
import type {
  AppSettings,
  ClipboardItem,
  CreateItemInput,
  HotkeyResult,
  ItemType,
  UpdateItemInput,
} from '../../shared/types';

export type NavKey = 'history' | 'starred' | 'images' | 'files';

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
  /** Drag-to-reorder mode; only reachable from starred and category views. */
  reorderMode: boolean;
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
  toggleReorderMode: () => void;
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
  reorderMode: false,

  isOrderedView() {
    const { nav, activeCategory } = get();
    return activeCategory !== null || nav === 'starred';
  },

  async fetchItems() {
    const { search, nav, activeCategory } = get();
    const items = await window.copycat.getItems({
      search: search || undefined,
      type: NAV_TYPE[nav],
      tags: activeCategory ? [activeCategory] : undefined,
      onlyStarred: nav === 'starred' || undefined,
      ordered: get().isOrderedView() || undefined,
    });
    set({ items });
  },

  setSearch(value) {
    set({ search: value });
    void get().fetchItems();
  },

  setNav(nav) {
    set({ nav, activeCategory: null, reorderMode: false });
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
    set({ activeCategory: name, reorderMode: false });
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
    set({ settings: await window.copycat.getSettings() });
  },

  async setHotkey(accelerator) {
    const result = await window.copycat.setHotkey(accelerator);
    if (result.ok) set({ settings: { ...(get().settings ?? { hotkey: accelerator }), hotkey: accelerator } });
    return result;
  },

  toggleReorderMode() {
    if (!get().isOrderedView()) return;
    set({ reorderMode: !get().reorderMode });
  },

  moveItem(dragId, overId) {
    if (dragId === overId) return;
    const items = [...get().items];
    const from = items.findIndex((item) => item.id === dragId);
    const to = items.findIndex((item) => item.id === overId);
    if (from === -1 || to === -1) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    set({ items });
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
