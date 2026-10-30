/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { ItemGrid } from '../../../../src/renderer/components/ItemGrid';
import type { ClipboardItem } from '../../../../src/shared/types';

function makeItem(id: number): ClipboardItem {
  return {
    id,
    type: 'text',
    title: null,
    content: `текст ${id}`,
    sourceApp: null,
    createdAt: Date.now(),
    sortOrder: null,
    starred: false,
    pinned: false,
    tags: [],
  };
}

const handlers = {
  reorderMode: false,
  onToggleReorder: () => {},
  onCompose: () => {},
  onCopy: () => {},
  onToggleStar: () => {},
  onDelete: () => {},
  onExpand: () => {},
  onEdit: () => {},
  onMove: () => {},
  onOrderCommit: () => {},
};

describe('ItemGrid', () => {
  it('offers the order button where the view allows it', () => {
    render(<ItemGrid {...handlers} items={[makeItem(1), makeItem(2)]} canReorder />);
    expect(screen.getByTitle('Изменить порядок')).toBeInTheDocument();
  });

  it('hides the order button when the view keeps its own order', () => {
    render(<ItemGrid {...handlers} items={[makeItem(1), makeItem(2)]} canReorder={false} />);
    expect(screen.queryByTitle('Изменить порядок')).not.toBeInTheDocument();
  });

  it('always offers creating a block', () => {
    render(<ItemGrid {...handlers} items={[]} canReorder={false} />);
    expect(screen.getByTitle('Создать блок')).toBeInTheDocument();
  });
});
