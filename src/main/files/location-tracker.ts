import fs from 'node:fs';
import path from 'node:path';
import type { ItemsRepo } from '../storage/items-repo';
import { kindFromPath } from '../../shared/file-kind';

export interface LocationTrackerDeps {
  itemsRepo: ItemsRepo;
  /** Copycat-managed image previews are never "moved" by the user; exclude them. */
  previewsDir: string;
  /** Pushed to the renderer whenever a sweep changed something in the DB. */
  onChanged: () => void;
}

export interface LocationTracker {
  /** Re-reads the item list, re-points the watchers at the current set of
   * folders, and checks every tracked path. Cheap enough to call after any
   * item mutation (insert/delete/relink), not just on a timer. */
  refresh(): void;
  stop(): void;
}

interface Tracked {
  itemId: number;
  pathIndex: number;
  fullPath: string;
  dir: string;
  base: string;
  isDirKind: boolean;
}

/** fs.watch's own 'rename' event doesn't say whether a path appeared or
 * disappeared, let alone correlate an old name with a new one, so moves are
 * detected by re-checking existence afterwards rather than from the event
 * payload itself. */
export function createLocationTracker(deps: LocationTrackerDeps): LocationTracker {
  const watchers = new Map<string, fs.FSWatcher>();
  let debounceTimer: NodeJS.Timeout | null = null;
  let sweepTimer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  function isExternal(type: string, content: string): boolean {
    if (type === 'text') return false;
    if (type === 'image') return !content.startsWith(deps.previewsDir);
    return true;
  }

  function trackedPaths(): Tracked[] {
    const out: Tracked[] = [];
    for (const item of deps.itemsRepo.getItems({})) {
      if (!isExternal(item.type, item.content)) continue;
      let paths: string[];
      if (item.type === 'file') {
        try {
          paths = JSON.parse(item.content);
        } catch {
          paths = [item.content];
        }
      } else {
        paths = [item.content];
      }
      paths.forEach((fullPath, pathIndex) => {
        out.push({
          itemId: item.id,
          pathIndex,
          fullPath,
          dir: path.dirname(fullPath),
          base: path.basename(fullPath),
          isDirKind: item.kind === 'folder',
        });
      });
    }
    return out;
  }

  function syncWatchedDirs(dirs: Set<string>): void {
    for (const dir of dirs) {
      if (watchers.has(dir)) continue;
      try {
        const watcher = fs.watch(dir, { persistent: false }, () => scheduleSweep());
        watcher.on('error', () => {
          watcher.close();
          watchers.delete(dir);
        });
        watchers.set(dir, watcher);
      } catch {
        // The folder itself may already be gone; the periodic sweep still
        // notices the item inside it is missing.
      }
    }
    for (const [dir, watcher] of watchers) {
      if (!dirs.has(dir)) {
        watcher.close();
        watchers.delete(dir);
      }
    }
  }

  function scheduleSweep(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(sweep, 200);
  }

  function sweep(): void {
    debounceTimer = null;
    if (stopped) return;

    const tracked = trackedPaths();
    const dirs = new Set(tracked.map((t) => t.dir));
    const dirEntries = new Map<string, Set<string>>();
    const entriesOf = (dir: string): Set<string> => {
      let set = dirEntries.get(dir);
      if (set) return set;
      try {
        set = new Set(fs.readdirSync(dir));
      } catch {
        set = new Set();
      }
      dirEntries.set(dir, set);
      return set;
    };

    // Items with more than one path (a multi-select copy) are reported
    // missing as soon as any of their paths can't be found, but are only
    // auto-relinked when every one of them can be resolved again, so a
    // partially-moved batch doesn't get silently truncated.
    const byItem = new Map<number, Tracked[]>();
    for (const t of tracked) {
      const list = byItem.get(t.itemId) ?? [];
      list.push(t);
      byItem.set(t.itemId, list);
    }

    for (const [itemId, parts] of byItem) {
      const item = deps.itemsRepo.getById(itemId);
      if (!item) continue;
      const resolved: string[] = new Array(parts.length);
      let anyMissing = false;
      let anyChanged = false;
      for (const part of parts) {
        if (entriesOf(part.dir).has(part.base)) {
          resolved[part.pathIndex] = part.fullPath;
          continue;
        }
        const match = findByBasename(part.base, part.isDirKind, dirs, entriesOf);
        if (match) {
          resolved[part.pathIndex] = match;
          anyChanged = true;
        } else {
          anyMissing = true;
          resolved[part.pathIndex] = part.fullPath;
        }
      }

      if (!anyMissing && anyChanged) {
        // 'file' items always store a JSON array, even for a single path;
        // every other trackable type ('image') stores a plain path string.
        const content = item.type === 'file' ? JSON.stringify(resolved) : resolved[0];
        const kind = kindFromPath(resolved[0], parts[0].isDirKind);
        deps.itemsRepo.relinkItem(itemId, content, kind);
        deps.onChanged();
      } else if (anyMissing) {
        if (!item.missing) {
          deps.itemsRepo.setMissing(itemId, Date.now());
          deps.onChanged();
        }
      } else if (item.missing) {
        deps.itemsRepo.setMissing(itemId, null);
        deps.onChanged();
      }
    }

    syncWatchedDirs(dirs);
  }

  function findByBasename(
    base: string,
    isDirKind: boolean,
    dirs: Set<string>,
    entriesOf: (dir: string) => Set<string>,
  ): string | null {
    for (const dir of dirs) {
      if (!entriesOf(dir).has(base)) continue;
      const candidate = path.join(dir, base);
      try {
        const stat = fs.statSync(candidate);
        if (stat.isDirectory() === isDirKind) return candidate;
      } catch {
        // Listed a moment ago, gone again; keep looking elsewhere.
      }
    }
    return null;
  }

  sweep();
  sweepTimer = setInterval(sweep, 60_000);

  return {
    refresh: scheduleSweep,
    stop() {
      stopped = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (sweepTimer) clearInterval(sweepTimer);
      for (const watcher of watchers.values()) watcher.close();
      watchers.clear();
    },
  };
}
