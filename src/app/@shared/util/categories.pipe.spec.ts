import { IBaseItem } from '../types';
import { mockStorageItem } from '../testing/test-data';
import { CategoriesPipe } from './categories.pipe';

describe('CategoriesPipe', () => {
  let pipe: CategoriesPipe;

  beforeEach(() => {
    // Pure pipe: no TestBed / DI required.
    pipe = new CategoriesPipe();
  });

  it('creates an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns "" when the item has no category and no altText', () => {
    expect(pipe.transform({} as IBaseItem)).toBe('');
  });

  it('returns "" when value is undefined and no altText', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns the altText when provided and the item has no category', () => {
    expect(pipe.transform({} as IBaseItem, 'no categories')).toBe(
      'no categories'
    );
    expect(pipe.transform(undefined, 'no categories')).toBe('no categories');
  });

  it('returns the joined categories when categories exist', () => {
    const item = mockStorageItem({ category: ['A', 'B'] });
    expect(pipe.transform(item)).toBe('A, B');
  });

  it('prefers the categories over the altText when categories exist', () => {
    const item = mockStorageItem({ category: ['A', 'B'] });
    expect(pipe.transform(item, 'no categories')).toBe('A, B');
  });
});
