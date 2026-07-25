import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/list/list.selector';
import {
  selectTasksListItems,
  selectTasksListSearchResult,
  selectTasksState,
} from './tasks.selector';
import { mockAppState } from '../../@shared/testing/test-data';
import { mockTaskItem, mockTasksState } from '../testing/tasks.test-data';

describe('tasks.selector', () => {
  it('selects the tasks feature slice', () => {
    const tasks = mockTasksState();
    const state = mockAppState({ tasks });
    expect(selectTasksState(state)).toBe(tasks);
  });

  describe('selectTasksListSearchResult', () => {
    it('returns undefined without a search query', () => {
      const listState = mockTasksState();
      expect(selectTasksListSearchResult.projector(listState)).toBeUndefined();
    });

    it('returns the search result matching the query', () => {
      const listState = mockTasksState({
        searchQuery: 'Sweep',
        items: [
          mockTaskItem({ id: 'a', name: 'Sweep' }),
          mockTaskItem({ id: 'b', name: 'Mop' }),
        ],
      });
      const result = selectTasksListSearchResult.projector(listState);
      expect(result?.listItems.map((index) => index.name)).toEqual(['Sweep']);
      expect(result).toEqual(filterListBySearchQuery(listState));
    });
  });

  describe('selectTasksListItems', () => {
    it('filters and sorts the item list', () => {
      const state = mockTasksState({
        sort: { sortBy: 'name', sortDir: 'asc' },
        items: [
          mockTaskItem({ id: 'a', name: 'Sweep' }),
          mockTaskItem({ id: 'b', name: 'Mop' }),
        ],
      });
      expect(selectTasksListItems.projector(state, undefined)).toEqual(
        filterAndSortItemList(state)
      );
      expect(
        selectTasksListItems
          .projector(state, undefined)
          ?.map((index) => index.name)
      ).toEqual(['Mop', 'Sweep']);
    });

    // Relocated from grocery-list.selector.spec (DDD review #1): the task prio
    // sort belongs in a tasks spec, not a groceries one. Exercises the shared
    // list engine's structural `prio` comparator through the tasks selector.
    it('sorts task items by priority through the shared engine', () => {
      const state = mockTasksState({
        sort: { sortBy: 'prio', sortDir: 'asc' },
        items: [
          mockTaskItem({ id: 'h', name: 'high', prio: 9 }),
          mockTaskItem({ id: 'l', name: 'low', prio: 1 }),
        ],
      });
      expect(
        selectTasksListItems
          .projector(state, undefined)
          ?.map((index) => index.name)
      ).toEqual(['low', 'high']);
    });

    it('sorts task items by due date, falling back to name when both are unset', () => {
      const dated = mockTasksState({
        sort: { sortBy: 'dueAt', sortDir: 'asc' },
        items: [
          mockTaskItem({ id: 'l', name: 'Aaa', dueAt: '2024-12-01' }),
          mockTaskItem({ id: 'e', name: 'Zzz', dueAt: '2024-01-01' }),
        ],
      });
      expect(
        selectTasksListItems.projector(dated, undefined)?.map((task) => task.id)
      ).toEqual(['e', 'l']);

      const undated = mockTasksState({
        sort: { sortBy: 'dueAt', sortDir: 'asc' },
        items: [
          mockTaskItem({ id: '1', name: 'B' }),
          mockTaskItem({ id: '2', name: 'A' }),
        ],
      });
      expect(
        selectTasksListItems
          .projector(undated, undefined)
          ?.map((task) => task.name)
      ).toEqual(['A', 'B']);
    });

    it('sorts task items by due date descending, latest first', () => {
      const state = mockTasksState({
        sort: { sortBy: 'dueAt', sortDir: 'desc' },
        items: [
          mockTaskItem({ id: 'e', name: 'early', dueAt: '2024-01-01' }),
          mockTaskItem({ id: 'l', name: 'late', dueAt: '2024-12-01' }),
        ],
      });
      expect(
        selectTasksListItems.projector(state, undefined)?.map((task) => task.id)
      ).toEqual(['l', 'e']);
    });
  });
});
