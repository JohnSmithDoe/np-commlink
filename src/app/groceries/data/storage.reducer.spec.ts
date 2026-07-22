import { GroceriesActions } from './groceries.actions';
import { GroceryCategoriesActions } from './grocery-list/grocery-categories.actions';
import { StorageActions } from './storage.actions';
import { initialState, storageReducer } from './storage.reducer';
import { mockCategory } from '../../@shared/testing/test-data';
import {
  mockShoppingItem,
  mockStorageItem,
  mockStorageState,
} from '../testing/grocery.test-data';

describe('storageReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = storageReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item without deriving categories (the catalog is authoritative)', () => {
    const item = mockStorageItem({ name: 'Milk', categoryIds: ['dairy'] });
    const state = storageReducer(initialState, StorageActions.addItem(item));
    expect(state.items).toEqual([item]);
    expect(state.categories).toEqual([]);
  });

  it('does not add an item with a blank name', () => {
    const item = mockStorageItem({ name: ' '.repeat(3) });
    const state = storageReducer(initialState, StorageActions.addItem(item));
    expect(state.items).toHaveLength(0);
  });

  it('removes an item by id', () => {
    const item = mockStorageItem({ id: 'a' });
    const start = mockStorageState({ items: [item] });
    const state = storageReducer(start, StorageActions.removeItem(item));
    expect(state.items).toHaveLength(0);
  });

  it('updates an existing item', () => {
    const item = mockStorageItem({ id: 'a', quantity: 1 });
    const start = mockStorageState({ items: [item] });
    const state = storageReducer(
      start,
      StorageActions.updateItem({ ...item, quantity: 5 })
    );
    expect(state.items[0].quantity).toBe(5);
  });

  it('updates the search query only when it changed', () => {
    const start = mockStorageState({ searchQuery: 'milk' });
    const unchanged = storageReducer(
      start,
      StorageActions.updateSearch('milk')
    );
    expect(unchanged).toBe(start);
    const changed = storageReducer(start, StorageActions.updateSearch('bread'));
    expect(changed.searchQuery).toBe('bread');
  });

  it('sets a filter and forces alphabetical mode', () => {
    const start = mockStorageState({ mode: 'categories' });
    const state = storageReducer(start, StorageActions.updateFilter('Dairy'));
    expect(state.filterBy).toBe('Dairy');
    expect(state.mode).toBe('alphabetical');
  });

  it('adds a shopping list into storage and merges quantities', () => {
    const existing = mockStorageItem({ name: 'Milk', quantity: 2 });
    const start = mockStorageState({ items: [existing] });
    const bought = [
      mockShoppingItem({ name: 'Milk', quantity: 3, state: 'bought' }),
      mockShoppingItem({ id: 's2', name: 'Bread', quantity: 1 }),
    ];
    const state = storageReducer(start, StorageActions.addShoppingList(bought));
    const milk = state.items.find((index) => index.name === 'Milk');
    const bread = state.items.find((index) => index.name === 'Bread');
    expect(milk?.quantity).toBe(5);
    expect(bread?.quantity).toBe(1);
  });

  it('adds, renames and removes categories via the shared grocery catalog', () => {
    const added = storageReducer(
      initialState,
      GroceryCategoriesActions.add(mockCategory({ id: 'dairy', name: 'Dairy' }))
    );
    expect(added.categories.map((c) => c.name)).toContain('Dairy');
    const renamed = storageReducer(
      added,
      GroceryCategoriesActions.rename('dairy', 'Fridge')
    );
    expect(renamed.categories.find((c) => c.id === 'dairy')?.name).toBe(
      'Fridge'
    );
    const removed = storageReducer(
      renamed,
      GroceryCategoriesActions.remove('dairy')
    );
    expect(removed.categories.map((c) => c.name)).not.toContain('Fridge');
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const state = storageReducer(
      initialState,
      GroceriesActions.loaded({
        products: null,
        shopping: null,
        storage: mockStorageState({
          items: [mockStorageItem()],
          searchQuery: 'stale',
          mode: 'categories',
          filterBy: 'Dairy',
        }),
      })
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.mode).toBe('alphabetical');
    expect(state.filterBy).toBeUndefined();
  });
});
