import { useEffect, useState } from 'react';
import type { ClipboardItem, CreateItemInput, PickedObject } from '../../shared/types';
import { fileGroupOf, type FileGroup } from '../../shared/file-kind';
import { KIND_LABEL, fileIcon } from './ItemCard';
import {
  AudioIcon,
  BoxIcon,
  CloseIcon,
  FileIcon,
  FolderIcon,
  ImageIcon,
  PlusIcon,
  StarIcon,
  TextDocumentIcon,
  VideoIcon,
} from './icons';
import { Overlay } from './Overlay';
import { ConfirmDialog } from './ConfirmDialog';
import { useT } from '../i18n';

interface ItemEditDialogProps {
  /** The card being edited, or null while composing a new one. */
  item: ClipboardItem | null;
  /** Category names from the sidebar, offered as checkboxes. */
  categories: string[];
  /** Pre-ticked on a new card, so a category fills up without extra clicks. */
  initialTags?: string[];
  /** null allows text/object choice; text and file groups lock the creator. */
  creationGroup?: FileGroup | 'all' | 'text' | null;
  initialStarred?: boolean;
  onClose: () => void;
  onSave: (
    title: string | null,
    content: string,
    tags: string[],
    creation?: Pick<CreateItemInput, 'type' | 'starred' | 'expectedGroup'>,
  ) => Promise<void>;
  onCategoryAdd: (name: string) => void;
}

export function ItemEditDialog({
  item,
  categories,
  initialTags = [],
  creationGroup = null,
  initialStarred = false,
  onClose,
  onSave,
  onCategoryAdd,
}: ItemEditDialogProps) {
  const t = useT();
  const [title, setTitle] = useState(item?.title ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const [mode, setMode] = useState<'text' | 'object'>(
    creationGroup && creationGroup !== 'text' ? 'object' : 'text',
  );
  const [picked, setPicked] = useState<PickedObject | null>(null);
  const [starred, setStarred] = useState(initialStarred);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(item ? item.tags : initialTags);
  const [draft, setDraft] = useState('');
  const [asking, setAsking] = useState(false);

  const dirty = item
    ? title !== (item.title ?? '') ||
      content !== item.content ||
      tags.join('\u0000') !== item.tags.join('\u0000')
    : Boolean(title.trim() || content.trim() || picked || draft.trim());

  async function save() {
    if (busy) return;
    if (!item && (mode === 'text' ? !content.trim() : !picked)) {
      setAsking(false);
      setSaveError(t(mode === 'text' ? 'Введите текст блока.' : 'Выберите объект.'));
      return;
    }
    setBusy(true);
    setSaveError(null);
    try {
      const objectType = picked?.kind === 'image' ? 'image' : 'file';
      await onSave(
        title.trim() || null,
        item || mode === 'text' ? content : (picked?.path ?? ''),
        tags,
        item
          ? undefined
          : {
              type: mode === 'text' ? 'text' : objectType,
              starred,
              expectedGroup:
                creationGroup && creationGroup !== 'all' && creationGroup !== 'text'
                  ? creationGroup
                  : undefined,
            },
      );
    } catch {
      setAsking(false);
      setSaveError(t('Не удалось создать блок. Проверьте выбранный объект.'));
    } finally {
      setBusy(false);
    }
  }

  async function chooseObject(selection: 'file' | 'folder') {
    setSaveError(null);
    try {
      const result = await window.copycat.pickObject(
        selection,
        creationGroup && creationGroup !== 'all' && creationGroup !== 'text'
          ? creationGroup
          : undefined,
      );
      if (!result) return;
      const group = fileGroupOf({
        type: result.kind === 'image' ? 'image' : 'file',
        kind: result.kind,
        content: result.path,
      });
      if (
        creationGroup &&
        creationGroup !== 'all' &&
        creationGroup !== 'text' &&
        group !== creationGroup
      ) {
        setPicked(null);
        setSaveError(t('Выбранный объект не относится к этому разделу.'));
        return;
      }
      setPicked(result);
      setTitle(result.path.split(/[\\/]/).pop() ?? '');
    } catch {
      setSaveError(t('Не удалось выбрать объект.'));
    }
  }

  // Leaving with edits in hand asks first, so a stray Escape cannot drop them.
  function requestClose() {
    if (busy) return;
    if (dirty) setAsking(true);
    else onClose();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (asking) return;
      requestClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // The sidebar's categories plus any tag this item already carries, so a tag
  // added elsewhere never silently disappears when the dialog saves.
  const options = [...new Set([...categories.map((c) => c.toLowerCase()), ...tags])];
  const contentLabel = t(item?.type === 'image' ? 'Путь к файлу' : 'Содержимое');
  const groupLabels: Record<FileGroup | 'all', string> = {
    all: 'Файлы',
    documents: 'Документы',
    images: 'Изображения',
    audio: 'Аудио',
    video: 'Видео',
    files: 'Файлы',
    folders: 'Папки',
  };
  const fixedLabel = t(
    creationGroup && creationGroup !== 'text' ? groupLabels[creationGroup] : 'Текст',
  );
  const fixedIcon =
    creationGroup === 'images' ? (
      <ImageIcon size={18} />
    ) : creationGroup === 'audio' ? (
      <AudioIcon size={18} />
    ) : creationGroup === 'video' ? (
      <VideoIcon size={18} />
    ) : creationGroup === 'documents' ? (
      <TextDocumentIcon size={18} />
    ) : creationGroup === 'folders' ? (
      <FolderIcon size={18} />
    ) : creationGroup === 'files' ? (
      <BoxIcon size={18} />
    ) : null;
  const headerIcon = item ? null : mode === 'text' ? (
    <FileIcon size={18} />
  ) : (
    (fixedIcon ??
    (picked?.kind === 'image' ? (
      <ImageIcon size={18} />
    ) : picked?.kind === 'folder' ? (
      <FolderIcon size={18} />
    ) : picked?.kind === 'audio' ? (
      <AudioIcon size={18} />
    ) : picked?.kind === 'video' ? (
      <VideoIcon size={18} />
    ) : picked?.kind === 'document' ? (
      fileIcon({ content: picked.path, kind: picked.kind }, 18)
    ) : (
      <BoxIcon size={18} />
    )))
  );

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

  if (asking) {
    return (
      <ConfirmDialog
        title={t('Изменения не сохранены')}
        message={t('Сохранить изменения в блоке или закрыть без сохранения?')}
        confirmLabel={t('Сохранить')}
        cancelLabel={t('Закрыть без сохранения')}
        onConfirm={() => void save()}
        onCancel={onClose}
      />
    );
  }

  return (
    <Overlay onClose={requestClose} dismissOnBackdrop={false}>
      <div
        className="popup edit-dialog"
        role="dialog"
        aria-label={t(item ? 'Редактирование' : 'Новый блок')}
      >
        <div className="popup-head">
          <div className="popup-title edit-dialog-title">
            {headerIcon}
            {t(item ? 'Редактирование' : 'Новый блок')}
          </div>
          {!item && (
            <div className="creation-types">
              {creationGroup === null ? (
                <>
                  <button
                    type="button"
                    className={
                      mode === 'text' ? 'button settings-choice active' : 'button settings-choice'
                    }
                    aria-pressed={mode === 'text'}
                    onClick={() => setMode('text')}
                  >
                    {t('Текст')}
                  </button>
                  <button
                    type="button"
                    className={
                      mode === 'object' ? 'button settings-choice active' : 'button settings-choice'
                    }
                    aria-pressed={mode === 'object'}
                    onClick={() => setMode('object')}
                  >
                    {t('Объект')}
                  </button>
                </>
              ) : (
                <span className="button settings-choice active creation-type-fixed">
                  {fixedLabel}
                </span>
              )}
            </div>
          )}
          {!item && (
            <button
              type="button"
              className={starred ? 'item-card-action starred' : 'item-card-action'}
              aria-label={t(starred ? 'Убрать из избранного' : 'В избранное')}
              aria-pressed={starred}
              title={t('Избранное')}
              onClick={() => setStarred((value) => !value)}
            >
              <StarIcon size={17} filled={starred} />
            </button>
          )}
          <button
            className="item-card-action"
            aria-label={t('Закрыть')}
            title={t('Закрыть')}
            onClick={requestClose}
          >
            <CloseIcon size={15} />
          </button>
        </div>

        <label className="field">
          <span className="field-label">{t('Название')}</span>
          <input
            className="field-input"
            autoFocus={item !== null}
            value={title}
            disabled={!item && mode === 'object' && !picked}
            placeholder={t(
              item
                ? KIND_LABEL[item.type]
                : mode === 'object'
                  ? 'Название объекта'
                  : KIND_LABEL.text,
            )}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        {item || mode === 'text' ? (
          <label className="field field-grow">
            <span className="field-label">{contentLabel}</span>
            <textarea
              className="field-input field-textarea resize-none"
              autoFocus={item === null}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
        ) : (
          <div className="field field-grow">
            <span className="field-label">{t('Содержимое')}</span>
            <div className="object-picker">
              <button
                type="button"
                className={
                  picked &&
                  (creationGroup === 'folders'
                    ? picked.kind === 'folder'
                    : picked.kind !== 'folder')
                    ? 'button settings-choice active'
                    : 'button'
                }
                aria-pressed={Boolean(
                  picked &&
                  (creationGroup === 'folders'
                    ? picked.kind === 'folder'
                    : picked.kind !== 'folder'),
                )}
                onClick={() => void chooseObject(creationGroup === 'folders' ? 'folder' : 'file')}
              >
                {t(
                  'Выбрать ' +
                    (creationGroup === 'folders'
                      ? 'папку'
                      : creationGroup === 'audio'
                        ? 'аудио'
                        : creationGroup === 'video'
                          ? 'видео'
                          : creationGroup === 'images'
                            ? 'изображение'
                            : creationGroup === 'documents'
                              ? 'документ'
                              : 'объект'),
                )}
              </button>
              {(creationGroup === null || creationGroup === 'all') && (
                <button
                  type="button"
                  className={picked?.kind === 'folder' ? 'button settings-choice active' : 'button'}
                  aria-pressed={picked?.kind === 'folder'}
                  onClick={() => void chooseObject('folder')}
                >
                  {t('Выбрать папку')}
                </button>
              )}
            </div>
            {picked && (
              <input
                className="field-input object-path"
                aria-label={t('Путь к объекту')}
                readOnly
                value={picked.path}
                title={picked.path}
              />
            )}
          </div>
        )}

        <div className="field">
          <span className="field-label">{t('Категории')}</span>
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
                placeholder={t('Новая категория')}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addDraft();
                }}
              />
              <button
                type="button"
                className="item-card-action"
                aria-label={t('Добавить')}
                onClick={addDraft}
              >
                <PlusIcon size={14} />
              </button>
            </span>
          </div>
        </div>

        {saveError && (
          <div className="field-hint" role="alert">
            {saveError}
          </div>
        )}
        <div className="dialog-actions">
          <button type="button" className="button ghost" onClick={requestClose}>
            {t('Отмена')}
          </button>
          <button
            type="button"
            className="button primary"
            disabled={busy || (!item && (mode === 'text' ? !content.trim() : !picked))}
            onClick={() => void save()}
          >
            {t(item ? 'Сохранить' : 'Создать')}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
