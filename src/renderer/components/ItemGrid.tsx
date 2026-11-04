import { useRef, useState } from 'react';
import type { ClipboardItem } from '../../shared/types';
import { ItemCard } from './ItemCard';
import { ArrowUpIcon, CheckIcon, CloseIcon, PencilIcon, PlusIcon } from './icons';
import { useT } from '../i18n';

interface ItemGridProps {
  items: ClipboardItem[];
  reorderMode: boolean;
  /** Starred and category views can be reordered; the history view cannot. */
  canReorder: boolean;
  onToggleReorder: () => void;
  onCancelReorder: () => void;
  onCompose: () => void;
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
  onCancelReorder,
  onCompose,
  onCopy,
  onToggleStar,
  onDelete,
  onExpand,
  onEdit,
  onMove,
  onOrderCommit,
}: ItemGridProps) {
  const t = useT();
  const dragId = useRef<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);


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
      <div className="grid-toolbar">
        {canReorder && (
          <button
            className={reorderMode ? 'grid-reorder-toggle active' : 'grid-reorder-toggle'}
            aria-pressed={reorderMode}
            title={t(reorderMode ? 'Готово' : 'Изменить порядок')}
            onClick={onToggleReorder}
          >
            {reorderMode ? <CheckIcon size={15} /> : <PencilIcon size={15} />}
            <span>{t(reorderMode ? 'Готово' : 'Порядок')}</span>
          </button>
        )}
        {reorderMode ? (
          <button className="grid-reorder-toggle" title={t('Отменить')} onClick={onCancelReorder}>
            <CloseIcon size={15} />
            <span>{t('Отмена')}</span>
          </button>
        ) : (
          <button className="grid-reorder-toggle" title={t('Создать')} onClick={onCompose}>
            <PlusIcon size={15} />
            <span>{t('Создать')}</span>
          </button>
        )}
        {showTop && items.length > 0 && <button className="grid-reorder-toggle grid-top" onClick={() => sectionRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={t('В начало')}><ArrowUpIcon size={15} /><span>{t('В начало')}</span></button>}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">{t('Ничего не найдено')}</div>
      ) : (
        <div className="item-grid" ref={sectionRef} onScroll={(event) => setShowTop(event.currentTarget.scrollTop > 220)}>
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
