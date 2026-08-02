import { BaseItem } from '../../model/base-item.types';
import { ListState } from '../../model/item-list.types';
import {
  addListItem,
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
  over: Partial<ListState<BaseItem>> = {}
): ListState<BaseItem> => ({
  id: '_probe',
  items: [],
  ...over,
});

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

describe('updateListSort', () => {
  it('returns undefined without a sortBy', () => {
    expect(updateListSort()).toBeUndefined();
  });

  it('honours an explicit direction', () => {
    expect(updateListSort('name', 'desc')).toEqual({
      sortBy: 'name',
      sortDirection: 'desc',
    });
  });

  it('keeps the current direction', () => {
    expect(updateListSort('name', 'keep', 'desc')).toEqual({
      sortBy: 'name',
      sortDirection: 'desc',
    });
  });

  it('toggles the direction', () => {
    expect(updateListSort('name', 'toggle', 'asc')?.sortDirection).toBe('desc');
    expect(updateListSort('name', 'toggle', 'desc')?.sortDirection).toBe('asc');
  });

  it('defaults to asc', () => {
    expect(updateListSort('name')?.sortDirection).toBe('asc');
  });
});

describe('updateListSearch', () => {
  it('stores the query', () => {
    expect(updateListSearch(probeList(), 'milk').searchQuery).toBe('milk');
  });

  it('trims what it stores, so the four list domains agree', () => {
    expect(updateListSearch(probeList(), '  milk  ').searchQuery).toBe('milk');
  });

  it('returns the SAME state object when the query is unchanged', () => {
    const state = probeList({ searchQuery: 'milk' });
    expect(updateListSearch(state, 'milk')).toBe(state);
  });

  it('treats a whitespace-only change as unchanged', () => {
    const state = probeList({ searchQuery: 'milk' });
    expect(updateListSearch(state, 'milk ')).toBe(state);
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
