import dayjs from 'dayjs';
import {
  IBaseItem,
  IListState,
  ISearchResult,
  TItemListCategory,
  TItemListSort,
} from '../../types';
import {
  itemHasCategory,
  matchesSearch,
  matchesSearchExactly,
} from '../../util/app.utils';

// Domain-blind selector helpers shared by every list domain. They operate over
// the generic `IListState<T>` shape and know no concrete list identity. The
// grocery cross-list search buckets stay in grocery-list.selector.ts, which
// builds on `filterListBySearchQuery` below.

export const sortItemListFn = <T extends IBaseItem>(sort?: TItemListSort) => {
  const MAXPRIO = Number.MAX_SAFE_INTEGER;
  const MINPRIO = Number.MIN_SAFE_INTEGER;
  const MAXDATE = '5000-1-1';
  const MINDATE = '1970-1-1';
  return (a: T, b: T): number => {
    switch (sort?.sortBy) {
      case 'name': {
        return sort.sortDir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      case 'bestBefore': {
        // structural optional-field reads (was isStorageItem guard) so the
        // shared engine stays domain-blind after the grocery types moved out.
        const aBest = (a as { bestBefore?: string }).bestBefore;
        const bBest = (b as { bestBefore?: string }).bestBefore;
        return !aBest && !bBest
          ? sortItemListFn<T>({ ...sort, sortBy: 'name' })(a, b)
          : sort.sortDir === 'asc'
            ? dayjs(aBest ?? MAXDATE).unix() - dayjs(bBest ?? MAXDATE).unix()
            : dayjs(bBest ?? MINDATE).unix() - dayjs(aBest ?? MINDATE).unix();
      }
      case 'prio': {
        // structural read (was isTaskItem guard).
        const aPrio = (a as { prio?: number }).prio;
        const bPrio = (b as { prio?: number }).prio;
        return !aPrio && !bPrio
          ? sortItemListFn<T>({ ...sort, sortBy: 'name' })(a, b)
          : sort.sortDir === 'asc'
            ? (aPrio ?? MAXPRIO) - (bPrio ?? MAXPRIO)
            : (bPrio ?? MINPRIO) - (aPrio ?? MINPRIO);
      }
      case 'dueAt': {
        // structural read (was isTaskItem guard).
        const aDue = (a as { dueAt?: string }).dueAt;
        const bDue = (b as { dueAt?: string }).dueAt;
        return !aDue && !bDue
          ? sortItemListFn<T>({ ...sort, sortBy: 'name' })(a, b)
          : sort.sortDir === 'asc'
            ? dayjs(aDue ?? MAXDATE).unix() - dayjs(bDue ?? MAXDATE).unix()
            : dayjs(bDue ?? MINDATE).unix() - dayjs(aDue ?? MINDATE).unix();
      }

      default: {
        return 0;
      }
    }
  };
};

export const filterAndSortItemList = <
  T extends IListState<R>,
  R extends IBaseItem,
>(
  state: T,
  result?: ISearchResult<R>
): R[] => {
  return (result?.listItems ?? [...state.items])
    .filter(
      (item) => !state.filterBy || item.categoryIds?.includes(state.filterBy)
    )
    .sort(sortItemListFn<R>(state.sort));
};

export const sortCategoriesFn = (sort?: TItemListSort) => {
  return (a: TItemListCategory, b: TItemListCategory) => {
    return sort?.sortDir === 'desc'
      ? b.name.localeCompare(a.name)
      : a.name.localeCompare(b.name);
  };
};

// Generic single-list search: filters the list's own items by the search
// query. Grocery's `filterBySearchQuery` decorates this with the cross-list
// buckets (products/storage/shopping); domains without cross-reads (tasks) use
// this directly.
export const filterListBySearchQuery = <
  T extends IListState<R>,
  R extends IBaseItem,
>(
  listState: T
): ISearchResult<R> | undefined => {
  const searchQuery = listState.searchQuery?.trim();
  if (!searchQuery || searchQuery.length === 0) return;
  const result: ISearchResult<R> = {
    searchTerm: searchQuery,
    hasSearchTerm: searchQuery.length > 0,
    listItems: listState.items.filter((item) =>
      matchesSearch(item, searchQuery)
    ),
  };
  result.exactMatch = result.listItems.find((base) =>
    matchesSearchExactly(base, searchQuery)
  );
  return result;
};

export const listStateFilter = (
  state?: IListState<IBaseItem>
): { isCategoryModeOrHasFilter: boolean; hasFilter: boolean } => {
  return {
    isCategoryModeOrHasFilter:
      !!state?.filterBy || state?.mode === 'categories',
    hasFilter: !!state?.filterBy,
  };
};

export const listCategoriesWithCount = (
  state?: IListState<IBaseItem>
): { category: TItemListCategory; count: number }[] => {
  if (!state) return [];
  return [...state.categories]
    .sort(sortCategoriesFn(state.sort))
    .filter((cat) => matchesSearch(cat.name, state.searchQuery ?? ''))
    .map((category) => ({
      category,
      count: state.items.filter((current) =>
        itemHasCategory(current, category.id)
      ).length,
    }));
};
