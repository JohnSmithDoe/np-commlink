import {
  selectShoppingItems,
  selectShoppingListHasBoughtItems,
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

  // Same invariant as `selectStorageItems`, plus one shopping-only clause: a
  // bought row is still a sibling, so its name stays taken.
  describe('selectShoppingItems', () => {
    it('ignores the page search query and keeps bought rows', () => {
      const state = mockShoppingState({
        searchQuery: 'Milk',
        items: [
          mockShoppingItem({ id: 'a', name: 'Bread', state: 'bought' }),
          mockShoppingItem({ id: 'b', name: 'Milk' }),
        ],
      });

      expect(
        selectShoppingItems.projector(state).map(({ name }) => name)
      ).toEqual(['Bread', 'Milk']);
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
