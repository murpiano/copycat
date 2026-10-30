export function parseFileDropBuffer(buf: Buffer): string[] {
  if (!buf || buf.length === 0) return [];
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
