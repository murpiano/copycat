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
}

export function Sidebar({
  nav,
  categories,
  activeCategory,
  onNavChange,
  onCategorySelect,
  onCategoryAdd,
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
        <button className="icon-button" aria-label="Настройки">
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

        <button
          className="nav-item"
          aria-expanded={categoriesOpen}
          onClick={() => setCategoriesOpen((open) => !open)}
        >
          <TagIcon />
          <span>Категории</span>
          <span className={categoriesOpen ? 'nav-chevron open' : 'nav-chevron'}>
            <ChevronDownIcon size={14} />
          </span>
        </button>

        {categoriesOpen && (
          <div className="category-list">
            {categories.map((name) => (
              <button
                key={name}
                className={activeCategory === name ? 'category-item active' : 'category-item'}
                onClick={() => onCategorySelect(name)}
              >
                <span>{name}</span>
              </button>
            ))}

            {draft === null ? (
              <button className="category-add" onClick={() => setDraft('')}>
                <PlusIcon size={13} />
                Добавить категорию
              </button>
            ) : (
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
          </div>
        )}
      </nav>
    </div>
  );
}
