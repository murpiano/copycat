/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { App } from '../../../src/renderer/App';
import type { CopycatAPI } from '../../../src/shared/types';

beforeEach(() => {
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
      navOrder: ['history', 'starred', 'images', 'files'],
      windowBounds: null,
    }),
    updateSettings: jest.fn(),
    hideWindow: jest.fn(),
    onItemAdded: jest.fn().mockReturnValue(() => {}),
  } as unknown as CopycatAPI;
  (window as unknown as { copycat: CopycatAPI }).copycat = api;
});

describe('App', () => {
  it('renders the search bar and sidebar navigation', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Поиск по буферу обмена...')).toBeInTheDocument();
    expect(screen.getByText('Все')).toBeInTheDocument();
    expect(screen.getByText('Избранное')).toBeInTheDocument();
    expect(screen.getByText('Изображения')).toBeInTheDocument();
    expect(screen.getByText('Файлы')).toBeInTheDocument();
    expect(screen.getByText('Категории')).toBeInTheDocument();
  });
});
