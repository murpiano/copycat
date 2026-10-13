import type Database from 'better-sqlite3';

export interface TagCount {
  name: string;
  count: number;
}

export interface TagsRepo {
  addTagToItem(itemId: number, tagName: string): void;
  removeTagFromItem(itemId: number, tagName: string): void;
  getTagsForItem(itemId: number): string[];
  getAllTagsWithCounts(): TagCount[];
}

function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

export function createTagsRepo(db: Database.Database): TagsRepo {
  return {
    addTagToItem(itemId, tagName) {
      const name = normalizeTagName(tagName);
      if (!name) return;
      db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(name);
      const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(name) as { id: number };
      db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)').run(
        itemId,
        tag.id,
      );
    },
    removeTagFromItem(itemId, tagName) {
      const name = normalizeTagName(tagName);
      db.prepare(
        `DELETE FROM item_tags WHERE item_id = ? AND tag_id = (SELECT id FROM tags WHERE name = ?)`,
      ).run(itemId, name);
    },
    getTagsForItem(itemId) {
      return (
        db
          .prepare(
            `SELECT tags.name as name FROM tags
             JOIN item_tags ON item_tags.tag_id = tags.id
             WHERE item_tags.item_id = ?
             ORDER BY tags.name`,
          )
          .all(itemId) as { name: string }[]
      ).map((r) => r.name);
    },
    getAllTagsWithCounts() {
      return db
        .prepare(
          `SELECT tags.name as name, COUNT(item_tags.item_id) as count
           FROM tags LEFT JOIN item_tags ON item_tags.tag_id = tags.id
           GROUP BY tags.id ORDER BY count DESC, tags.name ASC`,
        )
        .all() as TagCount[];
    },
  };
}
