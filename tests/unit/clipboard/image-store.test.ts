import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { saveImagePreview } from '../../../src/main/clipboard/image-store';

describe('saveImagePreview', () => {
  it('writes the PNG buffer to the previews dir and returns its path', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'copycat-previews-'));
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const filePath = saveImagePreview(dir, png);

    expect(filePath.endsWith('.png')).toBe(true);
    expect(fs.readFileSync(filePath)).toEqual(png);
  });

  it('reuses the same file for identical image content', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'copycat-previews-'));
    const png = Buffer.from([1, 2, 3]);

    const first = saveImagePreview(dir, png);
    const second = saveImagePreview(dir, png);

    expect(first).toBe(second);
  });
});
