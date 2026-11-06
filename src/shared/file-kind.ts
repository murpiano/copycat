import type { ClipboardItem, ItemKind } from './types';

export type FileGroup = 'documents' | 'images' | 'audio' | 'video' | 'files' | 'folders';
export type FileSection = FileGroup | 'all';
export const DEFAULT_FILE_SECTION_ORDER: FileSection[] = ['all', 'documents', 'images', 'audio', 'video', 'files', 'folders'];

export function firstPath(content: string): string {
  try { return JSON.parse(content)[0] ?? content; } catch { return content; }
}

export const DOCUMENT_EXTS = new Set(['doc', 'docx', 'dot', 'dotx', 'odt', 'xls', 'xlsx', 'xlsm', 'xlsb', 'ods', 'csv', 'ppt', 'pptx', 'pps', 'ppsx', 'odp', 'txt', 'md', 'rtf', 'log', 'ini', 'yaml', 'yml', 'json', 'xml', 'html', 'htm', 'pdf', 'epub', 'mobi']);
export const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'jfif', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tif', 'tiff', 'avif', 'heic']);
export const AUDIO_EXTS = new Set(['mp3', 'wav', 'flac', 'm4a', 'ogg', 'oga', 'aac', 'wma', 'opus', 'aiff', 'aif']);
export const VIDEO_EXTS = new Set(['mp4', 'm4v', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'mpg', 'mpeg', '3gp']);

export function kindFromPath(filePath: string, isDirectory = false): ItemKind {
  if (isDirectory) return 'folder';
  const name = filePath.split(/[\\/]/).pop() ?? '';
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return 'file';
  const extension = name.slice(dot + 1).toLowerCase();
  if (DOCUMENT_EXTS.has(extension)) return 'document';
  if (IMAGE_EXTS.has(extension)) return 'image';
  if (AUDIO_EXTS.has(extension)) return 'audio';
  if (VIDEO_EXTS.has(extension)) return 'video';
  return 'file';
}

export function fileGroupOf(item: Pick<ClipboardItem, 'type' | 'content' | 'kind'>): FileGroup | null {
  if (item.type === 'text') return null;
  const kind = item.kind ?? (item.type === 'image' ? 'image' : kindFromPath(firstPath(item.content)));
  return kind === 'document' ? 'documents' : kind === 'image' ? 'images' : kind === 'audio' ? 'audio' : kind === 'video' ? 'video' : kind === 'folder' ? 'folders' : 'files';
}
