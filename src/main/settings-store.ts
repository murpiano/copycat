import fs from 'node:fs';
import path from 'node:path';
import type { AppSettings, NavKey, UpdateSettingsInput, WindowBounds } from '../shared/types';
import { DEFAULT_HOTKEY, DEFAULT_NAV_ORDER } from '../shared/config';

export interface SettingsStore {
  get(): AppSettings;
  setHotkey(accelerator: string): AppSettings;
  update(input: UpdateSettingsInput): AppSettings;
}

function defaults(): AppSettings {
  return {
    hotkey: DEFAULT_HOTKEY,
    categoriesExpanded: false,
    navOrder: [...DEFAULT_NAV_ORDER],
    windowBounds: null,
  };
}

/** Keeps every known entry exactly once, whatever the stored list looks like. */
function sanitizeNavOrder(value: unknown): NavKey[] {
  const known = new Set<NavKey>(DEFAULT_NAV_ORDER);
  const stored = Array.isArray(value) ? value.filter((key): key is NavKey => known.has(key)) : [];
  const seen = new Set(stored);
  return [...new Set(stored), ...DEFAULT_NAV_ORDER.filter((key) => !seen.has(key))];
}

function sanitizeBounds(value: unknown): WindowBounds | null {
  if (!value || typeof value !== 'object') return null;
  const bounds = value as Record<string, unknown>;
  const numbers = ['x', 'y', 'width', 'height'].map((key) => bounds[key]);
  if (!numbers.every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  const [x, y, width, height] = numbers as number[];
  return { x, y, width, height };
}

/**
 * Plain JSON next to the database. Settings are a handful of values the user
 * edits by hand, so a file they can read and fix beats a table.
 */
export function createSettingsStore(filePath: string): SettingsStore {
  function read(): AppSettings {
    const base = defaults();
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<AppSettings>;
      return {
        hotkey: typeof raw.hotkey === 'string' && raw.hotkey ? raw.hotkey : base.hotkey,
        categoriesExpanded: raw.categoriesExpanded === true,
        navOrder: sanitizeNavOrder(raw.navOrder),
        windowBounds: sanitizeBounds(raw.windowBounds),
      };
    } catch {
      // Missing or corrupt file: fall back to defaults rather than refuse to start.
      return base;
    }
  }

  function write(settings: AppSettings): AppSettings {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(settings, null, 2)}\n`);
    return settings;
  }

  return {
    get: read,

    setHotkey(accelerator) {
      return write({ ...read(), hotkey: accelerator });
    },

    update(input) {
      const current = read();
      return write({
        ...current,
        ...(input.categoriesExpanded !== undefined
          ? { categoriesExpanded: input.categoriesExpanded }
          : {}),
        ...(input.navOrder !== undefined ? { navOrder: sanitizeNavOrder(input.navOrder) } : {}),
        ...(input.windowBounds !== undefined
          ? { windowBounds: sanitizeBounds(input.windowBounds) }
          : {}),
      });
    },
  };
}
