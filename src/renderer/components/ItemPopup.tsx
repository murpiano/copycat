import { useEffect, useState } from 'react';
import type { ClipboardItem } from '../../shared/types';
import { badgeIcon, copyLabel, fileIcon, formatAge, itemDisplayTitle } from './ItemCard';
import { CloseIcon, CopyIcon, PencilIcon } from './icons';
import { useSelectionCursor } from '../useSelectionCursor';
import { Overlay } from './Overlay';
import { useLanguage, useT } from '../i18n';
import { useClipboardStore } from '../store/useClipboardStore';

interface ItemPopupProps {
  item: ClipboardItem;
  onClose: () => void;
  onCopy: (id: number) => void;
  onEdit: (id: number) => void;
}

export function ItemPopup({ item, onClose, onCopy, onEdit }: ItemPopupProps) {
  const language = useLanguage();
  const t = useT();
  const { selecting, ref: contentRef } = useSelectionCursor<HTMLDivElement>();
  const [openError, setOpenError] = useState(false);
  const relinkItem = useClipboardStore((s) => s.relinkItem);

  async function handleRelink() {
    const picked = await window.copycat.pickObject(item.kind === 'folder' ? 'folder' : 'file');
    if (!picked) return;
    await relinkItem(item.id, picked.path);
    setOpenError(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <Overlay onClose={onClose}>
      <div className="popup" data-type={item.type} role="dialog" aria-label={t('Содержимое')}>
        <div className="popup-head">
          <div className="item-card-badge static">
            {item.type === 'file' ? fileIcon(item, 15) : badgeIcon(item.type, 15)}
          </div>
          <div className="popup-title" title={itemDisplayTitle(item, language)}>
            {itemDisplayTitle(item, language)}
          </div>
          <span className="item-card-time">{formatAge(item.createdAt, language)}</span>
          <button
            className="item-card-action"
            aria-label={t(copyLabel(item))}
            title={t(copyLabel(item))}
            onClick={() => onCopy(item.id)}
          >
            <CopyIcon size={15} />
          </button>
          <button
            className="item-card-action"
            aria-label={t('Редактировать')}
            title={t('Редактировать')}
            onClick={() => onEdit(item.id)}
          >
            <PencilIcon size={15} />
          </button>
          <button
            className="item-card-action"
            aria-label={t('Закрыть')}
            title={t('Закрыть')}
            onClick={onClose}
          >
            <CloseIcon size={15} />
          </button>
        </div>

        {item.type === 'image' ? (
          <div className="popup-image">
            <img src={window.copycat.toFileUrl(item.content)} alt={t('Предпросмотр изображения')} />
          </div>
        ) : (
          <div ref={contentRef} className={selecting ? 'popup-content selecting' : 'popup-content'}>
            {item.content}
          </div>
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
        {item.type !== 'text' && (
          <button
            type="button"
            className="button open-object"
            onClick={() => {
              void window.copycat
                .openItem(item.id)
                .then(() => setOpenError(false))
                .catch(() => setOpenError(true));
            }}
          >
            {t('Открыть')}
          </button>
        )}
        {(item.missing || openError) && (
          <div className="field-hint popup-missing" role="alert">
            <span>{t('Исходный объект не найден.')}</span>
            <button type="button" className="item-relink-link" onClick={() => void handleRelink()}>
              {t('Указать расположение')}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}
