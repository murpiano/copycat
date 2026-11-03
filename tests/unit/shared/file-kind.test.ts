import { fileGroupOf, kindFromPath } from '../../../src/shared/file-kind';

describe('file classification', () => {
  it.each([
    ['report.docx', 'document'],
    ['table.xlsx', 'document'],
    ['slides.pptx', 'document'],
    ['notes.txt', 'document'],
    ['manual.pdf', 'document'],
    ['photo.avif', 'image'],
    ['voice.opus', 'audio'],
    ['archive.zip', 'file'],
  ] as const)('classifies %s as %s', (filePath, kind) => {
    expect(kindFromPath(filePath)).toBe(kind);
  });

  it('uses explicit directory evidence for folders with dots in their names', () => {
    expect(kindFromPath('C:\\Work\\release.v2', true)).toBe('folder');
  });

  it('maps persisted kinds to the Files subsections', () => {
    expect(fileGroupOf({ type: 'file', content: '["C:\\\\a.bin"]', kind: 'folder' })).toBe('folders');
    expect(fileGroupOf({ type: 'file', content: '["C:\\\\a.bin"]', kind: 'audio' })).toBe('audio');
  });
});
