import { useEffect, useState } from 'react';
import type { ClipboardItem } from '../../shared/types';
import { KIND_LABEL } from './ItemCard';
import { CloseIcon, PlusIcon } from './icons';

interface ItemEditDialogProps {
  /** The card being edited, or null while composing a new one. */
  item: ClipboardItem | null;
  /** Category names from the sidebar, offered as checkboxes. */
  categories: string[];
  /** Pre-ticked on a new card, so a category fills up without extra clicks. */
  initialTags?: string[];
  onClose: () => void;
  onSave: (title: string | null, content: string, tags: string[]) => void;
  onCategoryAdd: (name: string) => void;
}

export function ItemEditDialog({
  item,
  categories,
  initialTags = [],
  onClose,
  onSave,
  onCategoryAdd,
}: ItemEditDialogProps) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const [tags, setTags] = useState<string[]>(item ? item.tags : initialTags);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // The sidebar's categories plus any tag this item already carries, so a tag
  // added elsewhere never silently disappears when the dialog saves.
  const options = [...new Set([...categories.map((c) => c.toLowerCase()), ...tags])];
  const contentLabel = item?.type === 'image' ? 'Путь к файлу' : 'Содержимое';

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  function addDraft() {
    const name = draft.trim();
    if (!name) return;
    onCategoryAdd(name);
    const normalized = name.toLowerCase();
    setTags((current) => (current.includes(normalized) ? current : [...current, normalized]));
    setDraft('');
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="popup edit-dialog"
        role="dialog"
        aria-label={item ? 'Редактирование' : 'Новый блок'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-head">
          <div className="popup-title">{item ? 'Редактирование' : 'Новый блок'}</div>
          <button
            className="item-card-action"
            aria-label="Закрыть"
            title="Закрыть"
            onClick={onClose}
          >
            <CloseIcon size={15} />
          </button>
        </div>

        <label className="field">
          <span className="field-label">Название</span>
          <input
            className="field-input"
            autoFocus={item !== null}
            value={title}
            placeholder={KIND_LABEL[item?.type ?? 'text']}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="field field-grow">
          <span className="field-label">{contentLabel}</span>
          <textarea
            className="field-input field-textarea"
            autoFocus={item === null}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>

        <div className="field">
          <span className="field-label">Категории</span>
          <div className="category-picker">
            {options.map((tag) => (
              <button
                key={tag}
                type="button"
                className={tags.includes(tag) ? 'tag-chip selectable on' : 'tag-chip selectable'}
                aria-pressed={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
            <span className="category-new">
              <input
                className="field-input"
                value={draft}
                placeholder="Новая категория"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addDraft();
                }}
              />
              <button
                type="button"
                className="item-card-action"
                aria-label="Добавить"
                onClick={addDraft}
              >
                <PlusIcon size={14} />
              </button>
            </span>
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="button ghost" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="button primary"
            disabled={!item && !content.trim()}
            onClick={() => onSave(title.trim() || null, content, tags)}
          >
            {item ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}
