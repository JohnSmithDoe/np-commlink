import {
  filterAndSortItemList,
  filterBySearchQuery,
} from './grocery-list/grocery-list.selector';
import {
  selectProductListItems,
  selectProductsListSearchResult,
  selectProductsState,
} from './products.selector';
import {
  mockAppState,
  mockProduct,
  mockProductsState,
} from '../../@shared/testing/test-data';

describe('products.selector', () => {
  it('selects the globals feature slice', () => {
    const state = mockAppState();
    expect(selectProductsState(state)).toBe(state.products);
  });

  describe('selectProductsListSearchResult', () => {
    it('returns undefined without a search query', () => {
      const listState = mockProductsState();
      const appState = mockAppState({ products: listState });
      expect(
        selectProductsListSearchResult.projector(listState, appState)
      ).toBeUndefined();
    });

    it('returns the search result matching the query', () => {
      const listState = mockProductsState({
        searchQuery: 'Sugar',
        items: [
          mockProduct({ id: 'a', name: 'Sugar' }),
          mockProduct({ id: 'b', name: 'Salt' }),
        ],
      });
      const appState = mockAppState({ products: listState });
      const result = selectProductsListSearchResult.projector(
        listState,
        appState
      );
      expect(result?.listItems.map((i) => i.name)).toEqual(['Sugar']);
      expect(result).toEqual(filterBySearchQuery(appState, listState));
    });
  });

  describe('selectProductListItems', () => {
    it('filters and sorts the item list', () => {
      const state = mockProductsState({
        sort: { sortBy: 'name', sortDir: 'asc' },
        items: [
          mockProduct({ id: 'a', name: 'Sugar' }),
          mockProduct({ id: 'b', name: 'Salt' }),
        ],
      });
      expect(selectProductListItems.projector(state, undefined)).toEqual(
        filterAndSortItemList(state, undefined)
      );
      expect(
        selectProductListItems.projector(state, undefined)?.map((i) => i.name)
      ).toEqual(['Salt', 'Sugar']);
    });
  });
});
