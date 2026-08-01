import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import { initialState, tasksReducer } from './tasks.reducer';
import { mockTaskItem, mockTasksState } from '../testing/tasks.test-data';
import { mockCategory } from '../../@shared/testing/test-data';

describe('tasksReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = tasksReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
  });

  it('adds an item without touching the catalog', () => {
    const item = mockTaskItem({ name: 'Sweep', categoryIds: ['chores'] });
    const state = tasksReducer(initialState, TasksActions.addItem(item));
    expect(state.list.items).toEqual([item]);
    expect(state.categoryList.items).toEqual([]);
  });

  it('removes an item by id', () => {
    const item = mockTaskItem({ id: 'a' });
    const start = mockTasksState({ list: { items: [item] } });
    const state = tasksReducer(start, TasksActions.removeItem(item));
    expect(state.list.items).toHaveLength(0);
  });

  it('updates an existing item', () => {
    const item = mockTaskItem({ id: 'a', name: 'Old' });
    const start = mockTasksState({ list: { items: [item] } });
    const state = tasksReducer(
      start,
      TasksActions.updateItem({ ...item, name: 'New' })
    );
    expect(state.list.items[0].name).toBe('New');
  });

  it('trims the search query and only updates when it changed', () => {
    const start = mockTasksState({ list: { searchQuery: 'milk' } });
    const unchanged = tasksReducer(
      start,
      TasksActions.updateSearch('  milk  ')
    );
    expect(unchanged).toBe(start);
    const changed = tasksReducer(start, TasksActions.updateSearch('  bread  '));
    expect(changed.list.searchQuery).toBe('bread');
  });

  it('sets a filter', () => {
    const start = mockTasksState();
    const state = tasksReducer(start, TasksActions.updateFilter('Chores'));
    expect(state.list.filterBy).toBe('Chores');
  });

  it('adds and removes catalog entries through the catalog list', () => {
    const chores = mockCategory({ id: 'c1', name: 'Chores' });
    const added = tasksReducer(
      initialState,
      TaskCategoriesActions.addItem(chores)
    );
    expect(added.categoryList.items).toContainEqual(chores);
    const removed = tasksReducer(
      added,
      TaskCategoriesActions.removeItem(chores)
    );
    expect(removed.categoryList.items).not.toContainEqual(chores);
  });

  it('renames a catalog entry by id, leaving tasks alone — they reference by id', () => {
    const chores = mockCategory({ id: 'c1', name: 'Chores' });
    const start = mockTasksState({
      categoryList: { items: [chores] },
      list: { items: [mockTaskItem({ id: 't', categoryIds: ['c1'] })] },
    });

    const state = tasksReducer(
      start,
      TaskCategoriesActions.updateItem({ id: 'c1', name: 'Errands' })
    );

    expect(state.categoryList.items).toEqual([{ id: 'c1', name: 'Errands' }]);
    expect(state.list.items[0].categoryIds).toEqual(['c1']);
  });

  // The cascade: the catalog and the task list are siblings, so deleting an entry
  // has to reach across.
  it('deleting a catalog entry strips its id off every task', () => {
    const chores = mockCategory({ id: 'c1', name: 'Chores' });
    const start = mockTasksState({
      categoryList: { items: [chores] },
      list: { items: [mockTaskItem({ id: 't', categoryIds: ['c1'] })] },
    });

    const state = tasksReducer(start, TaskCategoriesActions.removeItem(chores));

    expect(state.categoryList.items).toEqual([]);
    expect(state.list.items[0].categoryIds).toEqual([]);
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const state = tasksReducer(
      initialState,
      TasksActions.loaded(
        mockTasksState({
          list: {
            items: [mockTaskItem()],
            searchQuery: 'stale',
            filterBy: 'Chores',
          },
        })
      )
    );
    expect(state.list.items).toHaveLength(1);
    expect(state.list.searchQuery).toBeUndefined();
    expect(state.list.filterBy).toBeUndefined();
  });
});
