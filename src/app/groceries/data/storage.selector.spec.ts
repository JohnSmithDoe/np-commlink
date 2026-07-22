import {
  filterAndSortItemList,
  filterBySearchQuery,
} from './grocery-list/grocery-list.selector';
import {
  selectStorageListItems,
  selectStorageListSearchResult,
  selectStorageState,
} from './storage.selector';
import {
  mockGroceryLists,
  mockStorageItem,
  mockStorageState,
} from '../testing/grocery.test-data';

describe('storage.selector', () => {
  it('selects the storage feature slice', () => {
    const lists = mockGroceryLists();
    expect(selectStorageState(lists)).toBe(lists.storage);
  });

  describe('selectStorageListSearchResult', () => {
    it('returns undefined without a search query', () => {
      const listState = mockStorageState();
      const lists = mockGroceryLists({ storage: listState });
      expect(
        selectStorageListSearchResult.projector(listState, lists)
      ).toBeUndefined();
    });

    it('returns the search result matching the query', () => {
      const listState = mockStorageState({
        searchQuery: 'Milk',
        items: [
          mockStorageItem({ id: 'a', name: 'Milk' }),
          mockStorageItem({ id: 'b', name: 'Bread' }),
        ],
      });
      const lists = mockGroceryLists({ storage: listState });
      const result = selectStorageListSearchResult.projector(listState, lists);
      expect(result?.listItems.map((index) => index.name)).toEqual(['Milk']);
      expect(result).toEqual(filterBySearchQuery(lists, listState));
    });
  });

  describe('selectStorageListItems', () => {
    it('filters and sorts the item list', () => {
      const state = mockStorageState({
        sort: { sortBy: 'name', sortDir: 'asc' },
        items: [
          mockStorageItem({ id: 'a', name: 'Milk' }),
          mockStorageItem({ id: 'b', name: 'Bread' }),
        ],
      });
      expect(selectStorageListItems.projector(state, undefined)).toEqual(
        filterAndSortItemList(state)
      );
      expect(
        selectStorageListItems
          .projector(state, undefined)
          ?.map((index) => index.name)
      ).toEqual(['Bread', 'Milk']);
    });
  });
});
