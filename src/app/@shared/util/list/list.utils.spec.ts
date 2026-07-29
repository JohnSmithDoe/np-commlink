import { IBaseItem } from '../../model/base-item.types';
import { IListState } from '../../model/item-list.types';
import { mockCategory } from '../../testing/test-data';
import {
  addListCategory,
  addListCategoryObject,
  addListItem,
  removeListCategory,
  removeListItem,
  removeListItems,
  updatedSearchQuery,
  updateListCategory,
  updateListItem,
  updateListMode,
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
  categories: [],
  mode: 'alphabetical',
  ...over,
});

describe('addListItem', () => {
  it('prepends the item without deriving categories', () => {
    const state = probeList({ items: [item({ id: 'a', name: 'Milk' })] });
    const added = item({ id: 'b', name: 'Bread', categoryIds: ['bakery'] });

    const result = addListItem(state, added);

    expect(result.items[0]).toBe(added);
    expect(result.items).toHaveLength(2);
    // The catalog is authoritative — adding an item never mints a category.
    expect(result.categories).toEqual([]);
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
      sortDir: 'desc',
    });
  });

  it('keeps the current direction', () => {
    expect(updateListSort('name', 'keep', 'desc')).toEqual({
      sortBy: 'name',
      sortDir: 'desc',
    });
  });

  it('toggles the direction', () => {
    expect(updateListSort('name', 'toggle', 'asc')?.sortDir).toBe('desc');
    expect(updateListSort('name', 'toggle', 'desc')?.sortDir).toBe('asc');
  });

  it('defaults to asc', () => {
    expect(updateListSort('name')?.sortDir).toBe('asc');
  });
});

describe('updateListMode', () => {
  it('resets the sort when the mode changes', () => {
    const state = probeList({
      mode: 'alphabetical',
      sort: { sortBy: 'name', sortDir: 'desc' },
    });

    const result = updateListMode(state, 'categories');

    expect(result.mode).toBe('categories');
    expect(result.sort).toEqual({ sortBy: 'name', sortDir: 'asc' });
  });

  it('toggles the sort when the mode stays the same', () => {
    const state = probeList({
      mode: 'alphabetical',
      sort: { sortBy: 'name', sortDir: 'asc' },
    });

    expect(updateListMode(state, 'alphabetical').sort?.sortDir).toBe('desc');
  });

  it('clears the filter in categories mode and defaults undefined mode to alphabetical', () => {
    const state = probeList({ mode: 'alphabetical', filterBy: 'Dairy' });

    expect(updateListMode(state, 'categories').filterBy).toBeUndefined();
    expect(updateListMode(state).mode).toBe('alphabetical');
  });
});

describe('addListCategory', () => {
  it('mints a new {id,name} category and prepends it', () => {
    const state = probeList({
      categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
    });

    // The minted id is a uuid — assert on the resolved names, not the id.
    expect(
      addListCategory(state, 'Bakery').categories.map((cat) => cat.name)
    ).toEqual(['Bakery', 'Dairy']);
  });

  it('ignores an empty or duplicate (case-insensitive) category', () => {
    const state = probeList({
      categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
    });

    expect(addListCategory(state, '')).toBe(state);
    expect(addListCategory(state, 'dairy')).toBe(state);
  });
});

describe('addListCategoryObject', () => {
  it('prepends a pre-minted {id,name} category', () => {
    const state = probeList({
      categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
    });

    expect(
      addListCategoryObject(state, { id: 'bake', name: 'Bakery' }).categories
    ).toEqual([
      { id: 'bake', name: 'Bakery' },
      { id: 'dairy', name: 'Dairy' },
    ]);
  });

  it('is a no-op on a duplicate id, a case-insensitive duplicate name, or a blank name', () => {
    const state = probeList({
      categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
    });

    expect(addListCategoryObject(state, { id: 'dairy', name: 'X' })).toBe(
      state
    );
    expect(addListCategoryObject(state, { id: 'new', name: 'dairy' })).toBe(
      state
    );
    expect(addListCategoryObject(state, { id: 'new', name: '  ' })).toBe(state);
  });
});

describe('updateListCategory', () => {
  it('renames in place, keeping the id and leaving items untouched', () => {
    const state = probeList({
      categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
      items: [item({ categoryIds: ['dairy'] })],
    });

    const result = updateListCategory(state, 'dairy', 'Fridge');

    expect(result.categories).toEqual([{ id: 'dairy', name: 'Fridge' }]);
    expect(result.items[0].categoryIds).toEqual(['dairy']);
  });

  it('merges onto an existing name: drops the entry and remaps item refs, deduped', () => {
    const state = probeList({
      categories: [
        mockCategory({ id: 'fresh', name: 'Fresh' }),
        mockCategory({ id: 'dairy', name: 'Dairy' }),
      ],
      items: [item({ categoryIds: ['dairy', 'fresh'] })],
    });

    const result = updateListCategory(state, 'dairy', 'fresh');

    expect(result.categories.map((cat) => cat.id)).toEqual(['fresh']);
    expect(result.items[0].categoryIds).toEqual(['fresh']);
  });

  it('is a no-op for a blank new name or an unknown id', () => {
    const state = probeList({
      categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
    });

    expect(updateListCategory(state, 'dairy', '  ')).toBe(state);
    expect(updateListCategory(state, 'nope', 'X')).toBe(state);
  });
});

describe('removeListCategory', () => {
  it('removes the category by id from the catalog and strips it off every item', () => {
    const state = probeList({
      categories: [
        mockCategory({ id: 'dairy', name: 'Dairy' }),
        mockCategory({ id: 'fresh', name: 'Fresh' }),
      ],
      items: [item({ categoryIds: ['dairy', 'fresh'] })],
    });

    const result = removeListCategory(state, 'dairy');

    expect(result.categories.map((cat) => cat.name)).toEqual(['Fresh']);
    expect(result.items[0].categoryIds).toEqual(['fresh']);
  });

  it('is a no-op without a category id', () => {
    const state = probeList({
      categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
    });

    expect(removeListCategory(state, undefined)).toBe(state);
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
