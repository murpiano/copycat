import fs from 'node:fs';
import path from 'node:path';
import type { AppSettings } from '../shared/types';
import { DEFAULT_HOTKEY } from '../shared/config';

export interface SettingsStore {
  get(): AppSettings;
  setHotkey(accelerator: string): AppSettings;
}

const DEFAULTS: AppSettings = { hotkey: DEFAULT_HOTKEY };

/**
 * Plain JSON next to the database. Settings are a handful of values the user
 * edits by hand, so a file they can read and fix beats a table.
 */
export function createSettingsStore(filePath: string): SettingsStore {
  function read(): AppSettings {
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<AppSettings>;
      return { hotkey: typeof raw.hotkey === 'string' && raw.hotkey ? raw.hotkey : DEFAULTS.hotkey };
    } catch {
      // Missing or corrupt file: fall back to defaults rather than refuse to start.
      return { ...DEFAULTS };
    }
  }

  function write(settings: AppSettings): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(settings, null, 2)}\n`);
  }

  return {
    get: read,

    setHotkey(accelerator) {
      const settings = { ...read(), hotkey: accelerator };
      write(settings);
      return settings;
    },
  };
}
