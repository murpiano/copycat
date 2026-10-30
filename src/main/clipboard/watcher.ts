import { hashContent } from './hash';
import { parseFileDropBuffer } from './file-drop';
import type { ClipboardReader, ClipboardSnapshot } from './types';
import { POLL_INTERVAL_MS } from '../../shared/config';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.ico', '.tiff', '.tif', '.avif']);

function isImagePath(p: string): boolean {
  const dot = p.lastIndexOf('.');
  return dot !== -1 && IMAGE_EXTS.has(p.slice(dot).toLowerCase());
}

export type CaptureCallback = (snapshot: ClipboardSnapshot) => void;

export class ClipboardWatcher {
  private lastHash: string | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private reader: ClipboardReader,
    private onCapture: CaptureCallback,
    private pollMs: number = POLL_INTERVAL_MS,
  ) {}

  /**
   * Record a hash as "already seen" without emitting a capture. Call this
   * right before writing content to the OS clipboard ourselves (e.g. when
   * the user re-copies a history item) so the next poll doesn't mistake our
   * own write for a new external clipboard entry.
   */
  markSelfWrite(hash: string): void {
    this.lastHash = hash;
  }

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
      if (paths.length === 1 && isImagePath(paths[0]) && this.reader.readFileAsImagePNG) {
        const pngBuffer = this.reader.readFileAsImagePNG(paths[0]);
        if (pngBuffer && pngBuffer.length > 0) {
          return { type: 'image', pngBuffer, hash: hashContent(pngBuffer) };
        }
      }
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
