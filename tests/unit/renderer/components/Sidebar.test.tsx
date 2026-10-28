/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../../../../src/renderer/components/Sidebar';

function renderSidebar(overrides: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const props = {
    nav: 'history' as const,
    categories: ['работа'],
    activeCategory: null,
    onNavChange: jest.fn(),
    onCategorySelect: jest.fn(),
    onCategoryAdd: jest.fn(),
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
});
