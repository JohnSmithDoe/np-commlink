import { IBaseItem } from '../../model/types';
import { mockBaseItem, mockCategory } from '../../testing/test-data';
import { CategoriesPipe } from './categories.pipe';

describe('CategoriesPipe', () => {
  let pipe: CategoriesPipe;

  // The list's authoritative {id,name} catalog the pipe resolves ids against.
  const catalog = [
    mockCategory({ id: 'c-a', name: 'A' }),
    mockCategory({ id: 'c-b', name: 'B' }),
  ];

  beforeEach(() => {
    // Pure pipe: no TestBed / DI required.
    pipe = new CategoriesPipe();
  });

  it('creates an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns "" when the item has no categoryIds and no altText', () => {
    expect(pipe.transform({} as IBaseItem)).toBe('');
  });

  it('returns "" when value is undefined and no altText', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns the altText when provided and the item has no categories', () => {
    expect(pipe.transform({} as IBaseItem, catalog, 'no categories')).toBe(
      'no categories'
    );
    expect(pipe.transform(undefined, catalog, 'no categories')).toBe(
      'no categories'
    );
  });

  it('resolves the item categoryIds to their joined catalog names', () => {
    const item = mockBaseItem({ categoryIds: ['c-a', 'c-b'] });
    expect(pipe.transform(item, catalog)).toBe('A, B');
  });

  it('prefers the resolved categories over the altText when they exist', () => {
    const item = mockBaseItem({ categoryIds: ['c-a', 'c-b'] });
    expect(pipe.transform(item, catalog, 'no categories')).toBe('A, B');
  });

  it('drops category ids missing from the catalog', () => {
    const item = mockBaseItem({ categoryIds: ['c-a', 'c-missing'] });
    expect(pipe.transform(item, catalog, 'no categories')).toBe('A');
  });
});
