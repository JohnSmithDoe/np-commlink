import {
  selectActiveHouseholdListId,
  selectListIdFromRouteData,
  selectListIdParameter,
  selectListItems,
  selectListSearchResult,
  selectListState,
} from './household-list.selector';
import { filterAndSortItemList } from '../../../@shared/util/item-lists/list.selector';
import {
  mockHouseholdState,
  mockProduct,
  mockProductsState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/household.test-data';

describe('household-list.selector', () => {
  describe('selectListIdParameter projector', () => {
    it('narrows a list id out of the route params', () => {
      expect(selectListIdParameter.projector({ listId: '_storage' })).toBe(
        '_storage'
      );
    });

    it('is undefined for a foreign or absent list id', () => {
      expect(
        selectListIdParameter.projector({ listId: '_tracking' })
      ).toBeUndefined();
      expect(selectListIdParameter.projector({})).toBeUndefined();
      expect(
        selectListIdParameter.projector(undefined as never)
      ).toBeUndefined();
    });
  });

  describe('selectListIdFromRouteData projector', () => {
    it('narrows a list id out of the route data', () => {
      expect(selectListIdFromRouteData.projector({ listId: '_products' })).toBe(
        '_products'
      );
    });

    it('is undefined for a foreign, absent or non-string list id', () => {
      expect(
        selectListIdFromRouteData.projector({ listId: '_tracking' })
      ).toBeUndefined();
      expect(
        selectListIdFromRouteData.projector({ listId: 7 })
      ).toBeUndefined();
      expect(selectListIdFromRouteData.projector({})).toBeUndefined();
      expect(
        selectListIdFromRouteData.projector(undefined as never)
      ).toBeUndefined();
    });
  });

  describe('selectActiveHouseholdListId projector', () => {
    it('prefers the list a route definition fixed over a param', () => {
      expect(
        selectActiveHouseholdListId.projector('_storage', '_products')
      ).toBe('_storage');
    });

    it('falls back to the param, which is what the catalog route carries', () => {
      expect(
        selectActiveHouseholdListId.projector(undefined, '_products')
      ).toBe('_products');
    });

    it('lands on shopping when neither names a list', () => {
      expect(selectActiveHouseholdListId.projector(undefined, undefined)).toBe(
        '_shopping'
      );
    });
  });

  describe('selectListState projector', () => {
    it('resolves the list the route names', () => {
      const products = mockProductsState({
        items: [mockProduct({ id: 'p' })],
      });
      const lists = mockHouseholdState({ products });
      expect(selectListState.projector('_products', lists)).toBe(products);
    });

    it('is undefined off a household route', () => {
      expect(
        selectListState.projector(undefined, mockHouseholdState())
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
          mockHouseholdState({ storage: listState })
        )?.listItems
      ).toHaveLength(1);
    });

    it('does not search without a list', () => {
      expect(
        selectListSearchResult.projector(undefined, mockHouseholdState())
      ).toBeUndefined();
    });
  });

  describe('selectListItems projector', () => {
    it('sorts the resolved list, and is undefined off a household route', () => {
      const state = mockStorageState({
        sort: { sortBy: 'name', sortDirection: 'asc' },
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

  describe('filterAndSortItemList', () => {
    it('filters by the active category filter and sorts the result', () => {
      const state = mockStorageState({
        filterBy: 'dairy',
        sort: { sortBy: 'name', sortDirection: 'asc' },
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
});
