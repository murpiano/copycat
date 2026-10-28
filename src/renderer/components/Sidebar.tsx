import { useState } from 'react';
import type { NavKey } from '../store/useClipboardStore';
import {
  ChevronDownIcon,
  FileIcon,
  FolderIcon,
  ImageIcon,
  PlusIcon,
  SettingsIcon,
  StarIcon,
  TagIcon,
} from './icons';

const NAV_ITEMS: { key: NavKey; label: string; icon: JSX.Element }[] = [
  { key: 'history', label: 'Все', icon: <FolderIcon /> },
  { key: 'starred', label: 'Избранное', icon: <StarIcon /> },
  { key: 'images', label: 'Изображения', icon: <ImageIcon /> },
  { key: 'files', label: 'Файлы', icon: <FileIcon /> },
];

interface SidebarProps {
  nav: NavKey;
  categories: string[];
  activeCategory: string | null;
  onNavChange: (nav: NavKey) => void;
  onCategorySelect: (name: string) => void;
  onCategoryAdd: (name: string) => void;
  onSettingsOpen: () => void;
}

export function Sidebar({
  nav,
  categories,
  activeCategory,
  onNavChange,
  onCategorySelect,
  onCategoryAdd,
  onSettingsOpen,
}: SidebarProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  function commitDraft() {
    if (draft !== null && draft.trim()) onCategoryAdd(draft);
    setDraft(null);
  }

  return (
    <div className="sidebar">
      <div className="sidebar-head">
        <span className="sidebar-title">CopyCat</span>
        <button className="icon-button" aria-label="Настройки" onClick={onSettingsOpen}>
          <SettingsIcon size={17} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={nav === item.key && !activeCategory ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavChange(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
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
          {categoriesOpen && (
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
                className={activeCategory === name ? 'category-item active' : 'category-item'}
                onClick={() => onCategorySelect(name)}
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
