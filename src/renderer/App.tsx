import { useEffect, useState } from 'react';
import { useClipboardStore } from './store/useClipboardStore';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { ItemGrid } from './components/ItemGrid';
import { ItemPopup } from './components/ItemPopup';
import { ItemEditDialog } from './components/ItemEditDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useSelectionDismiss } from './useSelectionDismiss';

export function App() {
  const {
    items,
    search,
    nav,
    navOrder,
    categories,
    activeCategory,
    expandedId,
    editingId,
    composing,
    settingsOpen,
    settings,
    reorderMode,
    navReorderMode,
    navOrderDirty,
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
    loadSettings,
    setHotkey,
    updateSettings,
    startNavReorder,
    moveNav,
    moveCategory,
    commitNavOrder,
    cancelNavOrder,
    toggleReorderMode,
    moveItem,
    persistOrder,
    fetchItems,
    copyItem,
    toggleStar,
    setTags,
    updateItem,
    deleteItem,
    hideWindow,
    subscribeToNewItems,
  } = useClipboardStore();

  const [askNavOrder, setAskNavOrder] = useState(false);

  useSelectionDismiss();

  useEffect(() => {
    void fetchItems();
    void loadSettings();
    return subscribeToNewItems();
  }, []);

  // Escape unwinds one layer at a time and closes the window only once there
  // is nothing left to undo. Dialogs handle their own Escape, so this skips
  // them; a dialog with unsaved input asks before it lets go.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (expandedId !== null || editingId !== null || composing || settingsOpen) return;
      if (askNavOrder) return;

      if (navReorderMode) {
        if (navOrderDirty) setAskNavOrder(true);
        else cancelNavOrder();
        return;
      }
      if (reorderMode) {
        toggleReorderMode();
        return;
      }
      void hideWindow();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    expandedId,
    editingId,
    composing,
    settingsOpen,
    navReorderMode,
    navOrderDirty,
    reorderMode,
    askNavOrder,
  ]);

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
    <div className={navReorderMode ? 'app arranging' : 'app'}>
      <Sidebar
        nav={nav}
        navOrder={navOrder}
        categories={categories}
        activeCategory={activeCategory}
        categoriesExpanded={settings?.categoriesExpanded ?? false}
        reorderMode={navReorderMode}
        onNavChange={setNav}
        onCategorySelect={selectCategory}
        onCategoryAdd={addCategory}
        onSettingsOpen={() => openSettings(true)}
        onNavMove={moveNav}
        onCategoryMove={moveCategory}
        onReorderDone={() => void commitNavOrder()}
      />
      {/* While the sidebar is being arranged, nothing else accepts input.
          `inert` is not in React 18's typings yet, hence the cast. */}
      <div
        className="main"
        {...((navReorderMode ? { inert: '' } : {}) as Record<string, string>)}
      >
        <div className="topbar">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <ItemGrid
          items={items}
          reorderMode={reorderMode}
          // Arranging needs at least a pair to swap, and "Все" keeps its own
          // newest-first order.
          canReorder={isOrderedView() && items.length >= 2}
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
          onCategoriesExpandedChange={(categoriesExpanded) =>
            void updateSettings({ categoriesExpanded })
          }
          onNavReorderStart={startNavReorder}
        />
      )}

      {askNavOrder && (
        <ConfirmDialog
          title="Порядок разделов изменён"
          message="Сохранить новый порядок разделов или вернуть прежний?"
          confirmLabel="Сохранить"
          cancelLabel="Отменить изменения"
          onConfirm={() => {
            setAskNavOrder(false);
            void commitNavOrder();
          }}
          onCancel={() => {
            setAskNavOrder(false);
            cancelNavOrder();
          }}
        />
      )}
    </div>
  );
}
