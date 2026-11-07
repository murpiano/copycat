import { useClipboardStore } from './store/useClipboardStore';
import type { Language } from '../shared/types';
export type { Language };

const english: Record<string, string> = {
  'Все': 'All', 'Избранное': 'Favorites', 'Текст': 'Text', 'Файлы': 'Files',
  'Категории': 'Categories', 'Изображения': 'Images', 'Изображение': 'Image',
  'Документы': 'Documents', 'Аудио': 'Audio', 'Видео': 'Video', 'Папки': 'Folders', 'Папку': 'Folder',
  'Файл': 'File', 'Все файлы': 'All files', 'Все категории': 'All categories',
  'Объект': 'Object', 'Новый блок': 'New block', 'Редактирование': 'Edit block',
  'Настройки': 'Settings', 'Горячая клавиша': 'Hotkey', 'Разделы': 'Sections',
  'История': 'History', 'Язык': 'Language', 'Тема': 'Theme', 'Тёмная': 'Dark', 'Светлая': 'Light', 'Развернуть раздел категорий': 'Expand categories',
  'Развернуть раздел файлов': 'Expand files', 'Настроить разделы': 'Configure sections',
  'Очистить историю': 'Clear history', 'Закрыть': 'Close', 'Отмена': 'Cancel',
  'Отменить': 'Cancel', 'Готово': 'Done', 'Создать': 'Create', 'Сохранить': 'Save',
  'Удалить': 'Delete', 'Добавить': 'Add', 'Название': 'Title',
  'Удалить блок?': 'Delete block?',
  'Блок добавлен в избранное.': 'This block is in Favorites.',
  'Блок включён в категории:': 'This block belongs to categories:',
  'Блок будет удалён из истории и всех разделов.': 'The block will be removed from history and all sections.',
  'Не удалось удалить блок. Попробуйте ещё раз.': 'Could not delete the block. Try again.',
  'Название объекта': 'Object title', 'Название категории': 'Category name',
  'Новая категория': 'New category', 'Содержимое': 'Content',
  'Путь к файлу': 'File path', 'Путь к объекту': 'Object path',
  'Открыть': 'Open', 'Порядок': 'Order', 'В начало': 'Back to top',
  'Изменить порядок': 'Change order', 'Ничего не найдено': 'Nothing found',
  'Поиск по буферу обмена': 'Search clipboard history',
  'Поиск по буферу обмена...': 'Search clipboard history...',
  'Очистить поиск': 'Clear search', 'В избранное': 'Add to favorites',
  'Убрать из избранного': 'Remove from favorites',
  'Редактировать': 'Edit', 'Скопировать содержимое': 'Copy content',
  'Скопировать документ': 'Copy document', 'Скопировать изображение': 'Copy image',
  'Скопировать аудио': 'Copy audio', 'Скопировать видео': 'Copy video', 'Скопировать файл': 'Copy file',
  'Скопировать папку': 'Copy folder', 'Исходный объект не найден.': 'Source object not found.',
  'Добавить категорию': 'Add category', 'Удалить категорию': 'Delete category',
  'Свернуть категории': 'Collapse categories', 'Развернуть категории': 'Expand categories',
  'Группы файлов': 'File groups', 'Показать': 'Show', 'Скрыть': 'Hide',
  'Показать Файлы': 'Show Files', 'Скрыть Файлы': 'Hide Files',
  'Показать Категории': 'Show Categories', 'Скрыть Категории': 'Hide Categories',
  'Не удалось удалить категорию.': 'Could not delete category.',
  'Блоки останутся в истории, но отметка категории будет удалена.': 'Blocks stay in history, but their category label is removed.',
  'Введите текст блока.': 'Enter block text.', 'Выберите объект.': 'Choose an object.',
  'Не удалось создать блок. Проверьте выбранный объект.': 'Could not create block. Check the selected object.',
  'Выбранный объект не относится к этому разделу.': 'The selected object does not belong to this section.',
  'Не удалось выбрать объект.': 'Could not choose an object.',
  'Изменения не сохранены': 'Unsaved changes',
  'Сохранить изменения в блоке или закрыть без сохранения?': 'Save changes to this block or close without saving?',
  'Закрыть без сохранения': 'Close without saving',
  'Выбрать объект': 'Choose object', 'Выбрать папку': 'Choose folder',
  'Выбрать аудио': 'Choose audio', 'Выбрать видео': 'Choose video', 'Выбрать изображение': 'Choose image',
  'Выбрать документ': 'Choose document', 'Выбрать файл': 'Choose file',
  'Нажмите сочетание…': 'Press a key combination…', 'Сохранено': 'Saved',
  'Нужно сочетание с Ctrl, Alt или Shift': 'Use Ctrl, Alt, or Shift in the combination',
  'Не удалось назначить сочетание': 'Could not assign the hotkey',
  'Сочетание занято другой программой или не поддерживается': 'This hotkey is in use by another app or is unsupported',
  'Предпросмотр изображения': 'Image preview',
  'За час': 'Last hour', 'За 3 часа': 'Last 3 hours',
  'За сутки': 'Last 24 hours', 'За всё время': 'All time',
  'Файлы — выбрать всё': 'Files — select all',
  'Категории — выбрать всё': 'Categories — select all',
  'Удалить из выбранного раздела/подраздела всё, кроме:': 'Delete everything in the selected section except:',
  'Не удалось очистить историю. Попробуйте ещё раз.': 'Could not clear history. Try again.',
  'Очистить': 'Clear',
  'Порядок разделов изменён': 'Section order changed',
  'Сохранить новый порядок разделов или вернуть прежний?': 'Save the new section order or restore the previous order?',
  'Порядок блоков изменён': 'Block order changed',
  'Сохранить новый порядок блоков или вернуть прежний?': 'Save the new block order or restore the previous order?',
  'Отменить изменения': 'Discard changes',
};

export function translateUi(value: string, language: Language): string {
  return language === 'en' ? english[value] ?? value : value;
}

export function useLanguage(): Language {
  return useClipboardStore((state) => state.settings?.language === 'ru' ? 'ru' : 'en');
}

export function useT(): (value: string) => string {
  const language = useLanguage();
  return (value) => translateUi(value, language);
}
