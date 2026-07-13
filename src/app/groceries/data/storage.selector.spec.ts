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
  mockAppState,
  mockStorageItem,
  mockStorageState,
} from '../../@shared/testing/test-data';

describe('storage.selector', () => {
  it('selects the storage feature slice', () => {
    const state = mockAppState();
    expect(selectStorageState(state)).toBe(state.storage);
  });

  describe('selectStorageListSearchResult', () => {
    it('returns undefined without a search query', () => {
      const listState = mockStorageState();
      const appState = mockAppState({ storage: listState });
      expect(
        selectStorageListSearchResult.projector(listState, appState)
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
      const appState = mockAppState({ storage: listState });
      const result = selectStorageListSearchResult.projector(
        listState,
        appState
      );
      expect(result?.listItems.map((i) => i.name)).toEqual(['Milk']);
      expect(result).toEqual(filterBySearchQuery(appState, listState));
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
        filterAndSortItemList(state, undefined)
      );
      expect(
        selectStorageListItems.projector(state, undefined)?.map((i) => i.name)
      ).toEqual(['Bread', 'Milk']);
    });
  });
});
