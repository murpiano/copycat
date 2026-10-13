interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder="Search clipboard history..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="search-bar"
    />
  );
}
