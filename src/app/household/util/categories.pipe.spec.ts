import { mockBaseItem, mockCategory } from '../../@shared/testing/test-data';
import { CategoriesPipe } from './categories.pipe';
import { BaseItem } from '../../@shared/model/base-item.types';

describe('CategoriesPipe', () => {
  let pipe: CategoriesPipe;

  const catalog = [
    mockCategory({ id: 'c-a', name: 'A' }),
    mockCategory({ id: 'c-b', name: 'B' }),
  ];

  beforeEach(() => {
    pipe = new CategoriesPipe();
  });

  it('creates an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns "" for an item with no categories, and for no item at all', () => {
    expect(pipe.transform({} as BaseItem)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('resolves the item categoryIds to their joined catalog names', () => {
    const item = mockBaseItem({ categoryIds: ['c-a', 'c-b'] });
    expect(pipe.transform(item, catalog)).toBe('A, B');
  });

  it('drops category ids missing from the catalog', () => {
    const item = mockBaseItem({ categoryIds: ['c-a', 'c-missing'] });
    expect(pipe.transform(item, catalog)).toBe('A');
  });
});
