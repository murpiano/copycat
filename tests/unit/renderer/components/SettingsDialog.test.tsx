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
  it('protects favorites and all categories by default after section switches', () => {
    render(<SettingsDialog settings={null} onClose={() => {}} onHotkeyChange={async () => ({ ok: true })}
      onCategoriesExpandedChange={() => {}} onNavReorderStart={() => {}} categories={['Работа', 'Личное']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Очистить историю' }));
    expect(screen.getByLabelText('Избранное')).toBeChecked();
    expect(screen.getByLabelText('Категории — выбрать всё')).toBeChecked();
    expect(screen.getByLabelText('Работа')).toBeChecked();
    expect(screen.getByLabelText('Личное')).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: /^Файлы$/ }));
    expect(screen.getByLabelText('Избранное')).toBeChecked();
    expect(screen.getByLabelText('Категории — выбрать всё')).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: /^Избранное$/ }));
    expect(screen.queryByLabelText('Избранное')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Категории — выбрать всё')).toBeChecked();
  });

  it('shows period first and changes exclusions for file and category subsections', async () => {
    const onClearHistory = jest.fn().mockResolvedValue(undefined);
    render(<SettingsDialog settings={null} onClose={() => {}} onHotkeyChange={async () => ({ ok: true })}
      onCategoriesExpandedChange={() => {}} onNavReorderStart={() => {}}
      categories={['Работа']} onClearHistory={onClearHistory} />);
    fireEvent.click(screen.getByRole('button', { name: 'Очистить историю' }));
    const dialog = screen.getByRole('dialog', { name: 'Очистить историю' });
    const buttons = Array.from(dialog.querySelectorAll('button')).map((button) => button.textContent);
    expect(buttons.indexOf('За час')).toBeLessThan(buttons.indexOf('Все'));
    expect(screen.getByText('Удалить из выбранного раздела/подраздела всё, кроме:')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Файлы$/ }));
    expect(screen.getByRole('button', { name: 'Все файлы' })).toBeInTheDocument();
    expect(screen.getByLabelText('Документы')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Изображения' }));
    expect(screen.queryByLabelText('Документы')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Избранное')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Категории$/ }));
    expect(screen.getByRole('button', { name: 'Все категории' })).toBeInTheDocument();
    expect(screen.getByLabelText('Файлы — выбрать всё')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Работа' }));
    expect(screen.getByLabelText('Работа')).toBeChecked();
    fireEvent.click(screen.getByLabelText('Файлы — выбрать всё'));
    fireEvent.click(screen.getByRole('button', { name: /^Очистить$/ }));
    await waitFor(() => expect(onClearHistory).toHaveBeenCalledWith(expect.objectContaining({
      scope: 'category', category: 'Работа', exclude: expect.arrayContaining(['files', 'file:documents', 'file:images']),
    })));
  });

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
    const field = screen.getByLabelText('Горячая клавиша');
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
    const field = screen.getByLabelText('Горячая клавиша');
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
