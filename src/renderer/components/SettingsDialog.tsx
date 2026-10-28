import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { AppSettings } from '../../shared/types';
import { CloseIcon } from './icons';

/** Modifiers alone are not a shortcut; the field waits for a real key. */
const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta']);

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
}

export function SettingsDialog({ settings, onClose, onHotkeyChange }: SettingsDialogProps) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // While capturing, Escape cancels the capture rather than the dialog.
      if (event.key === 'Escape' && !capturing) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, capturing]);

  async function captureKey(event: ReactKeyboardEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (event.key === 'Escape') {
      setCapturing(false);
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
      setCapturing(false);
      setSaved(true);
    } else {
      setError(result.reason ?? 'Не удалось назначить сочетание');
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="popup settings-dialog"
        role="dialog"
        aria-label="Настройки"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-head">
          <div className="popup-title">Настройки</div>
          <button
            className="item-card-action"
            aria-label="Закрыть"
            title="Закрыть"
            onClick={onClose}
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
            onClick={() => {
              setCapturing(true);
              setError(null);
              setSaved(false);
            }}
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

        <div className="dialog-actions">
          <button type="button" className="button ghost" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
