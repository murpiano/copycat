import { useEffect, useRef, useState, type DragEvent } from 'react';
import appIcon from '../assets/icon.svg';
import type { NavKey, SidebarEntry } from '../store/useClipboardStore';
import type { FileGroup } from '../../shared/file-kind';
import {
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
  files: { label: 'Файлы', icon: <FileIcon /> },
};
const FILE_GROUPS: Array<[FileGroup, string]> = [['documents', 'Документы'], ['images', 'Изображения'], ['audio', 'Аудио'], ['files', 'Файлы'], ['folders', 'Папки']];

interface SidebarProps {
  nav: NavKey;
  navOrder: SidebarEntry[];
  hiddenNavEntries?: SidebarEntry[];
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
  onSettingsOpen: () => void;
  onNavMove: (dragKey: SidebarEntry, overKey: SidebarEntry) => void;
  onNavVisibilityToggle?: (key: SidebarEntry) => void;
  onCategoryMove: (dragName: string, overName: string) => void;
  onReorderDone: () => void;
  onReorderCancel: () => void;
}

export function Sidebar({
  nav,
  navOrder,
  hiddenNavEntries = [],
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
  onSettingsOpen,
  onNavMove,
  onNavVisibilityToggle = () => {},
  onCategoryMove,
  onReorderDone,
  onReorderCancel,
}: SidebarProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(categoriesExpanded);
  const [filesOpen, setFilesOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const dragged = useRef<{ kind: 'nav' | 'category'; id: string } | null>(null);

  useEffect(() => {
    setCategoriesOpen(categoriesExpanded);
  }, [categoriesExpanded]);

  useEffect(() => {
    setFilesOpen(filesExpanded);
  }, [filesExpanded]);

  useEffect(() => {
    // Categories can only be rearranged while they are on screen.
    if (reorderMode) setCategoriesOpen(true);
  }, [reorderMode]);

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
    if (key === 'files') return <div key="files">
      <div className={nav === key && !activeCategory ? 'nav-item nav-row active' : 'nav-item nav-row'} {...navDragProps(key)}>
        <button className="nav-row-main" onClick={() => !reorderMode && onNavChange(key)}><FileIcon /><span>Файлы</span></button>
        {reorderMode && <button className="nav-visibility" aria-label={hiddenNavEntries.includes(key) ? 'Показать Файлы' : 'Скрыть Файлы'} onClick={() => onNavVisibilityToggle(key)}><EyeIcon closed={hiddenNavEntries.includes(key)} size={15} /></button>}
        <button className={filesOpen ? 'nav-chevron open' : 'nav-chevron'} aria-label="Группы файлов" onClick={() => !reorderMode && setFilesOpen((value) => !value)}><ChevronDownIcon size={14} /></button>
      </div>
      {filesOpen && <div className="category-list"><button className={activeFileGroup === null ? 'category-item active' : 'category-item'} onClick={() => onFileGroupSelect(null)}>Все файлы</button>{FILE_GROUPS.map(([group, label]) => <button key={group} className={activeFileGroup === group ? 'category-item active' : 'category-item'} onClick={() => onFileGroupSelect(group)}>{label}</button>)}</div>}
    </div>;
    return (
      <div
        key={key}
        className={[
          nav === key && !activeCategory ? 'nav-item active' : 'nav-item',
          reorderMode ? 'jiggle' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...navDragProps(key)}
      >
        <button className="nav-row-main" onClick={() => !reorderMode && onNavChange(key)}>{NAV_ITEMS[key].icon}<span>{NAV_ITEMS[key].label}</span></button>
        {reorderMode && <button className="nav-visibility" aria-label={hiddenNavEntries.includes(key) ? `Показать ${NAV_ITEMS[key].label}` : `Скрыть ${NAV_ITEMS[key].label}`} onClick={() => onNavVisibilityToggle(key)}><EyeIcon closed={hiddenNavEntries.includes(key)} size={15} /></button>}
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
          className={reorderMode ? 'nav-item nav-row jiggle' : 'nav-item nav-row'}
          {...navDragProps('categories')}
        >
          <button
            className="nav-row-main"
            aria-expanded={categoriesOpen}
            onClick={() => !reorderMode && setCategoriesOpen((open) => !open)}
          >
            <TagIcon />
            <span>Категории</span>
          </button>
          {reorderMode && <button className="nav-visibility" aria-label={hiddenNavEntries.includes('categories') ? 'Показать Категории' : 'Скрыть Категории'} onClick={() => onNavVisibilityToggle('categories')}><EyeIcon closed={hiddenNavEntries.includes('categories')} size={15} /></button>}
          {categoriesOpen && !reorderMode && (
            <button
              className="nav-row-add"
              aria-label="Добавить категорию"
              title="Добавить категорию"
              onClick={() => setDraft('')}
            >
              <PlusIcon size={14} />
            </button>
          )}
          <button
            className={categoriesOpen ? 'nav-chevron open' : 'nav-chevron'}
            aria-label={categoriesOpen ? 'Свернуть категории' : 'Развернуть категории'}
            onClick={() => !reorderMode && setCategoriesOpen((open) => !open)}
          >
            <ChevronDownIcon size={14} />
          </button>
        </div>

        {categoriesOpen && (
          <div className="category-list">
            {draft !== null && (
              <input
                className="category-input"
                autoFocus
                value={draft}
                placeholder="Название категории"
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraft}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitDraft();
                  if (e.key === 'Escape') setDraft(null);
                }}
              />
            )}

            {categories.map((name) => (
              <button
                key={name}
                className={[
                  activeCategory === name ? 'category-item active' : 'category-item',
                  reorderMode ? 'jiggle' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
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
                <span>{name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={reorderMode ? 'sidebar reordering' : 'sidebar'}>
      <div className="sidebar-head">
        <div className="sidebar-title-group">
          <img className="sidebar-logo" src={appIcon} alt="" />
          <span className="sidebar-title">CopyCat</span>
        </div>
        {reorderMode ? (
          <div className="sidebar-head-actions">
            <button
              className="icon-button"
              aria-label="Отмена"
              title="Отмена"
              onClick={onReorderCancel}
            >
              <CloseIcon size={16} />
            </button>
            <button
              className="icon-button done"
              aria-label="Готово"
              title="Готово"
              onClick={onReorderDone}
            >
              <CheckIcon size={17} />
            </button>
          </div>
        ) : (
          <button className="icon-button" aria-label="Настройки" onClick={onSettingsOpen}>
            <SettingsIcon size={17} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navOrder.filter((key) => reorderMode || !hiddenNavEntries.includes(key)).map((key) => (key === 'categories' ? renderCategories() : renderNavItem(key)))}
      </nav>
    </div>
  );
}
