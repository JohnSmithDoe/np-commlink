import { IBaseItem } from '../../model/base-item.types';
import { IListState } from '../../model/item-list.types';
import { updateListItem, updateListSearch } from './list.utils';

const item = (over: Partial<IBaseItem> = {}): IBaseItem => ({
  id: 'a',
  name: 'Item',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const listWith = (searchQuery?: string): IListState<IBaseItem> => ({
  id: '_probe',
  title: 'Probe',
  items: [],
  categories: [],
  mode: 'alphabetical',
  searchQuery,
});

describe('updateListItem', () => {
  it('merges the update onto the matching item', () => {
    const state = { ...listWith(), items: [item({ name: 'Old' })] };

    expect(updateListItem(state, item({ name: 'New' })).items[0].name).toBe(
      'New'
    );
  });

  it('keeps the matched row‘s own id when the DTO only matched by name', () => {
    // `matchesItemExactly` falls back from id to name, which is right for
    // add-dedupe. Here it means a stale DTO — its row deleted or re-hydrated
    // under a new id while the dialog stayed open — can land on a same-named
    // row, and spreading the DTO's id would rewrite that row's identity.
    const state = {
      ...listWith(),
      items: [item({ id: 'live', name: 'Milk' })],
    };

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
    const state = { ...listWith(), items: [item({ id: 'a', name: 'Milk' })] };

    expect(updateListItem(state, item({ id: 'gone', name: 'Bread' }))).toBe(
      state
    );
  });

  it('returns the SAME state for a missing update', () => {
    const state = { ...listWith(), items: [item()] };

    expect(updateListItem(state, undefined)).toBe(state);
  });
});

describe('updateListSearch', () => {
  it('stores the query', () => {
    expect(updateListSearch(listWith(), 'milk').searchQuery).toBe('milk');
  });

  it('trims what it stores, so the four list domains agree', () => {
    expect(updateListSearch(listWith(), '  milk  ').searchQuery).toBe('milk');
  });

  it('returns the SAME state object when the query is unchanged', () => {
    const state = listWith('milk');
    expect(updateListSearch(state, 'milk')).toBe(state);
  });

  it('treats a whitespace-only change as unchanged', () => {
    const state = listWith('milk');
    expect(updateListSearch(state, 'milk ')).toBe(state);
  });

  it('clears the query with an empty string', () => {
    expect(updateListSearch(listWith('milk'), '').searchQuery).toBe('');
  });

  it('clears the query with undefined', () => {
    expect(updateListSearch(listWith('milk'), undefined).searchQuery).toBe(
      undefined
    );
  });
});
