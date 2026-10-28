import type { ClipboardItem, ItemType } from '../../shared/types';
import { CloseIcon, FileIcon, FolderIcon, ImageIcon, StarIcon } from './icons';

const KIND_LABEL: Record<ItemType, string> = {
  text: 'Текст',
  image: 'Изображение',
  file: 'Файл',
};

function formatAge(createdAt: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - createdAt) / 60_000));
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.round(hours / 24)} д назад`;
}

function badgeIcon(type: ItemType) {
  if (type === 'image') return <ImageIcon size={14} />;
  if (type === 'file') return <FolderIcon size={14} />;
  return <FileIcon size={14} />;
}

interface ItemCardProps {
  item: ClipboardItem;
  onCopy: (id: number) => void;
  onToggleStar: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ItemCard({ item, onCopy, onToggleStar, onDelete }: ItemCardProps) {
  return (
    <div className="item-card" data-type={item.type}>
      <div className="item-card-bar" />
      <div className="item-card-body">
        <div className="item-card-head">
          <div className="item-card-badge">{badgeIcon(item.type)}</div>
          <div className="item-card-kind">{KIND_LABEL[item.type]}</div>
          <span className="item-card-time">{formatAge(item.createdAt)}</span>
          <button
            aria-label="star"
            className={item.starred ? 'item-card-action starred' : 'item-card-action'}
            onClick={() => onToggleStar(item.id)}
          >
            <StarIcon size={15} filled={item.starred} />
          </button>
          <button
            aria-label="delete"
            className="item-card-action delete"
            onClick={() => onDelete(item.id)}
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {item.type === 'image' ? (
          <div className="item-card-preview" onClick={() => onCopy(item.id)}>
            <img src={`file://${item.content}`} alt="clipboard preview" />
          </div>
        ) : (
          <div className="item-card-content" onClick={() => onCopy(item.id)}>
            {item.content}
          </div>
        )}

        <div className="item-card-tags">
          {item.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
