import { matchesItemExactlyIndex, matchesSearch } from '../app.utils';
import { IBaseItem, TUpdateDTO } from '../../model/base-item.types';
import {
  IListState,
  TItemListSort,
  TItemListSortDirection,
  TItemListSortType,
} from '../../model/item-list.types';

// Domain-blind reducer helpers shared by every list domain (tracking, grocery,
// tasks). They operate over the generic `IListState<T>` shape and never read a
// concrete list identity — hence they live in the shared kernel, not in the
// grocery engine.
//
// A catalog is a list too, so these serve it unchanged; the two rules that ARE
// catalog-specific (unique names, merge-on-rename) live in `category-list.utils`.

/**
 * Put an updated list back on the slice that holds it, preserving the helpers'
 * no-op guarantee.
 *
 * Several helpers return the SAME list object when nothing changed —
 * `updateListSearch` on a keystroke landing on the same query, `addListItem` on a
 * blank name — so that downstream selectors do not recompute. A slice that holds
 * its lists as members defeats that by spreading unconditionally: `{...state,
 * list}` is a new object every time, and every selector reading the slice
 * recomputes on every no-op.
 */
export const withList = <S, K extends keyof S>(
  state: S,
  key: K,
  next: S[K]
): S => (next === state[key] ? state : { ...state, [key]: next });

export const addListItem = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  item: R
): T => {
  const name = item.name.trim();
  if (name.length === 0) {
    return state;
  }
  return { ...state, items: [item, ...state.items] };
};

export const removeListItem = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  item: R
): T => ({
  ...state,
  items: state.items.filter((listItem) => listItem.id !== item.id),
});

export const removeListItems = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  items: R[]
): T => {
  const toRemove = new Set(items.map((item) => item.id));
  return {
    ...state,
    items: state.items.filter((listItem) => !toRemove.has(listItem.id)),
  };
};

// An update for an item that is no longer in the list is a legitimate no-op:
// the row can be deleted (or the list re-hydrated) while its edit dialog is
// still open. Returning state unchanged is the whole behaviour — a reducer
// helper must stay pure, so it does not log.
export const updateListItem = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  item: TUpdateDTO<R> | undefined
): T => {
  if (!item) return state;
  const itemIndex = matchesItemExactlyIndex(item, state.items);
  const matched = state.items[itemIndex];
  if (!matched) return state;
  const items: TUpdateDTO<R>[] = [...state.items];
  // The matched row keeps its OWN id. `matchesItemExactly` falls back from id to
  // name — right for add-dedupe, but here it means a stale DTO (dialog still open
  // over a row that was deleted or re-hydrated under a new id) can land on a
  // same-named row, and spreading the DTO's `id` would rewrite that row's
  // identity out from under everything holding it.
  items[itemIndex] = { ...matched, ...item, id: matched.id };
  return { ...state, items };
};

export const updateListSort = (
  sortBy?: TItemListSortType,
  requestedDirection?: TItemListSortDirection | 'keep' | 'toggle',
  currentDirection?: TItemListSortDirection
) => {
  let result: TItemListSort | undefined;
  if (!!sortBy) {
    const defaultSort = 'asc';
    let sortDirection: 'asc' | 'desc' = defaultSort;
    switch (requestedDirection) {
      case 'asc':
      case 'desc': {
        sortDirection = requestedDirection;
        break;
      }
      case 'keep': {
        sortDirection = currentDirection ?? defaultSort;
        break;
      }
      case 'toggle': {
        sortDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        break;
      }
    }
    result = { sortBy, sortDirection };
  }
  return result;
};

/**
 * Store a searchbar query, trimmed and canonical. Returns the SAME state object
 * when nothing changed, so a keystroke that lands on the same query cannot
 * retrigger the reducer's downstream selectors.
 *
 * Trimming matters only for what is stored and redisplayed — matching already
 * normalises through `matchingTxt` — but the four list reducers that each had
 * their own copy of this disagreed about it, so two lists stored `'milk '` and
 * two stored `'milk'`.
 */
export const updateListSearch = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  searchQuery?: string
): T => {
  const trimmed = searchQuery?.trim();
  return trimmed === state.searchQuery
    ? state
    : { ...state, searchQuery: trimmed };
};

export const updatedSearchQuery = (
  item: IBaseItem,
  searchQuery: string | undefined
) => {
  if (!!item.name && !matchesSearch(item, searchQuery ?? '')) {
    searchQuery = undefined;
  }
  return searchQuery;
};
