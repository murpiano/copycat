import type { ClipboardItem } from './types';

export type FileGroup = 'documents' | 'images' | 'audio' | 'files' | 'folders';

function firstPath(content: string): string {
  try { return JSON.parse(content)[0] ?? content; } catch { return content; }
}

export function fileGroupOf(item: Pick<ClipboardItem, 'type' | 'content'>): FileGroup | null {
  if (item.type === 'text') return null;
  if (item.type === 'image') return 'images';
  const path = firstPath(item.content).toLowerCase();
  if (/\.(docx?|xlsx?|pptx?|pdf|rtf|odt|csv)$/.test(path)) return 'documents';
  if (/\.(mp3|wav|flac|m4a|ogg|aac)$/.test(path)) return 'audio';
  if (!/\.[^\\/]+$/.test(path)) return 'folders';
  return 'files';
}
