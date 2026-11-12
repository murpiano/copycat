import { clipboard, nativeImage } from 'electron';
import { readFileSync } from 'node:fs';
import type { ClipboardReader } from './types';
import { parseFileDropBuffer } from './file-drop';
import { decodeFilenamesPboardBuffer, parseFileUrlBuffer } from './mac-pasteboard';

export class ElectronClipboardReader implements ClipboardReader {
  hasFileDrop(): boolean {
    if (process.platform === 'darwin') {
      return clipboard.has('NSFilenamesPboardType') || clipboard.has('public.file-url');
    }
    return clipboard.has('FileNameW');
  }

  hasImage(): boolean {
    // Chromium's nativeImage decoder recognises the clipboard image formats
    // it ships with, but some cross-OS clipboard bridges (e.g. Windows ->
    // WSLg) advertise an image/* MIME type whose payload it fails to decode;
    // readImage() then comes back empty and the capture would wrongly fall
    // through to readText(), storing the raw bytes as garbled text.
    if (!clipboard.readImage().isEmpty()) return true;
    return clipboard.availableFormats().some((format) => format.startsWith('image/'));
  }

  readText(): string {
    return clipboard.readText();
  }

  readImagePNG(): Buffer {
    return clipboard.readImage().toPNG();
  }

  readFileDropPaths(): string[] {
    if (process.platform === 'darwin') {
      if (clipboard.has('NSFilenamesPboardType')) {
        return decodeFilenamesPboardBuffer(clipboard.readBuffer('NSFilenamesPboardType'));
      }
      return parseFileUrlBuffer(clipboard.readBuffer('public.file-url'));
    }
    return parseFileDropBuffer(clipboard.readBuffer('FileNameW'));
  }

  readFileAsImagePNG(filePath: string): Buffer | null {
    try {
      const img = nativeImage.createFromPath(filePath);
      if (img.isEmpty()) return null;
      return img.toPNG();
    } catch {
      return null;
    }
  }

  readFileAsSVG(filePath: string): Buffer | null {
    try {
      return readFileSync(filePath);
    } catch {
      return null;
    }
  }
}
