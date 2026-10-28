import { createDb } from '../../../src/main/storage/db';
import { createTagsRepo } from '../../../src/main/storage/tags-repo';
import { createItemsRepo } from '../../../src/main/storage/items-repo';
import { MAX_CONTENT_LENGTH } from '../../../src/shared/config';

function setup() {
  const db = createDb(':memory:');
  const tagsRepo = createTagsRepo(db);
  const itemsRepo = createItemsRepo(db, tagsRepo);
  return { db, tagsRepo, itemsRepo };
}

describe('items-repo', () => {
  it('inserts and retrieves an item with its tags', () => {
    const { itemsRepo, tagsRepo } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'hello', sourceApp: 'notepad' });
    tagsRepo.addTagToItem(item.id, 'work');
    const found = itemsRepo.getById(item.id);
    expect(found).toMatchObject({ type: 'text', content: 'hello', starred: false, pinned: false });
    expect(found!.tags).toEqual(['work']);
  });

  it('renames an item and edits its content', () => {
    const { itemsRepo } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'hello', sourceApp: null });
    expect(item.title).toBeNull();
    itemsRepo.updateItem(item.id, { title: '  Моя команда  ', content: 'bye' });
    expect(itemsRepo.getById(item.id)).toMatchObject({ title: 'Моя команда', content: 'bye' });
  });

  it('clears the title back to the default label when it is blanked', () => {
    const { itemsRepo } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'hello', sourceApp: null });
    itemsRepo.updateItem(item.id, { title: 'named' });
    itemsRepo.updateItem(item.id, { title: '   ' });
    expect(itemsRepo.getById(item.id)!.title).toBeNull();
  });

  it('ignores case in Cyrillic, which SQLite LIKE does not', () => {
    const { itemsRepo } = setup();
    const item = itemsRepo.insertItem({
      type: 'text',
      content: 'Здравствуйте, коллеги',
      sourceApp: null,
    });
    expect(itemsRepo.getItems({ search: 'ЗДРАВСТВУЙТЕ' }).map((i) => i.id)).toEqual([item.id]);
    expect(itemsRepo.getItems({ search: 'коллеги' }).map((i) => i.id)).toEqual([item.id]);
  });

  it('finds a card by the name the user gave it', () => {
    const { itemsRepo } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'ssh root@host', sourceApp: null });
    itemsRepo.updateItem(item.id, { title: 'Боевой сервер' });
    expect(itemsRepo.getItems({ search: 'боевой' }).map((i) => i.id)).toEqual([item.id]);
    expect(itemsRepo.getItems({ search: 'ssh' }).map((i) => i.id)).toEqual([item.id]);
  });

  it('serves the manual order to ordered views only', () => {
    const { itemsRepo } = setup();
    const first = itemsRepo.insertItem({ type: 'text', content: 'first', sourceApp: null });
    const second = itemsRepo.insertItem({ type: 'text', content: 'second', sourceApp: null });
    itemsRepo.reorderItems([first.id, second.id]);
    expect(itemsRepo.getItems({ ordered: true }).map((i) => i.id)).toEqual([first.id, second.id]);
    // Without the flag the newest capture still comes first.
    expect(itemsRepo.getItems({}).map((i) => i.id)).toEqual([second.id, first.id]);
  });

  it('truncates content longer than MAX_CONTENT_LENGTH', () => {
    const { itemsRepo } = setup();
    const longText = 'a'.repeat(MAX_CONTENT_LENGTH + 500);
    const item = itemsRepo.insertItem({ type: 'text', content: longText, sourceApp: null });
    expect(item.content).toHaveLength(MAX_CONTENT_LENGTH);
  });

  it('filters by search, type, and tags', () => {
    const { itemsRepo, tagsRepo } = setup();
    const a = itemsRepo.insertItem({ type: 'text', content: 'docker compose', sourceApp: null });
    const b = itemsRepo.insertItem({ type: 'text', content: 'python script', sourceApp: null });
    tagsRepo.addTagToItem(a.id, 'docker');

    expect(itemsRepo.getItems({ search: 'docker' }).map((i) => i.id)).toEqual([a.id]);
    expect(itemsRepo.getItems({ tags: ['docker'] }).map((i) => i.id)).toEqual([a.id]);
    expect(itemsRepo.getItems({}).map((i) => i.id).sort()).toEqual([a.id, b.id].sort());
  });

  it('toggles starred and prunes oldest non-starred items beyond the limit', () => {
    const { itemsRepo } = setup();
    const first = itemsRepo.insertItem({ type: 'text', content: '1', sourceApp: null });
    itemsRepo.toggleStar(first.id);
    itemsRepo.insertItem({ type: 'text', content: '2', sourceApp: null });
    itemsRepo.insertItem({ type: 'text', content: '3', sourceApp: null });

    const deleted = itemsRepo.pruneToLimit(1);
    expect(deleted).toBe(1);
    const remaining = itemsRepo.getItems({}).map((i) => i.content).sort();
    expect(remaining).toEqual(['1', '3']);
  });

  it('deletes an item', () => {
    const { itemsRepo } = setup();
    const item = itemsRepo.insertItem({ type: 'text', content: 'x', sourceApp: null });
    itemsRepo.deleteItem(item.id);
    expect(itemsRepo.getById(item.id)).toBeNull();
  });
});
