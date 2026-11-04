/**
 * @jest-environment jsdom
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../../../../src/renderer/components/Sidebar';
import type { SidebarEntry } from '../../../../src/shared/types';

function renderSidebar(overrides: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const props = {
    nav: 'history' as const,
    categories: ['работа'],
    activeCategory: null,
    onNavChange: jest.fn(),
    onCategorySelect: jest.fn(),
    onCategoryAdd: jest.fn(),
    onSettingsOpen: jest.fn(),
    navOrder: ['history', 'starred', 'images', 'files', 'categories'] as SidebarEntry[],
    categoriesExpanded: false,
    reorderMode: false,
    onNavMove: jest.fn(),
    onCategoryMove: jest.fn(),
    onReorderDone: jest.fn(),
    onReorderCancel: jest.fn(),
    ...overrides,
  };
  render(<Sidebar {...props} />);
  return props;
}

describe('Sidebar', () => {
  it('reports the chosen navigation entry', () => {
    const props = renderSidebar();
    fireEvent.click(screen.getAllByText('Изображения')[0]);
    expect(props.onNavChange).toHaveBeenCalledWith('images');
  });

  it('keeps categories collapsed until the selector is opened', () => {
    renderSidebar();
    expect(screen.queryByText('работа')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Категории'));
    expect(screen.getByText('работа')).toBeInTheDocument();
    expect(screen.getByLabelText('Добавить категорию')).toBeInTheDocument();
  });

  it('adds a category from the inline input on Enter', () => {
    const props = renderSidebar();
    fireEvent.click(screen.getByText('Категории'));
    fireEvent.click(screen.getByLabelText('Добавить категорию'));
    const input = screen.getByPlaceholderText('Название категории');
    fireEvent.change(input, { target: { value: 'личное' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onCategoryAdd).toHaveBeenCalledWith('личное');
  });

  it('lets the "Категории" entry be dragged like any other section', () => {
    const props = renderSidebar({ reorderMode: true });
    const row = screen.getByText('Категории').closest('.nav-row')!;
    expect(row).toHaveAttribute('draggable', 'true');
    fireEvent.dragStart(row);
    const history = screen.getByText('Все').closest('.nav-item')!;
    fireEvent.dragOver(history);
    expect(props.onNavMove).toHaveBeenCalledWith('categories', 'history');
  });

  it('offers Отмена next to Готово while sections are being arranged', () => {
    const props = renderSidebar({ reorderMode: true });
    fireEvent.click(screen.getByLabelText('Отмена'));
    expect(props.onReorderCancel).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Готово'));
    expect(props.onReorderDone).toHaveBeenCalled();
  });

  it('ignores taps on nav entries and categories while arranging', () => {
    const props = renderSidebar({ reorderMode: true });
    fireEvent.click(screen.getAllByText('Изображения')[0]);
    expect(props.onNavChange).not.toHaveBeenCalled();
    // The list stays open throughout a reorder (there is nothing to arrange
    // if it is collapsed), but a tap on an entry must not select it.
    fireEvent.click(screen.getByText('работа'));
    expect(props.onCategorySelect).not.toHaveBeenCalled();
  });

  it('does not highlight file subgroups while another section is active', () => {
    renderSidebar({ filesExpanded: true, nav: 'history' });
    expect(screen.getByText('Все файлы').closest('.category-item')).not.toHaveClass('active');
  });

  it('opens files from the whole row and selects subgroups from row edges', () => {
    const props = renderSidebar({ onFileGroupSelect: jest.fn() });
    fireEvent.click(screen.getByText('Файлы', { selector: 'span' }).closest('.nav-row')!);
    expect(screen.getByText('Все файлы')).toBeInTheDocument();
    expect(props.onNavChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Документы').closest('.category-item')!);
    expect(props.onFileGroupSelect).toHaveBeenCalledWith('documents');
    fireEvent.click(screen.getByText('Файлы', { selector: 'span' }).closest('.nav-row')!);
    expect(screen.queryByText('Документы')).not.toBeInTheDocument();
  });

  it('keeps selected rows unhighlighted while arranging', () => {
    renderSidebar({ reorderMode: true, nav: 'files', activeCategory: null, filesExpanded: true });
    expect(screen.getByText('Файлы', { selector: 'span' }).closest('.nav-row')).not.toHaveClass('active');
    expect(screen.getByText('Все файлы').closest('.category-item')).not.toHaveClass('active');
  });

  it('reorders file subgroups locally and allows hiding a category', () => {
    const props = renderSidebar({ reorderMode: true, filesExpanded: true, onFileSectionMove: jest.fn(), onCategoryVisibilityToggle: jest.fn() });
    const images = screen.getAllByText('Изображения').find((node) => node.closest('.category-item'))!.closest('.category-item')!;
    const audio = screen.getByText('Аудио').closest('.category-item')!;
    fireEvent.dragStart(images);
    fireEvent.dragOver(audio);
    expect(props.onFileSectionMove).toHaveBeenCalledWith('images', 'audio');
    fireEvent.click(screen.getByLabelText('Скрыть работа'));
    expect(props.onCategoryVisibilityToggle).toHaveBeenCalledWith('работа');
  });

  it('asks before deleting a category in reorder mode', () => {
    const onCategoryDelete = jest.fn().mockResolvedValue(undefined);
    renderSidebar({ reorderMode: true, onCategoryDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Удалить категорию работа' }));
    expect(onCategoryDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onCategoryDelete).toHaveBeenCalledWith('работа');
  });

  it('restores expansion preferences when the window is shown again', () => {
    const previous = window.copycat;
    let showWindow!: () => void;
    window.copycat = { ...previous, onWindowShown: (callback) => { showWindow = callback; return () => {}; } };
    try {
      renderSidebar({ filesExpanded: false, categoriesExpanded: false });
      fireEvent.click(screen.getByText('Категории'));
      fireEvent.click(screen.getByText('Файлы', { selector: 'span' }));
      expect(screen.getByText('работа')).toBeInTheDocument();
      expect(screen.getByText('Все файлы')).toBeInTheDocument();
      act(() => showWindow());
      expect(screen.queryByText('работа')).not.toBeInTheDocument();
      expect(screen.queryByText('Все файлы')).not.toBeInTheDocument();
    } finally { window.copycat = previous; }
  });

  it('keeps both groups expanded after reopening while arranging', () => {
    const previous = window.copycat;
    let showWindow!: () => void;
    window.copycat = { ...previous, onWindowShown: (callback) => { showWindow = callback; return () => {}; } };
    try {
      renderSidebar({ reorderMode: true, filesExpanded: false, categoriesExpanded: false });
      act(() => showWindow());
      expect(screen.getByText('работа')).toBeInTheDocument();
      expect(screen.getByText('Все файлы')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Категории' })).toHaveAttribute('aria-expanded', 'true');
    } finally { window.copycat = previous; }
  });
});
