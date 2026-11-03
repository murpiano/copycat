import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { AppSettings, ClearHistoryScope } from '../../shared/types';
import { CloseIcon } from './icons';
import { Overlay } from './Overlay';

/** Modifiers alone are not a shortcut; the field waits for a real key. */
const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta']);
const NOOP_HOTKEY_CAPTURE = async (): Promise<void> => {};

/**
 * Turns a key press into an Electron accelerator. `event.code` is used for
 * letters and digits so the shortcut stays on the same physical key when the
 * user switches to a Russian layout.
 */
export function toAccelerator(event: {
  code: string;
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null;

  const parts: string[] = [];
  if (event.ctrlKey) parts.push('CommandOrControl');
  if (event.metaKey && !event.ctrlKey) parts.push('Super');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');

  let key: string | null = null;
  if (/^Key[A-Z]$/.test(event.code)) key = event.code.slice(3);
  else if (/^Digit[0-9]$/.test(event.code)) key = event.code.slice(5);
  else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(event.code)) key = event.code;
  else if (['Space', 'Tab', 'Backspace', 'Delete', 'Insert', 'Home', 'End'].includes(event.code))
    key = event.code;
  else if (event.code === 'Escape') key = 'Esc';
  else if (/^Arrow(Up|Down|Left|Right)$/.test(event.code)) key = event.code.slice(5);

  if (!key) return null;
  // A bare letter would fire while the user types anywhere else in Windows.
  if (parts.length === 0) return null;
  return [...parts, key].join('+');
}

/** Renders an accelerator the way the keys are labelled on the keyboard. */
export function formatAccelerator(accelerator: string): string {
  return accelerator
    .split('+')
    .map((part) => (part === 'CommandOrControl' ? 'Ctrl' : part))
    .join(' + ');
}

interface SettingsDialogProps {
  settings: AppSettings | null;
  onClose: () => void;
  onHotkeyChange: (accelerator: string) => Promise<{ ok: boolean; reason?: string }>;
  onHotkeyCapture?: (capturing: boolean) => Promise<void>;
  onCategoriesExpandedChange: (expanded: boolean) => void;
  onNavReorderStart: () => void;
  categories?: string[];
  onClearHistory?: (input: { scope: ClearHistoryScope; category?: string; since?: number; exclude: string[] }) => Promise<void>;
}

export function SettingsDialog({
  settings,
  onClose,
  onHotkeyChange,
  onHotkeyCapture = NOOP_HOTKEY_CAPTURE,
  onCategoriesExpandedChange,
  onNavReorderStart,
  categories = [],
  onClearHistory = async () => {},
}: SettingsDialogProps) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [scope, setScope] = useState<ClearHistoryScope>('all');
  const [period, setPeriod] = useState('all');
  const [category, setCategory] = useState(categories[0] ?? '');
  const [exclude, setExclude] = useState<string[]>([]);
  const choices = scope === 'all' ? ['starred', 'image', 'file', 'category', ...categories] : scope === 'starred' ? ['image', 'file', 'category', ...categories] : scope === 'image' ? ['starred', 'category', ...categories] : scope === 'file' ? ['starred', 'category', ...categories] : ['starred', 'image', 'file'];

  async function requestClose() {
    await onHotkeyCapture(false);
    setCapturing(false);
    onClose();
  }

  async function startCapture() {
    await onHotkeyCapture(true);
    setCapturing(true);
    setError(null);
    setSaved(false);
  }

  async function cancelCapture() {
    await onHotkeyCapture(false);
    setCapturing(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // While capturing, Escape cancels the capture rather than the dialog.
      if (event.key === 'Escape' && !capturing) void requestClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [capturing, onHotkeyCapture, onClose]);

  useEffect(
    () => () => {
      if (capturing) void onHotkeyCapture(false);
    },
    [capturing, onHotkeyCapture],
  );

  async function captureKey(event: ReactKeyboardEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (event.key === 'Escape') {
      void cancelCapture();
      return;
    }
    const accelerator = toAccelerator(event);
    if (!accelerator) {
      setError('Нужно сочетание с Ctrl, Alt или Shift');
      return;
    }
    setError(null);
    const result = await onHotkeyChange(accelerator);
    if (result.ok) {
      await onHotkeyCapture(false);
      setCapturing(false);
      setSaved(true);
    } else {
      setError(result.reason ?? 'Не удалось назначить сочетание');
    }
  }

  return (
    <Overlay onClose={() => void requestClose()}>
      <div
        className="popup settings-dialog"
        role="dialog"
        aria-label="Настройки"
      >
        <div className="popup-head">
          <div className="popup-title">Настройки</div>
          <button
            className="item-card-action"
            aria-label="Закрыть"
            title="Закрыть"
            onClick={() => void requestClose()}
          >
            <CloseIcon size={15} />
          </button>
        </div>

        <div className="field">
          <span className="field-label">Горячая клавиша открытия</span>
          <button
            type="button"
            className={capturing ? 'hotkey-field capturing' : 'hotkey-field'}
            aria-label="Горячая клавиша открытия"
            onClick={() => void startCapture()}
            onKeyDown={capturing ? (e) => void captureKey(e) : undefined}
          >
            {capturing
              ? 'Нажмите сочетание…'
              : settings
                ? formatAccelerator(settings.hotkey)
                : '—'}
          </button>
          <span className="field-hint">
            {error ?? (saved ? 'Сохранено' : 'Нажмите на поле и задайте новое сочетание')}
          </span>
        </div>

        <div className="field">
          <button type="button" className="button ghost wide" onClick={() => setClearOpen(true)}>Очистить историю</button>
        </div>

        <label className="field field-row">
          <input
            type="checkbox"
            checked={settings?.categoriesExpanded ?? false}
            onChange={(e) => onCategoriesExpandedChange(e.target.checked)}
          />
          <span>Развернуть раздел «Категории»</span>
        </label>

        <div className="field">
          <span className="field-label">Разделы</span>
          <button type="button" className="button ghost wide" onClick={onNavReorderStart}>
            Изменить порядок разделов
          </button>
          <span className="field-hint">
            Настройки свернутся, разделы и категории можно будет перетаскивать
          </span>
        </div>

        <div className="dialog-actions">
          <button type="button" className="button ghost" onClick={() => void requestClose()}>
            Закрыть
          </button>
        </div>
      </div>
      {clearOpen && <div className="popup clear-history-dialog" role="dialog" aria-label="Очистить историю">
        <div className="popup-head"><div className="popup-title">Очистить историю</div><button className="item-card-action" onClick={() => setClearOpen(false)}><CloseIcon size={15} /></button></div>
        <label className="field"><span className="field-label">Раздел</span><select value={scope} onChange={e => { setScope(e.target.value as ClearHistoryScope); setExclude([]); }}><option value="all">Все</option><option value="starred">Избранное</option><option value="image">Изображения</option><option value="file">Файлы</option><option value="category">Категория</option></select></label>
        {scope === 'category' && <label className="field"><span className="field-label">Категория</span><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>}
        <label className="field"><span className="field-label">Период</span><select value={period} onChange={e => setPeriod(e.target.value)}><option value="all">Всё время</option><option value="hour">За час</option><option value="today">За сегодня</option></select></label>
        <div className="field"><span className="field-label">Кроме</span>{choices.map(c => <label className="field-row" key={c}><input type="checkbox" checked={exclude.includes(c)} onChange={e => setExclude(v => e.target.checked ? [...v, c] : v.filter(x => x !== c))} /><span>{c === 'starred' ? 'Избранное' : c === 'image' ? 'Изображения' : c === 'file' ? 'Файлы' : c === 'category' ? 'Категории без уточнения' : c}</span></label>)}</div>
        <div className="dialog-actions"><button className="button ghost" onClick={() => setClearOpen(false)}>Отмена</button><button className="button danger" onClick={() => { const now = Date.now(); const since = period === 'hour' ? now - 3600000 : period === 'today' ? new Date().setHours(0,0,0,0) : undefined; void onClearHistory({ scope, category: scope === 'category' ? category : undefined, since, exclude }).then(() => setClearOpen(false)); }}>Очистить</button></div>
      </div>}
    </Overlay>
  );
}
