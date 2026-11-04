import { useEffect, useRef, useState, type DragEvent } from 'react';
import appIcon from '../assets/icon.svg';
import type { NavKey, SidebarEntry } from '../store/useClipboardStore';
import { DEFAULT_FILE_SECTION_ORDER, type FileGroup, type FileSection } from '../../shared/file-kind';
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
const FILE_LABELS: Record<FileSection, string> = { all: 'Все файлы', ...Object.fromEntries(FILE_GROUPS) } as Record<FileSection, string>;

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
  const [categoriesOpen, setCategoriesOpen] = useState(categoriesExpanded);
  const [filesOpen, setFilesOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const dragged = useRef<{ kind: 'nav' | 'category' | 'file'; id: string } | null>(null);

  useEffect(() => {
    setCategoriesOpen(categoriesExpanded);
  }, [categoriesExpanded]);

  useEffect(() => {
    setFilesOpen(filesExpanded);
  }, [filesExpanded]);

  useEffect(() => {
    // Categories can only be rearranged while they are on screen.
    if (reorderMode) {
      setCategoriesOpen(true);
      setFilesOpen(true);
    }
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
      <div className={[nav === key && !activeCategory && !reorderMode ? 'nav-item nav-row active' : 'nav-item nav-row', reorderMode ? 'jiggle' : '', hiddenNavEntries.includes(key) ? 'nav-hidden' : ''].join(' ')} {...navDragProps(key)} onClick={() => { if (!reorderMode) { setFilesOpen((value) => !value); onNavChange(key); } }}>
        <button className="nav-row-main" aria-expanded={filesOpen} onClick={(event) => { event.stopPropagation(); if (!reorderMode) { setFilesOpen((value) => !value); onNavChange(key); } }}><FileIcon /><span>Файлы</span></button>
        {reorderMode && <button className="nav-visibility" aria-label={hiddenNavEntries.includes(key) ? 'Показать Файлы' : 'Скрыть Файлы'} onClick={(event) => { event.stopPropagation(); onNavVisibilityToggle(key); }}><EyeIcon closed={hiddenNavEntries.includes(key)} size={15} /></button>}
        <button className={filesOpen ? 'nav-chevron open' : 'nav-chevron'} aria-label="Группы файлов" onClick={(event) => { event.stopPropagation(); if (!reorderMode) { setFilesOpen((value) => !value); onNavChange(key); } }}><ChevronDownIcon size={14} /></button>
      </div>
      {filesOpen && <div className="category-list">{fileSectionOrder.filter((section) => reorderMode || !hiddenFileSections.includes(section)).map((section) => <div key={section} className={['category-item', nav === 'files' && !activeCategory && !reorderMode && activeFileGroup === (section === 'all' ? null : section) ? 'active' : '', reorderMode ? 'jiggle' : '', hiddenFileSections.includes(section) ? 'nav-hidden' : ''].join(' ')} draggable={reorderMode} onDragStart={() => { dragged.current = { kind: 'file', id: section }; }} onDragOver={(event) => { if (reorderMode && dragged.current?.kind === 'file') { event.preventDefault(); onFileSectionMove(dragged.current.id as FileSection, section); } }} onDragEnd={() => { dragged.current = null; }} onClick={() => { if (!reorderMode) onFileGroupSelect(section === 'all' ? null : section); }}><button className="category-item-main" onClick={(event) => { event.stopPropagation(); if (!reorderMode) onFileGroupSelect(section === 'all' ? null : section); }}>{FILE_LABELS[section]}</button>{reorderMode && <button className="nav-visibility" aria-label={`${hiddenFileSections.includes(section) ? 'Показать' : 'Скрыть'} ${FILE_LABELS[section]}`} onClick={(event) => { event.stopPropagation(); onFileSectionVisibilityToggle(section); }}><EyeIcon closed={hiddenFileSections.includes(section)} size={15} /></button>}</div>)}</div>}
    </div>;
    return (
      <div
        key={key}
        className={[
          nav === key && !activeCategory && !reorderMode ? 'nav-item active' : 'nav-item',
          reorderMode ? 'jiggle' : '',
          hiddenNavEntries.includes(key) ? 'nav-hidden' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...navDragProps(key)}
        onClick={() => !reorderMode && onNavChange(key)}
      >
        <button className="nav-row-main" onClick={(event) => { event.stopPropagation(); if (!reorderMode) onNavChange(key); }}>{NAV_ITEMS[key].icon}<span>{NAV_ITEMS[key].label}</span></button>
        {reorderMode && <button className="nav-visibility" aria-label={hiddenNavEntries.includes(key) ? `Показать ${NAV_ITEMS[key].label}` : `Скрыть ${NAV_ITEMS[key].label}`} onClick={(event) => { event.stopPropagation(); onNavVisibilityToggle(key); }}><EyeIcon closed={hiddenNavEntries.includes(key)} size={15} /></button>}
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
          className={['nav-item nav-row', reorderMode ? 'jiggle' : '', hiddenNavEntries.includes('categories') ? 'nav-hidden' : ''].join(' ')}
          {...navDragProps('categories')}
          onClick={() => !reorderMode && setCategoriesOpen((open) => !open)}
        >
          <button
            className="nav-row-main"
            aria-expanded={categoriesOpen}
            onClick={(event) => { event.stopPropagation(); if (!reorderMode) setCategoriesOpen((open) => !open); }}
          >
            <TagIcon />
            <span>Категории</span>
          </button>
          {reorderMode && <button className="nav-visibility" aria-label={hiddenNavEntries.includes('categories') ? 'Показать Категории' : 'Скрыть Категории'} onClick={(event) => { event.stopPropagation(); onNavVisibilityToggle('categories'); }}><EyeIcon closed={hiddenNavEntries.includes('categories')} size={15} /></button>}
          {categoriesOpen && !reorderMode && (
            <button
              className="nav-row-add"
              aria-label="Добавить категорию"
              title="Добавить категорию"
              onClick={(event) => { event.stopPropagation(); setDraft(''); }}
            >
              <PlusIcon size={14} />
            </button>
          )}
          <button
            className={categoriesOpen ? 'nav-chevron open' : 'nav-chevron'}
            aria-label={categoriesOpen ? 'Свернуть категории' : 'Развернуть категории'}
            onClick={(event) => { event.stopPropagation(); if (!reorderMode) setCategoriesOpen((open) => !open); }}
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

            {categories.filter((name) => reorderMode || !hiddenCategories.includes(name)).map((name) => (
              <div
                key={name}
                className={[
                  activeCategory === name && !reorderMode ? 'category-item active' : 'category-item',
                  reorderMode ? 'jiggle' : '',
                  hiddenCategories.includes(name) ? 'nav-hidden' : '',
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
                <button className="category-item-main" onClick={(event) => { event.stopPropagation(); if (!reorderMode) onCategorySelect(name); }}><span>{name}</span></button>
                {reorderMode && <button className="nav-visibility" aria-label={`${hiddenCategories.includes(name) ? 'Показать' : 'Скрыть'} ${name}`} onClick={(event) => { event.stopPropagation(); onCategoryVisibilityToggle(name); }}><EyeIcon closed={hiddenCategories.includes(name)} size={15} /></button>}
              </div>
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
