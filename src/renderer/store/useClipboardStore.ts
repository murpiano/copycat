import { create } from 'zustand';
import type { ClipboardItem, ItemType } from '../../shared/types';

export type ActiveTab = 'history' | 'starred';

interface ClipboardState {
  items: ClipboardItem[];
  search: string;
  typeFilter: ItemType | null;
  tagFilters: string[];
  activeTab: ActiveTab;
  fetchItems: () => Promise<void>;
  setSearch: (value: string) => void;
  setTypeFilter: (type: ItemType | null) => void;
  toggleTagFilter: (tag: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
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
  typeFilter: null,
  tagFilters: [],
  activeTab: 'history',

  async fetchItems() {
    const { search, typeFilter, tagFilters, activeTab } = get();
    const items = await window.copycat.getItems({
      search: search || undefined,
      type: typeFilter ?? undefined,
      tags: tagFilters.length > 0 ? tagFilters : undefined,
      onlyStarred: activeTab === 'starred' || undefined,
    });
    set({ items });
  },

  setSearch(value) {
    set({ search: value });
    void get().fetchItems();
  },

  setTypeFilter(type) {
    set({ typeFilter: type });
    void get().fetchItems();
  },

  toggleTagFilter(tag) {
    const current = get().tagFilters;
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    set({ tagFilters: next });
    void get().fetchItems();
  },

  setActiveTab(tab) {
    set({ activeTab: tab });
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
