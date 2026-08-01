import dayjs from 'dayjs';
import { matcherFor, matchesSearchExactly } from '../app.utils';
import { IBaseItem } from '../../model/base-item.types';
import { TCategoryId } from '../../model/category.types';
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
  direction?: TItemListSort['sortDirection']
): number =>
  direction === 'asc'
    ? a.name.localeCompare(b.name)
    : b.name.localeCompare(a.name);

// Structural optional-field reads (was an isStorageItem/isTaskItem guard) so the
// shared engine stays domain-blind after the grocery types moved out.
const optional = <V>(item: IBaseItem, field: string): V | undefined =>
  (item as Record<string, unknown>)[field] as V | undefined;

const compareByOptionalDate = <T extends IBaseItem>(
  a: T,
  b: T,
  field: string,
  direction?: TItemListSort['sortDirection']
): number => {
  const aDate = optional<string>(a, field);
  const bDate = optional<string>(b, field);
  if (!aDate && !bDate) return compareByName(a, b, direction);
  return direction === 'asc'
    ? dayjs(aDate ?? MAXDATE).unix() - dayjs(bDate ?? MAXDATE).unix()
    : dayjs(bDate ?? MINDATE).unix() - dayjs(aDate ?? MINDATE).unix();
};

const compareByOptionalNumber = <T extends IBaseItem>(
  a: T,
  b: T,
  field: string,
  direction?: TItemListSort['sortDirection']
): number => {
  const aValue = optional<number>(a, field);
  const bValue = optional<number>(b, field);
  // Presence and ties are separate questions, and conflating them under one
  // falsy check cost the sentinel its guarantee: `prio: 0` read as unset, so a
  // real 0 tied with an absent field and the pair broke on the name instead —
  // the one case where "an unset field loses in either direction" did not hold.
  if (aValue === undefined && bValue === undefined)
    return compareByName(a, b, direction);
  const byValue =
    direction === 'asc'
      ? (aValue ?? MAXPRIO) - (bValue ?? MAXPRIO)
      : (bValue ?? MINPRIO) - (aValue ?? MINPRIO);
  return byValue === 0 ? compareByName(a, b, direction) : byValue;
};

const compareByOptionalText = <T extends IBaseItem>(
  a: T,
  b: T,
  field: string,
  direction?: TItemListSort['sortDirection']
): number => {
  const aText = optional<string>(a, field);
  const bText = optional<string>(b, field);
  if (aText === undefined && bText === undefined)
    return compareByName(a, b, direction);
  // "Missing loses in either direction", stated directly rather than through a
  // pair of sentinels: no string sorts outside every locale's collation the way
  // MAXDATE and MAXPRIO do for their types. Substituting `''` on both sides —
  // which is what this did — sorted an unset field FIRST ascending, the
  // opposite of the rule at the top of this file, and the same conflation of
  // "absent" with "empty" that `compareByOptionalNumber` had to unpick for
  // `prio: 0`.
  if (aText === undefined) return 1;
  if (bText === undefined) return -1;
  const byText =
    direction === 'asc'
      ? aText.localeCompare(bText)
      : bText.localeCompare(aText);
  return byText === 0 ? compareByName(a, b, direction) : byText;
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
type TFieldComparator<T extends IBaseItem> = (
  a: T,
  b: T,
  field: string,
  direction?: TItemListSort['sortDirection']
) => number;

/**
 * What a date looks like in this app: every one is a `dayjs().format()` output
 * (ISO 8601) or the `YYYY-MM-DD` a date input produces, so the head is enough.
 *
 * Sniffing with `dayjs(sample).isValid()` instead accepted anything V8's `Date`
 * constructor would — and it will take `'2'` (1 Feb 2001), `'May'`, `'12'`. So a
 * *text* column whose first non-empty value happened to be short was sorted as
 * dates for the rest of the pass, silently and only for that data.
 */
const ISO_DATE_HEAD = /^\d{4}-\d{2}-\d{2}/;

const comparatorForSample = <T extends IBaseItem>(
  sample: unknown
): TFieldComparator<T> => {
  if (typeof sample === 'number') return compareByOptionalNumber;
  if (typeof sample !== 'string')
    return (a, b, _field, direction) => compareByName(a, b, direction);
  return ISO_DATE_HEAD.test(sample)
    ? compareByOptionalDate
    : compareByOptionalText;
};

export const itemComparator = <T extends IBaseItem>(sort?: TItemListSort) => {
  const field = sort?.sortBy;
  if (!field || field === 'name') {
    return (a: T, b: T): number => compareByName(a, b, sort?.sortDirection);
  }
  // The kind is a property of the field, not of a pair, but nothing hands the
  // factory the items — so it is decided on the first comparison that sees a
  // value and pinned for the rest of the sort. Pinning only once a value has
  // actually been seen is what keeps it equivalent to deciding per pair: an
  // all-undefined pair always falls back to the name, either way.
  let compare: TFieldComparator<T> | undefined;
  return (a: T, b: T): number => {
    if (compare) return compare(a, b, field, sort.sortDirection);
    const sample = optional<unknown>(a, field) ?? optional<unknown>(b, field);
    const chosen = comparatorForSample<T>(sample);
    if (sample !== undefined) compare = chosen;
    return chosen(a, b, field, sort.sortDirection);
  };
};

export const filterAndSortItemList = <
  T extends IListState<R>,
  R extends IBaseItem,
>(
  state: T,
  result?: ISearchResult<R>
): R[] => {
  // `.filter` already returns a fresh array, so `state.items` is never the one
  // being sorted — the defensive copy this used to spread was a second allocation
  // guarding nothing.
  return (result?.listItems ?? state.items)
    .filter(
      (item) => !state.filterBy || item.categoryIds?.includes(state.filterBy)
    )
    .sort(itemComparator<R>(state.sort));
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
  const matches = matcherFor(searchQuery);
  const result: ISearchResult<R> = {
    searchTerm: searchQuery,
    listItems: listState.items.filter((item) => matches(item)),
  };
  result.exactMatch = result.listItems.find((base) =>
    matchesSearchExactly(base, searchQuery)
  );
  return result;
};

/**
 * How many items reference each category, in ONE pass over the items rather than
 * a full scan per category (which was C×N per recompute, i.e. per keystroke).
 *
 * A lookup rather than a decorated catalog: the catalog is a list now, so its
 * page view comes from `filterAndSortItemList` like every other list's, and the
 * count is what its row adds on top.
 */
export const itemCountByCategory = (
  items: readonly IBaseItem[]
): Map<TCategoryId, number> => {
  const counts = new Map<TCategoryId, number>();
  for (const item of items) {
    for (const categoryId of item.categoryIds ?? []) {
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    }
  }
  return counts;
};
