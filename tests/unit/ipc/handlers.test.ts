import { createDb } from '../../../src/main/storage/db';
import { createTagsRepo } from '../../../src/main/storage/tags-repo';
import { createItemsRepo } from '../../../src/main/storage/items-repo';
import {
  handleGetItems,
  handleCopyItem,
  handlePasteItem,
  handleToggleStar,
  handleAddTag,
  handleRemoveTag,
  handleSetTags,
  handleUpdateItem,
  handleReorderItems,
  handleDeleteItem,
  type IpcDeps,
} from '../../../src/main/ipc/handlers';

function setup() {
  const db = createDb(':memory:');
  const tagsRepo = createTagsRepo(db);
  const itemsRepo = createItemsRepo(db, tagsRepo);
  const copied: unknown[] = [];
  const pasted: unknown[] = [];
  const deps: IpcDeps = {
    itemsRepo,
    tagsRepo,
    copyToClipboard: (item) => copied.push(item),
    pasteActive: (item) => pasted.push(item),
  };
  return { deps, itemsRepo, copied, pasted };
}

describe('ipc handlers', () => {
  it('get-items returns items with tags attached', async () => {
    const { deps, itemsRepo } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'x', sourceApp: null });
    deps.tagsRepo.addTagToItem(item.id, 'work');

    const result = await handleGetItems(deps, {});
    expect(result[0].tags).toEqual(['work']);
  });

  it('copy-item invokes copyToClipboard with the stored item', async () => {
    const { deps, itemsRepo, copied } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'x', sourceApp: null });

    await handleCopyItem(deps, item.id);
    expect(copied).toHaveLength(1);
  });

  it('copy-item on a missing id is a no-op', async () => {
    const { deps, copied } = setup();
    await handleCopyItem(deps, 999);
    expect(copied).toHaveLength(0);
  });

  it('paste-item invokes pasteActive with the stored item', async () => {
    const { deps, itemsRepo, pasted } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'x', sourceApp: null });

    await handlePasteItem(deps, item.id);
    expect(pasted).toHaveLength(1);
  });

  it('toggle-star, add-tag, remove-tag, delete-item mutate storage', async () => {
    const { deps, itemsRepo } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'x', sourceApp: null });

    await handleToggleStar(deps, item.id);
    expect(itemsRepo.getById(item.id)!.starred).toBe(true);

    await handleAddTag(deps, item.id, 'work');
    expect(itemsRepo.getById(item.id)!.tags).toEqual(['work']);

    await handleRemoveTag(deps, item.id, 'work');
    expect(itemsRepo.getById(item.id)!.tags).toEqual([]);

    await handleDeleteItem(deps, item.id);
    expect(itemsRepo.getById(item.id)).toBeNull();
  });

  it('set-tags replaces the whole tag set of an item', async () => {
    const { deps, itemsRepo } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'hello', sourceApp: null });
    await handleSetTags(deps, item.id, ['Work', 'docs']);
    expect(itemsRepo.getById(item.id)!.tags).toEqual(['docs', 'work']);
    await handleSetTags(deps, item.id, ['docs']);
    expect(itemsRepo.getById(item.id)!.tags).toEqual(['docs']);
  });

  it('update-item and reorder-items reach storage', async () => {
    const { deps, itemsRepo } = setup();
    const first = itemsRepo.insertItem({ type: 'text', content: 'a', sourceApp: null });
    const second = itemsRepo.insertItem({ type: 'text', content: 'b', sourceApp: null });
    await handleUpdateItem(deps, first.id, { title: 'named', content: 'edited' });
    expect(itemsRepo.getById(first.id)).toMatchObject({ title: 'named', content: 'edited' });
    await handleReorderItems(deps, [second.id, first.id]);
    expect(itemsRepo.getItems({ ordered: true }).map((i) => i.id)).toEqual([second.id, first.id]);
  });
});
