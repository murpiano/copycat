import type { DragEvent, MouseEvent } from 'react';
import { useSelectionCursor } from '../useSelectionCursor';
import type { ClipboardItem, ItemType } from '../../shared/types';
import { AudioIcon, BoxIcon, CloseIcon, ExcelIcon, FileIcon, FolderIcon, ImageIcon, PdfIcon, PencilIcon, PowerPointIcon, StarIcon, TextDocumentIcon, WordIcon } from './icons';
import { firstPath } from '../../shared/file-kind';

export const KIND_LABEL: Record<ItemType, string> = {
  text: 'Текст',
  image: 'Изображение',
  file: 'Файл',
};

export function formatAge(createdAt: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - createdAt) / 60_000));
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.round(hours / 24)} д назад`;
}

export function badgeIcon(type: ItemType, size = 14) {
  if (type === 'image') return <ImageIcon size={size} />;
  if (type === 'file') return <FolderIcon size={size} />;
  return <FileIcon size={size} />;
}

export function itemDisplayTitle(item: ClipboardItem): string {
  if (item.type === 'text') return item.title ?? KIND_LABEL.text;
  let path = item.content;
  if (item.type === 'file') { try { path = JSON.parse(item.content)[0] ?? item.content; } catch { /* plain path */ } }
  const name = path.split(/[\\/]/).pop() ?? '';
  if (!item.title) return name || KIND_LABEL[item.type];
  const extension = name.match(/(\.[^.]+)$/)?.[1];
  return extension && !item.title.toLowerCase().endsWith(extension.toLowerCase()) ? `${item.title}${extension}` : item.title;
}

function fileIcon(item: ClipboardItem, size = 14) {
  const name = firstPath(item.content).toLowerCase();
  if (/\.docx?$/.test(name)) return <WordIcon size={size} />;
  if (/\.(xlsx?|xlsm|xlsb|ods|csv)$/.test(name)) return <ExcelIcon size={size} />;
  if (/\.(pptx?|ppsx?|odp)$/.test(name)) return <PowerPointIcon size={size} />;
  if (/\.pdf$/.test(name)) return <PdfIcon size={size} />;
  if (item.kind === 'document') return <TextDocumentIcon size={size} />;
  if (item.kind === 'audio') return <AudioIcon size={size} />;
  if (item.kind === 'folder') return <FolderIcon size={size} />;
  return <BoxIcon size={size} />;
}

interface ItemCardProps {
  item: ClipboardItem;
  reorderMode: boolean;
  onCopy: (id: number) => void;
  onToggleStar: (id: number) => void;
  onDelete: (id: number) => void;
  onExpand: (id: number) => void;
  onEdit: (id: number) => void;
  onDragStart: (id: number) => void;
  onDragOver: (id: number) => void;
  onDrop: () => void;
}

export function ItemCard({
  item,
  reorderMode,
  onCopy,
  onToggleStar,
  onDelete,
  onExpand,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
}: ItemCardProps) {
  const { selecting, ref: contentRef } = useSelectionCursor<HTMLDivElement>();
  const title = itemDisplayTitle(item);

  // The whole card opens the popup, so there is no dead area inside it. A
  // click that leaves text highlighted is the end of picking an excerpt and
  // must not open anything. A later click clears that highlight first (see
  // useSelectionDismiss), so by this point the selection is empty again and
  // the card opens as any click would.
  function handleCardClick() {
    if (reorderMode) return;
    if (window.getSelection()?.toString()) return;
    onExpand(item.id);
  }

  /** Header controls act on their own, never on the card underneath. */
  function actOnly(run: () => void) {
    return (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      run();
    };
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!reorderMode) return;
    event.preventDefault();
    onDragOver(item.id);
  }

  return (
    <div
      className={reorderMode ? 'item-card jiggle' : 'item-card'}
      data-type={item.type}
      draggable={reorderMode}
      onDragStart={() => onDragStart(item.id)}
      onDragOver={handleDragOver}
      onDrop={onDrop}
      onDragEnd={onDrop}
      onClick={handleCardClick}
    >
      <div className="item-card-bar" />
      <div className="item-card-body">
        <div className="item-card-head">
          <button
            className="item-card-badge"
            aria-label="Копировать целиком"
            title="Копировать целиком"
            onClick={actOnly(() => onCopy(item.id))}
          >
            {item.type === 'file' ? fileIcon(item) : badgeIcon(item.type)}
          </button>
          <div className="item-card-kind" title={title} data-tooltip={title}>
            {title}
          </div>
          <button
            aria-label="star"
            className={item.starred ? 'item-card-action starred' : 'item-card-action'}
            title="В избранное"
            onClick={actOnly(() => onToggleStar(item.id))}
          >
            <StarIcon size={15} filled={item.starred} />
          </button>
          <button
            aria-label="edit"
            className="item-card-action"
            title="Редактировать"
            onClick={actOnly(() => onEdit(item.id))}
          >
            <PencilIcon size={14} />
          </button>
          <button
            aria-label="delete"
            className="item-card-action delete"
            title="Удалить"
            onClick={actOnly(() => onDelete(item.id))}
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {item.type === 'image' ? (
          <div className="item-card-preview">
            <img src={window.copycat.toFileUrl(item.content)} alt="clipboard preview" />
          </div>
        ) : (
          <div
            ref={contentRef}
            className={selecting ? 'item-card-content selecting' : 'item-card-content'}
          >
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
