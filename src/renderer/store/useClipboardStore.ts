import { create } from 'zustand';
import type { ClipboardItem, ItemType } from '../../shared/types';

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
  fetchItems: () => Promise<void>;
  setSearch: (value: string) => void;
  setNav: (nav: NavKey) => void;
  addCategory: (name: string) => void;
  selectCategory: (name: string | null) => void;
  copyItem: (id: number) => Promise<void>;
  pasteItem: (id: number) => Promise<void>;
  toggleStar: (id: number) => Promise<void>;
  addTag: (id: number, tag: string) => Promise<void>;
  removeTag: (id: number, tag: string) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  subscribeToNewItems: () => () => void;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],
  search: '',
  nav: 'history',
  categories: loadCategories(),
  activeCategory: null,

  async fetchItems() {
    const { search, nav, activeCategory } = get();
    const items = await window.copycat.getItems({
      search: search || undefined,
      type: NAV_TYPE[nav],
      tags: activeCategory ? [activeCategory] : undefined,
      onlyStarred: nav === 'starred' || undefined,
    });
    set({ items });
  },

  setSearch(value) {
    set({ search: value });
    void get().fetchItems();
  },

  setNav(nav) {
    set({ nav, activeCategory: null });
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
    set({ activeCategory: name });
    void get().fetchItems();
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

  async deleteItem(id) {
    await window.copycat.deleteItem(id);
    await get().fetchItems();
  },

  subscribeToNewItems() {
    return window.copycat.onItemAdded(() => {
      void get().fetchItems();
    });
  },
}));
