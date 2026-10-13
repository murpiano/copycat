import { useEffect } from 'react';
import { useClipboardStore } from './store/useClipboardStore';
import { SearchBar } from './components/SearchBar';
import { TabBar } from './components/TabBar';
import { TagFilterRow } from './components/TagFilterRow';
import { ItemGrid } from './components/ItemGrid';

export function App() {
  const {
    items,
    search,
    activeTab,
    tagFilters,
    setSearch,
    setActiveTab,
    toggleTagFilter,
    fetchItems,
    copyItem,
    toggleStar,
    deleteItem,
    subscribeToNewItems,
  } = useClipboardStore();

  useEffect(() => {
    void fetchItems();
    return subscribeToNewItems();
  }, []);

  const tagCounts = Array.from(
    items.flatMap((item) => item.tags).reduce((acc, tag) => {
      acc.set(tag, (acc.get(tag) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).map(([name, count]) => ({ name, count }));

  return (
    <div className="app">
      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} />
        <TabBar active={activeTab} onChange={setActiveTab} />
      </div>
      <TagFilterRow tags={tagCounts} activeTags={tagFilters} onToggle={toggleTagFilter} />
      <ItemGrid
        items={items}
        onCopy={copyItem}
        onToggleStar={toggleStar}
        onDelete={deleteItem}
      />
    </div>
  );
}
