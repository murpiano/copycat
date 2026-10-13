import { ClipboardWatcher } from '../../../src/main/clipboard/watcher';
import type { ClipboardReader } from '../../../src/main/clipboard/types';

class FakeReader implements ClipboardReader {
  fileDrop: Buffer | null = null;
  image: Buffer | null = null;
  text = '';

  hasFileDrop() {
    return this.fileDrop !== null && this.fileDrop.length > 0;
  }
  hasImage() {
    return this.image !== null && this.image.length > 0;
  }
  readText() {
    return this.text;
  }
  readImagePNG() {
    return this.image ?? Buffer.alloc(0);
  }
  readFileDropBuffer() {
    return this.fileDrop ?? Buffer.alloc(0);
  }
}

describe('ClipboardWatcher', () => {
  it('captures text once per unique value', () => {
    const reader = new FakeReader();
    reader.text = 'hello';
    const captured: unknown[] = [];
    const watcher = new ClipboardWatcher(reader, (s) => captured.push(s));

    watcher.pollOnce();
    watcher.pollOnce();
    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({ type: 'text', content: 'hello' });
  });

  it('skips empty or whitespace-only text', () => {
    const reader = new FakeReader();
    const captured: unknown[] = [];
    const watcher = new ClipboardWatcher(reader, (s) => captured.push(s));

    reader.text = '';
    watcher.pollOnce();
    reader.text = '   \n\t';
    watcher.pollOnce();
    expect(captured).toHaveLength(0);
  });

  it('captures a new value after a change', () => {
    const reader = new FakeReader();
    const captured: unknown[] = [];
    const watcher = new ClipboardWatcher(reader, (s) => captured.push(s));

    reader.text = 'first';
    watcher.pollOnce();
    reader.text = 'second';
    watcher.pollOnce();
    expect(captured).toHaveLength(2);
  });

  it('captures file-drop paths and skips malformed empty buffers', () => {
    const reader = new FakeReader();
    const captured: unknown[] = [];
    const watcher = new ClipboardWatcher(reader, (s) => captured.push(s));

    reader.fileDrop = Buffer.from('C:\\a.txt\u0000\u0000', 'ucs2');
    watcher.pollOnce();
    expect(captured).toEqual([
      { type: 'file', paths: ['C:\\a.txt'], hash: expect.any(String) },
    ]);
  });

  it('captures image PNG buffers and ignores empty image buffers', () => {
    const reader = new FakeReader();
    const captured: unknown[] = [];
    const watcher = new ClipboardWatcher(reader, (s) => captured.push(s));

    reader.image = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    watcher.pollOnce();
    expect(captured).toHaveLength(1);
    expect((captured[0] as { type: string }).type).toBe('image');
  });
});
