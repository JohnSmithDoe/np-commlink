import { mockBaseItem } from '../../testing/test-data';
import { IBaseItem } from '../../model/base-item.types';
import { IListState } from '../../model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
  itemCountByCategory,
  itemComparator,
} from './list.selector';

const mockListState = (
  overrides: Partial<IListState<IBaseItem>> = {}
): IListState<IBaseItem> => ({
  items: [],
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

    expect(
      sortedNames(items, { sortBy: 'name', sortDirection: 'asc' })
    ).toEqual(['Alpha', 'Mike', 'Zulu']);
    expect(
      sortedNames(items, { sortBy: 'name', sortDirection: 'desc' })
    ).toEqual(['Zulu', 'Mike', 'Alpha']);
  });

  // The sentinel pair (MAXPRIO/MINPRIO, MAXDATE/MINDATE) exists so an unset
  // field loses in EITHER direction rather than flipping to the front on desc.
  describe('items missing the sorted field', () => {
    it('sorts them last when sorting by an optional number', () => {
      const items = [named('unset'), named('low', { prio: 1 })];

      expect(
        sortedNames(items, { sortBy: 'prio', sortDirection: 'asc' })
      ).toEqual(['low', 'unset']);
      expect(
        sortedNames(items, { sortBy: 'prio', sortDirection: 'desc' })
      ).toEqual(['low', 'unset']);
    });

    it('sorts them last when sorting by an optional date', () => {
      const items = [
        named('unset'),
        named('dated', { bestBefore: '2024-01-01' }),
      ];

      expect(
        sortedNames(items, { sortBy: 'bestBefore', sortDirection: 'asc' })
      ).toEqual(['dated', 'unset']);
      expect(
        sortedNames(items, { sortBy: 'bestBefore', sortDirection: 'desc' })
      ).toEqual(['dated', 'unset']);
    });

    it('falls back to the name comparator when neither item has the field', () => {
      const items = [named('Zulu'), named('Alpha')];

      expect(
        sortedNames(items, { sortBy: 'prio', sortDirection: 'asc' })
      ).toEqual(['Alpha', 'Zulu']);
      expect(
        sortedNames(items, { sortBy: 'bestBefore', sortDirection: 'desc' })
      ).toEqual(['Zulu', 'Alpha']);
    });

    // A zero is a value, not an absence — so it beats an unset field in either
    // direction like any other number. Read as falsy it tied with `undefined`
    // instead, which is the one pair where the sentinel above did not hold.
    it('sorts an unset field last against a zero', () => {
      const items = [named('unset'), named('zeroed', { prio: 0 })];

      expect(
        sortedNames(items, { sortBy: 'prio', sortDirection: 'asc' })
      ).toEqual(['zeroed', 'unset']);
      expect(
        sortedNames(items, { sortBy: 'prio', sortDirection: 'desc' })
      ).toEqual(['zeroed', 'unset']);
    });

    // Equal values say nothing to order by, so the tie breaks on the name
    // rather than on whatever order the input happened to arrive in — the same
    // rule the blank-text case below follows, and what keeps a row's position
    // stable across two different filters that both contain it.
    it('falls back to the name when the values are equal', () => {
      expect(
        sortedNames([named('Zulu', { prio: 0 }), named('Alpha', { prio: 0 })], {
          sortBy: 'prio',
          sortDirection: 'asc',
        })
      ).toEqual(['Alpha', 'Zulu']);
      expect(
        sortedNames([named('Zulu', { prio: 3 }), named('Alpha', { prio: 3 })], {
          sortBy: 'prio',
          sortDirection: 'asc',
        })
      ).toEqual(['Alpha', 'Zulu']);
    });
  });

  // A string field that isn't a date sorts as text. The engine picks the
  // comparison from the *value*, so this needs no field name in @shared.
  describe('an optional text field', () => {
    it('sorts it in both directions', () => {
      const items = [
        named('second', { note: 'zulu' }),
        named('first', { note: 'alpha' }),
      ];

      expect(
        sortedNames(items, { sortBy: 'note', sortDirection: 'asc' })
      ).toEqual(['first', 'second']);
      expect(
        sortedNames(items, { sortBy: 'note', sortDirection: 'desc' })
      ).toEqual(['second', 'first']);
    });

    // Text now holds the same rule as number and date. It used to read a
    // missing field as `''`, which won ascending — an asymmetry this spec
    // pinned as-is rather than as intended. Still latent (no domain sorts by a
    // text field yet), but `sortBy` is an open string precisely so one can.
    it('sorts a missing field last in either direction', () => {
      const items = [named('unset'), named('texted', { note: 'alpha' })];

      expect(
        sortedNames(items, { sortBy: 'note', sortDirection: 'asc' })
      ).toEqual(['texted', 'unset']);
      expect(
        sortedNames(items, { sortBy: 'note', sortDirection: 'desc' })
      ).toEqual(['texted', 'unset']);
    });

    // An empty string is a value, not an absence — the distinction the `''`
    // substitution destroyed.
    it('treats an empty string as a value that sorts before other text', () => {
      const items = [
        named('texted', { note: 'alpha' }),
        named('blank', { note: '' }),
      ];

      expect(
        sortedNames(items, { sortBy: 'note', sortDirection: 'asc' })
      ).toEqual(['blank', 'texted']);
    });

    /**
     * The comparator is chosen from the first non-empty value, and it used to ask
     * `dayjs(sample).isValid()` — which V8's `Date` answers yes to for `'2'`
     * (1 Feb 2001). A short text value therefore pinned the DATE comparator for
     * the whole sort, so these three ordered as 2001-02-01 / 2001-10-01 / invalid
     * instead of as text.
     */
    it('sorts short text as text, not as a date V8 would accept', () => {
      const items = [
        named('two', { note: '2' }),
        named('ten', { note: '10' }),
        named('abc', { note: 'abc' }),
      ];

      expect(
        sortedNames(items, { sortBy: 'note', sortDirection: 'asc' })
      ).toEqual(['ten', 'two', 'abc']);
    });

    it('still sorts an ISO date field as a date', () => {
      const items = [
        named('later', { dueAt: '2024-12-01' }),
        named('earlier', { dueAt: '2024-01-02' }),
      ];

      expect(
        sortedNames(items, { sortBy: 'dueAt', sortDirection: 'asc' })
      ).toEqual(['earlier', 'later']);
    });

    // An empty string is present but says nothing to order by, so the tie
    // breaks on the name rather than silently keeping the input order.
    it('falls back to the name when the field is blank on both', () => {
      const items = [named('Zulu', { note: '' }), named('Alpha', { note: '' })];

      expect(
        sortedNames(items, { sortBy: 'note', sortDirection: 'asc' })
      ).toEqual(['Alpha', 'Zulu']);
    });
  });

  it('reads the sorted field structurally, so any domain item can carry it', () => {
    const items = [
      named('late', { dueAt: '2024-12-01' }),
      named('early', { dueAt: '2024-01-01' }),
    ];

    expect(
      sortedNames(items, { sortBy: 'dueAt', sortDirection: 'asc' })
    ).toEqual(['early', 'late']);
  });
});

describe('filterAndSortItemList', () => {
  it('sorts the list items when there is no search result', () => {
    const state = mockListState({
      items: [named('Zulu'), named('Alpha')],
      sort: { sortBy: 'name', sortDirection: 'asc' },
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
      sort: { sortBy: 'name', sortDirection: 'asc' },
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

describe('itemCountByCategory', () => {
  it('counts every reference in one pass, and omits categories nobody uses', () => {
    const counts = itemCountByCategory([
      named('a', { categoryIds: ['dairy', 'fresh'] }),
      named('b', { categoryIds: ['dairy'] }),
      named('c'),
    ]);

    expect(counts.get('dairy')).toBe(2);
    expect(counts.get('fresh')).toBe(1);
    expect(counts.has('bakery')).toBe(false);
  });
});
