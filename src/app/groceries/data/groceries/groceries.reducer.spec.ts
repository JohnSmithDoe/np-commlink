import { mockCategory } from '../../../@shared/testing/test-data';
import {
  mockGroceriesState,
  mockProduct,
  mockProductsState,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/groceries.test-data';
import { GroceryCategoriesActions } from '../categories/grocery-categories.actions';
import { groceriesReducer } from './groceries.reducer';

// One category, referenced from all three lists — the arrangement the fan-out
// used to make impossible to test in one place.
const stateWithSharedCategory = () =>
  mockGroceriesState({
    categories: {
      id: '_grocery-categories',
      items: [
        mockCategory({ id: 'dairy', name: 'Dairy' }),
        mockCategory({ id: 'fresh', name: 'Fresh' }),
      ],
    },
    products: mockProductsState({
      items: [mockProduct({ id: 'p', categoryIds: ['dairy'] })],
    }),
    shopping: mockShoppingState({
      items: [mockShoppingItem({ id: 'sh', categoryIds: ['dairy'] })],
    }),
    storage: mockStorageState({
      items: [mockStorageItem({ id: 'st', categoryIds: ['dairy', 'fresh'] })],
    }),
  });

describe('groceriesReducer — the shared catalog', () => {
  it('mints a category once, into the one catalog', () => {
    const state = groceriesReducer(
      mockGroceriesState(),
      GroceryCategoriesActions.addItem(
        mockCategory({ id: 'baking', name: 'Baking' })
      )
    );

    expect(state.categories.items.map((entry) => entry.name)).toEqual([
      'Baking',
    ]);
  });

  it('renames in place without touching any list — they reference by id', () => {
    const state = groceriesReducer(
      stateWithSharedCategory(),
      GroceryCategoriesActions.updateItem({ id: 'dairy', name: 'Fridge' })
    );

    expect(
      state.categories.items.find((entry) => entry.id === 'dairy')?.name
    ).toBe('Fridge');
    expect(state.products.items[0].categoryIds).toEqual(['dairy']);
  });

  // The cascade the three list reducers each used to run over their own copy.
  it('deleting a category strips its id from all three lists', () => {
    const state = groceriesReducer(
      stateWithSharedCategory(),
      GroceryCategoriesActions.removeItem(
        mockCategory({ id: 'dairy', name: 'Dairy' })
      )
    );

    expect(state.categories.items.map((entry) => entry.id)).toEqual(['fresh']);
    expect(state.products.items[0].categoryIds).toEqual([]);
    expect(state.shopping.items[0].categoryIds).toEqual([]);
    expect(state.storage.items[0].categoryIds).toEqual(['fresh']);
  });

  it('renaming onto an existing name merges and remaps all three lists, deduped', () => {
    const state = groceriesReducer(
      stateWithSharedCategory(),
      GroceryCategoriesActions.updateItem({ id: 'dairy', name: 'Fresh' })
    );

    expect(state.categories.items.map((entry) => entry.id)).toEqual(['fresh']);
    expect(state.products.items[0].categoryIds).toEqual(['fresh']);
    expect(state.shopping.items[0].categoryIds).toEqual(['fresh']);
    // Already carried both, so the merge must not duplicate the survivor.
    expect(state.storage.items[0].categoryIds).toEqual(['fresh']);
  });
});
