import { createSelector } from '@ngrx/store';
import {
  IAppState,
  IListState,
  ISearchResult,
  ITrackingItem,
  TItemListSort,
} from '../../types';
import { matchesSearch, matchesSearchExactly } from '../../util/app.utils';

export const selectListState = createSelector(
  (state: IAppState) => state,
  (state) => state.tracking
);

export const filterBySearchQuery = <
  T extends IListState<R>,
  R extends ITrackingItem,
>(
  listState?: T
): ISearchResult<R> | undefined => {
  const searchQuery = listState?.searchQuery?.trim();
  if (!searchQuery || !searchQuery.length) return;
  const result: ISearchResult<R> = {
    searchTerm: searchQuery,
    hasSearchTerm: !!searchQuery.length,
    listItems: [],
  };
  result.listItems =
    listState?.items.filter((item) => matchesSearch(item, searchQuery)) ?? [];

  result.exactMatch = result.listItems.find((base) =>
    matchesSearchExactly(base, searchQuery)
  );
  return result;
};
export const sortItemListFn = <T extends ITrackingItem>(
  sort?: TItemListSort
) => {
  return (a: T, b: T): number => {
    switch (sort?.sortBy) {
      case 'name':
        return sort.sortDir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      default:
        return 0;
    }
  };
};
export const filterAndSortItemList = <
  T extends IListState<R>,
  R extends ITrackingItem,
>(
  state: T,
  result?: ISearchResult<R>
): R[] => {
  return (result?.listItems ?? [...state.items]).sort(
    sortItemListFn<R>(state.sort)
  );
};

export const selectListSearchResult = createSelector(
  selectListState,
  (state): ISearchResult<ITrackingItem> | undefined => {
    return filterBySearchQuery(state);
  }
);

export const selectListItems = createSelector(
  selectListState,
  selectListSearchResult,
  (state, result): ITrackingItem[] | undefined =>
    state ? filterAndSortItemList(state, result) : undefined
);
