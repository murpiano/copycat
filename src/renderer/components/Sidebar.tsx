import { useEffect, useRef, useState, type DragEvent, type JSX } from 'react';
import { clsx } from 'clsx';
import appIcon from '../../../resources/small/app-logo.png';
import { ConfirmDialog } from './ConfirmDialog';
import { useT } from '../i18n';
import styles from './Sidebar.module.css';
import type { NavKey, SidebarEntry } from '../store/useClipboardStore';
import {
  DEFAULT_FILE_SECTION_ORDER,
  type FileGroup,
  type FileSection,
} from '../../shared/file-kind';
import {
  BoxIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  FileIcon,
  FolderIcon,
  ImageIcon,
  EyeIcon,
  PlusIcon,
  SettingsIcon,
  StarIcon,
  TagIcon,
} from './icons';

const NAV_ITEMS: Record<NavKey, { label: string; icon: JSX.Element }> = {
  history: { label: 'Все', icon: <FolderIcon /> },
  starred: { label: 'Избранное', icon: <StarIcon /> },
  text: { label: 'Текст', icon: <FileIcon /> },
  images: { label: 'Изображения', icon: <ImageIcon /> },
  files: { label: 'Файлы', icon: <BoxIcon /> },
};
const FILE_GROUPS: Array<[FileGroup, string]> = [
  ['documents', 'Документы'],
  ['images', 'Изображения'],
  ['audio', 'Аудио'],
  ['video', 'Видео'],
  ['files', 'Файлы'],
  ['folders', 'Папки'],
];
const FILE_LABELS: Record<FileSection, string> = {
  all: 'Все файлы',
  ...Object.fromEntries(FILE_GROUPS),
} as Record<FileSection, string>;

interface SidebarProps {
  nav: NavKey;
  navOrder: SidebarEntry[];
  hiddenNavEntries?: SidebarEntry[];
  fileSectionOrder?: FileSection[];
  hiddenFileSections?: FileSection[];
  hiddenCategories?: string[];
  categories: string[];
  activeCategory: string | null;
  activeFileGroup?: FileGroup | null;
  /** Opens the category selector on start, per the matching setting. */
  categoriesExpanded: boolean;
  filesExpanded?: boolean;
  reorderMode: boolean;
  onNavChange: (nav: NavKey) => void;
  onCategorySelect: (name: string) => void;
  onFileGroupSelect?: (group: FileGroup | null) => void;
  onCategoryAdd: (name: string) => void;
  onCategoryDelete?: (name: string) => Promise<void>;
  onSettingsOpen: () => void;
  onNavMove: (dragKey: SidebarEntry, overKey: SidebarEntry) => void;
  onNavVisibilityToggle?: (key: SidebarEntry) => void;
  onFileSectionVisibilityToggle?: (key: FileSection) => void;
  onCategoryVisibilityToggle?: (name: string) => void;
  onFileSectionMove?: (dragKey: FileSection, overKey: FileSection) => void;
  onCategoryMove: (dragName: string, overName: string) => void;
  onReorderDone: () => void;
  onReorderCancel: () => void;
}

export function Sidebar({
  nav,
  navOrder,
  hiddenNavEntries = [],
  fileSectionOrder = DEFAULT_FILE_SECTION_ORDER,
  hiddenFileSections = [],
  hiddenCategories = [],
  categories,
  activeCategory,
  activeFileGroup = null,
  categoriesExpanded,
  filesExpanded = false,
  reorderMode,
  onNavChange,
  onCategorySelect,
  onFileGroupSelect = () => {},
  onCategoryAdd,
  onCategoryDelete = async () => {},
  onSettingsOpen,
  onNavMove,
  onNavVisibilityToggle = () => {},
  onFileSectionVisibilityToggle = () => {},
  onCategoryVisibilityToggle = () => {},
  onFileSectionMove = () => {},
  onCategoryMove,
  onReorderDone,
  onReorderCancel,
}: SidebarProps) {
  const t = useT();
  const [categoriesOpen, setCategoriesOpen] = useState(reorderMode || categoriesExpanded);
  const [filesOpen, setFilesOpen] = useState(reorderMode || filesExpanded);
  const [draft, setDraft] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dragged = useRef<{ kind: 'nav' | 'category' | 'file'; id: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: syncs local open state when external props change (reorderMode forces expand)
    setCategoriesOpen(reorderMode || categoriesExpanded);
    setFilesOpen(reorderMode || filesExpanded);
  }, [categoriesExpanded, filesExpanded, reorderMode]);

  useEffect(() => {
    const restoreExpansion = () => {
      setCategoriesOpen(reorderMode || categoriesExpanded);
      setFilesOpen(reorderMode || filesExpanded);
    };
    return window.copycat?.onWindowShown?.(restoreExpansion);
  }, [categoriesExpanded, filesExpanded, reorderMode]);

  function commitDraft() {
    if (draft !== null && draft.trim()) onCategoryAdd(draft);
    setDraft(null);
  }

  function navDragProps(key: SidebarEntry) {
    return {
      draggable: reorderMode,
      onDragStart: () => {
        dragged.current = { kind: 'nav', id: key };
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!reorderMode || dragged.current?.kind !== 'nav') return;
        event.preventDefault();
        onNavMove(dragged.current.id as SidebarEntry, key);
      },
      onDragEnd: () => {
        dragged.current = null;
      },
    };
  }

  function categoryDragOver(name: string) {
    return (event: DragEvent<HTMLElement>) => {
      if (!reorderMode || dragged.current?.kind !== 'category') return;
      event.preventDefault();
      onCategoryMove(dragged.current.id, name);
    };
  }

  function renderNavItem(key: NavKey) {
    if (key === 'files')
      return (
        <div key="files">
          <div
            className={clsx(
              styles.navItem,
              styles.navRow,
              reorderMode && styles.jiggle,
              hiddenNavEntries.includes(key) && styles.navHidden,
            )}
            {...navDragProps(key)}
            onClick={() => {
              if (!reorderMode) setFilesOpen((value) => !value);
            }}
          >
            <button
              className={styles.navRowMain}
              aria-expanded={filesOpen}
              onClick={(event) => {
                event.stopPropagation();
                if (!reorderMode) setFilesOpen((value) => !value);
              }}
            >
              <BoxIcon />
              <span>{t('Файлы')}</span>
            </button>
            {reorderMode && (
              <button
                className={styles.navVisibility}
                aria-label={t(hiddenNavEntries.includes(key) ? 'Показать Файлы' : 'Скрыть Файлы')}
                onClick={(event) => {
                  event.stopPropagation();
                  onNavVisibilityToggle(key);
                }}
              >
                <EyeIcon closed={hiddenNavEntries.includes(key)} size={15} />
              </button>
            )}
            <button
              className={clsx(styles.navChevron, filesOpen && styles.open)}
              aria-label={t('Группы файлов')}
              onClick={(event) => {
                event.stopPropagation();
                if (!reorderMode) setFilesOpen((value) => !value);
              }}
            >
              <ChevronDownIcon size={14} />
            </button>
          </div>
          {filesOpen && (
            <div className={styles.categoryList}>
              {fileSectionOrder
                .filter((section) => reorderMode || !hiddenFileSections.includes(section))
                .map((section) => (
                  <div
                    key={section}
                    className={clsx(
                      styles.categoryItem,
                      nav === 'files' &&
                        !activeCategory &&
                        !reorderMode &&
                        activeFileGroup === (section === 'all' ? null : section) &&
                        styles.active,
                      reorderMode && styles.jiggle,
                      hiddenFileSections.includes(section) && styles.navHidden,
                    )}
                    draggable={reorderMode}
                    onDragStart={() => {
                      dragged.current = { kind: 'file', id: section };
                    }}
                    onDragOver={(event) => {
                      if (reorderMode && dragged.current?.kind === 'file') {
                        event.preventDefault();
                        onFileSectionMove(dragged.current.id as FileSection, section);
                      }
                    }}
                    onDragEnd={() => {
                      dragged.current = null;
                    }}
                    onClick={() => {
                      if (!reorderMode) onFileGroupSelect(section === 'all' ? null : section);
                    }}
                  >
                    <button
                      className={styles.categoryItemMain}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!reorderMode) onFileGroupSelect(section === 'all' ? null : section);
                      }}
                    >
                      {t(FILE_LABELS[section])}
                    </button>
                    {reorderMode && (
                      <button
                        className={styles.navVisibility}
                        aria-label={`${t(hiddenFileSections.includes(section) ? 'Показать' : 'Скрыть')} ${t(FILE_LABELS[section])}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onFileSectionVisibilityToggle(section);
                        }}
                      >
                        <EyeIcon closed={hiddenFileSections.includes(section)} size={15} />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      );
    return (
      <div
        key={key}
        className={clsx(
          styles.navItem,
          nav === key && !activeCategory && !reorderMode && styles.active,
          reorderMode && styles.jiggle,
          hiddenNavEntries.includes(key) && styles.navHidden,
        )}
        {...navDragProps(key)}
        onClick={() => !reorderMode && onNavChange(key)}
      >
        <button
          className={styles.navRowMain}
          onClick={(event) => {
            event.stopPropagation();
            if (!reorderMode) onNavChange(key);
          }}
        >
          {NAV_ITEMS[key].icon}
          <span>{t(NAV_ITEMS[key].label)}</span>
        </button>
        {reorderMode && (
          <button
            className={styles.navVisibility}
            aria-label={`${t(hiddenNavEntries.includes(key) ? 'Показать' : 'Скрыть')} ${t(NAV_ITEMS[key].label)}`}
            onClick={(event) => {
              event.stopPropagation();
              onNavVisibilityToggle(key);
            }}
          >
            <EyeIcon closed={hiddenNavEntries.includes(key)} size={15} />
          </button>
        )}
      </div>
    );
  }

  function renderCategories() {
    return (
      <div key="categories">
        {/* A row, not one button: the "+" sits inside it and must stay its own
            control, and HTML forbids nesting a button in a button. The row
            itself is the drag handle for this whole entry, so it jiggles
            like any other nav-item while sections are being arranged. */}
        <div
          className={clsx(
            styles.navItem,
            styles.navRow,
            reorderMode && styles.jiggle,
            hiddenNavEntries.includes('categories') && styles.navHidden,
          )}
          {...navDragProps('categories')}
          onClick={() => !reorderMode && setCategoriesOpen((open) => !open)}
        >
          <button
            className={styles.navRowMain}
            aria-expanded={categoriesOpen}
            onClick={(event) => {
              event.stopPropagation();
              if (!reorderMode) setCategoriesOpen((open) => !open);
            }}
          >
            <TagIcon />
            <span>{t('Категории')}</span>
          </button>
          {reorderMode && (
            <button
              className={styles.navVisibility}
              aria-label={t(
                hiddenNavEntries.includes('categories') ? 'Показать Категории' : 'Скрыть Категории',
              )}
              onClick={(event) => {
                event.stopPropagation();
                onNavVisibilityToggle('categories');
              }}
            >
              <EyeIcon closed={hiddenNavEntries.includes('categories')} size={15} />
            </button>
          )}
          {categoriesOpen && !reorderMode && (
            <button
              className={styles.navRowAdd}
              aria-label={t('Добавить категорию')}
              title={t('Добавить категорию')}
              onClick={(event) => {
                event.stopPropagation();
                setDraft('');
              }}
            >
              <PlusIcon size={14} />
            </button>
          )}
          <button
            className={clsx(styles.navChevron, categoriesOpen && styles.open)}
            aria-label={t(categoriesOpen ? 'Свернуть категории' : 'Развернуть категории')}
            onClick={(event) => {
              event.stopPropagation();
              if (!reorderMode) setCategoriesOpen((open) => !open);
            }}
          >
            <ChevronDownIcon size={14} />
          </button>
        </div>

        {categoriesOpen && (
          <div className={styles.categoryList}>
            {draft !== null && (
              <input
                className={styles.categoryInput}
                autoFocus
                value={draft}
                placeholder={t('Название категории')}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraft}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitDraft();
                  if (e.key === 'Escape') setDraft(null);
                }}
              />
            )}

            {categories
              .filter((name) => reorderMode || !hiddenCategories.includes(name))
              .map((name) => (
                <div
                  key={name}
                  className={clsx(
                    styles.categoryItem,
                    activeCategory === name && !reorderMode && styles.active,
                    reorderMode && styles.jiggle,
                    hiddenCategories.includes(name) && styles.navHidden,
                  )}
                  draggable={reorderMode}
                  onDragStart={() => {
                    dragged.current = { kind: 'category', id: name };
                  }}
                  onDragOver={categoryDragOver(name)}
                  onDragEnd={() => {
                    dragged.current = null;
                  }}
                  onClick={() => !reorderMode && onCategorySelect(name)}
                >
                  <button
                    className={styles.categoryItemMain}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!reorderMode) onCategorySelect(name);
                    }}
                  >
                    <span>{name}</span>
                  </button>
                  {reorderMode && (
                    <button
                      className={styles.navVisibility}
                      aria-label={`${t(hiddenCategories.includes(name) ? 'Показать' : 'Скрыть')} ${name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onCategoryVisibilityToggle(name);
                      }}
                    >
                      <EyeIcon closed={hiddenCategories.includes(name)} size={15} />
                    </button>
                  )}
                  {reorderMode && (
                    <button
                      className={clsx(styles.navVisibility, styles.categoryDelete)}
                      aria-label={`${t('Удалить категорию')} ${name}`}
                      title={t('Удалить категорию')}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(name);
                      }}
                    >
                      <CloseIcon size={15} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx(styles.sidebar, reorderMode && styles.reordering)}>
      <div className={styles.sidebarHead}>
        <div className={styles.sidebarTitleGroup}>
          <span className={styles.sidebarLogoBadge}>
            <img className={styles.sidebarLogo} src={appIcon} alt="" />
          </span>
          <span className={styles.sidebarTitle}>CopyCat</span>
        </div>
        {reorderMode ? (
          <div className={styles.sidebarHeadActions}>
            <button
              className={styles.iconButton}
              aria-label={t('Отмена')}
              title={t('Отмена')}
              onClick={onReorderCancel}
            >
              <CloseIcon size={16} />
            </button>
            <button
              className={clsx(styles.iconButton, styles.done)}
              aria-label={t('Готово')}
              title={t('Готово')}
              onClick={onReorderDone}
            >
              <CheckIcon size={17} />
            </button>
          </div>
        ) : (
          <button
            className={styles.iconButton}
            aria-label={t('Настройки')}
            onClick={onSettingsOpen}
          >
            <SettingsIcon size={17} />
          </button>
        )}
      </div>

      <nav className={styles.sidebarNav}>
        {navOrder
          .filter((key) => reorderMode || !hiddenNavEntries.includes(key))
          .map((key) => (key === 'categories' ? renderCategories() : renderNavItem(key)))}
      </nav>
      {deleteTarget && (
        <ConfirmDialog
          title={t('Удалить категорию')}
          message={
            t('Удалить категорию') +
            ` «${deleteTarget}»? ` +
            t('Блоки останутся в истории, но отметка категории будет удалена.')
          }
          confirmLabel={t('Удалить')}
          cancelLabel={t('Отмена')}
          danger
          busy={deleting}
          error={deleteError ? t('Не удалось удалить категорию.') : null}
          onConfirm={() => {
            if (deleting) return;
            setDeleting(true);
            void onCategoryDelete(deleteTarget)
              .then(() => {
                setDeleteTarget(null);
                setDeleteError(false);
              })
              .catch(() => setDeleteError(true))
              .finally(() => setDeleting(false));
          }}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(false);
          }}
        />
      )}
    </div>
  );
}
