import dayjs from 'dayjs';
import {
  itemHasCategory,
  matchesSearch,
  matchesSearchExactly,
} from '../app.utils';
import { IBaseItem } from '../../model/base-item.types';
import { ICategory } from '../../model/category.types';
import {
  IListState,
  ISearchResult,
  TItemListSort,
} from '../../model/item-list.types';

// Domain-blind selector helpers shared by every list domain. They operate over
// the generic `IListState<T>` shape and know no concrete list identity. The
// grocery cross-list search buckets stay in grocery-list.selector.ts, which
// builds on `filterListBySearchQuery` below.

// Missing values sort last in either direction: the sentinel is picked per
// direction so an unset field always loses. Deliberately loose dayjs strings.
const MAXPRIO = Number.MAX_SAFE_INTEGER;
const MINPRIO = Number.MIN_SAFE_INTEGER;
const MAXDATE = '5000-1-1';
const MINDATE = '1970-1-1';

const compareByName = <T extends IBaseItem>(
  a: T,
  b: T,
  dir?: TItemListSort['sortDir']
): number =>
  dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);

// Structural optional-field reads (was an isStorageItem/isTaskItem guard) so the
// shared engine stays domain-blind after the grocery types moved out.
const optional = <V>(item: IBaseItem, field: string): V | undefined =>
  (item as Record<string, unknown>)[field] as V | undefined;

const compareByOptionalDate = <T extends IBaseItem>(
  a: T,
  b: T,
  field: string,
  dir?: TItemListSort['sortDir']
): number => {
  const aDate = optional<string>(a, field);
  const bDate = optional<string>(b, field);
  if (!aDate && !bDate) return compareByName(a, b, dir);
  return dir === 'asc'
    ? dayjs(aDate ?? MAXDATE).unix() - dayjs(bDate ?? MAXDATE).unix()
    : dayjs(bDate ?? MINDATE).unix() - dayjs(aDate ?? MINDATE).unix();
};

const compareByOptionalNumber = <T extends IBaseItem>(
  a: T,
  b: T,
  field: string,
  dir?: TItemListSort['sortDir']
): number => {
  const aValue = optional<number>(a, field);
  const bValue = optional<number>(b, field);
  if (!aValue && !bValue) return compareByName(a, b, dir);
  return dir === 'asc'
    ? (aValue ?? MAXPRIO) - (bValue ?? MAXPRIO)
    : (bValue ?? MINPRIO) - (aValue ?? MINPRIO);
};

const compareByOptionalText = <T extends IBaseItem>(
  a: T,
  b: T,
  field: string,
  dir?: TItemListSort['sortDir']
): number => {
  const aText = optional<string>(a, field) ?? '';
  const bText = optional<string>(b, field) ?? '';
  if (!aText && !bText) return compareByName(a, b, dir);
  return dir === 'asc'
    ? aText.localeCompare(bText)
    : bText.localeCompare(aText);
};

/**
 * Pick the comparison from the *value*, not from a list of field names.
 *
 * The engine used to switch on `'bestBefore' | 'dueAt' | 'prio'` — grocery and
 * tasks vocabulary hardcoded in the kernel, with `default: return 0`. So adding
 * a sort key to a domain meant editing `@shared`, and forgetting to was silent:
 * the action dispatched, the reducer stored the sort, the toolbar highlighted
 * it, and the list simply did not reorder.
 */
const compareByField = <T extends IBaseItem>(
  a: T,
  b: T,
  field: string,
  dir?: TItemListSort['sortDir']
): number => {
  const sample = optional<unknown>(a, field) ?? optional<unknown>(b, field);
  if (typeof sample === 'number')
    return compareByOptionalNumber(a, b, field, dir);
  if (typeof sample !== 'string') return compareByName(a, b, dir);
  return dayjs(sample).isValid()
    ? compareByOptionalDate(a, b, field, dir)
    : compareByOptionalText(a, b, field, dir);
};

export const itemComparator =
  <T extends IBaseItem>(sort?: TItemListSort) =>
  (a: T, b: T): number =>
    !sort?.sortBy || sort.sortBy === 'name'
      ? compareByName(a, b, sort?.sortDir)
      : compareByField(a, b, sort.sortBy, sort.sortDir);

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
    .sort(itemComparator<R>(state.sort));
};

export const categoryComparator = (sort?: TItemListSort) => {
  return (a: ICategory, b: ICategory) => {
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
): { category: ICategory; count: number }[] => {
  if (!state) return [];
  return [...state.categories]
    .sort(categoryComparator(state.sort))
    .filter((cat) => matchesSearch(cat.name, state.searchQuery ?? ''))
    .map((category) => ({
      category,
      count: state.items.filter((current) =>
        itemHasCategory(current, category.id)
      ).length,
    }));
};
