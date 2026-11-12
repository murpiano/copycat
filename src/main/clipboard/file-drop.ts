import { decodeFilenamesPboardBuffer } from './mac-pasteboard';

/** A single `public.file-url` pasteboard entry: a `file://`-prefixed,
 * percent-encoded URL, not a path — the fallback used when Finder's legacy
 * `NSFilenamesPboardType` (the format Copycat otherwise reads) isn't set. */
function parseFileUrlBuffer(buf: Buffer): string[] {
  try {
    const url = buf.toString('utf8').trim();
    if (!url.startsWith('file://')) return [];
    return [decodeURIComponent(url.slice('file://'.length))];
  } catch {
    return [];
  }
}

export function parseFileDropBuffer(buf: Buffer): string[] {
  if (!buf || buf.length === 0) return [];
  if (process.platform === 'darwin') {
    const bplist = decodeFilenamesPboardBuffer(buf);
    return bplist.length > 0 ? bplist : parseFileUrlBuffer(buf);
  }
  try {
    const text = buf.toString('ucs2');
    return text
      .split('\u0000')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Build a Windows CF_HDROP buffer so Explorer (and other apps) can paste files.
 * Structure: DROPFILES header (20 bytes) + UTF-16LE null-separated paths + double null.
 */
export function buildCFDropBuffer(paths: string[]): Buffer {
  // DROPFILES: pFiles(4) pt.x(4) pt.y(4) fNC(4) fWide(4)
  const header = Buffer.alloc(20);
  header.writeUInt32LE(20, 0); // pFiles offset
  header.writeUInt32LE(1, 16); // fWide = TRUE
  const pathList = Buffer.from(paths.join('\0') + '\0\0', 'utf16le');
  return Buffer.concat([header, pathList]);
}
