/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
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
    fireEvent.click(screen.getByText('Изображения'));
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
    fireEvent.click(screen.getByText('Изображения'));
    expect(props.onNavChange).not.toHaveBeenCalled();
    // The list stays open throughout a reorder (there is nothing to arrange
    // if it is collapsed), but a tap on an entry must not select it.
    fireEvent.click(screen.getByText('работа'));
    expect(props.onCategorySelect).not.toHaveBeenCalled();
  });
});
