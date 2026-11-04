/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ItemEditDialog } from '../../../../src/renderer/components/ItemEditDialog';
import type { CopycatAPI } from '../../../../src/shared/types';

const onClose = jest.fn();
const onCategoryAdd = jest.fn();

beforeEach(() => {
  (window as unknown as { copycat: Partial<CopycatAPI> }).copycat = {
    pickObject: jest.fn().mockResolvedValue(null),
  };
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
  expect(screen.getByLabelText('Путь к объекту')).toHaveValue('C:\\Docs\\report.pdf');
  fireEvent.click(screen.getByRole('button', { name: 'Создать' }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(
    'report.pdf', 'C:\\Docs\\report.pdf', [], { type: 'file', starred: true, expectedGroup: undefined },
  ));
  expect(pickObject).toHaveBeenCalledWith('file', undefined);
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
