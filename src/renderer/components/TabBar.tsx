import type { ActiveTab } from '../store/useClipboardStore';

interface TabBarProps {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="tab-bar">
      <button className={active === 'history' ? 'active' : ''} onClick={() => onChange('history')}>
        History
      </button>
      <button className={active === 'starred' ? 'active' : ''} onClick={() => onChange('starred')}>
        Starred
      </button>
    </div>
  );
}
