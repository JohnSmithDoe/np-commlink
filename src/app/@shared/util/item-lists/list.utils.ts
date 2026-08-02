import { matchesItemExactlyIndex, matchesSearch } from '../app.utils';
import { BaseItem, UpdateDTO } from '../../model/base-item.types';
import {
  ItemListSort,
  ItemListSortDirection,
  ItemListSortType,
  ListState,
} from '../../model/item-list.types';

export const withList = <S, K extends keyof S>(
  state: S,
  key: K,
  next: S[K]
): S => (next === state[key] ? state : { ...state, [key]: next });

export const addListItem = <T extends ListState<R>, R extends BaseItem>(
  state: T,
  item: R
): T => {
  const name = item.name.trim();
  if (name.length === 0) {
    return state;
  }
  return { ...state, items: [item, ...state.items] };
};

export const removeListItem = <T extends ListState<R>, R extends BaseItem>(
  state: T,
  item: R
): T => ({
  ...state,
  items: state.items.filter((listItem) => listItem.id !== item.id),
});

export const updateListItem = <T extends ListState<R>, R extends BaseItem>(
  state: T,
  item: UpdateDTO<R> | undefined
): T => {
  if (!item) return state;
  const itemIndex = matchesItemExactlyIndex(item, state.items);
  const matched = state.items[itemIndex];
  if (!matched) return state;
  const items: UpdateDTO<R>[] = [...state.items];
  items[itemIndex] = { ...matched, ...item, id: matched.id };
  return { ...state, items };
};

export const updateListSort = (
  sortBy?: ItemListSortType,
  requestedDirection?: ItemListSortDirection | 'keep' | 'toggle',
  currentDirection?: ItemListSortDirection
) => {
  let result: ItemListSort | undefined;
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

export const updateListSearch = <T extends ListState<R>, R extends BaseItem>(
  state: T,
  searchQuery?: string
): T => {
  const trimmed = searchQuery?.trim();
  return trimmed === state.searchQuery
    ? state
    : { ...state, searchQuery: trimmed };
};

export const updatedSearchQuery = (
  item: BaseItem,
  searchQuery: string | undefined
) => {
  if (!!item.name && !matchesSearch(item, searchQuery ?? '')) {
    searchQuery = undefined;
  }
  return searchQuery;
};
