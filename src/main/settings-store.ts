import fs from 'node:fs';
import path from 'node:path';
import type {
  AppSettings,
  SidebarEntry,
  UpdateSettingsInput,
  WindowBounds,
} from '../shared/types';
import { DEFAULT_HOTKEY, DEFAULT_NAV_ORDER } from '../shared/config';
import { DEFAULT_FILE_SECTION_ORDER, type FileSection } from '../shared/file-kind';

const NAV_ORDER_VERSION = 2;

export interface SettingsStore {
  get(): AppSettings;
  setHotkey(accelerator: string): AppSettings;
  update(input: UpdateSettingsInput): AppSettings;
}

function defaults(): AppSettings {
  return {
    language: 'ru',
    theme: 'dark',
    hotkey: DEFAULT_HOTKEY,
    categoriesExpanded: false,
    filesExpanded: false,
    navOrder: [...DEFAULT_NAV_ORDER],
    hiddenNavEntries: [],
    fileSectionOrder: [...DEFAULT_FILE_SECTION_ORDER],
    hiddenFileSections: [],
    hiddenCategories: [],
    windowBounds: null,
  };
}

/** Keeps every known entry exactly once, whatever the stored list looks like. */
function sanitizeNavOrder(value: unknown): SidebarEntry[] {
  const known = new Set<SidebarEntry>(DEFAULT_NAV_ORDER);
  const stored = Array.isArray(value)
    ? value
        .map((key) => (key === 'images' ? 'text' : key))
        .filter((key): key is SidebarEntry => known.has(key as SidebarEntry))
    : [];
  const seen = new Set(stored);
  return [...new Set(stored), ...DEFAULT_NAV_ORDER.filter((key) => !seen.has(key))];
}

function sanitizeHiddenEntries(value: unknown): SidebarEntry[] {
  const known = new Set<SidebarEntry>(DEFAULT_NAV_ORDER);
  return Array.isArray(value)
    ? [...new Set(value.filter((key): key is SidebarEntry => known.has(key as SidebarEntry)))]
    : [];
}

function sanitizeFileSections(value: unknown): FileSection[] {
  const valid = new Set<string>(DEFAULT_FILE_SECTION_ORDER);
  const entries = Array.isArray(value) ? value.filter((entry): entry is FileSection => valid.has(entry)) : [];
  return [...new Set(entries), ...DEFAULT_FILE_SECTION_ORDER.filter((entry) => !entries.includes(entry))];
}

function sanitizeHiddenFileSections(value: unknown): FileSection[] {
  const valid = new Set<string>(DEFAULT_FILE_SECTION_ORDER);
  return Array.isArray(value) ? [...new Set(value.filter((entry): entry is FileSection => valid.has(entry)))] : [];
}

function sanitizeHiddenCategories(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((entry): entry is string => typeof entry === 'string'))] : [];
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
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<AppSettings> & { navOrderVersion?: number };
      // Reset arrangements from pre-default-order releases once.
      const navOrder = raw.navOrderVersion === NAV_ORDER_VERSION
        ? sanitizeNavOrder(raw.navOrder)
        : [...DEFAULT_NAV_ORDER];
      return {
        language: raw.language === 'en' ? 'en' : 'ru',
        theme: raw.theme === 'light' ? 'light' : 'dark',
        hotkey: typeof raw.hotkey === 'string' && raw.hotkey ? raw.hotkey : base.hotkey,
        categoriesExpanded: raw.categoriesExpanded === true,
        filesExpanded: raw.filesExpanded === true,
        navOrder,
        hiddenNavEntries: sanitizeHiddenEntries(raw.hiddenNavEntries),
        fileSectionOrder: sanitizeFileSections(raw.fileSectionOrder),
        hiddenFileSections: sanitizeHiddenFileSections(raw.hiddenFileSections),
        hiddenCategories: sanitizeHiddenCategories(raw.hiddenCategories),
        windowBounds: sanitizeBounds(raw.windowBounds),
      };
    } catch {
      // Missing or corrupt file: fall back to defaults rather than refuse to start.
      return base;
    }
  }

  function write(settings: AppSettings): AppSettings {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify({ ...settings, navOrderVersion: NAV_ORDER_VERSION }, null, 2)}\n`);
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
        ...(input.language !== undefined ? { language: input.language === 'en' ? 'en' : 'ru' } : {}),
        ...(input.theme !== undefined ? { theme: input.theme === 'light' ? 'light' : 'dark' } : {}),
        ...(input.categoriesExpanded !== undefined
          ? { categoriesExpanded: input.categoriesExpanded }
          : {}),
        ...(input.filesExpanded !== undefined ? { filesExpanded: input.filesExpanded } : {}),
        ...(input.navOrder !== undefined ? { navOrder: sanitizeNavOrder(input.navOrder) } : {}),
        ...(input.hiddenNavEntries !== undefined ? { hiddenNavEntries: sanitizeHiddenEntries(input.hiddenNavEntries) } : {}),
        ...(input.fileSectionOrder !== undefined ? { fileSectionOrder: sanitizeFileSections(input.fileSectionOrder) } : {}),
        ...(input.hiddenFileSections !== undefined ? { hiddenFileSections: sanitizeHiddenFileSections(input.hiddenFileSections) } : {}),
        ...(input.hiddenCategories !== undefined ? { hiddenCategories: sanitizeHiddenCategories(input.hiddenCategories) } : {}),
        ...(input.windowBounds !== undefined
          ? { windowBounds: sanitizeBounds(input.windowBounds) }
          : {}),
      });
    },
  };
}
