import { FixedSizeList } from 'react-window';
import type { ClipboardItem } from '../../shared/types';
import { ItemCard } from './ItemCard';

interface ItemGridProps {
  items: ClipboardItem[];
  onCopy: (id: number) => void;
  onToggleStar: (id: number) => void;
  onDelete: (id: number) => void;
}

const CARD_WIDTH = 280;

export function ItemGrid({ items, onCopy, onToggleStar, onDelete }: ItemGridProps) {
  return (
    <FixedSizeList
      layout="horizontal"
      height={420}
      width={window.innerWidth}
      itemCount={items.length}
      itemSize={CARD_WIDTH}
    >
      {({ index, style }) => (
        <div style={style}>
          <ItemCard
            item={items[index]}
            onCopy={onCopy}
            onToggleStar={onToggleStar}
            onDelete={onDelete}
          />
        </div>
      )}
    </FixedSizeList>
  );
}
