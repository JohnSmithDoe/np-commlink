import { IDatastore } from '../../@shared/types';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { TasksActions } from './tasks.actions';
import { initialState, tasksReducer } from './tasks.reducer';
import { mockTaskItem, mockTasksState } from '../../@shared/testing/test-data';

describe('tasksReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = tasksReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item and derives its categories', () => {
    const item = mockTaskItem({ name: 'Sweep', category: ['Chores'] });
    const state = tasksReducer(initialState, TasksActions.addItem(item));
    expect(state.items).toEqual([item]);
    expect(state.categories).toContain('Chores');
  });

  it('removes an item by id', () => {
    const item = mockTaskItem({ id: 'a' });
    const start = mockTasksState({ items: [item] });
    const state = tasksReducer(start, TasksActions.removeItem(item));
    expect(state.items).toHaveLength(0);
  });

  it('updates an existing item', () => {
    const item = mockTaskItem({ id: 'a', name: 'Old' });
    const start = mockTasksState({ items: [item] });
    const state = tasksReducer(
      start,
      TasksActions.updateItem({ ...item, name: 'New' })
    );
    expect(state.items[0].name).toBe('New');
  });

  it('trims the search query and only updates when it changed', () => {
    const start = mockTasksState({ searchQuery: 'milk' });
    const unchanged = tasksReducer(
      start,
      TasksActions.updateSearch('  milk  ')
    );
    expect(unchanged).toBe(start);
    const changed = tasksReducer(start, TasksActions.updateSearch('  bread  '));
    expect(changed.searchQuery).toBe('bread');
  });

  it('sets a filter and forces alphabetical mode', () => {
    const start = mockTasksState({ mode: 'categories' });
    const state = tasksReducer(start, TasksActions.updateFilter('Chores'));
    expect(state.filterBy).toBe('Chores');
    expect(state.mode).toBe('alphabetical');
  });

  it('updates the mode', () => {
    const state = tasksReducer(
      initialState,
      TasksActions.updateMode('categories')
    );
    expect(state.mode).toBe('categories');
  });

  it('adds and removes categories', () => {
    const added = tasksReducer(
      initialState,
      TasksActions.addCategory('Chores')
    );
    expect(added.categories).toContain('Chores');
    const removed = tasksReducer(added, TasksActions.removeCategory('Chores'));
    expect(removed.categories).not.toContain('Chores');
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const datastore = {
      tasks: mockTasksState({
        items: [mockTaskItem()],
        searchQuery: 'stale',
        mode: 'categories',
        filterBy: 'Chores',
      }),
    } as IDatastore;
    const state = tasksReducer(
      initialState,
      ApplicationActions.loadedSuccessfully(datastore)
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.mode).toBe('alphabetical');
    expect(state.filterBy).toBeUndefined();
  });
});
