import { matchesClearHistory } from '../../../src/shared/clear-history';
import type { ClipboardItem, ClearHistoryInput } from '../../../src/shared/types';

const base: ClipboardItem = {
  id: 1, type: 'text', kind: 'text', title: null, content: 'x', sourceApp: null,
  createdAt: 100, sortOrder: null, starred: false, pinned: false, tags: [],
};
const item = (changes: Partial<ClipboardItem> = {}): ClipboardItem => ({ ...base, ...changes });
const input = (changes: Partial<ClearHistoryInput> = {}): ClearHistoryInput => ({ scope: 'all', exclude: [], ...changes });

describe('matchesClearHistory', () => {
  it('respects period and main sections', () => {
    expect(matchesClearHistory(item(), input({ since: 101 }))).toBe(false);
    expect(matchesClearHistory(item(), input({ scope: 'text' }))).toBe(true);
    expect(matchesClearHistory(item(), input({ scope: 'file' }))).toBe(false);
    expect(matchesClearHistory(item({ starred: true }), input({ scope: 'starred' }))).toBe(true);
    expect(matchesClearHistory(item({ tags: ['work'] }), input({ scope: 'category' }))).toBe(true);
    expect(matchesClearHistory(item({ tags: ['work'] }), input({ scope: 'category', category: 'other' }))).toBe(false);
  });

  it('selects only the requested file subgroup', () => {
    const image = item({ type: 'image', kind: 'image', content: 'C:/photo.png' });
    expect(matchesClearHistory(image, input({ scope: 'file', fileGroup: 'images' }))).toBe(true);
    expect(matchesClearHistory(image, input({ scope: 'file', fileGroup: 'documents' }))).toBe(false);
  });

  it('preserves overlapping exclusions across sections and subgroups', () => {
    const image = item({ type: 'image', kind: 'image', starred: true, tags: ['work'] });
    expect(matchesClearHistory(image, input({ exclude: ['starred'] }))).toBe(false);
    expect(matchesClearHistory(image, input({ exclude: ['files'] }))).toBe(false);
    expect(matchesClearHistory(image, input({ exclude: ['file:images'] }))).toBe(false);
    expect(matchesClearHistory(image, input({ exclude: ['categories'] }))).toBe(false);
    expect(matchesClearHistory(image, input({ exclude: ['category:work'] }))).toBe(false);
    expect(matchesClearHistory(image, input({ exclude: ['text', 'file:audio'] }))).toBe(true);
    expect(matchesClearHistory(item(), input({ exclude: ['text'] }))).toBe(false);
  });
});
