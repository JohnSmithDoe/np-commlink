import { GroceriesActions } from '../groceries/groceries.actions';
import { StorageActions } from './storage.actions';
import { initialState, storageReducer } from './storage.reducer';
import {
  mockGroceriesState,
  mockShoppingItem,
  mockStorageItem,
  mockStorageState,
} from '../../testing/groceries.test-data';

describe('storageReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = storageReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item', () => {
    const item = mockStorageItem({ name: 'Milk', categoryIds: ['dairy'] });
    const state = storageReducer(initialState, StorageActions.addItem(item));
    expect(state.items).toEqual([item]);
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

  it('sets a filter', () => {
    const start = mockStorageState();
    const state = storageReducer(start, StorageActions.updateFilter('Dairy'));
    expect(state.filterBy).toBe('Dairy');
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

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const state = storageReducer(
      initialState,
      GroceriesActions.loaded(
        mockGroceriesState({
          storage: mockStorageState({
            items: [mockStorageItem()],
            searchQuery: 'stale',
            filterBy: 'Dairy',
          }),
        })
      )
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.filterBy).toBeUndefined();
  });
});
