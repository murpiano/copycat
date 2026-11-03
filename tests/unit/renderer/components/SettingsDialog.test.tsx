/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  SettingsDialog,
  toAccelerator,
  formatAccelerator,
} from '../../../../src/renderer/components/SettingsDialog';

function press(overrides: Partial<Parameters<typeof toAccelerator>[0]> = {}) {
  return toAccelerator({
    code: 'KeyV',
    key: 'v',
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...overrides,
  });
}

describe('toAccelerator', () => {
  it('builds an Electron accelerator from modifiers and a key', () => {
    expect(press({ ctrlKey: true, shiftKey: true })).toBe('CommandOrControl+Shift+V');
    expect(press({ code: 'Digit1', key: '1', altKey: true })).toBe('Alt+1');
  });

  it('keys off the physical key so a Russian layout keeps the shortcut', () => {
    expect(press({ key: 'м', ctrlKey: true })).toBe('CommandOrControl+V');
  });

  it('rejects a key with no modifier, which would fire while typing', () => {
    expect(press()).toBeNull();
  });

  it('ignores a modifier pressed on its own', () => {
    expect(press({ key: 'Control', code: 'ControlLeft', ctrlKey: true })).toBeNull();
  });
});

describe('formatAccelerator', () => {
  it('labels the keys the way they are printed on the keyboard', () => {
    expect(formatAccelerator('CommandOrControl+Shift+V')).toBe('Ctrl + Shift + V');
  });
});

describe('SettingsDialog', () => {
  it('shows the current hotkey and saves a newly captured one', async () => {
    const onHotkeyChange = jest.fn().mockResolvedValue({ ok: true });
    render(
      <SettingsDialog
        settings={{
          hotkey: 'CommandOrControl+Shift+V',
          categoriesExpanded: false,
          navOrder: ['history', 'starred', 'images', 'files'],
          windowBounds: null,
        }}
        onClose={() => {}}
        onHotkeyChange={onHotkeyChange}
        onCategoriesExpandedChange={() => {}}
        onNavReorderStart={() => {}}
      />,
    );
    const field = screen.getByLabelText('Горячая клавиша открытия');
    expect(field).toHaveTextContent('Ctrl + Shift + V');

    fireEvent.click(field);
    await screen.findByText('Нажмите сочетание…');
    fireEvent.keyDown(field, { code: 'KeyB', key: 'b', ctrlKey: true, altKey: true });

    await waitFor(() => expect(onHotkeyChange).toHaveBeenCalledWith('CommandOrControl+Alt+B'));
    await screen.findByText('Сохранено');
  });

  it('keeps the old hotkey visible and explains a rejected combination', async () => {
    const onHotkeyChange = jest.fn().mockResolvedValue({ ok: false, reason: 'Сочетание занято' });
    render(
      <SettingsDialog
        settings={{
          hotkey: 'CommandOrControl+Shift+V',
          categoriesExpanded: false,
          navOrder: ['history', 'starred', 'images', 'files'],
          windowBounds: null,
        }}
        onClose={() => {}}
        onHotkeyChange={onHotkeyChange}
        onCategoriesExpandedChange={() => {}}
        onNavReorderStart={() => {}}
      />,
    );
    const field = screen.getByLabelText('Горячая клавиша открытия');
    fireEvent.click(field);
    await screen.findByText('Нажмите сочетание…');
    fireEvent.keyDown(field, {
      code: 'KeyB',
      key: 'b',
      ctrlKey: true,
    });

    await screen.findByText('Сочетание занято');
  });
});
