import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/item-lists/list.selector';
import {
  selectDoneTasks,
  selectOpenTaskCount,
  selectOpenTasks,
  selectTasksListItems,
  selectTasksListSearchResult,
  selectTasksState,
} from './tasks.selector';
import { mockKernelState } from '../../@shared/testing/test-data';
import {
  mockTaskItem,
  mockTasksList,
  mockTasksState,
} from '../testing/tasks.test-data';

describe('tasks.selector', () => {
  it('selects the tasks feature slice', () => {
    const tasks = mockTasksState();
    const state = mockKernelState({ tasks });
    expect(selectTasksState(state)).toBe(tasks);
  });

  describe('selectTasksListSearchResult', () => {
    it('returns undefined without a search query', () => {
      const listState = mockTasksList();
      expect(selectTasksListSearchResult.projector(listState)).toBeUndefined();
    });

    it('returns the search result matching the query', () => {
      const listState = mockTasksList({
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
      const state = mockTasksList({
        sort: { sortBy: 'name', sortDirection: 'asc' },
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

    it('sorts task items by priority through the shared engine', () => {
      const state = mockTasksList({
        sort: { sortBy: 'prio', sortDirection: 'asc' },
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
      const dated = mockTasksList({
        sort: { sortBy: 'dueAt', sortDirection: 'asc' },
        items: [
          mockTaskItem({ id: 'l', name: 'Aaa', dueAt: '2024-12-01' }),
          mockTaskItem({ id: 'e', name: 'Zzz', dueAt: '2024-01-01' }),
        ],
      });
      expect(
        selectTasksListItems.projector(dated, undefined)?.map((task) => task.id)
      ).toEqual(['e', 'l']);

      const undated = mockTasksList({
        sort: { sortBy: 'dueAt', sortDirection: 'asc' },
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
      const state = mockTasksList({
        sort: { sortBy: 'dueAt', sortDirection: 'desc' },
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

describe('open and done', () => {
  const items = [
    mockTaskItem({ id: 'a' }),
    mockTaskItem({ id: 'b', doneAt: '2026-08-01' }),
  ];

  it('partitions the visible list on doneAt', () => {
    expect(selectOpenTasks.projector(items).map((task) => task.id)).toEqual([
      'a',
    ]);
    expect(selectDoneTasks.projector(items).map((task) => task.id)).toEqual([
      'b',
    ]);
  });

  it('survives a list that has not loaded', () => {
    expect(selectOpenTasks.projector(undefined)).toEqual([]);
    expect(selectDoneTasks.projector(undefined)).toEqual([]);
  });
});

describe('selectOpenTaskCount', () => {
  it('counts what is still open, not what is on the list', () => {
    expect(
      selectOpenTaskCount.projector(
        mockTasksList({
          items: [
            mockTaskItem({ id: 'a' }),
            mockTaskItem({ id: 'b' }),
            mockTaskItem({ id: 'c', doneAt: '2026-08-01' }),
          ],
        })
      )
    ).toBe(2);
  });

  it('is 0 for an unregistered slice', () => {
    expect(selectOpenTaskCount.projector(undefined as never)).toBe(0);
  });
});
