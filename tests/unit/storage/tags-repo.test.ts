import { createDb } from '../../../src/main/storage/db';
import { createTagsRepo } from '../../../src/main/storage/tags-repo';

describe('tags-repo', () => {
  function setup() {
    const db = createDb(':memory:');
    return { db, repo: createTagsRepo(db) };
  }

  it('adds a tag to an item and retrieves it', () => {
    const { db, repo } = setup();
    db.prepare(
      `INSERT INTO items (type, content, source_app, created_at, starred, pinned) VALUES ('text','hi',NULL,1,0,0)`,
    ).run();
    repo.addTagToItem(1, 'Work');
    expect(repo.getTagsForItem(1)).toEqual(['work']);
  });

  it('normalizes tag name case and whitespace to avoid duplicates', () => {
    const { db, repo } = setup();
    db.prepare(
      `INSERT INTO items (type, content, source_app, created_at, starred, pinned) VALUES ('text','hi',NULL,1,0,0)`,
    ).run();
    repo.addTagToItem(1, '  Api ');
    repo.addTagToItem(1, 'api');
    const counts = repo.getAllTagsWithCounts();
    expect(counts).toHaveLength(1);
    expect(counts[0]).toEqual({ name: 'api', count: 1 });
  });

  it('removes a tag association without deleting the tag row', () => {
    const { db, repo } = setup();
    db.prepare(
      `INSERT INTO items (type, content, source_app, created_at, starred, pinned) VALUES ('text','hi',NULL,1,0,0)`,
    ).run();
    repo.addTagToItem(1, 'work');
    repo.removeTagFromItem(1, 'work');
    expect(repo.getTagsForItem(1)).toEqual([]);
  });
});
