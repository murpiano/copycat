import { useEffect } from 'react';
import { useClipboardStore } from './store/useClipboardStore';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { ItemGrid } from './components/ItemGrid';

export function App() {
  const {
    items,
    search,
    nav,
    categories,
    activeCategory,
    setSearch,
    setNav,
    addCategory,
    selectCategory,
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
          onCopy={copyItem}
          onToggleStar={toggleStar}
          onDelete={deleteItem}
        />
      </div>
    </div>
  );
}
