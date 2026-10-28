import { SearchIcon } from './icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-field">
      <SearchIcon size={16} />
      <label>
        <span className="visually-hidden">Поиск по буферу обмена</span>
        <input
          type="text"
          placeholder="Поиск по буферу обмена..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="search-bar"
        />
      </label>
    </div>
  );
}
