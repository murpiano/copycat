import { encodeFilenamesPboardBuffer, decodeFilenamesPboardBuffer } from '../../../src/main/clipboard/mac-pasteboard';

describe('mac-pasteboard bplist codec', () => {
  it('round-trips a single ASCII path', () => {
    const paths = ['/Users/bob/Desktop/report.docx'];
    expect(decodeFilenamesPboardBuffer(encodeFilenamesPboardBuffer(paths))).toEqual(paths);
  });

  it('round-trips several paths, including non-ASCII and long names', () => {
    const paths = [
      '/Users/bob/Desktop/report.docx',
      '/Users/bob/Documents/Résumé café.pdf',
      '/Users/bob/Downloads/a very long file name that goes past fifteen characters for sure.txt',
    ];
    expect(decodeFilenamesPboardBuffer(encodeFilenamesPboardBuffer(paths))).toEqual(paths);
  });

  it('round-trips 20 paths (forces the extended array-count encoding)', () => {
    const paths = Array.from({ length: 20 }, (_, i) => `/Users/bob/file-${i}.txt`);
    expect(decodeFilenamesPboardBuffer(encodeFilenamesPboardBuffer(paths))).toEqual(paths);
  });

  it('decodes empty input safely', () => {
    expect(decodeFilenamesPboardBuffer(Buffer.alloc(0))).toEqual([]);
  });

  it('decodes garbage input safely instead of throwing', () => {
    expect(decodeFilenamesPboardBuffer(Buffer.from('not a plist'))).toEqual([]);
  });
});
