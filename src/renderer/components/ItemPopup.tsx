import { useEffect } from 'react';
import type { ClipboardItem } from '../../shared/types';
import { KIND_LABEL, badgeIcon, formatAge } from './ItemCard';
import { CloseIcon, CopyIcon, PencilIcon } from './icons';

interface ItemPopupProps {
  item: ClipboardItem;
  onClose: () => void;
  onCopy: (id: number) => void;
  onEdit: (id: number) => void;
}

export function ItemPopup({ item, onClose, onCopy, onEdit }: ItemPopupProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="popup"
        data-type={item.type}
        role="dialog"
        aria-label="Содержимое"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-head">
          <div className="item-card-badge static">{badgeIcon(item.type, 15)}</div>
          <div className="popup-title">{item.title ?? KIND_LABEL[item.type]}</div>
          <span className="item-card-time">{formatAge(item.createdAt)}</span>
          <button
            className="item-card-action"
            aria-label="Копировать целиком"
            title="Копировать целиком"
            onClick={() => onCopy(item.id)}
          >
            <CopyIcon size={15} />
          </button>
          <button
            className="item-card-action"
            aria-label="Редактировать"
            title="Редактировать"
            onClick={() => onEdit(item.id)}
          >
            <PencilIcon size={15} />
          </button>
          <button
            className="item-card-action"
            aria-label="Закрыть"
            title="Закрыть"
            onClick={onClose}
          >
            <CloseIcon size={15} />
          </button>
        </div>

        {item.type === 'image' ? (
          <div className="popup-image">
            <img src={`file://${item.content}`} alt="clipboard preview" />
          </div>
        ) : (
          <div className="popup-content">{item.content}</div>
        )}

        {item.tags.length > 0 && (
          <div className="item-card-tags">
            {item.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
