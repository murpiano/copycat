import { useEffect, useRef } from 'react';
import { SearchIcon } from './icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // The window is summoned by a hotkey to find something, so typing should
    // work straight away — on first mount and every time it is raised again.
    const focus = (): void => inputRef.current?.focus();
    focus();
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, []);

  return (
    <div className="search-field">
      <SearchIcon size={16} />
      <label>
        <span className="visually-hidden">Поиск по буферу обмена</span>
        <input
          ref={inputRef}
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
