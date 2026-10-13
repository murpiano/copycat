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
