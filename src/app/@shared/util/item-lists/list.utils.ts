import { indexOfMatchingItem, matcherFor } from '../app.utils';
import { BaseItem, UpdateDTO } from '../../model/base-item.types';
import {
  ItemListSort,
  ItemListSortDirection,
  ItemListSortType,
  ItemList,
} from '../../model/item-list.types';

export const withList = <S, K extends keyof S>(
  state: S,
  key: K,
  next: S[K]
): S => (next === state[key] ? state : { ...state, [key]: next });

export const addListItem = <T extends ItemList<R>, R extends BaseItem>(
  state: T,
  item: R
): T => {
  const name = item.name.trim();
  if (name.length === 0) {
    return state;
  }
  return { ...state, items: [item, ...state.items] };
};

export const removeListItem = <T extends ItemList<R>, R extends BaseItem>(
  state: T,
  item: R
): T => ({
  ...state,
  items: state.items.filter((listItem) => listItem.id !== item.id),
});

export const updateListItem = <T extends ItemList<R>, R extends BaseItem>(
  state: T,
  item: UpdateDTO<R> | undefined
): T => {
  if (!item) return state;
  const itemIndex = indexOfMatchingItem(item, state.items);
  const matched = state.items[itemIndex];
  if (!matched) return state;
  const items: UpdateDTO<R>[] = [...state.items];
  items[itemIndex] = { ...matched, ...item, id: matched.id };
  return { ...state, items };
};

const directionFor = (
  requested?: ItemListSortDirection | 'keep' | 'toggle',
  current?: ItemListSortDirection
): ItemListSortDirection => {
  if (requested === 'asc' || requested === 'desc') return requested;
  if (requested === 'keep') return current ?? 'asc';
  if (requested === 'toggle') return current === 'asc' ? 'desc' : 'asc';
  return 'asc';
};

export const updateListSort = <T extends { sort?: ItemListSort }>(
  state: T,
  sortBy?: ItemListSortType,
  requestedDirection?: ItemListSortDirection | 'keep' | 'toggle'
): T => ({
  ...state,
  sort: sortBy
    ? {
        sortBy,
        sortDirection: directionFor(
          requestedDirection,
          state.sort?.sortDirection
        ),
      }
    : undefined,
});

export const hydratedList = <
  T extends { searchQuery?: string; filterBy?: string },
>(
  list: T
): T => ({ ...list, searchQuery: undefined, filterBy: undefined });

export const updateListSearch = <T extends { searchQuery?: string }>(
  state: T,
  searchQuery?: string
): T => (searchQuery === state.searchQuery ? state : { ...state, searchQuery });

export const updatedSearchQuery = (
  item: BaseItem,
  searchQuery: string | undefined
) => (item.name && !matcherFor(searchQuery)(item) ? undefined : searchQuery);
