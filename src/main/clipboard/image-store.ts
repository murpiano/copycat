import fs from 'node:fs';
import path from 'node:path';
import { nativeImage } from 'electron';
import { hashContent } from './hash';

/** Cards in the grid never need more than this on their longest side; the
 * full-resolution file (used for the expanded view and for copy/paste) is
 * kept untouched alongside it. */
const MAX_THUMB_DIMENSION = 480;

export function thumbPathFor(filePath: string): string | null {
  return filePath.endsWith('.png') ? `${filePath.slice(0, -4)}.thumb.png` : null;
}

function writeThumbnail(filePath: string, pngBuffer: Buffer): void {
  const thumbPath = thumbPathFor(filePath);
  if (!thumbPath) return;
  try {
    const image = nativeImage.createFromBuffer(pngBuffer);
    const { width, height } = image.getSize();
    // Already small enough: the original itself is a fine thumbnail, no
    // second file needed.
    if (width <= MAX_THUMB_DIMENSION && height <= MAX_THUMB_DIMENSION) return;
    const scale = MAX_THUMB_DIMENSION / Math.max(width, height);
    const resized = image.resize({
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    });
    fs.writeFileSync(thumbPath, resized.toPNG());
  } catch {
    // Thumbnailing is an optimization; the full image still renders fine without one.
  }
}

export function saveImagePreview(previewsDir: string, pngBuffer: Buffer): string {
  fs.mkdirSync(previewsDir, { recursive: true });
  const filePath = path.join(previewsDir, `${hashContent(pngBuffer)}.png`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, pngBuffer);
    writeThumbnail(filePath, pngBuffer);
  }
  return filePath;
}

export function saveSvgPreview(previewsDir: string, svgBuffer: Buffer): string {
  fs.mkdirSync(previewsDir, { recursive: true });
  const filePath = path.join(previewsDir, `${hashContent(svgBuffer)}.svg`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, svgBuffer);
  }
  return filePath;
}
