import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDb } from '../../../src/main/storage/db';
import { createTagsRepo } from '../../../src/main/storage/tags-repo';
import { createItemsRepo } from '../../../src/main/storage/items-repo';
import { createCapturePipeline } from '../../../src/main/clipboard/capture-pipeline';
import { hashContent } from '../../../src/main/clipboard/hash';

function setup(retentionLimit = 1000) {
  const db = createDb(':memory:');
  const tagsRepo = createTagsRepo(db);
  const itemsRepo = createItemsRepo(db, tagsRepo);
  const previewsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copycat-previews-'));
  const added: unknown[] = [];
  const pipeline = createCapturePipeline({
    itemsRepo,
    previewsDir,
    retentionLimit,
    onItemAdded: (item) => added.push(item),
  });
  return { itemsRepo, previewsDir, pipeline, added };
}

describe('capture pipeline', () => {
  it('stores a text snapshot as-is', () => {
    const { pipeline, added, itemsRepo } = setup();
    pipeline({ type: 'text', content: 'hello', hash: hashContent('hello') });
    expect(added).toHaveLength(1);
    expect(itemsRepo.getItems({})[0]).toMatchObject({ type: 'text', content: 'hello' });
  });

  it('saves an image snapshot to disk and stores its path', () => {
    const { pipeline, itemsRepo, previewsDir } = setup();
    const png = Buffer.from([1, 2, 3]);
    pipeline({ type: 'image', pngBuffer: png, hash: hashContent(png) });
    const item = itemsRepo.getItems({})[0];
    expect(item.type).toBe('image');
    expect(item.content.startsWith(previewsDir)).toBe(true);
  });

  it('stores a file snapshot as a JSON path list', () => {
    const { pipeline, itemsRepo } = setup();
    pipeline({ type: 'file', paths: ['C:\\a.txt'], hash: 'h' });
    const item = itemsRepo.getItems({})[0];
    expect(JSON.parse(item.content)).toEqual(['C:\\a.txt']);
  });

  it('prunes to the retention limit after every insert', () => {
    const { pipeline, itemsRepo } = setup(1);
    pipeline({ type: 'text', content: 'a', hash: 'a' });
    pipeline({ type: 'text', content: 'b', hash: 'b' });
    expect(itemsRepo.getItems({})).toHaveLength(1);
  });
});
