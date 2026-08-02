import { mockCategory } from '../../@shared/testing/test-data';
import {
  mockHouseholdState,
  mockProduct,
  mockProductsState,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../testing/household.test-data';
import { HouseholdCategoriesActions } from './categories/household-categories.actions';
import { householdReducer } from './household.reducer';

const stateWithSharedCategory = () =>
  mockHouseholdState({
    categories: {
      id: '_household-categories',
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

describe('householdReducer — the shared catalog', () => {
  it('mints a category once, into the one catalog', () => {
    const state = householdReducer(
      mockHouseholdState(),
      HouseholdCategoriesActions.addItem(
        mockCategory({ id: 'baking', name: 'Baking' })
      )
    );

    expect(state.categories.items.map((entry) => entry.name)).toEqual([
      'Baking',
    ]);
  });

  it('renames in place without touching any list — they reference by id', () => {
    const state = householdReducer(
      stateWithSharedCategory(),
      HouseholdCategoriesActions.updateItem({ id: 'dairy', name: 'Fridge' })
    );

    expect(
      state.categories.items.find((entry) => entry.id === 'dairy')?.name
    ).toBe('Fridge');
    expect(state.products.items[0].categoryIds).toEqual(['dairy']);
  });

  it('deleting a category strips its id from all three lists', () => {
    const state = householdReducer(
      stateWithSharedCategory(),
      HouseholdCategoriesActions.removeItem(
        mockCategory({ id: 'dairy', name: 'Dairy' })
      )
    );

    expect(state.categories.items.map((entry) => entry.id)).toEqual(['fresh']);
    expect(state.products.items[0].categoryIds).toEqual([]);
    expect(state.shopping.items[0].categoryIds).toEqual([]);
    expect(state.storage.items[0].categoryIds).toEqual(['fresh']);
  });

  it('renaming onto an existing name merges and remaps all three lists, deduped', () => {
    const state = householdReducer(
      stateWithSharedCategory(),
      HouseholdCategoriesActions.updateItem({ id: 'dairy', name: 'Fresh' })
    );

    expect(state.categories.items.map((entry) => entry.id)).toEqual(['fresh']);
    expect(state.products.items[0].categoryIds).toEqual(['fresh']);
    expect(state.shopping.items[0].categoryIds).toEqual(['fresh']);
    expect(state.storage.items[0].categoryIds).toEqual(['fresh']);
  });
});
