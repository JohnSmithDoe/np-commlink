import { IDatastore } from '../../@shared/types';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { GlobalsActions } from './globals.actions';
import { globalsReducer, initialState } from './globals.reducer';
import {
  mockGlobalItem,
  mockGlobalsState,
} from '../../@shared/testing/test-data';

describe('globalsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = globalsReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item and derives its categories', () => {
    const item = mockGlobalItem({ name: 'Sugar', category: ['Baking'] });
    const state = globalsReducer(initialState, GlobalsActions.addItem(item));
    expect(state.items).toEqual([item]);
    expect(state.categories).toContain('Baking');
  });

  it('removes an item by id', () => {
    const item = mockGlobalItem({ id: 'a' });
    const start = mockGlobalsState({ items: [item] });
    const state = globalsReducer(start, GlobalsActions.removeItem(item));
    expect(state.items).toHaveLength(0);
  });

  it('updates an existing item', () => {
    const item = mockGlobalItem({ id: 'a', name: 'Old' });
    const start = mockGlobalsState({ items: [item] });
    const state = globalsReducer(
      start,
      GlobalsActions.updateItem({ ...item, name: 'New' })
    );
    expect(state.items[0].name).toBe('New');
  });

  it('trims the search query and only updates when it changed', () => {
    const start = mockGlobalsState({ searchQuery: 'sugar' });
    const unchanged = globalsReducer(
      start,
      GlobalsActions.updateSearch('  sugar  ')
    );
    expect(unchanged).toBe(start);
    const changed = globalsReducer(
      start,
      GlobalsActions.updateSearch('  salt  ')
    );
    expect(changed.searchQuery).toBe('salt');
  });

  it('sets a filter and forces alphabetical mode', () => {
    const start = mockGlobalsState({ mode: 'categories' });
    const state = globalsReducer(start, GlobalsActions.updateFilter('Baking'));
    expect(state.filterBy).toBe('Baking');
    expect(state.mode).toBe('alphabetical');
  });

  it('updates the mode', () => {
    const state = globalsReducer(
      initialState,
      GlobalsActions.updateMode('categories')
    );
    expect(state.mode).toBe('categories');
  });

  it('adds and removes categories', () => {
    const added = globalsReducer(
      initialState,
      GlobalsActions.addCategory('Baking')
    );
    expect(added.categories).toContain('Baking');
    const removed = globalsReducer(
      added,
      GlobalsActions.removeCategory('Baking')
    );
    expect(removed.categories).not.toContain('Baking');
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const datastore = {
      globals: mockGlobalsState({
        items: [mockGlobalItem()],
        searchQuery: 'stale',
        mode: 'categories',
        filterBy: 'Baking',
      }),
    } as IDatastore;
    const state = globalsReducer(
      initialState,
      ApplicationActions.loadedSuccessfully(datastore)
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.mode).toBe('alphabetical');
    expect(state.filterBy).toBeUndefined();
  });
});
