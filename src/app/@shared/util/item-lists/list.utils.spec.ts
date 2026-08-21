import { BaseItem } from '../../model/base-item.types';
import { ItemList, ItemListSortDirection } from '../../model/item-list.types';
import {
  addListItem,
  hydratedList,
  removeListItem,
  updatedSearchQuery,
  updateListItem,
  updateListSearch,
  updateListSort,
} from './list.utils';

const item = (over: Partial<BaseItem> = {}): BaseItem => ({
  id: 'a',
  name: 'Item',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const probeList = (
  over: Partial<ItemList<BaseItem>> = {}
): ItemList<BaseItem> => ({
  id: '_probe',
  items: [],
  ...over,
});

const sorted = (sortDirection: ItemListSortDirection) =>
  probeList({ sort: { sortBy: 'name', sortDirection } });

describe('addListItem', () => {
  it('prepends the item without deriving categories', () => {
    const state = probeList({ items: [item({ id: 'a', name: 'Milk' })] });
    const added = item({ id: 'b', name: 'Bread', categoryIds: ['bakery'] });

    const result = addListItem(state, added);

    expect(result.items[0]).toBe(added);
    expect(result.items).toHaveLength(2);
  });

  it('ignores an item with a blank name', () => {
    const state = probeList();
    expect(addListItem(state, item({ name: '  ' }))).toBe(state);
  });
});

describe('removeListItem', () => {
  it('removes a single item by id', () => {
    const a = item({ id: 'a' });
    const b = item({ id: 'b' });

    expect(removeListItem(probeList({ items: [a, b] }), a).items).toEqual([b]);
  });
});

describe('updateListItem', () => {
  it('merges the update onto the matching item', () => {
    const state = probeList({ items: [item({ name: 'Old' })] });

    expect(updateListItem(state, item({ name: 'New' })).items[0].name).toBe(
      'New'
    );
  });

  it('keeps the matched row‘s own id when the DTO only matched by name', () => {
    const state = probeList({ items: [item({ id: 'live', name: 'Milk' })] });

    const updated = updateListItem(state, item({ id: 'stale', name: 'Milk' }));

    expect(updated.items[0].id).toBe('live');
  });

  it('returns the SAME state when the item is no longer in the list', () => {
    const state = probeList({ items: [item({ id: 'a', name: 'Milk' })] });

    expect(updateListItem(state, item({ id: 'gone', name: 'Bread' }))).toBe(
      state
    );
  });

  it('returns the SAME state for a missing update', () => {
    const state = probeList({ items: [item()] });

    expect(updateListItem(state, undefined)).toBe(state);
  });
});

describe('hydratedList', () => {
  it('restores the items and the sort, but never a search or a filter', () => {
    const stored = probeList({
      items: [item()],
      searchQuery: 'milk',
      filterBy: 'dairy',
      sort: { sortBy: 'name', sortDirection: 'desc' },
    });

    expect(hydratedList(stored)).toEqual({
      ...stored,
      searchQuery: undefined,
      filterBy: undefined,
    });
  });
});

describe('updateListSort', () => {
  it('clears the sort without a sortBy, so a configured default can be undone', () => {
    expect(updateListSort(sorted('desc')).sort).toBeUndefined();
  });

  it('honours an explicit direction', () => {
    expect(updateListSort(probeList(), 'name', 'desc').sort).toEqual({
      sortBy: 'name',
      sortDirection: 'desc',
    });
  });

  it('reads the current direction off the state it is given', () => {
    expect(updateListSort(sorted('desc'), 'name', 'keep').sort).toEqual({
      sortBy: 'name',
      sortDirection: 'desc',
    });
    expect(updateListSort(sorted('asc'), 'name', 'toggle').sort).toEqual({
      sortBy: 'name',
      sortDirection: 'desc',
    });
    expect(updateListSort(sorted('desc'), 'name', 'toggle').sort).toEqual({
      sortBy: 'name',
      sortDirection: 'asc',
    });
  });

  it('defaults to asc', () => {
    expect(updateListSort(probeList(), 'name').sort?.sortDirection).toBe('asc');
  });

  it('leaves the rest of the state alone', () => {
    const state = probeList({ items: [item()], searchQuery: 'milk' });

    const next = updateListSort(state, 'name');

    expect(next.items).toBe(state.items);
    expect(next.searchQuery).toBe('milk');
  });
});

describe('updateListSearch', () => {
  it('needs nothing but a search query, so a view without items can use it', () => {
    expect(updateListSearch({ searchQuery: 'old' }, 'new')).toEqual({
      searchQuery: 'new',
    });
  });

  it('stores the query', () => {
    expect(updateListSearch(probeList(), 'milk').searchQuery).toBe('milk');
  });

  it('stores the query verbatim — trimming here would eat the space the user is still typing', () => {
    expect(updateListSearch(probeList(), '  milk  ').searchQuery).toBe(
      '  milk  '
    );
  });

  it('returns the SAME state object when the query is unchanged', () => {
    const state = probeList({ searchQuery: 'milk' });
    expect(updateListSearch(state, 'milk')).toBe(state);
  });

  it('keeps a trailing space, so the next keystroke lands after it', () => {
    const state = probeList({ searchQuery: 'milk' });
    expect(updateListSearch(state, 'milk ').searchQuery).toBe('milk ');
  });

  it('clears the query with an empty string', () => {
    expect(
      updateListSearch(probeList({ searchQuery: 'milk' }), '').searchQuery
    ).toBe('');
  });

  it('clears the query with undefined', () => {
    expect(
      updateListSearch(probeList({ searchQuery: 'milk' }), undefined)
        .searchQuery
    ).toBe(undefined);
  });
});

describe('updatedSearchQuery', () => {
  it('keeps the query when the item name still contains it', () => {
    expect(updatedSearchQuery(item({ name: 'Milk' }), 'Mil')).toBe('Mil');
  });

  it('keeps the query on a case-insensitive match (matching the list filter)', () => {
    expect(updatedSearchQuery(item({ name: 'Brot' }), 'b')).toBe('b');
  });

  it('clears the query when the item name no longer contains it', () => {
    expect(updatedSearchQuery(item({ name: 'Bread' }), 'Milk')).toBeUndefined();
  });
});
