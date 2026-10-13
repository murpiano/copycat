import { hashContent } from '../../../src/main/clipboard/hash';

describe('hashContent', () => {
  it('is deterministic for the same input', () => {
    expect(hashContent('hello')).toBe(hashContent('hello'));
  });

  it('differs for different input', () => {
    expect(hashContent('hello')).not.toBe(hashContent('world'));
  });

  it('works on buffers', () => {
    expect(hashContent(Buffer.from('hello'))).toBe(hashContent('hello'));
  });
});
