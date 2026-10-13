import { clipboard } from 'electron';
import type { ClipboardReader } from './types';

export class ElectronClipboardReader implements ClipboardReader {
  hasFileDrop(): boolean {
    return clipboard.has('FileNameW');
  }

  hasImage(): boolean {
    return !clipboard.readImage().isEmpty();
  }

  readText(): string {
    return clipboard.readText();
  }

  readImagePNG(): Buffer {
    return clipboard.readImage().toPNG();
  }

  readFileDropBuffer(): Buffer {
    return clipboard.readBuffer('FileNameW');
  }
}
