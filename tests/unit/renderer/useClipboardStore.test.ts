/**
 * @jest-environment jsdom
 */
import { act } from '@testing-library/react';
import { useClipboardStore } from '../../../src/renderer/store/useClipboardStore';
import type { ClipboardItem, CopycatAPI } from '../../../src/shared/types';

function fakeItem(overrides: Partial<ClipboardItem> = {}): ClipboardItem {
  return {
    id: 1,
    type: 'text',
    title: null,
    content: 'hello',
    sourceApp: null,
    createdAt: Date.now(),
    sortOrder: null,
    starred: false,
    pinned: false,
    tags: [],
    ...overrides,
  };
}

function installFakeApi(overrides: Partial<CopycatAPI> = {}): CopycatAPI {
  const api: CopycatAPI = {
    getItems: jest.fn().mockResolvedValue([fakeItem()]),
    createItem: jest.fn().mockResolvedValue(fakeItem()),
    copyItem: jest.fn().mockResolvedValue(undefined),
    pasteItem: jest.fn().mockResolvedValue(undefined),
    toggleStar: jest.fn().mockResolvedValue(undefined),
    addTag: jest.fn().mockResolvedValue(undefined),
    removeTag: jest.fn().mockResolvedValue(undefined),
    setTags: jest.fn().mockResolvedValue(undefined),
    updateItem: jest.fn().mockResolvedValue(undefined),
    reorderItems: jest.fn().mockResolvedValue(undefined),
    deleteItem: jest.fn().mockResolvedValue(undefined),
    getSettings: jest.fn().mockResolvedValue({ hotkey: 'CommandOrControl+Shift+V' }),
    setHotkey: jest.fn().mockResolvedValue({ ok: true }),
    onItemAdded: jest.fn().mockReturnValue(() => {}),
    ...overrides,
  };
  (window as unknown as { copycat: CopycatAPI }).copycat = api;
  return api;
}

describe('useClipboardStore', () => {
  it('fetchItems loads items via the copycat API using current filters', async () => {
    const api = installFakeApi();
    await act(async () => {
      useClipboardStore.getState().setSearch('foo');
      await useClipboardStore.getState().fetchItems();
    });
    expect(api.getItems).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'foo' }),
    );
    expect(useClipboardStore.getState().items).toHaveLength(1);
  });

  it('setNav maps the images tab onto a type filter', async () => {
    const api = installFakeApi();
    await act(async () => {
      useClipboardStore.getState().setNav('images');
      await useClipboardStore.getState().fetchItems();
    });
    expect(api.getItems).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image' }),
    );
  });

  it('selectCategory filters items by that category tag', async () => {
    const api = installFakeApi();
    await act(async () => {
      useClipboardStore.getState().selectCategory('work');
      await useClipboardStore.getState().fetchItems();
    });
    expect(api.getItems).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['work'] }),
    );
  });

  it('addCategory ignores blank and duplicate names', () => {
    installFakeApi();
    useClipboardStore.getState().addCategory('work');
    useClipboardStore.getState().addCategory('work');
    useClipboardStore.getState().addCategory('   ');
    expect(useClipboardStore.getState().categories).toEqual(['work']);
  });

  it('copyItem calls the API with the item id', async () => {
    const api = installFakeApi();
    await useClipboardStore.getState().copyItem(42);
    expect(api.copyItem).toHaveBeenCalledWith(42);
  });
});
