import { useRef } from 'react';
import type { ClipboardItem } from '../../shared/types';
import { ItemCard } from './ItemCard';
import { CheckIcon, PencilIcon } from './icons';

interface ItemGridProps {
  items: ClipboardItem[];
  reorderMode: boolean;
  /** Starred and category views can be reordered; the history view cannot. */
  canReorder: boolean;
  onToggleReorder: () => void;
  onCopy: (id: number) => void;
  onToggleStar: (id: number) => void;
  onDelete: (id: number) => void;
  onExpand: (id: number) => void;
  onEdit: (id: number) => void;
  onMove: (dragId: number, overId: number) => void;
  onOrderCommit: () => void;
}

export function ItemGrid({
  items,
  reorderMode,
  canReorder,
  onToggleReorder,
  onCopy,
  onToggleStar,
  onDelete,
  onExpand,
  onEdit,
  onMove,
  onOrderCommit,
}: ItemGridProps) {
  const dragId = useRef<number | null>(null);

  function handleDragOver(overId: number) {
    if (dragId.current === null) return;
    onMove(dragId.current, overId);
  }

  function handleDrop() {
    if (dragId.current === null) return;
    dragId.current = null;
    onOrderCommit();
  }

  return (
    <div className="grid-section">
      {canReorder && (
        <div className="grid-toolbar">
          <button
            className={reorderMode ? 'grid-reorder-toggle active' : 'grid-reorder-toggle'}
            aria-pressed={reorderMode}
            title={reorderMode ? 'Готово' : 'Изменить порядок'}
            onClick={onToggleReorder}
          >
            {reorderMode ? <CheckIcon size={15} /> : <PencilIcon size={15} />}
            <span>{reorderMode ? 'Готово' : 'Порядок'}</span>
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">Ничего не найдено</div>
      ) : (
        <div className="item-grid">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              reorderMode={reorderMode}
              onCopy={onCopy}
              onToggleStar={onToggleStar}
              onDelete={onDelete}
              onExpand={onExpand}
              onEdit={onEdit}
              onDragStart={(id) => {
                dragId.current = id;
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
