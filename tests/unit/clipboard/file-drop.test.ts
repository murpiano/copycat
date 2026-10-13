import { parseFileDropBuffer } from '../../../src/main/clipboard/file-drop';

describe('parseFileDropBuffer', () => {
  it('parses a UTF-16LE double-null-terminated path list', () => {
    const paths = ['C:\\Users\\a.txt', 'C:\\Users\\b.png'];
    const buf = Buffer.from(paths.join('\u0000') + '\u0000\u0000', 'ucs2');
    expect(parseFileDropBuffer(buf)).toEqual(paths);
  });

  it('returns an empty array for an empty buffer', () => {
    expect(parseFileDropBuffer(Buffer.alloc(0))).toEqual([]);
  });

  it('does not throw on malformed/garbage input', () => {
    const garbage = Buffer.from([0xff, 0x00, 0x01, 0x02, 0xfe]);
    expect(() => parseFileDropBuffer(garbage)).not.toThrow();
    expect(Array.isArray(parseFileDropBuffer(garbage))).toBe(true);
  });
});
