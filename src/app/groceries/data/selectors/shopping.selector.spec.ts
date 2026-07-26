import { filterBySearchQuery } from './grocery-list.selector';
import {
  selectShoppingListHasBoughtItems,
  selectShoppingSearchResult,
  selectShoppingState,
} from './shopping.selector';
import {
  mockGroceriesState,
  mockShoppingItem,
  mockShoppingState,
} from '../../testing/groceries.test-data';

describe('shopping.selector', () => {
  it('selects the shopping feature slice', () => {
    const lists = mockGroceriesState();
    expect(selectShoppingState({ groceries: lists })).toBe(lists.shopping);
  });

  describe('selectShoppingSearchResult', () => {
    it('returns undefined without a search query', () => {
      const listState = mockShoppingState();
      const lists = mockGroceriesState({ shopping: listState });
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
      const lists = mockGroceriesState({ shopping: listState });
      const result = selectShoppingSearchResult.projector(listState, lists);
      expect(result?.listItems.map((index) => index.name)).toEqual(['Bread']);
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
