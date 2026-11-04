import { useEffect, useRef } from 'react';
import { CloseIcon, SearchIcon } from './icons';
import { useT } from '../i18n';
import { useClipboardStore } from '../store/useClipboardStore';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search initially, but preserve the control the user was editing
    // when a hidden window is raised again.
    const focus = (): void => {
      const state = useClipboardStore.getState();
      if (state.expandedId !== null || state.editingId !== null || state.composing || state.settingsOpen) return;
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement && active !== inputRef.current) return;
      inputRef.current?.focus();
    };
    focus();
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, []);

  return (
    <div className="search-field">
      {value ? <button type="button" className="search-clear" aria-label={t('Очистить поиск')} title={t('Очистить поиск')} onClick={() => { onChange(''); inputRef.current?.focus(); }}><CloseIcon size={16} /></button> : <SearchIcon size={16} />}
      <label>
        <span className="visually-hidden">{t('Поиск по буферу обмена')}</span>
        <input
          ref={inputRef}
          type="text"
          placeholder={t('Поиск по буферу обмена...')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="search-bar"
        />
      </label>
    </div>
  );
}
