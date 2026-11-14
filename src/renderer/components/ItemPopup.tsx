import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import type { ClipboardItem } from '../../shared/types';
import { badgeIcon, copyLabel, fileIcon, formatAge, itemDisplayTitle } from './ItemCard';
import { CloseIcon, CopyIcon, PencilIcon } from './icons';
import { useSelectionCursor } from '../useSelectionCursor';
import { Overlay } from './Overlay';
import { useLanguage, useT } from '../i18n';
import { useClipboardStore } from '../store/useClipboardStore';
import cardStyles from './ItemCard.module.css';
import popupStyles from '../shared/popup.module.css';
import formStyles from '../shared/form.module.css';
import uiStyles from '../shared/ui.module.css';

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
      <div
        className={popupStyles.popup}
        data-type={item.type}
        role="dialog"
        aria-label={t('Содержимое')}
      >
        <div className={popupStyles.popupHead}>
          <div className={clsx(cardStyles.itemCardBadge, cardStyles.static)}>
            {item.type === 'file' ? fileIcon(item, 15) : badgeIcon(item.type, 15)}
          </div>
          <div className={popupStyles.popupTitle} title={itemDisplayTitle(item, language)}>
            {itemDisplayTitle(item, language)}
          </div>
          <span className={cardStyles.itemCardTime}>{formatAge(item.createdAt, language)}</span>
          <button
            className={cardStyles.itemCardAction}
            aria-label={t(copyLabel(item))}
            title={t(copyLabel(item))}
            onClick={() => onCopy(item.id)}
          >
            <CopyIcon size={15} />
          </button>
          <button
            className={cardStyles.itemCardAction}
            aria-label={t('Редактировать')}
            title={t('Редактировать')}
            onClick={() => onEdit(item.id)}
          >
            <PencilIcon size={15} />
          </button>
          <button
            className={cardStyles.itemCardAction}
            aria-label={t('Закрыть')}
            title={t('Закрыть')}
            onClick={onClose}
          >
            <CloseIcon size={15} />
          </button>
        </div>

        {item.type === 'image' ? (
          <div className={popupStyles.popupImage}>
            <img src={window.copycat.toFileUrl(item.content)} alt={t('Предпросмотр изображения')} />
          </div>
        ) : (
          <div
            ref={contentRef}
            className={clsx(popupStyles.popupContent, selecting && cardStyles.selecting)}
          >
            {item.content}
          </div>
        )}

        {item.tags.length > 0 && (
          <div className={cardStyles.itemCardTags}>
            {item.tags.map((tag) => (
              <span key={tag} className={cardStyles.tagChip}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {item.type !== 'text' && (
          <button
            type="button"
            className={clsx(uiStyles.button, uiStyles.openObject)}
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
          <div className={clsx(formStyles.fieldHint, cardStyles.popupMissing)} role="alert">
            <span>{t('Исходный объект не найден.')}</span>
            <button
              type="button"
              className={cardStyles.itemRelinkLink}
              onClick={() => void handleRelink()}
            >
              {t('Указать расположение')}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}
