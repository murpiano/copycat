import { fileGroupOf, type FileGroup } from './file-kind';
import type { ClearHistoryInput, ClipboardItem } from './types';

const FILE_GROUPS = new Set<FileGroup>([
  'documents',
  'images',
  'audio',
  'video',
  'files',
  'folders',
]);

export function matchesClearHistory(item: ClipboardItem, input: ClearHistoryInput): boolean {
  if (input.since !== undefined && item.createdAt < input.since) return false;
  if (input.fileGroup && !FILE_GROUPS.has(input.fileGroup)) return false;

  const group = fileGroupOf(item);
  const category = input.category?.trim().toLowerCase();
  switch (input.scope) {
    case 'all':
      break;
    case 'starred':
      if (!item.starred) return false;
      break;
    case 'text':
      if (item.type !== 'text') return false;
      break;
    case 'file':
      if (!group || (input.fileGroup && group !== input.fileGroup)) return false;
      break;
    case 'category':
      if (category ? !item.tags.includes(category) : item.tags.length === 0) return false;
      break;
    default:
      return false;
  }

  return !input.exclude.some((rule) => {
    if (rule === 'starred') return item.starred;
    if (rule === 'text') return item.type === 'text';
    if (rule === 'files') return group !== null;
    if (rule === 'categories') return item.tags.length > 0;
    if (rule.startsWith('file:')) return group === rule.slice(5);
    if (rule.startsWith('category:')) return item.tags.includes(rule.slice(9).trim().toLowerCase());
    return false;
  });
}
