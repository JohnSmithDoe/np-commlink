import { mockBaseItem, mockCategory } from '../../testing/test-data';
import { IBaseItem } from '../../model/base-item.types';
import { IListState } from '../../model/item-list.types';
import {
  categoryComparator,
  filterAndSortItemList,
  filterListBySearchQuery,
  itemComparator,
  listCategoriesWithCount,
  listStateFilter,
} from './list.selector';

const mockListState = (
  overrides: Partial<IListState<IBaseItem>> = {}
): IListState<IBaseItem> => ({
  title: 'List',
  items: [],
  categories: [],
  mode: 'alphabetical',
  ...overrides,
});

// `prio`/`bestBefore`/`dueAt` are domain fields no shared type declares — the
// engine reads them structurally, which is exactly what these specs pin down.
const named = (
  name: string,
  extra: Record<string, unknown> = {}
): IBaseItem => ({ ...mockBaseItem({ id: name, name }), ...extra });

const sortedNames = (items: IBaseItem[], sort: IListState<IBaseItem>['sort']) =>
  [...items].sort(itemComparator(sort)).map((item) => item.name);

describe('itemComparator', () => {
  it('keeps the original order when no sort is configured', () => {
    const items = [named('Zulu'), named('Alpha')];
    expect(sortedNames(items, undefined)).toEqual(['Zulu', 'Alpha']);
  });

  it('sorts by name in both directions', () => {
    const items = [named('Mike'), named('Alpha'), named('Zulu')];

    expect(sortedNames(items, { sortBy: 'name', sortDir: 'asc' })).toEqual([
      'Alpha',
      'Mike',
      'Zulu',
    ]);
    expect(sortedNames(items, { sortBy: 'name', sortDir: 'desc' })).toEqual([
      'Zulu',
      'Mike',
      'Alpha',
    ]);
  });

  // The sentinel pair (MAXPRIO/MINPRIO, MAXDATE/MINDATE) exists so an unset
  // field loses in EITHER direction rather than flipping to the front on desc.
  describe('items missing the sorted field', () => {
    it('sorts them last when sorting by an optional number', () => {
      const items = [named('unset'), named('low', { prio: 1 })];

      expect(sortedNames(items, { sortBy: 'prio', sortDir: 'asc' })).toEqual([
        'low',
        'unset',
      ]);
      expect(sortedNames(items, { sortBy: 'prio', sortDir: 'desc' })).toEqual([
        'low',
        'unset',
      ]);
    });

    it('sorts them last when sorting by an optional date', () => {
      const items = [
        named('unset'),
        named('dated', { bestBefore: '2024-01-01' }),
      ];

      expect(
        sortedNames(items, { sortBy: 'bestBefore', sortDir: 'asc' })
      ).toEqual(['dated', 'unset']);
      expect(
        sortedNames(items, { sortBy: 'bestBefore', sortDir: 'desc' })
      ).toEqual(['dated', 'unset']);
    });

    it('falls back to the name comparator when neither item has the field', () => {
      const items = [named('Zulu'), named('Alpha')];

      expect(sortedNames(items, { sortBy: 'prio', sortDir: 'asc' })).toEqual([
        'Alpha',
        'Zulu',
      ]);
      expect(
        sortedNames(items, { sortBy: 'bestBefore', sortDir: 'desc' })
      ).toEqual(['Zulu', 'Alpha']);
    });
  });

  it('reads the sorted field structurally, so any domain item can carry it', () => {
    const items = [
      named('late', { dueAt: '2024-12-01' }),
      named('early', { dueAt: '2024-01-01' }),
    ];

    expect(sortedNames(items, { sortBy: 'dueAt', sortDir: 'asc' })).toEqual([
      'early',
      'late',
    ]);
  });
});

describe('filterAndSortItemList', () => {
  it('sorts the list items when there is no search result', () => {
    const state = mockListState({
      items: [named('Zulu'), named('Alpha')],
      sort: { sortBy: 'name', sortDir: 'asc' },
    });

    expect(filterAndSortItemList(state).map((item) => item.name)).toEqual([
      'Alpha',
      'Zulu',
    ]);
  });

  it('does not mutate the state it sorts', () => {
    const items = [named('Zulu'), named('Alpha')];
    const state = mockListState({
      items,
      sort: { sortBy: 'name', sortDir: 'asc' },
    });

    filterAndSortItemList(state);

    expect(items.map((item) => item.name)).toEqual(['Zulu', 'Alpha']);
  });

  it('narrows to the active category filter', () => {
    const state = mockListState({
      filterBy: 'cat-1',
      items: [
        named('kept', { categoryIds: ['cat-1'] }),
        named('other', { categoryIds: ['cat-2'] }),
        named('uncategorised'),
      ],
    });

    expect(filterAndSortItemList(state).map((item) => item.name)).toEqual([
      'kept',
    ]);
  });

  it('prefers the search result over the list items', () => {
    const state = mockListState({ items: [named('Alpha'), named('Zulu')] });
    const result = {
      listItems: [named('Zulu')],
      hasSearchTerm: true,
      searchTerm: 'Zulu',
    };

    expect(
      filterAndSortItemList(state, result).map((item) => item.name)
    ).toEqual(['Zulu']);
  });
});

describe('filterListBySearchQuery', () => {
  it('is undefined without a usable query', () => {
    const items = [named('Milk')];

    expect(filterListBySearchQuery(mockListState({ items }))).toBeUndefined();
    expect(
      filterListBySearchQuery(
        mockListState({ items, searchQuery: ' '.repeat(3) })
      )
    ).toBeUndefined();
  });

  it('trims the query and reports the matches', () => {
    const state = mockListState({
      searchQuery: '  mil ',
      items: [named('Milk'), named('Bread')],
    });

    const result = filterListBySearchQuery(state);

    expect(result?.searchTerm).toBe('mil');
    expect(result?.hasSearchTerm).toBe(true);
    expect(result?.listItems.map((item) => item.name)).toEqual(['Milk']);
  });

  it('flags the exact match among the partial ones', () => {
    const state = mockListState({
      searchQuery: 'milk',
      items: [named('Milk chocolate'), named('Milk')],
    });

    expect(filterListBySearchQuery(state)?.exactMatch?.name).toBe('Milk');
  });

  it('leaves exactMatch unset when only partial matches exist', () => {
    const state = mockListState({
      searchQuery: 'milk',
      items: [named('Milk chocolate')],
    });

    expect(filterListBySearchQuery(state)?.exactMatch).toBeUndefined();
  });
});

describe('categoryComparator', () => {
  it('sorts ascending by default and descending on request', () => {
    const categories = [
      mockCategory({ id: 'z', name: 'Zulu' }),
      mockCategory({ id: 'a', name: 'Alpha' }),
    ];

    expect(
      [...categories].sort(categoryComparator()).map((cat) => cat.name)
    ).toEqual(['Alpha', 'Zulu']);
    expect(
      [...categories]
        .sort(categoryComparator({ sortBy: 'name', sortDir: 'desc' }))
        .map((cat) => cat.name)
    ).toEqual(['Zulu', 'Alpha']);
  });
});

describe('listStateFilter', () => {
  it('reports category mode and an active filter independently', () => {
    expect(listStateFilter(mockListState())).toEqual({
      isCategoryModeOrHasFilter: false,
      hasFilter: false,
    });
    expect(listStateFilter(mockListState({ mode: 'categories' }))).toEqual({
      isCategoryModeOrHasFilter: true,
      hasFilter: false,
    });
    expect(listStateFilter(mockListState({ filterBy: 'cat-1' }))).toEqual({
      isCategoryModeOrHasFilter: true,
      hasFilter: true,
    });
  });

  it('is inert for an unregistered slice', () => {
    expect(listStateFilter(undefined)).toEqual({
      isCategoryModeOrHasFilter: false,
      hasFilter: false,
    });
  });
});

describe('listCategoriesWithCount', () => {
  const state = mockListState({
    categories: [
      mockCategory({ id: 'z', name: 'Zulu' }),
      mockCategory({ id: 'a', name: 'Alpha' }),
    ],
    items: [
      named('one', { categoryIds: ['a'] }),
      named('two', { categoryIds: ['a', 'z'] }),
      named('three'),
    ],
  });

  it('counts the items carrying each category, sorted by name', () => {
    expect(listCategoriesWithCount(state)).toEqual([
      { category: state.categories[1], count: 2 },
      { category: state.categories[0], count: 1 },
    ]);
  });

  it('narrows the catalog by the search query', () => {
    expect(
      listCategoriesWithCount({ ...state, searchQuery: 'zul' }).map(
        (entry) => entry.category.name
      )
    ).toEqual(['Zulu']);
  });

  it('does not mutate the catalog it sorts', () => {
    const categories = [
      mockCategory({ id: 'z', name: 'Zulu' }),
      mockCategory({ id: 'a', name: 'Alpha' }),
    ];

    listCategoriesWithCount(mockListState({ categories }));

    expect(categories.map((cat) => cat.name)).toEqual(['Zulu', 'Alpha']);
  });

  it('is empty for an unregistered slice', () => {
    expect(listCategoriesWithCount(undefined)).toEqual([]);
  });
});
