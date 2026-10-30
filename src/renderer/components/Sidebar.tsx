import { useEffect, useRef, useState, type DragEvent } from 'react';
import appIcon from '../assets/icon.png';
import type { NavKey, SidebarEntry } from '../store/useClipboardStore';
import {
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  FileIcon,
  FolderIcon,
  ImageIcon,
  PlusIcon,
  SettingsIcon,
  StarIcon,
  TagIcon,
} from './icons';

const NAV_ITEMS: Record<NavKey, { label: string; icon: JSX.Element }> = {
  history: { label: 'Все', icon: <FolderIcon /> },
  starred: { label: 'Избранное', icon: <StarIcon /> },
  images: { label: 'Изображения', icon: <ImageIcon /> },
  files: { label: 'Файлы', icon: <FileIcon /> },
};

interface SidebarProps {
  nav: NavKey;
  navOrder: SidebarEntry[];
  categories: string[];
  activeCategory: string | null;
  /** Opens the category selector on start, per the matching setting. */
  categoriesExpanded: boolean;
  reorderMode: boolean;
  onNavChange: (nav: NavKey) => void;
  onCategorySelect: (name: string) => void;
  onCategoryAdd: (name: string) => void;
  onSettingsOpen: () => void;
  onNavMove: (dragKey: SidebarEntry, overKey: SidebarEntry) => void;
  onCategoryMove: (dragName: string, overName: string) => void;
  onReorderDone: () => void;
  onReorderCancel: () => void;
}

export function Sidebar({
  nav,
  navOrder,
  categories,
  activeCategory,
  categoriesExpanded,
  reorderMode,
  onNavChange,
  onCategorySelect,
  onCategoryAdd,
  onSettingsOpen,
  onNavMove,
  onCategoryMove,
  onReorderDone,
  onReorderCancel,
}: SidebarProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(categoriesExpanded);
  const [draft, setDraft] = useState<string | null>(null);
  const dragged = useRef<{ kind: 'nav' | 'category'; id: string } | null>(null);

  useEffect(() => {
    setCategoriesOpen(categoriesExpanded);
  }, [categoriesExpanded]);

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
    return (
      <button
        key={key}
        className={[
          nav === key && !activeCategory ? 'nav-item active' : 'nav-item',
          reorderMode ? 'jiggle' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => !reorderMode && onNavChange(key)}
        {...navDragProps(key)}
      >
        {NAV_ITEMS[key].icon}
        <span>{NAV_ITEMS[key].label}</span>
      </button>
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
        {navOrder.map((key) => (key === 'categories' ? renderCategories() : renderNavItem(key)))}
      </nav>
    </div>
  );
}
