import { IStorageItem } from '../../model';
import {
  filterAndSortItemList,
  filterBySearchQuery,
  selectListCategories,
  sortCategoriesFn,
  sortItemListFn,
} from './grocery-list.selector';
import { mockListSettings } from '../../../@shared/testing/test-data';
import {
  mockGroceryLists,
  mockProduct,
  mockProductsState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/grocery.test-data';

describe('item-list.selector', () => {
  describe('filterBySearchQuery', () => {
    it('returns undefined without a search query', () => {
      const lists = mockGroceryLists();
      expect(filterBySearchQuery(lists, lists.storage)).toBeUndefined();
    });

    it('returns the list items matching the query and flags an exact match', () => {
      const listState = mockStorageState({
        searchQuery: 'Milk',
        items: [
          mockStorageItem({ id: 'a', name: 'Milk' }),
          mockStorageItem({ id: 'b', name: 'Milkshake' }),
          mockStorageItem({ id: 'c', name: 'Bread' }),
        ],
      });
      const lists = mockGroceryLists({ storage: listState });
      const result = filterBySearchQuery(lists, listState);
      expect(result?.listItems.map((i) => i.name)).toEqual([
        'Milk',
        'Milkshake',
      ]);
      expect(result?.exactMatch?.name).toBe('Milk');
      expect(result?.searchTerm).toBe('Milk');
    });

    it('includes matching global items when the setting is enabled', () => {
      const listState = mockStorageState({
        searchQuery: 'Sug',
        items: [mockStorageItem({ id: 'a', name: 'Salt' })],
      });
      const lists = mockGroceryLists({
        storage: listState,
        products: mockProductsState({
          items: [mockProduct({ name: 'Sugar' })],
        }),
        listSettings: mockListSettings({ showProductsInStorage: true }),
      });
      const result = filterBySearchQuery(lists, listState);
      expect(result?.products?.map((i) => i.name)).toEqual(['Sugar']);
    });

    it('omits global items when the setting is disabled', () => {
      const listState = mockStorageState({
        searchQuery: 'Sug',
        items: [mockStorageItem({ id: 'a', name: 'Salt' })],
      });
      const lists = mockGroceryLists({
        storage: listState,
        products: mockProductsState({
          items: [mockProduct({ name: 'Sugar' })],
        }),
        listSettings: mockListSettings({ showProductsInStorage: false }),
      });
      // Buckets are no longer pre-seeded: when the setting is off the grocery
      // selector never decorates the base result, so `products` stays undefined.
      expect(filterBySearchQuery(lists, listState)?.products).toBeUndefined();
    });
  });

  describe('sortItemListFn', () => {
    it('sorts by name ascending and descending', () => {
      const a = mockStorageItem({ name: 'Apple' });
      const b = mockStorageItem({ name: 'Banana' });
      expect(
        [b, a].sort(sortItemListFn({ sortBy: 'name', sortDir: 'asc' }))
      ).toEqual([a, b]);
      expect(
        [a, b].sort(sortItemListFn({ sortBy: 'name', sortDir: 'desc' }))
      ).toEqual([b, a]);
    });

    it('sorts storage items by bestBefore, falling back to name when both are unset', () => {
      const early = mockStorageItem({
        id: 'e',
        name: 'Zzz',
        bestBefore: '2024-01-01',
      });
      const late = mockStorageItem({
        id: 'l',
        name: 'Aaa',
        bestBefore: '2024-12-01',
      });
      const sorted = [late, early].sort(
        sortItemListFn<IStorageItem>({ sortBy: 'bestBefore', sortDir: 'asc' })
      );
      expect(sorted[0]).toBe(early);

      // isStorageItem() only recognises an item when the `bestBefore` key is
      // present (even if undefined) — matching what createStorageItem produces.
      const noDates = [
        mockStorageItem({ id: '1', name: 'B', bestBefore: undefined }),
        mockStorageItem({ id: '2', name: 'A', bestBefore: undefined }),
      ].sort(
        sortItemListFn<IStorageItem>({ sortBy: 'bestBefore', sortDir: 'asc' })
      );
      expect(noDates[0].name).toBe('A');
    });

    // The task prio-sort assertion was relocated to tasks.selector.spec.ts
    // (DDD review #1) — a groceries test must not depend on a task fixture.

    it('returns 0 (stable) for an unknown sort key', () => {
      const a = mockStorageItem({ name: 'A' });
      const b = mockStorageItem({ name: 'B' });
      expect(sortItemListFn({ sortBy: 'unknown', sortDir: 'asc' })(a, b)).toBe(
        0
      );
    });
  });

  describe('filterAndSortItemList', () => {
    it('filters by the active category filter and sorts the result', () => {
      const state = mockStorageState({
        filterBy: 'Dairy',
        sort: { sortBy: 'name', sortDir: 'asc' },
        items: [
          mockStorageItem({ id: 'a', name: 'Milk', category: ['Dairy'] }),
          mockStorageItem({ id: 'b', name: 'Cheese', category: ['Dairy'] }),
          mockStorageItem({ id: 'c', name: 'Bread', category: ['Bakery'] }),
        ],
      });
      const result = filterAndSortItemList(state);
      expect(result.map((i) => i.name)).toEqual(['Cheese', 'Milk']);
    });

    it('uses the search result list items when provided', () => {
      const state = mockStorageState({
        items: [mockStorageItem({ id: 'a', name: 'Milk' })],
      });
      const searchResult = {
        listItems: [mockStorageItem({ id: 'x', name: 'Bread' })],
      } as never;
      expect(
        filterAndSortItemList(state, searchResult).map((i) => i.name)
      ).toEqual(['Bread']);
    });
  });

  describe('sortCategoriesFn', () => {
    it('sorts categories ascending by default and descending on request', () => {
      expect(['B', 'A'].sort(sortCategoriesFn())).toEqual(['A', 'B']);
      expect(
        ['A', 'B'].sort(sortCategoriesFn({ sortBy: 'name', sortDir: 'desc' }))
      ).toEqual(['B', 'A']);
    });
  });

  describe('selectListCategories projector', () => {
    it('returns sorted categories with their item counts', () => {
      const state = mockStorageState({
        categories: ['Dairy', 'Bakery'],
        items: [
          mockStorageItem({ id: 'a', category: ['Dairy'] }),
          mockStorageItem({ id: 'b', category: ['Dairy'] }),
          mockStorageItem({ id: 'c', category: ['Bakery'] }),
        ],
      });
      expect(selectListCategories.projector(state)).toEqual([
        { category: 'Bakery', count: 1 },
        { category: 'Dairy', count: 2 },
      ]);
    });

    it('returns an empty array without a list state', () => {
      expect(selectListCategories.projector(undefined)).toEqual([]);
    });
  });
});
