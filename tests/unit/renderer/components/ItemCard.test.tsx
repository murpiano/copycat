/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from '../../../../src/renderer/components/ItemCard';
import type { ClipboardItem } from '../../../../src/shared/types';

const item: ClipboardItem = {
  id: 1,
  type: 'text',
  content: 'hello world',
  sourceApp: 'notepad',
  createdAt: Date.now(),
  starred: false,
  pinned: false,
  tags: ['work'],
};

describe('ItemCard', () => {
  it('renders content, tags, and triggers copy on click', () => {
    const onCopy = jest.fn();
    render(
      <ItemCard item={item} onCopy={onCopy} onToggleStar={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.getByText('work')).toBeInTheDocument();
    fireEvent.click(screen.getByText('hello world'));
    expect(onCopy).toHaveBeenCalledWith(1);
  });

  it('triggers star toggle and delete from their buttons', () => {
    const onToggleStar = jest.fn();
    const onDelete = jest.fn();
    render(
      <ItemCard item={item} onCopy={() => {}} onToggleStar={onToggleStar} onDelete={onDelete} />,
    );
    fireEvent.click(screen.getByLabelText('star'));
    expect(onToggleStar).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByLabelText('delete'));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
