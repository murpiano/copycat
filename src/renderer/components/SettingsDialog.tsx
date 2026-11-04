import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { AppSettings, ClearHistoryInput, ClearHistoryScope } from '../../shared/types';
import { DEFAULT_FILE_SECTION_ORDER, type FileGroup } from '../../shared/file-kind';
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
  onFilesExpandedChange?: (expanded: boolean) => void;
  onNavReorderStart: () => void;
  categories?: string[];
  onClearHistory?: (input: ClearHistoryInput) => Promise<void>;
}

export function SettingsDialog({
  settings,
  onClose,
  onHotkeyChange,
  onHotkeyCapture = NOOP_HOTKEY_CAPTURE,
  onCategoriesExpandedChange,
  onFilesExpandedChange = () => {},
  onNavReorderStart,
  categories = [],
  onClearHistory = async () => {},
}: SettingsDialogProps) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [scope, setScope] = useState<ClearHistoryScope>('all');
  const [fileGroup, setFileGroup] = useState<FileGroup | null>(null);
  const [period, setPeriod] = useState('hour');
  const [category, setCategory] = useState('');
  const [exclude, setExclude] = useState<string[]>(() => ['starred', 'categories', ...categories.map((name) => `category:${name}`)]);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

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

  if (clearOpen) {
    const periodButtons = [['hour', 'За час'], ['3hours', 'За 3 часа'], ['today', 'За сутки'], ['all', 'За всё время']];
    const scopeButtons: Array<[ClearHistoryScope, string]> = [['all', 'Все'], ['starred', 'Избранное'], ['text', 'Текст'], ['file', 'Файлы'], ['category', 'Категории']];
    const fileLabels: Record<FileGroup, string> = { documents: 'Документы', images: 'Изображения', audio: 'Аудио', files: 'Файлы', folders: 'Папки' };
    const fileGroups = DEFAULT_FILE_SECTION_ORDER.filter((value): value is FileGroup => value !== 'all');
    const options: Array<[string, string]> = [];
    if (scope !== 'starred') options.push(['starred', 'Избранное']);
    if (scope === 'all' || scope === 'starred' || scope === 'category') options.push(['text', 'Текст']);
    if (scope === 'all' || scope === 'starred' || scope === 'category') {
      options.push(['files', 'Файлы — выбрать всё']);
      for (const group of fileGroups) options.push([`file:${group}`, fileLabels[group]]);
    }
    if (scope === 'file' && !fileGroup) {
      for (const group of fileGroups) options.push([`file:${group}`, fileLabels[group]]);
    }
    options.push(['categories', 'Категории — выбрать всё']);
    options.push(...categories.map((name): [string, string] => [`category:${name}`, name]));
    function resetExclusions(nextScope: ClearHistoryScope) {
      setExclude([...(nextScope === 'starred' ? [] : ['starred']), 'categories', ...categories.map((name) => `category:${name}`)]);
    }
    const since = period === 'hour' ? Date.now() - 3600000 : period === '3hours' ? Date.now() - 10800000 : period === 'today' ? Date.now() - 86400000 : undefined;
    function toggleExclusion(key: string, checked: boolean) {
      const children = key === 'files' ? fileGroups.map((group) => `file:${group}`) : key === 'categories' ? categories.map((name) => `category:${name}`) : [];
      setExclude((current) => {
        const next = new Set(current);
        if (children.length) {
          for (const value of [key, ...children]) checked ? next.add(value) : next.delete(value);
        } else {
          checked ? next.add(key) : next.delete(key);
          if (!checked && key.startsWith('file:')) next.delete('files');
          if (!checked && key.startsWith('category:')) next.delete('categories');
        }
        return [...next];
      });
    }
    async function confirmClear() {
      if (clearing) return;
      setClearing(true);
      setClearError(null);
      try {
        await onClearHistory({ scope, category: scope === 'category' ? category || undefined : undefined, fileGroup: scope === 'file' ? fileGroup ?? undefined : undefined, since, exclude });
        setClearOpen(false);
      } catch {
        setClearError('Не удалось очистить историю. Попробуйте ещё раз.');
      } finally {
        setClearing(false);
      }
    }
    return <Overlay onClose={() => setClearOpen(false)}><div className="popup settings-dialog clear-history-dialog" role="dialog" aria-label="Очистить историю">
      <div className="popup-head"><div className="popup-title">Очистить историю</div><button className="item-card-action" aria-label="Закрыть" onClick={() => setClearOpen(false)}><CloseIcon size={15} /></button></div>
      <div className="settings-button-grid">{periodButtons.map(([value, label]) => <button key={value} className={period === value ? 'button settings-choice active' : 'button settings-choice'} onClick={() => setPeriod(value)}>{label}</button>)}</div>
      <div className="settings-button-grid">{scopeButtons.map(([value, label]) => <button key={value} className={scope === value ? 'button settings-choice active' : 'button settings-choice'} onClick={() => { setScope(value); setCategory(''); setFileGroup(null); resetExclusions(value); }}>{label}</button>)}</div>
      {scope === 'file' && <div className="settings-button-grid clear-subsections">{[['all', 'Все файлы'], ...fileGroups.map((group): [string, string] => [group, fileLabels[group]])].map(([value, label]) => <button key={value} className={(fileGroup ?? 'all') === value ? 'button settings-choice active' : 'button settings-choice'} onClick={() => { setFileGroup(value === 'all' ? null : value as FileGroup); resetExclusions(scope); }}>{label}</button>)}</div>}
      {scope === 'category' && <div className="settings-button-grid clear-subsections">{[['', 'Все категории'], ...categories.map((name): [string, string] => [name, name])].map(([value, label]) => <button key={value || '__all_categories'} className={category === value ? 'button settings-choice active' : 'button settings-choice'} onClick={() => { setCategory(value); resetExclusions(scope); }}>{label}</button>)}</div>}
      <div className="field"><span className="field-label">Удалить из выбранного раздела/подраздела всё, кроме:</span><div className="settings-exclusions">{options.map(([value, label]) => <label className="field-row" key={value}><input type="checkbox" checked={exclude.includes(value)} onChange={e => toggleExclusion(value, e.target.checked)} /><span>{label}</span></label>)}</div></div>
      {clearError && <div role="alert" className="field-hint">{clearError}</div>}
      <div className="dialog-actions"><button className="button ghost" disabled={clearing} onClick={() => setClearOpen(false)}>Отмена</button><button className="button danger" disabled={clearing} onClick={() => void confirmClear()}>Очистить</button></div>
    </div></Overlay>;
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
          <span className="field-label">Горячая клавиша</span>
          <button
            type="button"
            className={capturing ? 'hotkey-field capturing' : 'hotkey-field'}
            aria-label="Горячая клавиша"
            onClick={() => void startCapture()}
            onKeyDown={capturing ? (e) => void captureKey(e) : undefined}
          >
            {capturing
              ? 'Нажмите сочетание…'
              : settings
                ? formatAccelerator(settings.hotkey)
                : '—'}
          </button>
          {(error || saved) && <span className="field-hint">{error ?? 'Сохранено'}</span>}
        </div>

        <div className="field">
          <span className="field-label">Разделы</span>
          <label className="field field-row"><input type="checkbox" checked={settings?.categoriesExpanded ?? false} onChange={(e) => onCategoriesExpandedChange(e.target.checked)} /><span>Развернуть раздел категорий</span></label>
          <label className="field field-row"><input type="checkbox" checked={settings?.filesExpanded ?? false} onChange={(e) => onFilesExpandedChange(e.target.checked)} /><span>Развернуть раздел файлов</span></label>
          <button type="button" className="button ghost wide" onClick={onNavReorderStart}>
            Настроить разделы
          </button>
        </div>

        <div className="field">
          <span className="field-label">История</span>
          <button type="button" className="button ghost wide" onClick={() => setClearOpen(true)}>Очистить историю</button>
        </div>

        <div className="dialog-actions">
          <button type="button" className="button ghost" onClick={() => void requestClose()}>
            Закрыть
          </button>
        </div>
      </div>
    </Overlay>
  );
}
