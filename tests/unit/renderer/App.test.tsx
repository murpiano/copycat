/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from '../../../src/renderer/App';
import type { CopycatAPI } from '../../../src/shared/types';
import { useClipboardStore } from '../../../src/renderer/store/useClipboardStore';

beforeEach(() => {
  useClipboardStore.setState({
    items: [], search: '', nav: 'history', activeCategory: null, activeFileGroup: null,
    expandedId: null, editingId: null, composing: false, settingsOpen: false,
    settings: null, navOrder: ['history', 'starred', 'text', 'files', 'categories'],
    hiddenNavEntries: [], navReorderMode: false,
  });
  const api: CopycatAPI = {
    getItems: jest.fn().mockResolvedValue([]),
    copyItem: jest.fn(),
    pasteItem: jest.fn(),
    toggleStar: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
    deleteItem: jest.fn(),
    getSettings: jest.fn().mockResolvedValue({
      hotkey: 'CommandOrControl+Shift+V',
      categoriesExpanded: false,
      navOrder: ['history', 'starred', 'text', 'files'],
      windowBounds: null,
    }),
    updateSettings: jest.fn(),
    hideWindow: jest.fn(),
    onItemAdded: jest.fn().mockReturnValue(() => {}),
  } as unknown as CopycatAPI;
  (window as unknown as { copycat: CopycatAPI }).copycat = api;
});

describe('App', () => {
  it('keeps search and an open block when the window becomes hidden', async () => {
    (window.copycat.getItems as jest.Mock).mockResolvedValue([{
      id: 1, type: 'text', title: null, content: 'draft', sourceApp: null,
      createdAt: Date.now(), sortOrder: null, starred: false, pinned: false, tags: [],
    }]);
    useClipboardStore.setState({ expandedId: 1, search: 'draft' });
    render(<App />);
    expect(await screen.findByRole('dialog', { name: 'Содержимое' })).toBeInTheDocument();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    try {
      fireEvent(document, new Event('visibilitychange'));
      expect(screen.getByRole('dialog', { name: 'Содержимое' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('draft')).toBeInTheDocument();
    } finally {
      delete (document as unknown as { hidden?: boolean }).hidden;
      useClipboardStore.setState({ expandedId: null, search: '' });
    }
  });
  it('renders the search bar and sidebar navigation', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Поиск по буферу обмена...')).toBeInTheDocument();
    expect(screen.getByText('Все')).toBeInTheDocument();
    expect(screen.getByText('Избранное')).toBeInTheDocument();
    expect(screen.getAllByText('Текст').length).toBeGreaterThan(0);
    expect(screen.getByText('Файлы')).toBeInTheDocument();
    expect(screen.getByText('Категории')).toBeInTheDocument();
  });
});
