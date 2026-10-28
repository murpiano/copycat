import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSettingsStore } from '../../../src/main/settings-store';
import { DEFAULT_HOTKEY } from '../../../src/shared/config';

function tempFile(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'copycat-settings-')), 'settings.json');
}

describe('settings-store', () => {
  it('falls back to the default hotkey when there is no file yet', () => {
    expect(createSettingsStore(tempFile()).get()).toEqual({ hotkey: DEFAULT_HOTKEY });
  });

  it('persists a new hotkey across stores', () => {
    const file = tempFile();
    createSettingsStore(file).setHotkey('Alt+Space');
    expect(createSettingsStore(file).get().hotkey).toBe('Alt+Space');
  });

  it('survives a corrupt file instead of refusing to start', () => {
    const file = tempFile();
    fs.writeFileSync(file, '{ not json');
    expect(createSettingsStore(file).get()).toEqual({ hotkey: DEFAULT_HOTKEY });
  });
});
