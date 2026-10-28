/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from '../../../../src/renderer/components/ItemCard';
import type { ClipboardItem } from '../../../../src/shared/types';

const item: ClipboardItem = {
  id: 1,
  type: 'text',
  title: null,
  content: 'hello world',
  sourceApp: 'notepad',
  createdAt: Date.now(),
  sortOrder: null,
  starred: false,
  pinned: false,
  tags: ['work'],
};

const noopHandlers = {
  reorderMode: false,
  onCopy: () => {},
  onToggleStar: () => {},
  onDelete: () => {},
  onExpand: () => {},
  onEdit: () => {},
  onDragStart: () => {},
  onDragOver: () => {},
  onDrop: () => {},
};

describe('ItemCard', () => {
  it('renders content, tags, and copies the whole item from the badge', () => {
    const onCopy = jest.fn();
    render(<ItemCard {...noopHandlers} item={item} onCopy={onCopy} />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.getByText('work')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Копировать целиком'));
    expect(onCopy).toHaveBeenCalledWith(1);
  });

  it('expands the item when its content is clicked', () => {
    const onExpand = jest.fn();
    render(<ItemCard {...noopHandlers} item={item} onExpand={onExpand} />);
    fireEvent.click(screen.getByText('hello world'));
    expect(onExpand).toHaveBeenCalledWith(1);
  });

  it('keeps the popup closed while the user is selecting text to copy', () => {
    const onExpand = jest.fn();
    jest
      .spyOn(window, 'getSelection')
      .mockReturnValue({ toString: () => 'hello' } as unknown as Selection);
    render(<ItemCard {...noopHandlers} item={item} onExpand={onExpand} />);
    fireEvent.click(screen.getByText('hello world'));
    expect(onExpand).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('expands from anywhere on the card, not just its text', () => {
    const onExpand = jest.fn();
    const { container } = render(<ItemCard {...noopHandlers} item={item} onExpand={onExpand} />);
    fireEvent.click(container.querySelector('.item-card-tags')!);
    expect(onExpand).toHaveBeenCalledWith(1);
  });

  it('keeps header controls from also expanding the card', () => {
    const onExpand = jest.fn();
    const onCopy = jest.fn();
    render(<ItemCard {...noopHandlers} item={item} onExpand={onExpand} onCopy={onCopy} />);
    fireEvent.click(screen.getByLabelText('Копировать целиком'));
    expect(onCopy).toHaveBeenCalledWith(1);
    expect(onExpand).not.toHaveBeenCalled();
  });

  it('shows the custom title instead of the type label when one is set', () => {
    render(<ItemCard {...noopHandlers} item={{ ...item, title: 'Мой блок' }} />);
    expect(screen.getByText('Мой блок')).toBeInTheDocument();
    expect(screen.queryByText('Текст')).not.toBeInTheDocument();
  });

  it('triggers star, edit, and delete from their buttons', () => {
    const onToggleStar = jest.fn();
    const onDelete = jest.fn();
    const onEdit = jest.fn();
    render(
      <ItemCard
        {...noopHandlers}
        item={item}
        onToggleStar={onToggleStar}
        onDelete={onDelete}
        onEdit={onEdit}
      />,
    );
    fireEvent.click(screen.getByLabelText('star'));
    expect(onToggleStar).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByLabelText('edit'));
    expect(onEdit).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByLabelText('delete'));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
