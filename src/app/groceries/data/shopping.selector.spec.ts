import { filterBySearchQuery } from './grocery-list/grocery-list.selector';
import {
  selectShoppingListHasBoughtItems,
  selectShoppingSearchResult,
  selectShoppingState,
} from './shopping.selector';
import {
  mockGroceryLists,
  mockShoppingItem,
  mockShoppingState,
} from '../testing/grocery.test-data';

describe('shopping.selector', () => {
  it('selects the shopping feature slice', () => {
    const lists = mockGroceryLists();
    expect(selectShoppingState(lists)).toBe(lists.shopping);
  });

  describe('selectShoppingSearchResult', () => {
    it('returns undefined without a search query', () => {
      const listState = mockShoppingState();
      const lists = mockGroceryLists({ shopping: listState });
      expect(
        selectShoppingSearchResult.projector(listState, lists)
      ).toBeUndefined();
    });

    it('returns the search result matching the query', () => {
      const listState = mockShoppingState({
        searchQuery: 'Bread',
        items: [
          mockShoppingItem({ id: 'a', name: 'Bread' }),
          mockShoppingItem({ id: 'b', name: 'Milk' }),
        ],
      });
      const lists = mockGroceryLists({ shopping: listState });
      const result = selectShoppingSearchResult.projector(listState, lists);
      expect(result?.listItems.map((i) => i.name)).toEqual(['Bread']);
      expect(result).toEqual(filterBySearchQuery(lists, listState));
    });
  });

  describe('selectShoppingListHasBoughtItems', () => {
    it('is true when at least one item is bought', () => {
      const state = mockShoppingState({
        items: [
          mockShoppingItem({ id: 'a', state: 'active' }),
          mockShoppingItem({ id: 'b', state: 'bought' }),
        ],
      });
      expect(selectShoppingListHasBoughtItems.projector(state)).toBe(true);
    });

    it('is false when no item is bought', () => {
      const state = mockShoppingState({
        items: [mockShoppingItem({ id: 'a', state: 'active' })],
      });
      expect(selectShoppingListHasBoughtItems.projector(state)).toBe(false);
    });
  });
});
