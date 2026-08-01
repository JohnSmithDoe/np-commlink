import { IBaseItem } from '../../model/base-item.types';
import { IListState } from '../../model/item-list.types';
import {
  addListItem,
  removeListItem,
  removeListItems,
  updatedSearchQuery,
  updateListItem,
  updateListSearch,
  updateListSort,
} from './list.utils';

// A neutral `IListState<IBaseItem>` probe: these helpers are the kernel every
// list domain reducers through, so they are pinned against the generic shape
// rather than any one domain's fixtures.
const item = (over: Partial<IBaseItem> = {}): IBaseItem => ({
  id: 'a',
  name: 'Item',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const probeList = (
  over: Partial<IListState<IBaseItem>> = {}
): IListState<IBaseItem> => ({
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

describe('removeListItem / removeListItems', () => {
  it('removes a single item by id', () => {
    const a = item({ id: 'a' });
    const b = item({ id: 'b' });

    expect(removeListItem(probeList({ items: [a, b] }), a).items).toEqual([b]);
  });

  it('removes multiple items by id', () => {
    const a = item({ id: 'a' });
    const b = item({ id: 'b' });
    const c = item({ id: 'c' });

    expect(
      removeListItems(probeList({ items: [a, b, c] }), [a, c]).items
    ).toEqual([b]);
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
    // `matchesItemExactly` falls back from id to name, which is right for
    // add-dedupe. Here it means a stale DTO — its row deleted or re-hydrated
    // under a new id while the dialog stayed open — can land on a same-named
    // row, and spreading the DTO's id would rewrite that row's identity.
    const state = probeList({ items: [item({ id: 'live', name: 'Milk' })] });

    const updated = updateListItem(state, item({ id: 'stale', name: 'Milk' }));

    expect(updated.items[0].id).toBe('live');
  });

  it('returns the SAME state when the item is no longer in the list', () => {
    // The row can be deleted (or the list re-hydrated) while its edit dialog is
    // still open, so this is a legitimate no-op — and a no-op must not hand
    // downstream selectors a new object to recompute from.
    //
    // NB the update must differ in BOTH id and name: matching falls back to an
    // exact name match when the id misses, so a same-named row still counts as
    // present.
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
