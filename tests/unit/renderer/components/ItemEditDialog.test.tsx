/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ItemEditDialog } from '../../../../src/renderer/components/ItemEditDialog';
import type { CopycatAPI } from '../../../../src/shared/types';
import { useClipboardStore } from '../../../../src/renderer/store/useClipboardStore';

const onClose = jest.fn();
const onCategoryAdd = jest.fn();

// These tests check Russian-localized labels explicitly; pin the store to
// 'ru' so they stay independent of the app's default language.
let previousSettings: ReturnType<typeof useClipboardStore.getState>['settings'];

beforeEach(() => {
  (window as unknown as { copycat: Partial<CopycatAPI> }).copycat = {
    pickObject: jest.fn().mockResolvedValue(null),
  };
  previousSettings = useClipboardStore.getState().settings;
  useClipboardStore.setState({ settings: { language: 'ru', hotkey: 'CommandOrControl+F1', categoriesExpanded: true, filesExpanded: true, navOrder: ['history', 'starred', 'text', 'files', 'categories'], windowBounds: null } });
});

afterEach(() => {
  act(() => { useClipboardStore.setState({ settings: previousSettings }); });
});

it('creates a starred object link with the selected filename', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const pickObject = jest.fn().mockResolvedValue({ path: 'C:\\Docs\\report.pdf', kind: 'document' });
  window.copycat.pickObject = pickObject;
  render(<ItemEditDialog item={null} categories={[]} initialStarred onClose={onClose}
    onSave={onSave} onCategoryAdd={onCategoryAdd} />);

  expect(screen.getByRole('button', { name: 'Убрать из избранного' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Объект' }));
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать объект' }));
  await waitFor(() => expect(screen.getByDisplayValue('report.pdf')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Выбрать объект' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByLabelText('Путь к объекту')).toHaveValue('C:\\Docs\\report.pdf');
  fireEvent.click(screen.getByRole('button', { name: 'Создать' }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(
    'report.pdf', 'C:\\Docs\\report.pdf', [], { type: 'file', starred: true, expectedGroup: undefined },
  ));
  expect(pickObject).toHaveBeenCalledWith('file', undefined);
});

it('closes without confirmation after changing only type and favorite', () => {
  render(<ItemEditDialog item={null} categories={[]} onClose={onClose}
    onSave={jest.fn()} onCategoryAdd={onCategoryAdd} />);
  fireEvent.click(screen.getByRole('button', { name: 'Объект' }));
  expect(screen.getByRole('textbox', { name: 'Название' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'В избранное' }));
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
  expect(onClose).toHaveBeenCalled();
  expect(screen.queryByText('Изменения не сохранены')).not.toBeInTheDocument();
});

it('locks image creation to image picker and retains the form after a mismatch', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  window.copycat.pickObject = jest.fn().mockResolvedValue({ path: 'C:\\Docs\\report.pdf', kind: 'document' });
  render(<ItemEditDialog item={null} categories={[]} creationGroup="images" onClose={onClose}
    onSave={onSave} onCategoryAdd={onCategoryAdd} />);

  expect(screen.queryByRole('button', { name: 'Текст' })).not.toBeInTheDocument();
  expect(screen.getByText('Изображения')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать изображение' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('не относится к этому разделу');
  expect(onSave).not.toHaveBeenCalled();
});
