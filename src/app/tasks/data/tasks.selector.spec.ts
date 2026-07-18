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
      expect(result?.listItems.map((i) => i.name)).toEqual(['Sweep']);
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
        filterAndSortItemList(state, undefined)
      );
      expect(
        selectTasksListItems.projector(state, undefined)?.map((i) => i.name)
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
        selectTasksListItems.projector(state, undefined)?.map((i) => i.name)
      ).toEqual(['low', 'high']);
    });
  });
});
