import { GroceriesActions } from './groceries.actions';
import { ShoppingActions } from './shopping.actions';
import { initialState, shoppingReducer } from './shopping.reducer';
import {
  mockShoppingItem,
  mockShoppingState,
} from '../testing/grocery.test-data';

describe('shoppingReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = shoppingReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item and derives its categories', () => {
    const item = mockShoppingItem({ name: 'Milk', category: ['Dairy'] });
    const state = shoppingReducer(initialState, ShoppingActions.addItem(item));
    expect(state.items).toEqual([item]);
    expect(state.categories).toContain('Dairy');
  });

  it('does not add an item with a blank name', () => {
    const item = mockShoppingItem({ name: '   ' });
    const state = shoppingReducer(initialState, ShoppingActions.addItem(item));
    expect(state.items).toHaveLength(0);
  });

  it('removes an item by id', () => {
    const item = mockShoppingItem({ id: 'a' });
    const start = mockShoppingState({ items: [item] });
    const state = shoppingReducer(start, ShoppingActions.removeItem(item));
    expect(state.items).toHaveLength(0);
  });

  it('removes multiple items by id', () => {
    const a = mockShoppingItem({ id: 'a' });
    const b = mockShoppingItem({ id: 'b' });
    const c = mockShoppingItem({ id: 'c' });
    const start = mockShoppingState({ items: [a, b, c] });
    const state = shoppingReducer(start, ShoppingActions.removeItems([a, c]));
    expect(state.items.map((i) => i.id)).toEqual(['b']);
  });

  it('updates an existing item', () => {
    const item = mockShoppingItem({ id: 'a', quantity: 1 });
    const start = mockShoppingState({ items: [item] });
    const state = shoppingReducer(
      start,
      ShoppingActions.updateItem({ ...item, quantity: 5 })
    );
    expect(state.items[0].quantity).toBe(5);
  });

  it('updates the search query only when it changed', () => {
    const start = mockShoppingState({ searchQuery: 'milk' });
    const unchanged = shoppingReducer(
      start,
      ShoppingActions.updateSearch('milk')
    );
    expect(unchanged).toBe(start);
    const changed = shoppingReducer(
      start,
      ShoppingActions.updateSearch('bread')
    );
    expect(changed.searchQuery).toBe('bread');
  });

  it('sets a filter and forces alphabetical mode', () => {
    const start = mockShoppingState({ mode: 'categories' });
    const state = shoppingReducer(start, ShoppingActions.updateFilter('Dairy'));
    expect(state.filterBy).toBe('Dairy');
    expect(state.mode).toBe('alphabetical');
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

  it('adds and removes categories', () => {
    const added = shoppingReducer(
      initialState,
      ShoppingActions.addCategory('Dairy')
    );
    expect(added.categories).toContain('Dairy');
    const removed = shoppingReducer(
      added,
      ShoppingActions.removeCategory('Dairy')
    );
    expect(removed.categories).not.toContain('Dairy');
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const state = shoppingReducer(
      initialState,
      GroceriesActions.loaded({
        products: null,
        shopping: mockShoppingState({
          items: [mockShoppingItem()],
          searchQuery: 'stale',
          mode: 'categories',
          filterBy: 'Dairy',
          showActionSheet: true,
        }),
        storage: null,
      })
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.mode).toBe('alphabetical');
    expect(state.filterBy).toBeUndefined();
    expect(state.showActionSheet).toBe(false);
  });
});
