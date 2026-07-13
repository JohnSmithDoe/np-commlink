import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/data/list/list.selector';
import {
  selectTasksListItems,
  selectTasksListSearchResult,
  selectTasksState,
} from './tasks.selector';
import {
  mockAppState,
  mockTaskItem,
  mockTasksState,
} from '../../@shared/testing/test-data';

describe('tasks.selector', () => {
  it('selects the tasks feature slice', () => {
    const state = mockAppState();
    expect(selectTasksState(state)).toBe(state.tasks);
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
  });
});
