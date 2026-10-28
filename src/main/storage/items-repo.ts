import type Database from 'better-sqlite3';
import type {
  ClipboardItem,
  GetItemsQuery,
  ItemType,
  UpdateItemInput,
} from '../../shared/types';
import { MAX_CONTENT_LENGTH } from '../../shared/config';
import type { TagsRepo } from './tags-repo';

export interface InsertItemInput {
  type: ItemType;
  content: string;
  sourceApp: string | null;
}

export interface ItemsRepo {
  insertItem(input: InsertItemInput): ClipboardItem;
  getItems(query: GetItemsQuery): ClipboardItem[];
  getById(id: number): ClipboardItem | null;
  toggleStar(id: number): void;
  updateItem(id: number, input: UpdateItemInput): void;
  reorderItems(ids: number[]): void;
  deleteItem(id: number): void;
  pruneToLimit(limit: number): number;
}

interface ItemRow {
  id: number;
  type: ItemType;
  title: string | null;
  content: string;
  source_app: string | null;
  created_at: number;
  sort_order: number | null;
  starred: number;
  pinned: number;
}

export function createItemsRepo(db: Database.Database, tagsRepo: TagsRepo): ItemsRepo {
  const insertStmt = db.prepare(
    `INSERT INTO items (type, content, source_app, created_at, starred, pinned)
     VALUES (?, ?, ?, ?, 0, 0)`,
  );
  const byIdStmt = db.prepare(`SELECT * FROM items WHERE id = ?`);
  const toggleStarStmt = db.prepare(`UPDATE items SET starred = 1 - starred WHERE id = ?`);
  const titleStmt = db.prepare(`UPDATE items SET title = ? WHERE id = ?`);
  const contentStmt = db.prepare(`UPDATE items SET content = ? WHERE id = ?`);
  const sortOrderStmt = db.prepare(`UPDATE items SET sort_order = ? WHERE id = ?`);
  const deleteStmt = db.prepare(`DELETE FROM items WHERE id = ?`);

  function rowToItem(row: ItemRow): ClipboardItem {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      sourceApp: row.source_app,
      createdAt: row.created_at,
      sortOrder: row.sort_order,
      starred: row.starred === 1,
      pinned: row.pinned === 1,
      tags: tagsRepo.getTagsForItem(row.id),
    };
  }

  return {
    insertItem(input) {
      const content =
        input.content.length > MAX_CONTENT_LENGTH
          ? input.content.slice(0, MAX_CONTENT_LENGTH)
          : input.content;
      const createdAt = Date.now();
      const result = insertStmt.run(input.type, content, input.sourceApp, createdAt);
      return rowToItem(byIdStmt.get(result.lastInsertRowid) as ItemRow);
    },

    getItems(query) {
      const clauses: string[] = [];
      const params: unknown[] = [];
      let sql = 'SELECT DISTINCT items.* FROM items';

      if (query.tags && query.tags.length > 0) {
        sql +=
          ' JOIN item_tags ON item_tags.item_id = items.id JOIN tags ON tags.id = item_tags.tag_id';
        clauses.push(`tags.name IN (${query.tags.map(() => '?').join(',')})`);
        params.push(...query.tags.map((t) => t.trim().toLowerCase()));
      }
      if (query.onlyStarred) clauses.push('items.starred = 1');
      if (query.type) {
        clauses.push('items.type = ?');
        params.push(query.type);
      }
      if (query.search) {
        // A card renamed by the user is found by that name, not only by the
        // text it holds. lower_unicode folds Cyrillic, which SQLite's own
        // LIKE does not.
        clauses.push(
          '(lower_unicode(items.content) LIKE ? OR lower_unicode(items.title) LIKE ?)',
        );
        const needle = `%${query.search.toLowerCase()}%`;
        params.push(needle, needle);
      }
      if (clauses.length > 0) sql += ' WHERE ' + clauses.join(' AND ');
      // Manually ordered views put the dragged cards first; items never dragged
      // keep their sort_order NULL and fall back to newest-first behind them.
      sql += query.ordered
        ? ' ORDER BY items.sort_order IS NULL, items.sort_order ASC,' +
          ' items.created_at DESC, items.id DESC'
        : ' ORDER BY items.pinned DESC, items.created_at DESC, items.id DESC';

      const rows = db.prepare(sql).all(...params) as ItemRow[];
      return rows.map(rowToItem);
    },

    getById(id) {
      const row = byIdStmt.get(id) as ItemRow | undefined;
      return row ? rowToItem(row) : null;
    },

    toggleStar(id) {
      toggleStarStmt.run(id);
    },

    updateItem(id, input) {
      if (input.title !== undefined) {
        const title = input.title === null ? null : input.title.trim();
        titleStmt.run(title ? title : null, id);
      }
      if (input.content !== undefined) {
        const content =
          input.content.length > MAX_CONTENT_LENGTH
            ? input.content.slice(0, MAX_CONTENT_LENGTH)
            : input.content;
        contentStmt.run(content, id);
      }
    },

    reorderItems(ids) {
      const apply = db.transaction((ordered: number[]) => {
        ordered.forEach((id, index) => sortOrderStmt.run(index, id));
      });
      apply(ids);
    },

    deleteItem(id) {
      deleteStmt.run(id);
    },

    pruneToLimit(limit) {
      const result = db
        .prepare(
          `DELETE FROM items WHERE id IN (
             SELECT id FROM items WHERE starred = 0
             ORDER BY created_at DESC, id DESC LIMIT -1 OFFSET ?
           )`,
        )
        .run(limit);
      return result.changes;
    },
  };
}
