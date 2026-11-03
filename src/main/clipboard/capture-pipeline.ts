import type { ClipboardItem } from '../../shared/types';
import type { ItemsRepo } from '../storage/items-repo';
import type { ClipboardSnapshot } from './types';
import { saveImagePreview, saveSvgPreview } from './image-store';
import fs from 'node:fs';
import path from 'node:path';
import { kindFromPath } from '../../shared/file-kind';
import type { ItemKind } from '../../shared/types';

export interface CapturePipelineDeps {
  itemsRepo: ItemsRepo;
  previewsDir: string;
  retentionLimit: number;
  onItemAdded: (item: ClipboardItem) => void;
}

export function cleanupUnusedPreviews(previewsDir: string, itemsRepo: ItemsRepo): void {
  if (!fs.existsSync(previewsDir)) return;
  const referenced = new Set(itemsRepo.getItems({ type: 'image' }).map((x) => x.content));
  for (const name of fs.readdirSync(previewsDir)) {
    if (!/\.(png|svg)$/i.test(name)) continue;
    const file = path.join(previewsDir, name);
    if (!referenced.has(file)) fs.rmSync(file, { force: true });
  }
}

export function createCapturePipeline(deps: CapturePipelineDeps) {
  return function handleSnapshot(snapshot: ClipboardSnapshot): void {
    let content: string;
    let kind: ItemKind;
    if (snapshot.type === 'image-file') {
      content = snapshot.path;
      kind = 'image';
    } else if (snapshot.type === 'image') {
      content = saveImagePreview(deps.previewsDir, snapshot.pngBuffer);
      kind = 'image';
    } else if (snapshot.type === 'svg') {
      content = saveSvgPreview(deps.previewsDir, snapshot.svgBuffer);
      kind = 'image';
    } else if (snapshot.type === 'file') {
      content = JSON.stringify(snapshot.paths);
      const kinds = snapshot.paths.map((filePath) => {
        let isDirectory = false;
        try { isDirectory = fs.statSync(filePath).isDirectory(); } catch { /* unavailable paths are generic files */ }
        return kindFromPath(filePath, isDirectory);
      });
      kind = kinds.every((value) => value === kinds[0]) ? kinds[0] : 'file';
    } else {
      content = snapshot.content;
      kind = 'text';
    }

    const item = deps.itemsRepo.insertItem({
      type: snapshot.type === 'svg' || snapshot.type === 'image-file' ? 'image' : snapshot.type,
      content,
      kind,
      sourceApp: null,
    });
    deps.itemsRepo.pruneToLimit(deps.retentionLimit);
    // Retention removes DB rows; remove only generated previews no longer referenced.
    cleanupUnusedPreviews(deps.previewsDir, deps.itemsRepo);
    deps.onItemAdded(item);
  };
}
