import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('text','image','file')),
  title TEXT,
  content TEXT NOT NULL,
  source_app TEXT,
  created_at INTEGER NOT NULL,
  sort_order INTEGER,
  starred INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_starred ON items(starred);
`;

// Columns added after the first release. SQLite has no "ADD COLUMN IF NOT
// EXISTS", so each one is checked against the live table before it is added.
const ADDED_COLUMNS: { name: string; ddl: string }[] = [
  { name: 'title', ddl: 'ALTER TABLE items ADD COLUMN title TEXT' },
  { name: 'sort_order', ddl: 'ALTER TABLE items ADD COLUMN sort_order INTEGER' },
];

function migrate(db: Database.Database): void {
  const existing = new Set(
    (db.prepare('PRAGMA table_info(items)').all() as { name: string }[]).map((c) => c.name),
  );
  for (const column of ADDED_COLUMNS) {
    if (!existing.has(column.name)) db.exec(column.ddl);
  }
}

export function createDb(dbPath: string): Database.Database {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  migrate(db);
  registerUnicodeLower(db);
  return db;
}

/**
 * SQLite's own LOWER() and LIKE fold ASCII only, so a search for "боевой"
 * would miss "Боевой". JavaScript knows the full Unicode case map.
 */
function registerUnicodeLower(db: Database.Database): void {
  db.function('lower_unicode', { deterministic: true }, (value: unknown) =>
    typeof value === 'string' ? value.toLowerCase() : null,
  );
}
