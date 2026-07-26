import { TasksActions } from '../actions/tasks.actions';
import { initialState, tasksReducer } from './tasks.reducer';
import { mockTaskItem, mockTasksState } from '../../testing/tasks.test-data';
import { mockCategory } from '../../../@shared/testing/test-data';

describe('tasksReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = tasksReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item without deriving categories (the catalog is authoritative)', () => {
    const item = mockTaskItem({ name: 'Sweep', categoryIds: ['chores'] });
    const state = tasksReducer(initialState, TasksActions.addItem(item));
    expect(state.items).toEqual([item]);
    // categories are minted explicitly now — adding an item never touches them
    expect(state.categories).toEqual([]);
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

  it('adds and removes categories by id (pre-minted {id,name})', () => {
    const chores = mockCategory({ id: 'c1', name: 'Chores' });
    const added = tasksReducer(initialState, TasksActions.addCategory(chores));
    expect(added.categories).toContainEqual(chores);
    const removed = tasksReducer(added, TasksActions.removeCategory('c1'));
    expect(removed.categories).not.toContainEqual(chores);
  });

  it('renames a category in the catalog by id (items reference it by id)', () => {
    const chores = mockCategory({ id: 'c1', name: 'Chores' });
    const start = mockTasksState({ categories: [chores] });
    const state = tasksReducer(
      start,
      TasksActions.updateCategory('c1', 'Errands')
    );
    expect(state.categories).toEqual([{ id: 'c1', name: 'Errands' }]);
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const state = tasksReducer(
      initialState,
      TasksActions.loaded(
        mockTasksState({
          items: [mockTaskItem()],
          searchQuery: 'stale',
          mode: 'categories',
          filterBy: 'Chores',
        })
      )
    );
    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.mode).toBe('alphabetical');
    expect(state.filterBy).toBeUndefined();
  });
});
