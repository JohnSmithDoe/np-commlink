import { IDatastore } from '../../@shared/types';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { StorageActions } from './storage.actions';
import { initialState, storageReducer } from './storage.reducer';
import {
  mockShoppingItem,
  mockStorageItem,
  mockStorageState,
} from '../../@shared/testing/test-data';

describe('storageReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = storageReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item and derives its categories', () => {
    const item = mockStorageItem({ name: 'Milk', category: ['Dairy'] });
    const state = storageReducer(initialState, StorageActions.addItem(item));
    expect(state.items).toEqual([item]);
    expect(state.categories).toContain('Dairy');
  });

  it('does not add an item with a blank name', () => {
    const item = mockStorageItem({ name: '   ' });
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
    const milk = state.items.find((i) => i.name === 'Milk');
    const bread = state.items.find((i) => i.name === 'Bread');
    expect(milk?.quantity).toBe(5);
    expect(bread?.quantity).toBe(1);
  });

  it('adds and removes categories', () => {
    const added = storageReducer(
      initialState,
      StorageActions.addCategory('Dairy')
    );
    expect(added.categories).toContain('Dairy');
    const removed = storageReducer(
      added,
      StorageActions.removeCategory('Dairy')
    );
    expect(removed.categories).not.toContain('Dairy');
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const datastore = {
      storage: mockStorageState({
        items: [mockStorageItem()],
        searchQuery: 'stale',
        mode: 'categories',
        filterBy: 'Dairy',
      }),
    } as IDatastore;
    const state = storageReducer(
      initialState,
      ApplicationActions.loadedSuccessfully(datastore)
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.mode).toBe('alphabetical');
    expect(state.filterBy).toBeUndefined();
  });
});
