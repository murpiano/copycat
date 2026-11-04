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
import { useLanguage, useT } from './i18n';

export function App() {
  const t = useT();
  const language = useLanguage();

  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const {
    items,
    search,
    nav,
    navOrder,
    hiddenNavEntries,
    fileSectionOrder,
    categories,
    activeCategory,
    activeFileGroup,
    expandedId,
    editingId,
    composing,
    settingsOpen,
    settings,
    reorderMode,
    itemOrderDirty,
    navReorderMode,
    navOrderDirty,
    isOrderedView,
    setSearch,
    setNav,
    addCategory,
    deleteCategory,
    selectCategory,
    selectFileGroup,
    expandItem,
    editItem,
    composeItem,
    createItem,
    openSettings,
    loadSettings,
    setHotkey,
    setHotkeyCapture,
    updateSettings,
    startNavReorder,
    moveNav,
    toggleNavVisibility,
    toggleFileSectionVisibility,
    toggleCategoryVisibility,
    moveFileSection,
    moveCategory,
    commitNavOrder,
    cancelNavOrder,
    toggleReorderMode,
    cancelItemReorder,
    moveItem,
    persistOrder,
    fetchItems,
    copyItem,
    toggleStar,
    setTags,
    updateItem,
    deleteItem,
    clearHistory,
    hideWindow,
    subscribeToNewItems,
  } = useClipboardStore();

  const [askNavOrder, setAskNavOrder] = useState(false);
  const [askItemOrder, setAskItemOrder] = useState(false);

  useSelectionDismiss();

  useEffect(() => {
    void fetchItems();
    void loadSettings();
    return subscribeToNewItems();
  }, []);

  useEffect(
    () =>
      window.copycat.onHotkeyCaptureCanceled?.(() => {
        openSettings(false);
      }),
    [openSettings],
  );

  // Escape unwinds one layer at a time and closes the window only once there
  // is nothing left to undo. Dialogs handle their own Escape, so this skips
  // them; a dialog with unsaved input asks before it lets go.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (expandedId !== null || editingId !== null || composing || settingsOpen) return;
      if (askNavOrder || askItemOrder) return;

      if (navReorderMode) {
        if (navOrderDirty) setAskNavOrder(true);
        else cancelNavOrder();
        return;
      }
      if (reorderMode) {
        // Each drag already wrote its new position to storage, so leaving
        // without a choice would silently keep an accidental rearrangement.
        if (itemOrderDirty) setAskItemOrder(true);
        else toggleReorderMode();
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
    itemOrderDirty,
    askNavOrder,
    askItemOrder,
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
        hiddenNavEntries={hiddenNavEntries}
        fileSectionOrder={fileSectionOrder}
        hiddenFileSections={settings?.hiddenFileSections ?? []}
        hiddenCategories={settings?.hiddenCategories ?? []}
        categories={categories}
        activeCategory={activeCategory}
        activeFileGroup={activeFileGroup}
        categoriesExpanded={settings?.categoriesExpanded ?? false}
        filesExpanded={settings?.filesExpanded ?? false}
        reorderMode={navReorderMode}
        onNavChange={setNav}
        onCategorySelect={selectCategory}
        onFileGroupSelect={selectFileGroup}
        onCategoryAdd={addCategory}
        onCategoryDelete={deleteCategory}
        onSettingsOpen={() => openSettings(true)}
        onNavMove={moveNav}
        onNavVisibilityToggle={(key) => void toggleNavVisibility(key)}
        onFileSectionVisibilityToggle={(key) => void toggleFileSectionVisibility(key)}
        onCategoryVisibilityToggle={(name) => void toggleCategoryVisibility(name)}
        onFileSectionMove={moveFileSection}
        onCategoryMove={moveCategory}
        onReorderDone={() => void commitNavOrder()}
        onReorderCancel={cancelNavOrder}
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
          onCancelReorder={() => void cancelItemReorder()}
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
          onSave={(title, content, tags) => saveEdits(editing.id, title, content, tags)}
          onCategoryAdd={addCategory}
        />
      )}

      {composing && (
        <ItemEditDialog
          item={null}
          categories={categories}
          // A card made while a category is open belongs to it by default.
          initialTags={activeCategory ? [activeCategory.toLowerCase()] : []}
          initialStarred={!activeCategory && nav === 'starred'}
          creationGroup={activeCategory ? null : nav === 'files' ? activeFileGroup ?? 'all' : nav === 'text' ? 'text' : null}
          onClose={() => composeItem(false)}
          onSave={(title, content, tags, creation) => createItem({ title, content, tags, ...creation })}
          onCategoryAdd={addCategory}
        />
      )}

      {settingsOpen && (
        <SettingsDialog
          settings={settings}
          onClose={() => openSettings(false)}
          onHotkeyChange={setHotkey}
          onHotkeyCapture={setHotkeyCapture}
          onCategoriesExpandedChange={(categoriesExpanded) =>
            void updateSettings({ categoriesExpanded })
          }
          onFilesExpandedChange={(filesExpanded) => void updateSettings({ filesExpanded })}
          onLanguageChange={(language) => void updateSettings({ language })}
          onNavReorderStart={startNavReorder}
          categories={categories}
          onClearHistory={clearHistory}
        />
      )}

      {askNavOrder && (
        <ConfirmDialog
          title={t('Порядок разделов изменён')}
          message={t('Сохранить новый порядок разделов или вернуть прежний?')}
          confirmLabel={t('Сохранить')}
          cancelLabel={t('Отменить изменения')}
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

      {askItemOrder && (
        <ConfirmDialog
          title={t('Порядок блоков изменён')}
          message={t('Сохранить новый порядок блоков или вернуть прежний?')}
          confirmLabel={t('Сохранить')}
          cancelLabel={t('Отменить изменения')}
          onConfirm={() => {
            setAskItemOrder(false);
            toggleReorderMode();
          }}
          onCancel={() => {
            setAskItemOrder(false);
            void cancelItemReorder();
          }}
        />
      )}
    </div>
  );
}
