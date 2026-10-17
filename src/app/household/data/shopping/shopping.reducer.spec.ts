import { HouseholdActions } from '../household.actions';
import { ShoppingActions } from './shopping.actions';
import { initialState, shoppingReducer } from './shopping.reducer';
import {
  mockHouseholdState,
  mockShoppingItem,
  mockShoppingState,
} from '../../testing/household.test-data';

describe('shoppingReducer', () => {
  it('wires its list actions to the shared list utils', () => {
    const item = mockShoppingItem({ id: 'a', quantity: 1 });
    const added = shoppingReducer(initialState, ShoppingActions.addItem(item));
    const updated = shoppingReducer(
      added,
      ShoppingActions.updateItem({ ...item, quantity: 5 })
    );
    const narrowed = shoppingReducer(
      shoppingReducer(updated, ShoppingActions.updateSearch('milk')),
      ShoppingActions.updateFilter('dairy')
    );
    const removed = shoppingReducer(narrowed, ShoppingActions.removeItem(item));

    expect(updated.items).toEqual([{ ...item, quantity: 5 }]);
    expect(narrowed).toMatchObject({ searchQuery: 'milk', filterBy: 'dairy' });
    expect(removed.items).toEqual([]);
  });

  it('removes multiple items by id', () => {
    const a = mockShoppingItem({ id: 'a' });
    const b = mockShoppingItem({ id: 'b' });
    const c = mockShoppingItem({ id: 'c' });
    const start = mockShoppingState({ items: [a, b, c] });
    const state = shoppingReducer(start, ShoppingActions.removeItems([a, c]));
    expect(state.items.map((index) => index.id)).toEqual(['b']);
  });

  it('shows the action sheet', () => {
    const start = mockShoppingState({ showActionSheet: false });
    const state = shoppingReducer(start, ShoppingActions.showActionSheet());
    expect(state.showActionSheet).toBe(true);
  });

  it('hides the action sheet', () => {
    const start = mockShoppingState({ showActionSheet: true });
    const state = shoppingReducer(start, ShoppingActions.hideActionSheet());
    expect(state.showActionSheet).toBe(false);
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const stored = mockHouseholdState({
      shopping: mockShoppingState({
        items: [mockShoppingItem()],
        searchQuery: 'stale',
        filterBy: 'Dairy',
        showActionSheet: true,
      }),
    });
    const state = shoppingReducer(
      initialState,
      HouseholdActions.loaded(stored)
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.filterBy).toBeUndefined();
    expect(state.showActionSheet).toBe(false);
  });
});
