import { selectShoppingListHasBoughtItems } from './shopping.selector';
import {
  mockShoppingItem,
  mockShoppingState,
} from '../../testing/household.test-data';

describe('shopping.selector', () => {
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
