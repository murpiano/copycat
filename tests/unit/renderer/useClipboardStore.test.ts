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
    getSettings: jest.fn().mockResolvedValue({
      hotkey: 'CommandOrControl+Shift+V',
      categoriesExpanded: false,
      navOrder: ['history', 'starred', 'images', 'files'],
      windowBounds: null,
    }),
    setHotkey: jest.fn().mockResolvedValue({ ok: true }),
    setHotkeyCapture: jest.fn().mockResolvedValue(undefined),
    onHotkeyCaptureCanceled: jest.fn().mockReturnValue(() => {}),
    toFileUrl: jest.fn((filePath: string) => filePath),
    updateSettings: jest.fn().mockResolvedValue({
      hotkey: 'CommandOrControl+Shift+V',
      categoriesExpanded: false,
      navOrder: ['history', 'starred', 'images', 'files'],
      windowBounds: null,
    }),
    hideWindow: jest.fn().mockResolvedValue(undefined),
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

  it('shows everything in a category, ignoring the nav tab filter', async () => {
    const api = installFakeApi();
    await act(async () => {
      useClipboardStore.getState().setNav('images');
      await Promise.resolve();
    });
    await act(async () => {
      useClipboardStore.getState().selectCategory('работа');
      await Promise.resolve();
    });
    const query = (api.getItems as jest.Mock).mock.calls.at(-1)![0];
    expect(query.tags).toEqual(['работа']);
    expect(query.type).toBeUndefined();
    expect(query.onlyStarred).toBeUndefined();
  });

  it('drops the category when a nav tab is chosen', async () => {
    const api = installFakeApi();
    await act(async () => {
      useClipboardStore.getState().selectCategory('работа');
      await Promise.resolve();
    });
    await act(async () => {
      useClipboardStore.getState().setNav('files');
      await Promise.resolve();
    });
    const query = (api.getItems as jest.Mock).mock.calls.at(-1)![0];
    expect(query.tags).toBeUndefined();
    expect(query.type).toBe('file');
  });

  it('treats every view but the full history as hand-ordered', async () => {
    installFakeApi();
    const store = () => useClipboardStore.getState();
    await act(async () => {
      store().setNav('history');
      await Promise.resolve();
    });
    expect(store().isOrderedView()).toBe(false);

    for (const nav of ['starred', 'images', 'files'] as const) {
      await act(async () => {
        store().setNav(nav);
        await Promise.resolve();
      });
      expect(store().isOrderedView()).toBe(true);
    }

    await act(async () => {
      store().selectCategory('работа');
      await Promise.resolve();
    });
    expect(store().isOrderedView()).toBe(true);
  });

  it('keeps the dragged sidebar order as a draft until it is confirmed', async () => {
    const api = installFakeApi();
    await act(async () => {
      await useClipboardStore.getState().loadSettings();
    });

    act(() => useClipboardStore.getState().startNavReorder());
    expect(useClipboardStore.getState().settingsOpen).toBe(false);

    act(() => useClipboardStore.getState().moveNav('files', 'history'));
    expect(useClipboardStore.getState().navOrder).toEqual([
      'files',
      'history',
      'starred',
      'images',
    ]);
    expect(useClipboardStore.getState().navOrderDirty).toBe(true);
    expect(api.updateSettings).not.toHaveBeenCalled();

    await act(async () => {
      await useClipboardStore.getState().commitNavOrder();
    });
    expect(api.updateSettings).toHaveBeenCalledWith({
      navOrder: ['files', 'history', 'starred', 'images'],
    });
    expect(useClipboardStore.getState().navReorderMode).toBe(false);
  });

  it('rolls the sidebar order back when the arrangement is cancelled', async () => {
    installFakeApi();
    await act(async () => {
      await useClipboardStore.getState().loadSettings();
    });
    act(() => useClipboardStore.getState().startNavReorder());
    act(() => useClipboardStore.getState().moveNav('files', 'history'));

    act(() => useClipboardStore.getState().cancelNavOrder());
    expect(useClipboardStore.getState().navOrder).toEqual([
      'history',
      'starred',
      'images',
      'files',
    ]);
    expect(useClipboardStore.getState().navReorderMode).toBe(false);
  });

  it('flags the card order dirty only once it actually changes', async () => {
    const api = installFakeApi({
      getItems: jest.fn().mockResolvedValue([fakeItem({ id: 1 }), fakeItem({ id: 2 })]),
    });
    await act(async () => {
      useClipboardStore.getState().setNav('starred');
      await useClipboardStore.getState().fetchItems();
    });

    act(() => useClipboardStore.getState().toggleReorderMode());
    expect(useClipboardStore.getState().itemOrderDirty).toBe(false);

    act(() => useClipboardStore.getState().moveItem(2, 1));
    expect(useClipboardStore.getState().items.map((item) => item.id)).toEqual([2, 1]);
    expect(useClipboardStore.getState().itemOrderDirty).toBe(true);
    expect(api.reorderItems).not.toHaveBeenCalled();
  });

  it('restores the original card order when the arrangement is cancelled', async () => {
    const api = installFakeApi({
      getItems: jest.fn().mockResolvedValue([fakeItem({ id: 1 }), fakeItem({ id: 2 })]),
    });
    await act(async () => {
      useClipboardStore.getState().setNav('starred');
      await useClipboardStore.getState().fetchItems();
    });

    act(() => useClipboardStore.getState().toggleReorderMode());
    act(() => useClipboardStore.getState().moveItem(2, 1));

    await act(async () => {
      await useClipboardStore.getState().cancelItemReorder();
    });
    expect(api.reorderItems).toHaveBeenCalledWith([1, 2]);
    expect(useClipboardStore.getState().reorderMode).toBe(false);
    expect(useClipboardStore.getState().itemOrderDirty).toBe(false);
  });
});
