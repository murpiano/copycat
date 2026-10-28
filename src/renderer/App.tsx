import { useEffect } from 'react';
import { useClipboardStore } from './store/useClipboardStore';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { ItemGrid } from './components/ItemGrid';
import { ItemPopup } from './components/ItemPopup';
import { ItemEditDialog } from './components/ItemEditDialog';

export function App() {
  const {
    items,
    search,
    nav,
    categories,
    activeCategory,
    expandedId,
    editingId,
    reorderMode,
    isOrderedView,
    setSearch,
    setNav,
    addCategory,
    selectCategory,
    expandItem,
    editItem,
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
          onSave={(id, title, content, tags) => void saveEdits(id, title, content, tags)}
          onCategoryAdd={addCategory}
        />
      )}
    </div>
  );
}
