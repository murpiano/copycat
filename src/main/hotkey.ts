import { globalShortcut } from 'electron';

export function registerHotkey(accelerator: string, onTrigger: () => void): boolean {
  const ok = globalShortcut.register(accelerator, onTrigger);
  if (!ok) {
    console.warn(
      `[copycat] failed to register global hotkey "${accelerator}" (likely already bound by another app); use the tray icon to open Copycat instead.`,
    );
  }
  return ok;
}
