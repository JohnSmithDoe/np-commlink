import { HouseholdActions } from '../household.actions';
import { StorageActions } from './storage.actions';
import { initialState, storageReducer } from './storage.reducer';
import {
  mockHouseholdState,
  mockShoppingItem,
  mockStorageItem,
  mockStorageState,
} from '../../testing/household.test-data';

describe('storageReducer', () => {
  it('wires its list actions to the shared list utils', () => {
    const item = mockStorageItem({ id: 'a', quantity: 1 });
    const added = storageReducer(initialState, StorageActions.addItem(item));
    const updated = storageReducer(
      added,
      StorageActions.updateItem({ ...item, quantity: 5 })
    );
    const narrowed = storageReducer(
      storageReducer(updated, StorageActions.updateSearch('milk')),
      StorageActions.updateFilter('dairy')
    );
    const removed = storageReducer(narrowed, StorageActions.removeItem(item));

    expect(updated.items).toEqual([{ ...item, quantity: 5 }]);
    expect(narrowed).toMatchObject({ searchQuery: 'milk', filterBy: 'dairy' });
    expect(removed.items).toEqual([]);
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
    const stored = mockHouseholdState({
      storage: mockStorageState({
        items: [mockStorageItem()],
        searchQuery: 'stale',
        filterBy: 'Dairy',
      }),
    });
    const state = storageReducer(initialState, HouseholdActions.loaded(stored));
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.filterBy).toBeUndefined();
  });
});
