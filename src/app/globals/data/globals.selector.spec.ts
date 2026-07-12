import {
  filterAndSortItemList,
  filterBySearchQuery,
} from '../../@shared/data/grocery-list/grocery-list.selector';
import {
  selectGlobalListItems,
  selectGlobalsListSearchResult,
  selectGlobalsState,
} from './globals.selector';
import {
  mockAppState,
  mockGlobalItem,
  mockGlobalsState,
} from '../../@shared/testing/test-data';

describe('globals.selector', () => {
  it('selects the globals feature slice', () => {
    const state = mockAppState();
    expect(selectGlobalsState(state)).toBe(state.globals);
  });

  describe('selectGlobalsListSearchResult', () => {
    it('returns undefined without a search query', () => {
      const listState = mockGlobalsState();
      const appState = mockAppState({ globals: listState });
      expect(
        selectGlobalsListSearchResult.projector(listState, appState)
      ).toBeUndefined();
    });

    it('returns the search result matching the query', () => {
      const listState = mockGlobalsState({
        searchQuery: 'Sugar',
        items: [
          mockGlobalItem({ id: 'a', name: 'Sugar' }),
          mockGlobalItem({ id: 'b', name: 'Salt' }),
        ],
      });
      const appState = mockAppState({ globals: listState });
      const result = selectGlobalsListSearchResult.projector(
        listState,
        appState
      );
      expect(result?.listItems.map((i) => i.name)).toEqual(['Sugar']);
      expect(result).toEqual(filterBySearchQuery(appState, listState));
    });
  });

  describe('selectGlobalListItems', () => {
    it('filters and sorts the item list', () => {
      const state = mockGlobalsState({
        sort: { sortBy: 'name', sortDir: 'asc' },
        items: [
          mockGlobalItem({ id: 'a', name: 'Sugar' }),
          mockGlobalItem({ id: 'b', name: 'Salt' }),
        ],
      });
      expect(selectGlobalListItems.projector(state, undefined)).toEqual(
        filterAndSortItemList(state, undefined)
      );
      expect(
        selectGlobalListItems.projector(state, undefined)?.map((i) => i.name)
      ).toEqual(['Salt', 'Sugar']);
    });
  });
});
