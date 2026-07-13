import { IDatastore } from '../../@shared/types';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { ProductsActions } from './products.actions';
import { productsReducer, initialState } from './products.reducer';
import {
  mockProduct,
  mockProductsState,
} from '../../@shared/testing/test-data';

describe('productsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = productsReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item and derives its categories', () => {
    const item = mockProduct({ name: 'Sugar', category: ['Baking'] });
    const state = productsReducer(initialState, ProductsActions.addItem(item));
    expect(state.items).toEqual([item]);
    expect(state.categories).toContain('Baking');
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

  it('trims the search query and only updates when it changed', () => {
    const start = mockProductsState({ searchQuery: 'sugar' });
    const unchanged = productsReducer(
      start,
      ProductsActions.updateSearch('  sugar  ')
    );
    expect(unchanged).toBe(start);
    const changed = productsReducer(
      start,
      ProductsActions.updateSearch('  salt  ')
    );
    expect(changed.searchQuery).toBe('salt');
  });

  it('sets a filter and forces alphabetical mode', () => {
    const start = mockProductsState({ mode: 'categories' });
    const state = productsReducer(
      start,
      ProductsActions.updateFilter('Baking')
    );
    expect(state.filterBy).toBe('Baking');
    expect(state.mode).toBe('alphabetical');
  });

  it('updates the mode', () => {
    const state = productsReducer(
      initialState,
      ProductsActions.updateMode('categories')
    );
    expect(state.mode).toBe('categories');
  });

  it('adds and removes categories', () => {
    const added = productsReducer(
      initialState,
      ProductsActions.addCategory('Baking')
    );
    expect(added.categories).toContain('Baking');
    const removed = productsReducer(
      added,
      ProductsActions.removeCategory('Baking')
    );
    expect(removed.categories).not.toContain('Baking');
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const datastore = {
      products: mockProductsState({
        items: [mockProduct()],
        searchQuery: 'stale',
        mode: 'categories',
        filterBy: 'Baking',
      }),
    } as IDatastore;
    const state = productsReducer(
      initialState,
      ApplicationActions.loadedSuccessfully(datastore)
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.mode).toBe('alphabetical');
    expect(state.filterBy).toBeUndefined();
  });
});
