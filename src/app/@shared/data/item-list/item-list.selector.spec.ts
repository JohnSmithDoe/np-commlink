import { IListState, ITrackingItem } from '../../types';
import {
  filterAndSortItemList,
  filterBySearchQuery,
  sortItemListFn,
} from './item-list.selector';

const item = (id: string, name: string): ITrackingItem => ({
  id,
  name,
  createdAt: '2026-01-01',
  state: 'stopped',
});

const list = (
  items: ITrackingItem[],
  extra: Partial<IListState<ITrackingItem>> = {}
): IListState<ITrackingItem> => ({
  title: 'list',
  items,
  categories: [],
  mode: 'alphabetical',
  ...extra,
});

describe('item-list.selector', () => {
  describe('filterBySearchQuery', () => {
    it('returns undefined without a query', () => {
      expect(filterBySearchQuery(list([item('1', 'A')]))).toBeUndefined();
      expect(
        filterBySearchQuery(list([item('1', 'A')], { searchQuery: '   ' }))
      ).toBeUndefined();
    });

    it('filters by substring and flags the exact match', () => {
      const state = list([item('1', 'Foo'), item('2', 'Bar')], {
        searchQuery: 'foo',
      });
      const result = filterBySearchQuery(state);
      expect(result?.listItems.map((i) => i.id)).toEqual(['1']);
      expect(result?.exactMatch?.id).toBe('1');
    });

    it('has no exact match on a partial query', () => {
      const result = filterBySearchQuery(
        list([item('1', 'Foo')], { searchQuery: 'fo' })
      );
      expect(result?.listItems.map((i) => i.id)).toEqual(['1']);
      expect(result?.exactMatch).toBeUndefined();
    });
  });

  describe('sortItemListFn', () => {
    it('sorts by name ascending and descending', () => {
      const items = [
        item('1', 'Charlie'),
        item('2', 'Alpha'),
        item('3', 'Bravo'),
      ];
      expect(
        [...items]
          .sort(sortItemListFn({ sortBy: 'name', sortDir: 'asc' }))
          .map((i) => i.name)
      ).toEqual(['Alpha', 'Bravo', 'Charlie']);
      expect(
        [...items]
          .sort(sortItemListFn({ sortBy: 'name', sortDir: 'desc' }))
          .map((i) => i.name)
      ).toEqual(['Charlie', 'Bravo', 'Alpha']);
    });

    it('keeps the original order without a sort', () => {
      const items = [item('1', 'B'), item('2', 'A')];
      expect([...items].sort(sortItemListFn()).map((i) => i.id)).toEqual([
        '1',
        '2',
      ]);
    });
  });

  describe('filterAndSortItemList', () => {
    it('sorts the full list when there is no search result', () => {
      const state = list([item('1', 'B'), item('2', 'A')], {
        sort: { sortBy: 'name', sortDir: 'asc' },
      });
      expect(filterAndSortItemList(state).map((i) => i.name)).toEqual([
        'A',
        'B',
      ]);
    });

    it('sorts the search result subset when present', () => {
      const state = list([item('1', 'B'), item('2', 'A'), item('3', 'C')], {
        sort: { sortBy: 'name', sortDir: 'asc' },
      });
      const result = {
        searchTerm: 'x',
        hasSearchTerm: true,
        listItems: [state.items[0], state.items[1]],
      };
      expect(filterAndSortItemList(state, result).map((i) => i.name)).toEqual([
        'A',
        'B',
      ]);
    });
  });
});
