import fs from 'node:fs';
import path from 'node:path';
import { hashContent } from './hash';

export function saveImagePreview(previewsDir: string, pngBuffer: Buffer): string {
  fs.mkdirSync(previewsDir, { recursive: true });
  const filePath = path.join(previewsDir, `${hashContent(pngBuffer)}.png`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, pngBuffer);
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
