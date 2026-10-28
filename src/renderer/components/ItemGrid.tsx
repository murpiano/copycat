import type { ClipboardItem } from '../../shared/types';
import { ItemCard } from './ItemCard';

interface ItemGridProps {
  items: ClipboardItem[];
  onCopy: (id: number) => void;
  onToggleStar: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ItemGrid({ items, onCopy, onToggleStar, onDelete }: ItemGridProps) {
  if (items.length === 0) {
    return <div className="empty-state">Ничего не найдено</div>;
  }

  return (
    <div className="item-grid">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onCopy={onCopy}
          onToggleStar={onToggleStar}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
