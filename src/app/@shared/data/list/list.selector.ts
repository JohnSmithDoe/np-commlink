import dayjs from 'dayjs';
import {
  IBaseItem,
  IListState,
  ISearchResult,
  TAllItemTypes,
  TItemListCategory,
  TItemListSort,
} from '../../types';
import {
  isStorageItem,
  isTaskItem,
  matchesCategoryExactly,
  matchesSearch,
  matchesSearchExactly,
} from '../../util/app.utils';

// Domain-blind selector helpers shared by every list domain. They operate over
// the generic `IListState<T>` shape and know no concrete list identity. The
// grocery cross-list search buckets stay in grocery-list.selector.ts, which
// builds on `filterListBySearchQuery` below.

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

// Generic single-list search: filters the list's own items by the search
// query. Grocery's `filterBySearchQuery` decorates this with the cross-list
// buckets (products/storage/shopping); domains without cross-reads (tasks) use
// this directly.
export const filterListBySearchQuery = <
  T extends IListState<R>,
  R extends TAllItemTypes,
>(
  listState: T
): ISearchResult<R> | undefined => {
  const searchQuery = listState.searchQuery?.trim();
  if (!searchQuery || !searchQuery.length) return;
  const result: ISearchResult<R> = {
    searchTerm: searchQuery,
    hasSearchTerm: !!searchQuery.length,
    listItems: listState.items.filter((item) =>
      matchesSearch(item, searchQuery)
    ),
    products: [],
    storageItems: [],
    shoppingItems: [],
  };
  result.exactMatch = result.listItems.find((base) =>
    matchesSearchExactly(base, searchQuery)
  );
  return result;
};

export const listStateFilter = (
  state?: IListState<TAllItemTypes>
): { isCategoryModeOrHasFilter: boolean; hasFilter: boolean } => {
  return {
    isCategoryModeOrHasFilter:
      !!state?.filterBy || state?.mode === 'categories',
    hasFilter: !!state?.filterBy,
  };
};

export const listCategoriesWithCount = (
  state?: IListState<TAllItemTypes>
): { category: TItemListCategory; count: number }[] => {
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
};
