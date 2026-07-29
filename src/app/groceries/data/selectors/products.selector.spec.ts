import { selectProductItems, selectProductsState } from './products.selector';
import {
  mockGroceriesState,
  mockProduct,
  mockProductsState,
} from '../../testing/groceries.test-data';

describe('products.selector', () => {
  it('selects the globals feature slice', () => {
    const lists = mockGroceriesState();
    expect(selectProductsState({ groceries: lists })).toBe(lists.products);
  });

  // Same invariant as `selectStorageItems`: an aggregate read, unaffected by
  // whatever view state the catalog page happens to be holding.
  describe('selectProductItems', () => {
    it('ignores the page search query and category filter', () => {
      const state = mockProductsState({
        searchQuery: 'Salt',
        filterBy: 'baking',
        items: [
          mockProduct({ id: 'a', name: 'Sugar', categoryIds: ['baking'] }),
          mockProduct({ id: 'b', name: 'Salt' }),
        ],
      });

      expect(
        selectProductItems.projector(state).map(({ name }) => name)
      ).toEqual(['Sugar', 'Salt']);
    });
  });
});
