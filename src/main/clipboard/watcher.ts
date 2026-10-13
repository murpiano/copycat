import { hashContent } from './hash';
import { parseFileDropBuffer } from './file-drop';
import type { ClipboardReader, ClipboardSnapshot } from './types';
import { POLL_INTERVAL_MS } from '../../shared/config';

export type CaptureCallback = (snapshot: ClipboardSnapshot) => void;

export class ClipboardWatcher {
  private lastHash: string | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private reader: ClipboardReader,
    private onCapture: CaptureCallback,
    private pollMs: number = POLL_INTERVAL_MS,
  ) {}

  pollOnce(): void {
    const snapshot = this.capture();
    if (!snapshot || snapshot.hash === this.lastHash) return;
    this.lastHash = snapshot.hash;
    this.onCapture(snapshot);
  }

  private capture(): ClipboardSnapshot | null {
    if (this.reader.hasFileDrop()) {
      const paths = parseFileDropBuffer(this.reader.readFileDropBuffer());
      if (paths.length === 0) return null;
      return { type: 'file', paths, hash: hashContent(paths.join('|')) };
    }
    if (this.reader.hasImage()) {
      const pngBuffer = this.reader.readImagePNG();
      if (!pngBuffer || pngBuffer.length === 0) return null;
      return { type: 'image', pngBuffer, hash: hashContent(pngBuffer) };
    }
    const text = this.reader.readText();
    if (!text || text.trim().length === 0) return null;
    return { type: 'text', content: text, hash: hashContent(text) };
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.pollOnce(), this.pollMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
