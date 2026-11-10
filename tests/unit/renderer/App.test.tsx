/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from '../../../src/renderer/App';
import type { CopycatAPI } from '../../../src/shared/types';
import { useClipboardStore } from '../../../src/renderer/store/useClipboardStore';

beforeEach(() => {
  useClipboardStore.setState({
    items: [], search: '', nav: 'history', activeCategory: null, activeFileGroup: null,
    expandedId: null, editingId: null, composing: false, settingsOpen: false,
    // Pinned to 'ru' since these tests check Russian-localized labels
    // explicitly, independent of the app's default language.
    settings: { language: 'ru', hotkey: 'CommandOrControl+F1', categoriesExpanded: false, filesExpanded: false, navOrder: ['history', 'starred', 'text', 'files', 'categories'], windowBounds: null },
    navOrder: ['history', 'starred', 'text', 'files', 'categories'],
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
      language: 'ru',
      hotkey: 'CommandOrControl+Shift+V',
      categoriesExpanded: false,
      navOrder: ['history', 'starred', 'text', 'files'],
      windowBounds: null,
    }),
    updateSettings: jest.fn(),
    hideWindow: jest.fn(),
    onItemAdded: jest.fn().mockReturnValue(() => {}),
    onItemsChanged: jest.fn().mockReturnValue(() => {}),
  } as unknown as CopycatAPI;
  (window as unknown as { copycat: CopycatAPI }).copycat = api;
});

describe('App', () => {
  it.each([
    { starred: true, tags: [], expected: 'Блок добавлен в избранное.' },
    { starred: false, tags: ['Проект'], expected: 'Блок включён в категории: Проект.' },
  ])('protects membership before deletion: $expected', async ({ starred, tags, expected }) => {
    (window.copycat.getItems as jest.Mock).mockResolvedValue([{
      id: 7, type: 'text', title: null, content: 'protected', sourceApp: null,
      createdAt: Date.now(), sortOrder: null, starred, pinned: false, tags,
    }]);
    render(<App />);
    await screen.findByText('protected');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent(expected);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(window.copycat.deleteItem).not.toHaveBeenCalled();
    expect(window.copycat.hideWindow).not.toHaveBeenCalled();
  });
  it('confirms protected deletion, retains category names, and allows retry', async () => {
    (window.copycat.getItems as jest.Mock).mockResolvedValue([{
      id: 9, type: 'text', title: 'Important', content: 'protected content', sourceApp: null,
      createdAt: Date.now(), sortOrder: null, starred: true, pinned: false, tags: ['Профиль', 'Work'],
    }]);
    (window.copycat.deleteItem as jest.Mock).mockRejectedValueOnce(new Error('busy')).mockResolvedValueOnce(undefined);
    render(<App />);
    await screen.findByText('protected content');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    let dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('Блок добавлен в избранное.');
    expect(dialog).toHaveTextContent('Профиль, Work');
    expect(window.copycat.deleteItem).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    dialog = screen.getByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось удалить блок.');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(window.copycat.deleteItem).toHaveBeenCalledTimes(2);
  });

  it('deletes an ordinary block without a confirmation', async () => {
    (window.copycat.getItems as jest.Mock).mockResolvedValue([{
      id: 3, type: 'text', title: null, content: 'ordinary', sourceApp: null,
      createdAt: Date.now(), sortOrder: null, starred: false, pinned: false, tags: [],
    }]);
    render(<App />);
    await screen.findByText('ordinary');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(window.copycat.deleteItem).toHaveBeenCalledWith(3);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
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
