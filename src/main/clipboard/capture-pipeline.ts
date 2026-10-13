import type { ClipboardItem } from '../../shared/types';
import type { ItemsRepo } from '../storage/items-repo';
import type { ClipboardSnapshot } from './types';
import { saveImagePreview } from './image-store';

export interface CapturePipelineDeps {
  itemsRepo: ItemsRepo;
  previewsDir: string;
  retentionLimit: number;
  onItemAdded: (item: ClipboardItem) => void;
}

export function createCapturePipeline(deps: CapturePipelineDeps) {
  return function handleSnapshot(snapshot: ClipboardSnapshot): void {
    let content: string;
    if (snapshot.type === 'image') {
      content = saveImagePreview(deps.previewsDir, snapshot.pngBuffer);
    } else if (snapshot.type === 'file') {
      content = JSON.stringify(snapshot.paths);
    } else {
      content = snapshot.content;
    }

    const item = deps.itemsRepo.insertItem({
      type: snapshot.type,
      content,
      sourceApp: null,
    });
    deps.itemsRepo.pruneToLimit(deps.retentionLimit);
    deps.onItemAdded(item);
  };
}
