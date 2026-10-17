import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import { initialState, tasksReducer } from './tasks.reducer';
import { mockTaskItem, mockTasksState } from '../testing/tasks.test-data';
import { mockCategory } from '../../@shared/testing/test-data';

describe('tasksReducer', () => {
  it('wires its list actions to the task list, never the catalog', () => {
    const item = mockTaskItem({ id: 'a', name: 'Sweep', categoryIds: ['c1'] });
    const added = tasksReducer(initialState, TasksActions.addItem(item));
    const updated = tasksReducer(
      added,
      TasksActions.updateItem({ ...item, name: 'Mop' })
    );
    const narrowed = tasksReducer(
      tasksReducer(updated, TasksActions.updateSearch('mop')),
      TasksActions.updateFilter('c1')
    );
    const removed = tasksReducer(narrowed, TasksActions.removeItem(item));

    expect(updated.list.items).toEqual([{ ...item, name: 'Mop' }]);
    expect(narrowed.list).toMatchObject({ searchQuery: 'mop', filterBy: 'c1' });
    expect(removed.list.items).toEqual([]);
    expect(removed.categoryList).toBe(initialState.categoryList);
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

  it('undoing a delete puts the category back on the tasks that had it', () => {
    const chores = mockCategory({ id: 'c1', name: 'Chores' });
    const start = mockTasksState({
      categoryList: { items: [chores] },
      list: {
        items: [
          mockTaskItem({ id: 't', categoryIds: ['c1'] }),
          mockTaskItem({ id: 'other', categoryIds: [] }),
        ],
      },
    });

    const deleted = tasksReducer(
      start,
      TaskCategoriesActions.removeItem(chores)
    );
    const restored = tasksReducer(
      deleted,
      TasksActions.restoreCategory(chores, ['t'])
    );

    expect(restored.categoryList.items).toEqual([chores]);
    expect(restored.list.items[0].categoryIds).toEqual(['c1']);
    expect(restored.list.items[1].categoryIds).toEqual([]);
  });

  it('replaces the state from a loaded datastore and resets transient fields', () => {
    const stale = mockTasksState({
      list: {
        items: [mockTaskItem()],
        searchQuery: 'stale',
        filterBy: 'Chores',
      },
    });
    const state = tasksReducer(initialState, TasksActions.loaded(stale));
    expect(state.list.items).toHaveLength(1);
    expect(state.list.searchQuery).toBeUndefined();
    expect(state.list.filterBy).toBeUndefined();
  });
  it('reopens exactly the due tasks, keeping their schedule', () => {
    const due = mockTaskItem({
      id: 'due',
      doneAt: '2026-10-10T08:00:00.000Z',
      nextDueAt: '2026-10-17',
    });
    const other = mockTaskItem({
      id: 'other',
      doneAt: '2026-10-10T08:00:00.000Z',
    });
    const start = mockTasksState({ list: { items: [due, other] } });

    const state = tasksReducer(start, TasksActions.reopenDue([due]));

    expect(state.list.items).toEqual([{ ...due, doneAt: undefined }, other]);
    expect(state.list.items[1]).toBe(other);
  });

  it('returns the same state when nothing is due', () => {
    const start = mockTasksState({ list: { items: [mockTaskItem()] } });

    expect(tasksReducer(start, TasksActions.reopenDue([]))).toBe(start);
  });
});
