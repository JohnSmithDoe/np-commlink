import { ICategoryList } from '../../model/category.types';
import { mockBaseItem, mockCategory } from '../../testing/test-data';
import {
  addToCatalog,
  dropCategoryRef,
  remapCategoryRef,
  removeFromCatalog,
  renameInCatalog,
} from './category-list.utils';

const catalog = (...names: [string, string][]): ICategoryList => ({
  id: '_probe-categories',
  items: names.map(([id, name]) => mockCategory({ id, name })),
});

describe('addToCatalog', () => {
  it('prepends a pre-minted category', () => {
    expect(
      addToCatalog(
        catalog(['dairy', 'Dairy']),
        mockCategory({
          id: 'bake',
          name: 'Bakery',
        })
      ).items.map((entry) => entry.id)
    ).toEqual(['bake', 'dairy']);
  });

  it('is a no-op on a duplicate id, a case-insensitive duplicate name, or a blank name', () => {
    const start = catalog(['dairy', 'Dairy']);

    expect(addToCatalog(start, mockCategory({ id: 'dairy', name: 'X' }))).toBe(
      start
    );
    expect(
      addToCatalog(start, mockCategory({ id: 'new', name: 'dairy' }))
    ).toBe(start);
    expect(addToCatalog(start, mockCategory({ id: 'new', name: '  ' }))).toBe(
      start
    );
  });
});

describe('renameInCatalog', () => {
  it('renames in place and reports no merge, so no item needs touching', () => {
    const { catalog: next, mergedInto } = renameInCatalog(
      catalog(['dairy', 'Dairy']),
      'dairy',
      'Fridge'
    );

    expect(next.items).toEqual([{ id: 'dairy', name: 'Fridge' }]);
    expect(mergedInto).toBeUndefined();
  });

  // The survivor id is what the caller remaps its own references onto — the
  // reason this reports a merge instead of silently performing one.
  it('merges onto an existing name: drops the entry and names the survivor', () => {
    const { catalog: next, mergedInto } = renameInCatalog(
      catalog(['fresh', 'Fresh'], ['dairy', 'Dairy']),
      'dairy',
      'fresh'
    );

    expect(next.items.map((entry) => entry.id)).toEqual(['fresh']);
    expect(mergedInto).toBe('fresh');
  });

  it('is a no-op for a blank new name or an unknown id', () => {
    const start = catalog(['dairy', 'Dairy']);

    expect(renameInCatalog(start, 'dairy', '  ').catalog).toBe(start);
    expect(renameInCatalog(start, 'nope', 'X').catalog).toBe(start);
  });
});

describe('removeFromCatalog', () => {
  it('removes the entry by id', () => {
    expect(
      removeFromCatalog(
        catalog(['dairy', 'Dairy'], ['fresh', 'Fresh']),
        'dairy'
      ).items.map((entry) => entry.name)
    ).toEqual(['Fresh']);
  });
});

describe('dropCategoryRef', () => {
  it('strips the id off every item that referenced it', () => {
    const items = [
      mockBaseItem({ id: 'a', categoryIds: ['dairy', 'fresh'] }),
      mockBaseItem({ id: 'b', categoryIds: ['fresh'] }),
      mockBaseItem({ id: 'c' }),
    ];

    expect(
      dropCategoryRef(items, 'dairy').map((item) => item.categoryIds)
    ).toEqual([['fresh'], ['fresh'], undefined]);
  });
});

describe('remapCategoryRef', () => {
  it('points references at the survivor without duplicating an existing one', () => {
    const items = [mockBaseItem({ id: 'a', categoryIds: ['dairy', 'fresh'] })];

    expect(remapCategoryRef(items, 'dairy', 'fresh')[0].categoryIds).toEqual([
      'fresh',
    ]);
  });
});
