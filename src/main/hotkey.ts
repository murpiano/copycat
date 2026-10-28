import { globalShortcut } from 'electron';
import type { HotkeyResult } from '../shared/types';

export function registerHotkey(accelerator: string, onTrigger: () => void): boolean {
  const ok = globalShortcut.register(accelerator, onTrigger);
  if (!ok) {
    console.warn(
      `[copycat] failed to register global hotkey "${accelerator}" (likely already bound by another app); use the tray icon to open Copycat instead.`,
    );
  }
  return ok;
}

/**
 * Swaps the open-window shortcut. A rejected accelerator leaves the previous
 * one in place, so a combination already taken by another app cannot strand
 * the user with no way to open the window from the keyboard.
 */
export function rebindHotkey(
  previous: string,
  next: string,
  onTrigger: () => void,
): HotkeyResult {
  if (previous === next) return { ok: true };

  globalShortcut.unregister(previous);

  let registered = false;
  try {
    registered = globalShortcut.register(next, onTrigger);
  } catch (error) {
    // Electron throws on a malformed accelerator rather than returning false.
    registered = false;
    console.warn(`[copycat] invalid accelerator "${next}":`, (error as Error).message);
  }

  if (registered) return { ok: true };

  registerHotkey(previous, onTrigger);
  return {
    ok: false,
    reason: 'Сочетание занято другой программой или не поддерживается',
  };
}
