import { useEffect } from 'react';
import { useClipboardStore } from './store/useClipboardStore';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { ItemGrid } from './components/ItemGrid';
import { ItemPopup } from './components/ItemPopup';
import { ItemEditDialog } from './components/ItemEditDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { useSelectionDismiss } from './useSelectionDismiss';

export function App() {
  const {
    items,
    search,
    nav,
    categories,
    activeCategory,
    expandedId,
    editingId,
    composing,
    settingsOpen,
    settings,
    reorderMode,
    isOrderedView,
    setSearch,
    setNav,
    addCategory,
    selectCategory,
    expandItem,
    editItem,
    composeItem,
    createItem,
    openSettings,
    setHotkey,
    toggleReorderMode,
    moveItem,
    persistOrder,
    fetchItems,
    copyItem,
    toggleStar,
    setTags,
    updateItem,
    deleteItem,
    subscribeToNewItems,
  } = useClipboardStore();

  useSelectionDismiss();

  useEffect(() => {
    void fetchItems();
    return subscribeToNewItems();
  }, []);

  const expanded = items.find((item) => item.id === expandedId) ?? null;
  const editing = items.find((item) => item.id === editingId) ?? null;

  async function saveEdits(
    id: number,
    title: string | null,
    content: string,
    tags: string[],
  ): Promise<void> {
    await updateItem(id, { title, content });
    await setTags(id, tags);
    editItem(null);
  }

  return (
    <div className="app">
      <Sidebar
        nav={nav}
        categories={categories}
        activeCategory={activeCategory}
        onNavChange={setNav}
        onCategorySelect={selectCategory}
        onCategoryAdd={addCategory}
        onSettingsOpen={() => openSettings(true)}
      />
      <div className="main">
        <div className="topbar">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <ItemGrid
          items={items}
          reorderMode={reorderMode}
          canReorder={isOrderedView()}
          onToggleReorder={toggleReorderMode}
          onCompose={() => composeItem(true)}
          onCopy={copyItem}
          onToggleStar={toggleStar}
          onDelete={deleteItem}
          onExpand={expandItem}
          onEdit={editItem}
          onMove={moveItem}
          onOrderCommit={() => void persistOrder()}
        />
      </div>

      {expanded && (
        <ItemPopup
          item={expanded}
          onClose={() => expandItem(null)}
          onCopy={copyItem}
          onEdit={(id) => {
            expandItem(null);
            editItem(id);
          }}
        />
      )}

      {editing && (
        <ItemEditDialog
          item={editing}
          categories={categories}
          onClose={() => editItem(null)}
          onSave={(title, content, tags) => void saveEdits(editing.id, title, content, tags)}
          onCategoryAdd={addCategory}
        />
      )}

      {composing && (
        <ItemEditDialog
          item={null}
          categories={categories}
          // A card made while a category is open belongs to it by default.
          initialTags={activeCategory ? [activeCategory.toLowerCase()] : []}
          onClose={() => composeItem(false)}
          onSave={(title, content, tags) => void createItem({ title, content, tags })}
          onCategoryAdd={addCategory}
        />
      )}

      {settingsOpen && (
        <SettingsDialog
          settings={settings}
          onClose={() => openSettings(false)}
          onHotkeyChange={setHotkey}
        />
      )}
    </div>
  );
}
