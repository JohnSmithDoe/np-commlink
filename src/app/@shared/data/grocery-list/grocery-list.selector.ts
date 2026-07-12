import { createSelector } from '@ngrx/store';
import dayjs from 'dayjs';
import {
  IAppState,
  IBaseItem,
  IListState,
  ISearchResult,
  IShoppingItem,
  TAllItemTypes,
  TItemListCategory,
  TItemListSort,
} from '../../types';
import {
  isStorageItem,
  isTaskItem,
  matchesCategory,
  matchesCategoryExactly,
  matchesNameExactly,
  matchesSearch,
  matchesSearchExactly,
} from '../../util/app.utils';
import { selectRouteParams } from '../router.selector';

import { stateByListId } from './grocery-list.utils';

export const selectListState = createSelector(
  selectRouteParams,
  (state: IAppState) => state,
  ({ listId }, state) => {
    if (!listId) return undefined;
    return stateByListId(state, listId);
  }
);

const additionalSearch = <R extends TAllItemTypes, T extends TAllItemTypes>(
  items: T[],
  result: ISearchResult<R>,
  searchQuery: string,
  others?: IBaseItem[]
) => {
  others = others || [];
  const additionalItemsByName = items.filter(
    (item) =>
      !others?.find((litem) => matchesNameExactly(item, litem)) &&
      !result.listItems.find((litem) => matchesNameExactly(item, litem)) &&
      matchesSearch(item, searchQuery)
  );
  // then by category
  const additionalItemsByCat = items.filter(
    (item) =>
      !others?.find((litem) => matchesNameExactly(item, litem)) &&
      !result.listItems.find((litem) => matchesNameExactly(item, litem)) &&
      !additionalItemsByName.includes(item) &&
      matchesCategory(item, searchQuery)
  );
  return [...additionalItemsByName, ...additionalItemsByCat];
};
export const filterBySearchQuery = <
  T extends IListState<R>,
  R extends TAllItemTypes,
>(
  state: IAppState,
  listState: T
): ISearchResult<R> | undefined => {
  const searchQuery = listState.searchQuery?.trim();
  if (!searchQuery || !searchQuery.length) return;
  const result: ISearchResult<R> = {
    searchTerm: searchQuery,
    hasSearchTerm: !!searchQuery.length,
    listItems: [],
    globalItems: [],
    storageItems: [],
    shoppingItems: [],
  };
  result.listItems = listState.items.filter((item) =>
    matchesSearch(item, searchQuery)
  );
  //prettier-ignore
  switch (listState.id) {
    case '_storage':
      if (state.listSettings.showGlobalsInStorage)
        result.globalItems = additionalSearch(state.globals.items, result, searchQuery);
      if (state.listSettings.showShoppingInStorage)
        result.shoppingItems = additionalSearch(state.shopping.items, result, searchQuery, result.globalItems);
      break;
    case '_globals':
      if (state.listSettings.showStorageInGlobals)
        result.storageItems = additionalSearch(state.storage.items, result, searchQuery);
      if (state.listSettings.showShoppingInGlobals)
        result.shoppingItems = additionalSearch(state.shopping.items, result, searchQuery, result.storageItems);
      break;
    case '_shopping':
      if (state.listSettings.showGlobalsInShopping)
        result.globalItems = additionalSearch(state.globals.items, result, searchQuery);
      if (state.listSettings.showStorageInShopping)
        result.storageItems = additionalSearch(state.storage.items, result, searchQuery, result.globalItems);
      break;
  }

  result.exactMatch = result.listItems.find((base) =>
    matchesSearchExactly(base, searchQuery)
  );
  return result;
};
export const sortItemListFn = <T extends TAllItemTypes>(
  sort?: TItemListSort
) => {
  const MAXPRIO = Number.MAX_SAFE_INTEGER;
  const MINPRIO = Number.MIN_SAFE_INTEGER;
  const MAXDATE = '5000-1-1';
  const MINDATE = '1970-1-1';
  return (a: T, b: T): number => {
    switch (sort?.sortBy) {
      case 'name':
        return sort.sortDir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case 'bestBefore':
        if (isStorageItem(a) && isStorageItem(b)) {
          return !a.bestBefore && !b.bestBefore
            ? sortItemListFn<T>({ ...sort, sortBy: 'name' })(a, b)
            : sort.sortDir === 'asc'
              ? dayjs(a.bestBefore ?? MAXDATE).unix() -
                dayjs(b.bestBefore ?? MAXDATE).unix()
              : dayjs(b.bestBefore ?? MINDATE).unix() -
                dayjs(a.bestBefore ?? MINDATE).unix();
        } else {
          return 0;
        }
      case 'prio':
        if (isTaskItem(a) && isTaskItem(b)) {
          return !a.prio && !b.prio
            ? sortItemListFn<T>({ ...sort, sortBy: 'name' })(a, b)
            : sort.sortDir === 'asc'
              ? (a.prio ?? MAXPRIO) - (b.prio ?? MAXPRIO)
              : (b.prio ?? MINPRIO) - (a.prio ?? MINPRIO);
        } else {
          return 0;
        }
      case 'dueAt':
        if (isTaskItem(a) && isTaskItem(b)) {
          return !a.dueAt && !b.dueAt
            ? sortItemListFn<T>({ ...sort, sortBy: 'name' })(a, b)
            : sort.sortDir === 'asc'
              ? dayjs(a.dueAt ?? MAXDATE).unix() -
                dayjs(b.dueAt ?? MAXDATE).unix()
              : dayjs(b.dueAt ?? MINDATE).unix() -
                dayjs(a.dueAt ?? MINDATE).unix();
        } else {
          return 0;
        }

      default:
        return 0;
    }
  };
};
export const filterAndSortItemList = <
  T extends IListState<R>,
  R extends TAllItemTypes,
>(
  state: T,
  result?: ISearchResult<R>
): R[] => {
  return (result?.listItems ?? [...state.items])
    .filter(
      (item) => !state.filterBy || item.category?.includes(state.filterBy)
    )
    .sort(sortItemListFn<R>(state.sort));
};
export const sortCategoriesFn = (sort?: TItemListSort) => {
  return (a: TItemListCategory, b: TItemListCategory) => {
    return sort?.sortDir === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
  };
};
export const selectListCategories = createSelector(
  selectListState,
  (state): { category: TItemListCategory; count: number }[] => {
    if (!state) return [];
    return [...state.categories]
      .sort(sortCategoriesFn(state.sort))
      .filter((cat) => matchesSearch(cat, state.searchQuery ?? ''))
      .map((catgory) => ({
        category: catgory,
        count: state.items.reduce((count: number, cur: IBaseItem) => {
          return matchesCategoryExactly(cur, catgory) ? count + 1 : count;
        }, 0),
      }));
  }
);

export const selectListStateFilter = createSelector(
  selectListState,
  (
    state
  ): {
    isCategoryModeOrHasFilter: boolean;
    hasFilter: boolean;
  } => {
    return {
      isCategoryModeOrHasFilter:
        !!state?.filterBy || state?.mode === 'categories',
      hasFilter: !!state?.filterBy,
    };
  }
);

export const selectListSearchResult = createSelector(
  selectListState,
  (state: IAppState) => state,
  (state, appState): ISearchResult<IShoppingItem> | undefined => {
    return !!state && state.mode !== 'categories'
      ? filterBySearchQuery(appState, state)
      : undefined;
  }
);

export const selectListItems = createSelector(
  selectListState,
  selectListSearchResult,
  (state, result): IShoppingItem[] | undefined =>
    state ? filterAndSortItemList(state, result) : undefined
);
