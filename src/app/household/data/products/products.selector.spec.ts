import { selectProductItems, selectProductsState } from './products.selector';
import {
  mockHouseholdState,
  mockProduct,
  mockProductsState,
} from '../../testing/household.test-data';

describe('products.selector', () => {
  it('selects the globals feature slice', () => {
    const lists = mockHouseholdState();
    expect(selectProductsState({ household: lists })).toBe(lists.products);
  });

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
