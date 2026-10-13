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
    content: 'hello',
    sourceApp: null,
    createdAt: Date.now(),
    starred: false,
    pinned: false,
    tags: [],
    ...overrides,
  };
}

function installFakeApi(overrides: Partial<CopycatAPI> = {}): CopycatAPI {
  const api: CopycatAPI = {
    getItems: jest.fn().mockResolvedValue([fakeItem()]),
    copyItem: jest.fn().mockResolvedValue(undefined),
    pasteItem: jest.fn().mockResolvedValue(undefined),
    toggleStar: jest.fn().mockResolvedValue(undefined),
    addTag: jest.fn().mockResolvedValue(undefined),
    removeTag: jest.fn().mockResolvedValue(undefined),
    deleteItem: jest.fn().mockResolvedValue(undefined),
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

  it('toggleTagFilter adds and removes a tag from the active filter set', () => {
    installFakeApi();
    useClipboardStore.getState().toggleTagFilter('work');
    expect(useClipboardStore.getState().tagFilters).toEqual(['work']);
    useClipboardStore.getState().toggleTagFilter('work');
    expect(useClipboardStore.getState().tagFilters).toEqual([]);
  });

  it('copyItem calls the API with the item id', async () => {
    const api = installFakeApi();
    await useClipboardStore.getState().copyItem(42);
    expect(api.copyItem).toHaveBeenCalledWith(42);
  });
});
