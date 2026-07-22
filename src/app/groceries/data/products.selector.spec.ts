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
  mockGroceryLists,
  mockProduct,
  mockProductsState,
} from '../testing/grocery.test-data';

describe('products.selector', () => {
  it('selects the globals feature slice', () => {
    const lists = mockGroceryLists();
    expect(selectProductsState(lists)).toBe(lists.products);
  });

  describe('selectProductsListSearchResult', () => {
    it('returns undefined without a search query', () => {
      const listState = mockProductsState();
      const lists = mockGroceryLists({ products: listState });
      expect(
        selectProductsListSearchResult.projector(listState, lists)
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
      const lists = mockGroceryLists({ products: listState });
      const result = selectProductsListSearchResult.projector(listState, lists);
      expect(result?.listItems.map((index) => index.name)).toEqual(['Sugar']);
      expect(result).toEqual(filterBySearchQuery(lists, listState));
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
        filterAndSortItemList(state)
      );
      expect(
        selectProductListItems
          .projector(state, undefined)
          ?.map((index) => index.name)
      ).toEqual(['Salt', 'Sugar']);
    });
  });
});
