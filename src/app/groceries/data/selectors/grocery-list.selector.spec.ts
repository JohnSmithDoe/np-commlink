import { IStorageItem } from '../../model/grocery-list.types';
import {
  filterAndSortItemList,
  filterBySearchQuery,
  selectListCategories,
  selectListIdParam,
  selectListItems,
  selectListSearchResult,
  selectListState,
  categoryComparator as sortCategoriesFunction,
  itemComparator as sortItemListFunction,
} from './grocery-list.selector';
import { mockCategory } from '../../../@shared/testing/test-data';
import { mockListSettings } from '../../testing/groceries.test-data';
import {
  mockGroceriesState,
  mockProduct,
  mockProductsState,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/groceries.test-data';

// A field only this domain knows about — the point is that the shared engine
// never names it.
const itemWithShelf = (name: string, shelf: number): IStorageItem =>
  ({ ...mockStorageItem({ name }), shelf }) as IStorageItem;

describe('item-list.selector', () => {
  describe('filterBySearchQuery', () => {
    it('returns undefined without a search query', () => {
      const lists = mockGroceriesState();
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
      const lists = mockGroceriesState({ storage: listState });
      const result = filterBySearchQuery(lists, listState);
      expect(result?.listItems.map((index) => index.name)).toEqual([
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
      const lists = mockGroceriesState({
        storage: listState,
        products: mockProductsState({
          items: [mockProduct({ name: 'Sugar' })],
        }),
        listSettings: mockListSettings({ showProductsInStorage: true }),
      });
      const result = filterBySearchQuery(lists, listState);
      expect(result?.products?.map((index) => index.name)).toEqual(['Sugar']);
    });

    it('omits global items when the setting is disabled', () => {
      const listState = mockStorageState({
        searchQuery: 'Sug',
        items: [mockStorageItem({ id: 'a', name: 'Salt' })],
      });
      const lists = mockGroceriesState({
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

    it('decorates the products list with the storage and shopping buckets', () => {
      const listState = mockProductsState({
        searchQuery: 'Sug',
        items: [mockProduct({ id: 'p', name: 'Sugarcane' })],
      });
      const lists = mockGroceriesState({
        products: listState,
        storage: mockStorageState({
          items: [mockStorageItem({ id: 's', name: 'Sugar cubes' })],
        }),
        shopping: mockShoppingState({
          items: [mockShoppingItem({ id: 'h', name: 'Sugar syrup' })],
        }),
        listSettings: mockListSettings({
          showStorageInProducts: true,
          showShoppingInProducts: true,
        }),
      });
      const result = filterBySearchQuery(lists, listState);
      expect(result?.storageItems?.map((item) => item.name)).toEqual([
        'Sugar cubes',
      ]);
      expect(result?.shoppingItems?.map((item) => item.name)).toEqual([
        'Sugar syrup',
      ]);
    });

    it('decorates the shopping list with the products and storage buckets', () => {
      const listState = mockShoppingState({
        searchQuery: 'Sug',
        items: [mockShoppingItem({ id: 'h', name: 'Sugar syrup' })],
      });
      const lists = mockGroceriesState({
        shopping: listState,
        products: mockProductsState({
          items: [mockProduct({ id: 'p', name: 'Sugarcane' })],
        }),
        storage: mockStorageState({
          items: [mockStorageItem({ id: 's', name: 'Sugar cubes' })],
        }),
        listSettings: mockListSettings({
          showProductsInShopping: true,
          showStorageInShopping: true,
        }),
      });
      const result = filterBySearchQuery(lists, listState);
      expect(result?.products?.map((item) => item.name)).toEqual(['Sugarcane']);
      expect(result?.storageItems?.map((item) => item.name)).toEqual([
        'Sugar cubes',
      ]);
    });

    it('decorates the storage list with the shopping bucket', () => {
      const listState = mockStorageState({
        searchQuery: 'Sug',
        items: [],
      });
      const lists = mockGroceriesState({
        storage: listState,
        shopping: mockShoppingState({
          items: [mockShoppingItem({ id: 'h', name: 'Sugar syrup' })],
        }),
        listSettings: mockListSettings({ showShoppingInStorage: true }),
      });
      expect(
        filterBySearchQuery(lists, listState)?.shoppingItems?.map(
          (item) => item.name
        )
      ).toEqual(['Sugar syrup']);
    });

    // A suggestion is only worth showing if that name isn't already on screen —
    // in the list itself, or in a bucket rendered above this one.
    it('suppresses a name already in the list or in an earlier bucket', () => {
      const listState = mockStorageState({
        searchQuery: 'Sugar',
        items: [mockStorageItem({ id: 's', name: 'Sugar' })],
      });
      const lists = mockGroceriesState({
        storage: listState,
        products: mockProductsState({
          items: [
            mockProduct({ id: 'p1', name: 'Sugar' }),
            mockProduct({ id: 'p2', name: 'Sugar syrup' }),
          ],
        }),
        shopping: mockShoppingState({
          items: [mockShoppingItem({ id: 'h', name: 'Sugar syrup' })],
        }),
        listSettings: mockListSettings({
          showProductsInStorage: true,
          showShoppingInStorage: true,
        }),
      });
      const result = filterBySearchQuery(lists, listState);
      // 'Sugar' is already a row in the list; 'Sugar syrup' is already the
      // products bucket, which renders above the shopping one.
      expect(result?.products?.map((item) => item.name)).toEqual([
        'Sugar syrup',
      ]);
      expect(result?.shoppingItems).toEqual([]);
    });

    it('suggests a cross-list item whose category matches the query', () => {
      const listState = mockStorageState({ searchQuery: 'dair', items: [] });
      const lists = mockGroceriesState({
        storage: listState,
        products: mockProductsState({
          categories: [mockCategory({ id: 'c', name: 'Dairy' })],
          items: [mockProduct({ id: 'p', name: 'Butter', categoryIds: ['c'] })],
        }),
        listSettings: mockListSettings({ showProductsInStorage: true }),
      });
      expect(
        filterBySearchQuery(lists, listState)?.products?.map(
          (item) => item.name
        )
      ).toEqual(['Butter']);
    });

    // `/data/:listId` shares the param name with a different vocabulary, so a
    // non-grocery list reaching this selector must not be decorated.
    it('leaves a non-grocery list undecorated', () => {
      const listState = mockStorageState({
        id: '_tracking' as never,
        searchQuery: 'Sug',
        items: [],
      });
      const lists = mockGroceriesState({
        products: mockProductsState({
          items: [mockProduct({ id: 'p', name: 'Sugar' })],
        }),
        listSettings: mockListSettings({ showProductsInStorage: true }),
      });
      expect(filterBySearchQuery(lists, listState)?.products).toBeUndefined();
    });
  });

  describe('selectListIdParam projector', () => {
    it('narrows a grocery list id out of the route params', () => {
      expect(selectListIdParam.projector({ listId: '_storage' })).toBe(
        '_storage'
      );
    });

    // Narrowed rather than cast: this root-singleton selector keeps reading the
    // router from any route, including ones naming a foreign list.
    it('is undefined for a foreign or absent list id', () => {
      expect(
        selectListIdParam.projector({ listId: '_tracking' })
      ).toBeUndefined();
      expect(selectListIdParam.projector({})).toBeUndefined();
      // @ngrx types the params as always present, but the router slice is empty
      // until the first navigation completes — which is why the source reads it
      // with `?.` and why the cast here is the honest shape, not a convenience.
      expect(selectListIdParam.projector(undefined as never)).toBeUndefined();
    });
  });

  describe('selectListState projector', () => {
    it('resolves the list the route names', () => {
      const products = mockProductsState({
        items: [mockProduct({ id: 'p' })],
      });
      const lists = mockGroceriesState({ products });
      expect(selectListState.projector('_products', lists)).toBe(products);
    });

    it('is undefined off a grocery route', () => {
      expect(
        selectListState.projector(undefined, mockGroceriesState())
      ).toBeUndefined();
    });
  });

  describe('selectListSearchResult projector', () => {
    const listState = mockStorageState({
      searchQuery: 'Milk',
      items: [mockStorageItem({ id: 'a', name: 'Milk' })],
    });

    it('searches the active list', () => {
      expect(
        selectListSearchResult.projector(
          listState,
          mockGroceriesState({ storage: listState })
        )?.listItems
      ).toHaveLength(1);
    });

    // In category mode the page renders the catalog, not a hit list.
    it('does not search in category mode or without a list', () => {
      expect(
        selectListSearchResult.projector(
          { ...listState, mode: 'categories' },
          mockGroceriesState()
        )
      ).toBeUndefined();
      expect(
        selectListSearchResult.projector(undefined, mockGroceriesState())
      ).toBeUndefined();
    });
  });

  describe('selectListItems projector', () => {
    it('sorts the resolved list, and is undefined off a grocery route', () => {
      const state = mockStorageState({
        sort: { sortBy: 'name', sortDir: 'asc' },
        items: [
          mockStorageItem({ id: 'b', name: 'Bread' }),
          mockStorageItem({ id: 'a', name: 'Apple' }),
        ],
      });
      expect(
        selectListItems.projector(state, undefined)?.map((item) => item.name)
      ).toEqual(['Apple', 'Bread']);
      expect(selectListItems.projector(undefined, undefined)).toBeUndefined();
    });
  });

  describe('itemComparator', () => {
    it('sorts by name ascending and descending', () => {
      const a = mockStorageItem({ name: 'Apple' });
      const b = mockStorageItem({ name: 'Banana' });
      expect(
        [b, a].sort(sortItemListFunction({ sortBy: 'name', sortDir: 'asc' }))
      ).toEqual([a, b]);
      expect(
        [a, b].sort(sortItemListFunction({ sortBy: 'name', sortDir: 'desc' }))
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
        sortItemListFunction<IStorageItem>({
          sortBy: 'bestBefore',
          sortDir: 'asc',
        })
      );
      expect(sorted[0]).toBe(early);

      // isStorageItem() only recognises an item when the `bestBefore` key is
      // present (even if undefined) — matching what createStorageItem produces.
      const noDates = [
        mockStorageItem({ id: '1', name: 'B', bestBefore: undefined }),
        mockStorageItem({ id: '2', name: 'A', bestBefore: undefined }),
      ].sort(
        sortItemListFunction<IStorageItem>({
          sortBy: 'bestBefore',
          sortDir: 'asc',
        })
      );
      expect(noDates[0].name).toBe('A');
    });

    // The task prio-sort assertion was relocated to tasks.selector.spec.ts
    // (DDD review #1) — a groceries test must not depend on a task fixture.

    // A field no item carries has nothing to order by, so it falls back to the
    // name rather than to 0 — a silent no-op was indistinguishable from a
    // broken sort, which is what let three domain field names live hardcoded
    // in the shared engine.
    it('falls back to the name for a sort key no item carries', () => {
      const a = mockStorageItem({ name: 'A' });
      const b = mockStorageItem({ name: 'B' });
      expect(
        sortItemListFunction({ sortBy: 'unknown', sortDir: 'asc' })(a, b)
      ).toBeLessThan(0);
    });

    it('orders by a domain field the shared engine has never heard of', () => {
      const a = itemWithShelf('A', 9);
      const b = itemWithShelf('B', 2);
      expect(
        sortItemListFunction({ sortBy: 'shelf', sortDir: 'asc' })(a, b)
      ).toBeGreaterThan(0);
    });
  });

  describe('filterAndSortItemList', () => {
    it('filters by the active category filter and sorts the result', () => {
      const state = mockStorageState({
        filterBy: 'dairy',
        sort: { sortBy: 'name', sortDir: 'asc' },
        items: [
          mockStorageItem({ id: 'a', name: 'Milk', categoryIds: ['dairy'] }),
          mockStorageItem({ id: 'b', name: 'Cheese', categoryIds: ['dairy'] }),
          mockStorageItem({ id: 'c', name: 'Bread', categoryIds: ['bakery'] }),
        ],
      });
      const result = filterAndSortItemList(state);
      expect(result.map((index) => index.name)).toEqual(['Cheese', 'Milk']);
    });

    it('uses the search result list items when provided', () => {
      const state = mockStorageState({
        items: [mockStorageItem({ id: 'a', name: 'Milk' })],
      });
      const searchResult = {
        listItems: [mockStorageItem({ id: 'x', name: 'Bread' })],
      } as never;
      expect(
        filterAndSortItemList(state, searchResult).map((index) => index.name)
      ).toEqual(['Bread']);
    });
  });

  describe('categoryComparator', () => {
    it('sorts categories ascending by default and descending on request', () => {
      const a = mockCategory({ id: 'a', name: 'A' });
      const b = mockCategory({ id: 'b', name: 'B' });
      expect([b, a].sort(sortCategoriesFunction()).map((c) => c.name)).toEqual([
        'A',
        'B',
      ]);
      expect(
        [a, b]
          .sort(sortCategoriesFunction({ sortBy: 'name', sortDir: 'desc' }))
          .map((c) => c.name)
      ).toEqual(['B', 'A']);
    });
  });

  describe('selectListCategories projector', () => {
    it('returns sorted {id,name} categories with their item counts', () => {
      const dairy = mockCategory({ id: 'dairy', name: 'Dairy' });
      const bakery = mockCategory({ id: 'bakery', name: 'Bakery' });
      const state = mockStorageState({
        categories: [dairy, bakery],
        items: [
          mockStorageItem({ id: 'a', categoryIds: ['dairy'] }),
          mockStorageItem({ id: 'b', categoryIds: ['dairy'] }),
          mockStorageItem({ id: 'c', categoryIds: ['bakery'] }),
        ],
      });
      expect(selectListCategories.projector(state)).toEqual([
        { category: bakery, count: 1 },
        { category: dairy, count: 2 },
      ]);
    });

    it('returns an empty array without a list state', () => {
      expect(selectListCategories.projector(undefined)).toEqual([]);
    });
  });
});
