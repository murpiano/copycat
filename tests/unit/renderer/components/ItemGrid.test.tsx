/**
 * @jest-environment jsdom
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import { ItemGrid } from '../../../../src/renderer/components/ItemGrid';
import type { ClipboardItem } from '../../../../src/shared/types';
import { useClipboardStore } from '../../../../src/renderer/store/useClipboardStore';

// These tests check Russian-localized labels explicitly; pin the store to
// 'ru' so they stay independent of the app's default language.
let previousSettings: ReturnType<typeof useClipboardStore.getState>['settings'];
beforeEach(() => {
  previousSettings = useClipboardStore.getState().settings;
  useClipboardStore.setState({ settings: { language: 'ru', hotkey: 'CommandOrControl+F1', categoriesExpanded: true, filesExpanded: true, navOrder: ['history', 'starred', 'text', 'files', 'categories'], windowBounds: null } });
});
afterEach(() => {
  act(() => { useClipboardStore.setState({ settings: previousSettings }); });
});

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
  onCancelReorder: () => {},
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
    expect(screen.getByTitle('Создать')).toBeInTheDocument();
  });

  it('swaps the create-block button for Отмена while reordering', () => {
    const onCancelReorder = jest.fn();
    render(
      <ItemGrid
        {...handlers}
        onCancelReorder={onCancelReorder}
        items={[makeItem(1), makeItem(2)]}
        canReorder
        reorderMode
      />,
    );
    expect(screen.queryByTitle('Создать')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Отменить'));
    expect(onCancelReorder).toHaveBeenCalled();
  });

  it('shows В начало after the card grid is scrolled', () => {
    const { container } = render(<ItemGrid {...handlers} items={[makeItem(1)]} canReorder={false} />);
    const grid = container.querySelector('.item-grid') as HTMLDivElement;
    Object.defineProperty(grid, 'scrollTop', { value: 240, configurable: true });
    fireEvent.scroll(grid);
    expect(screen.getByRole('button', { name: 'В начало' })).toBeInTheDocument();
  });
});
