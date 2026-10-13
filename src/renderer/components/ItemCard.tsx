import type { ClipboardItem } from '../../shared/types';

interface ItemCardProps {
  item: ClipboardItem;
  onCopy: (id: number) => void;
  onToggleStar: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ItemCard({ item, onCopy, onToggleStar, onDelete }: ItemCardProps) {
  return (
    <div className="item-card">
      <div className="item-card-actions">
        <button aria-label="star" onClick={() => onToggleStar(item.id)}>
          {item.starred ? '★' : '☆'}
        </button>
        <button aria-label="delete" onClick={() => onDelete(item.id)}>
          ✕
        </button>
      </div>
      <div className="item-card-content" onClick={() => onCopy(item.id)}>
        {item.type === 'image' ? (
          <img src={`file://${item.content}`} alt="clipboard preview" />
        ) : (
          item.content
        )}
      </div>
      <div className="item-card-tags">
        {item.tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
      </div>
      {item.sourceApp && <div className="item-card-source">{item.sourceApp}</div>}
    </div>
  );
}
