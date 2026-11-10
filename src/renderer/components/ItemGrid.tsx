import { useLayoutEffect, useRef, useState } from 'react';
import type { ClipboardItem } from '../../shared/types';
import { ItemCard } from './ItemCard';
import { ArrowUpIcon, CheckIcon, CloseIcon, PencilIcon, PlusIcon } from './icons';
import { useT } from '../i18n';

// Mirrors the .item-grid rule in index.css (auto-fill columns, fixed row
// height): kept in sync by hand since the grid is windowed by row from here,
// not measured from the DOM on every scroll tick.
const GRID_MIN_CARD_WIDTH = 260;
const GRID_GAP = 24;
const GRID_ROW_HEIGHT = 186;
const GRID_ROW_STEP = GRID_ROW_HEIGHT + GRID_GAP;
const OVERSCAN_ROWS = 2;

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
  // Only the rows near the viewport are mounted: with hundreds of cards (and
  // their preview images) in a view, mounting every one at once is the main
  // driver of the renderer's memory footprint. Dragging to reorder wants the
  // whole list available to drop onto, so virtualization sits out for it —
  // reorder only applies to starred/category views, which stay small anyway.
  const [visibleRows, setVisibleRows] = useState({ columns: 1, startRow: 0, endRow: Infinity });

  function recomputeVisibleRows() {
    const el = sectionRef.current;
    if (!el) return;
    const columns = Math.max(1, Math.floor((el.clientWidth + GRID_GAP) / (GRID_MIN_CARD_WIDTH + GRID_GAP)));
    const totalRows = Math.ceil(items.length / columns);
    if (reorderMode) {
      setVisibleRows({ columns, startRow: 0, endRow: totalRows });
      return;
    }
    const startRow = Math.max(0, Math.floor(el.scrollTop / GRID_ROW_STEP) - OVERSCAN_ROWS);
    const endRow = Math.min(totalRows, Math.ceil((el.scrollTop + el.clientHeight) / GRID_ROW_STEP) + OVERSCAN_ROWS);
    setVisibleRows({ columns, startRow, endRow });
  }

  useLayoutEffect(() => {
    recomputeVisibleRows();
    const el = sectionRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(recomputeVisibleRows);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, reorderMode]);

  const startIndex = visibleRows.startRow * visibleRows.columns;
  const endIndex = Math.min(items.length, visibleRows.endRow * visibleRows.columns);
  const topRows = visibleRows.startRow;
  const bottomRows = Math.max(0, Math.ceil(items.length / visibleRows.columns) - visibleRows.endRow);

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
        <div
          className="item-grid"
          ref={sectionRef}
          onScroll={(event) => {
            setShowTop(event.currentTarget.scrollTop > 220);
            recomputeVisibleRows();
          }}
        >
          {topRows > 0 && (
            <div className="item-grid-spacer" style={{ gridColumn: '1 / -1', gridRow: `span ${topRows}` }} />
          )}
          {items.slice(startIndex, endIndex).map((item) => (
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
          {bottomRows > 0 && (
            <div className="item-grid-spacer" style={{ gridColumn: '1 / -1', gridRow: `span ${bottomRows}` }} />
          )}
        </div>
      )}
    </div>
  );
}
