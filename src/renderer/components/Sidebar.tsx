import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { NavKey } from '../store/useClipboardStore';
import {
  CheckIcon,
  ChevronDownIcon,
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
  navOrder: NavKey[];
  categories: string[];
  activeCategory: string | null;
  /** Opens the category selector on start, per the matching setting. */
  categoriesExpanded: boolean;
  reorderMode: boolean;
  onNavChange: (nav: NavKey) => void;
  onCategorySelect: (name: string) => void;
  onCategoryAdd: (name: string) => void;
  onSettingsOpen: () => void;
  onNavMove: (dragKey: NavKey, overKey: NavKey) => void;
  onCategoryMove: (dragName: string, overName: string) => void;
  onReorderDone: () => void;
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

  function dragOver(kind: 'nav' | 'category', id: string) {
    return (event: DragEvent<HTMLElement>) => {
      if (!reorderMode || dragged.current?.kind !== kind) return;
      event.preventDefault();
      if (kind === 'nav') onNavMove(dragged.current.id as NavKey, id as NavKey);
      else onCategoryMove(dragged.current.id, id);
    };
  }

  return (
    <div className={reorderMode ? 'sidebar reordering' : 'sidebar'}>
      <div className="sidebar-head">
        <span className="sidebar-title">CopyCat</span>
        {reorderMode ? (
          <button
            className="icon-button done"
            aria-label="Готово"
            title="Готово"
            onClick={onReorderDone}
          >
            <CheckIcon size={17} />
          </button>
        ) : (
          <button className="icon-button" aria-label="Настройки" onClick={onSettingsOpen}>
            <SettingsIcon size={17} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navOrder.map((key) => (
          <button
            key={key}
            className={[
              nav === key && !activeCategory ? 'nav-item active' : 'nav-item',
              reorderMode ? 'jiggle' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            draggable={reorderMode}
            onDragStart={() => {
              dragged.current = { kind: 'nav', id: key };
            }}
            onDragOver={dragOver('nav', key)}
            onDragEnd={() => {
              dragged.current = null;
            }}
            onClick={() => !reorderMode && onNavChange(key)}
          >
            {NAV_ITEMS[key].icon}
            <span>{NAV_ITEMS[key].label}</span>
          </button>
        ))}

        {/* A row, not one button: the "+" sits inside it and must stay its own
            control, and HTML forbids nesting a button in a button. */}
        <div className="nav-item nav-row">
          <button
            className="nav-row-main"
            aria-expanded={categoriesOpen}
            onClick={() => setCategoriesOpen((open) => !open)}
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
            onClick={() => setCategoriesOpen((open) => !open)}
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
                onDragOver={dragOver('category', name)}
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
      </nav>
    </div>
  );
}
