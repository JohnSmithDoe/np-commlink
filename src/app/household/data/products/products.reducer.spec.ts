import { HouseholdActions } from '../household.actions';
import { ProductsActions } from './products.actions';
import { initialState, productsReducer } from './products.reducer';
import {
  mockHouseholdState,
  mockProduct,
  mockProductsState,
} from '../../testing/household.test-data';

describe('productsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = productsReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item', () => {
    const item = mockProduct({ name: 'Sugar', categoryIds: ['baking'] });
    const state = productsReducer(initialState, ProductsActions.addItem(item));
    expect(state.items).toEqual([item]);
  });

  it('removes an item by id', () => {
    const item = mockProduct({ id: 'a' });
    const start = mockProductsState({ items: [item] });
    const state = productsReducer(start, ProductsActions.removeItem(item));
    expect(state.items).toHaveLength(0);
  });

  it('updates an existing item', () => {
    const item = mockProduct({ id: 'a', name: 'Old' });
    const start = mockProductsState({ items: [item] });
    const state = productsReducer(
      start,
      ProductsActions.updateItem({ ...item, name: 'New' })
    );
    expect(state.items[0].name).toBe('New');
  });

  it('stores the search query verbatim and only updates when it changed', () => {
    const start = mockProductsState({ searchQuery: 'sugar' });
    const unchanged = productsReducer(
      start,
      ProductsActions.updateSearch('sugar')
    );
    expect(unchanged).toBe(start);
    const changed = productsReducer(
      start,
      ProductsActions.updateSearch('  salt  ')
    );
    expect(changed.searchQuery).toBe('  salt  ');
  });

  it('sets a filter', () => {
    const start = mockProductsState();
    const state = productsReducer(
      start,
      ProductsActions.updateFilter('Baking')
    );
    expect(state.filterBy).toBe('Baking');
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const state = productsReducer(
      initialState,
      HouseholdActions.loaded(
        mockHouseholdState({
          products: mockProductsState({
            items: [mockProduct()],
            searchQuery: 'stale',
            filterBy: 'Baking',
          }),
        })
      )
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.filterBy).toBeUndefined();
  });
});
