import { HouseholdActions } from '../household.actions';
import { ProductsActions } from './products.actions';
import { initialState, productsReducer } from './products.reducer';
import {
  mockHouseholdState,
  mockProduct,
  mockProductsState,
} from '../../testing/household.test-data';

describe('productsReducer', () => {
  it('wires its list actions to the shared list utils', () => {
    const item = mockProduct({ id: 'a', name: 'Sugar' });
    const added = productsReducer(initialState, ProductsActions.addItem(item));
    const updated = productsReducer(
      added,
      ProductsActions.updateItem({ ...item, name: 'Salt' })
    );
    const narrowed = productsReducer(
      productsReducer(updated, ProductsActions.updateSearch('salt')),
      ProductsActions.updateFilter('baking')
    );
    const removed = productsReducer(narrowed, ProductsActions.removeItem(item));

    expect(updated.items).toEqual([{ ...item, name: 'Salt' }]);
    expect(narrowed).toMatchObject({ searchQuery: 'salt', filterBy: 'baking' });
    expect(removed.items).toEqual([]);
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const stored = mockHouseholdState({
      products: mockProductsState({
        items: [mockProduct()],
        searchQuery: 'stale',
        filterBy: 'Baking',
      }),
    });
    const state = productsReducer(
      initialState,
      HouseholdActions.loaded(stored)
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.filterBy).toBeUndefined();
  });

  it('fills a stored document out with the fields it was saved without', () => {
    const stored = { items: [mockProduct()] } as never;

    const state = productsReducer(
      initialState,
      HouseholdActions.loaded({ products: stored } as never)
    );

    expect(state.id).toBe(initialState.id);
    expect(state.items).toHaveLength(1);
  });
});
