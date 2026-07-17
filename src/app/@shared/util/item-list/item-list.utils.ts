import {
  IBaseItem,
  IItemList,
  IListState,
  ITrackingItem,
  TItemListSort,
  TItemListSortDir,
  TItemListSortType,
  TUpdateDTO,
} from '../../types';
import { matchesItemExactlyIdx } from '../../util/app.utils';

export const addListItem = <T extends IListState<R>, R extends ITrackingItem>(
  state: T,
  item: R
): T => {
  // do not add an empty item
  const name = item.name.trim();
  if (!name.length) {
    return state;
  }
  return {
    ...state,
    items: [item, ...state.items],
  };
};

export const removeListItem = <
  T extends IListState<R>,
  R extends ITrackingItem,
>(
  state: T,
  item: R
): T => ({
  ...state,
  items: state.items.filter((listItem) => listItem.id !== item.id),
});

export const updateListItem = <T extends IItemList<R>, R extends IBaseItem>(
  state: T,
  item: TUpdateDTO<R> | undefined
): T => {
  if (!item) return state;
  const itemIdx = matchesItemExactlyIdx(item, state.items);
  if (itemIdx < 0) return state;
  const items: TUpdateDTO<R>[] = [...state.items];
  const updatedItem = { ...items[itemIdx], ...item };
  items.splice(itemIdx, 1, updatedItem);
  return { ...state, items };
};

export const updateListSort = (
  sortBy?: TItemListSortType,
  newDir?: TItemListSortDir | 'keep' | 'toggle',
  currentDir?: TItemListSortDir
) => {
  let result: TItemListSort | undefined;
  if (!!sortBy) {
    const defaultSort = 'asc';
    let sortDir: 'asc' | 'desc' = defaultSort;
    switch (newDir) {
      case 'asc':
      case 'desc':
        sortDir = newDir;
        break;
      case 'keep':
        sortDir = currentDir ?? defaultSort;
        break;
      case 'toggle':
        sortDir = currentDir === 'asc' ? 'desc' : 'asc';
        break;
    }
    result = { sortBy, sortDir };
  }
  return result;
};

export const updatedSearchQuery = (item?: IBaseItem, searchQuery?: string) => {
  if (!!item?.name && !item.name.includes(searchQuery ?? '')) {
    searchQuery = undefined;
  }
  return searchQuery;
};
