import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSettingsStore } from '../../../src/main/settings-store';
import { DEFAULT_HOTKEY, DEFAULT_NAV_ORDER } from '../../../src/shared/config';
import { DEFAULT_FILE_SECTION_ORDER } from '../../../src/shared/file-kind';

function tempFile(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'copycat-settings-')), 'settings.json');
}

describe('settings-store', () => {
  it('starts from the defaults when there is no file yet', () => {
    expect(createSettingsStore(tempFile()).get()).toEqual({
      language: 'ru',
      theme: 'dark',
      hotkey: DEFAULT_HOTKEY,
      categoriesExpanded: false,
      filesExpanded: false,
      navOrder: [...DEFAULT_NAV_ORDER],
      hiddenNavEntries: [],
      fileSectionOrder: DEFAULT_FILE_SECTION_ORDER,
      hiddenFileSections: [],
      hiddenCategories: [],
      windowBounds: null,
    });
  });

  it('persists English without dropping existing settings', () => {
    const file = tempFile();
    createSettingsStore(file).update({ language: 'en', filesExpanded: true });
    expect(createSettingsStore(file).get()).toMatchObject({ language: 'en', filesExpanded: true });
  });

  it('persists local file order and hidden subgroups', () => {
    const file = tempFile();
    createSettingsStore(file).update({ fileSectionOrder: ['images', 'all', 'documents', 'audio', 'files', 'folders'], hiddenFileSections: ['audio'], hiddenCategories: ['работа'] });
    const saved = createSettingsStore(file).get();
    expect(saved.fileSectionOrder?.slice(0, 2)).toEqual(['images', 'all']);
    expect(saved.hiddenFileSections).toEqual(['audio']);
    expect(saved.hiddenCategories).toEqual(['работа']);
  });

  it('persists a new hotkey across stores', () => {
    const file = tempFile();
    createSettingsStore(file).setHotkey('Alt+Space');
    expect(createSettingsStore(file).get().hotkey).toBe('Alt+Space');
  });

  it('persists the sidebar order and the expanded flag', () => {
    const file = tempFile();
    createSettingsStore(file).update({
      navOrder: ['files', 'history', 'starred', 'text'],
      categoriesExpanded: true,
    });
    const stored = createSettingsStore(file).get();
    expect(stored.navOrder).toEqual(['files', 'history', 'starred', 'text', 'categories']);
    expect(stored.categoriesExpanded).toBe(true);
  });

  it('repairs a stored order that lost or repeated entries', () => {
    const file = tempFile();
    // Entries missing from the file still have to appear, exactly once each.
    createSettingsStore(file).update({
      navOrder: ['files', 'files', 'nonsense'] as never,
    });
    expect(createSettingsStore(file).get().navOrder).toEqual([
      'files',
      'history',
      'starred',
      'text',
      'categories',
    ]);
  });

  it('migrates the legacy images entry to the default text entry', () => {
    const file = tempFile();
    fs.writeFileSync(file, JSON.stringify({ navOrder: ['history', 'starred', 'images', 'files', 'categories'] }));
    expect(createSettingsStore(file).get().navOrder).toEqual([...DEFAULT_NAV_ORDER]);
  });

  it('remembers the window position and rejects a malformed one', () => {
    const file = tempFile();
    const store = createSettingsStore(file);
    store.update({ windowBounds: { x: 120, y: 80, width: 900, height: 600 } });
    expect(createSettingsStore(file).get().windowBounds).toEqual({
      x: 120,
      y: 80,
      width: 900,
      height: 600,
    });

    store.update({ windowBounds: { x: 1, y: 2, width: Number.NaN, height: 5 } });
    expect(createSettingsStore(file).get().windowBounds).toBeNull();
  });

  it('survives a corrupt file instead of refusing to start', () => {
    const file = tempFile();
    fs.writeFileSync(file, '{ not json');
    expect(createSettingsStore(file).get().hotkey).toBe(DEFAULT_HOTKEY);
    expect(createSettingsStore(file).get().navOrder).toEqual([...DEFAULT_NAV_ORDER]);
  });
});
