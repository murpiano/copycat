import fs from 'node:fs';
import path from 'node:path';
import type { AppSettings, SidebarEntry, UpdateSettingsInput, WindowBounds } from '../shared/types';
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
    language: 'en',
    theme: 'dark',
    hotkey: DEFAULT_HOTKEY,
    categoriesExpanded: true,
    filesExpanded: true,
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

/** Keeps the user's arrangement, but slots any newly introduced section
 * (e.g. 'video') next to its neighbours from the canonical order instead
 * of always tacking it onto the end. */
function sanitizeFileSections(value: unknown): FileSection[] {
  const valid = new Set<string>(DEFAULT_FILE_SECTION_ORDER);
  const stored = Array.isArray(value)
    ? value.filter((entry): entry is FileSection => valid.has(entry))
    : [];
  const result = [...new Set(stored)];
  for (const entry of DEFAULT_FILE_SECTION_ORDER) {
    if (result.includes(entry)) continue;
    const defaultIndex = DEFAULT_FILE_SECTION_ORDER.indexOf(entry);
    let insertAt = -1;
    for (let i = defaultIndex - 1; i >= 0; i--) {
      const idx = result.indexOf(DEFAULT_FILE_SECTION_ORDER[i]);
      if (idx !== -1) {
        insertAt = idx + 1;
        break;
      }
    }
    if (insertAt === -1) {
      insertAt = result.length;
      for (let i = defaultIndex + 1; i < DEFAULT_FILE_SECTION_ORDER.length; i++) {
        const idx = result.indexOf(DEFAULT_FILE_SECTION_ORDER[i]);
        if (idx !== -1) {
          insertAt = idx;
          break;
        }
      }
    }
    result.splice(insertAt, 0, entry);
  }
  // A previously published build appended a newly introduced 'video' entry
  // to the very end instead of slotting it after 'audio'; that stale order
  // is already on disk for anyone who ran that build, so pin it here too,
  // not just when the entry is missing outright.
  const audioIndex = result.indexOf('audio');
  const videoIndex = result.indexOf('video');
  if (audioIndex !== -1 && videoIndex !== -1 && videoIndex !== audioIndex + 1) {
    result.splice(videoIndex, 1);
    result.splice(result.indexOf('audio') + 1, 0, 'video');
  }
  return result;
}

function sanitizeHiddenFileSections(value: unknown): FileSection[] {
  const valid = new Set<string>(DEFAULT_FILE_SECTION_ORDER);
  return Array.isArray(value)
    ? [...new Set(value.filter((entry): entry is FileSection => valid.has(entry)))]
    : [];
}

function sanitizeHiddenCategories(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((entry): entry is string => typeof entry === 'string'))]
    : [];
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
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<AppSettings> & {
        navOrderVersion?: number;
      };
      // Reset arrangements from pre-default-order releases once.
      const navOrder =
        raw.navOrderVersion === NAV_ORDER_VERSION
          ? sanitizeNavOrder(raw.navOrder)
          : [...DEFAULT_NAV_ORDER];
      return {
        language: raw.language === 'ru' ? 'ru' : 'en',
        theme: raw.theme === 'light' ? 'light' : 'dark',
        hotkey: typeof raw.hotkey === 'string' && raw.hotkey ? raw.hotkey : base.hotkey,
        categoriesExpanded: raw.categoriesExpanded !== false,
        filesExpanded: raw.filesExpanded !== false,
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
    fs.writeFileSync(
      filePath,
      `${JSON.stringify({ ...settings, navOrderVersion: NAV_ORDER_VERSION }, null, 2)}\n`,
    );
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
        ...(input.language !== undefined
          ? { language: input.language === 'ru' ? 'ru' : 'en' }
          : {}),
        ...(input.theme !== undefined ? { theme: input.theme === 'light' ? 'light' : 'dark' } : {}),
        ...(input.categoriesExpanded !== undefined
          ? { categoriesExpanded: input.categoriesExpanded }
          : {}),
        ...(input.filesExpanded !== undefined ? { filesExpanded: input.filesExpanded } : {}),
        ...(input.navOrder !== undefined ? { navOrder: sanitizeNavOrder(input.navOrder) } : {}),
        ...(input.hiddenNavEntries !== undefined
          ? { hiddenNavEntries: sanitizeHiddenEntries(input.hiddenNavEntries) }
          : {}),
        ...(input.fileSectionOrder !== undefined
          ? { fileSectionOrder: sanitizeFileSections(input.fileSectionOrder) }
          : {}),
        ...(input.hiddenFileSections !== undefined
          ? { hiddenFileSections: sanitizeHiddenFileSections(input.hiddenFileSections) }
          : {}),
        ...(input.hiddenCategories !== undefined
          ? { hiddenCategories: sanitizeHiddenCategories(input.hiddenCategories) }
          : {}),
        ...(input.windowBounds !== undefined
          ? { windowBounds: sanitizeBounds(input.windowBounds) }
          : {}),
      });
    },
  };
}
