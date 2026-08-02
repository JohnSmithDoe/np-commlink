import dayjs from 'dayjs';
import { matcherFor, matchesSearchExactly } from '../app.utils';
import { BaseItem } from '../../model/base-item.types';
import { CategoryId } from '../../model/category.types';
import {
  SearchResult,
  ItemListSort,
  ListState,
} from '../../model/item-list.types';

const MAXPRIO = Number.MAX_SAFE_INTEGER;
const MINPRIO = Number.MIN_SAFE_INTEGER;
const MAXDATE = '5000-1-1';
const MINDATE = '1970-1-1';

const compareByName = <T extends BaseItem>(
  a: T,
  b: T,
  direction?: ItemListSort['sortDirection']
): number =>
  direction === 'asc'
    ? a.name.localeCompare(b.name)
    : b.name.localeCompare(a.name);

const optional = <V>(item: BaseItem, field: string): V | undefined =>
  (item as Record<string, unknown>)[field] as V | undefined;

const compareByOptionalDate = <T extends BaseItem>(
  a: T,
  b: T,
  field: string,
  direction?: ItemListSort['sortDirection']
): number => {
  const aDate = optional<string>(a, field);
  const bDate = optional<string>(b, field);
  if (!aDate && !bDate) return compareByName(a, b, direction);
  return direction === 'asc'
    ? dayjs(aDate ?? MAXDATE).unix() - dayjs(bDate ?? MAXDATE).unix()
    : dayjs(bDate ?? MINDATE).unix() - dayjs(aDate ?? MINDATE).unix();
};

const compareByOptionalNumber = <T extends BaseItem>(
  a: T,
  b: T,
  field: string,
  direction?: ItemListSort['sortDirection']
): number => {
  const aValue = optional<number>(a, field);
  const bValue = optional<number>(b, field);
  if (aValue === undefined && bValue === undefined)
    return compareByName(a, b, direction);
  const byValue =
    direction === 'asc'
      ? (aValue ?? MAXPRIO) - (bValue ?? MAXPRIO)
      : (bValue ?? MINPRIO) - (aValue ?? MINPRIO);
  return byValue === 0 ? compareByName(a, b, direction) : byValue;
};

const compareByOptionalText = <T extends BaseItem>(
  a: T,
  b: T,
  field: string,
  direction?: ItemListSort['sortDirection']
): number => {
  const aText = optional<string>(a, field);
  const bText = optional<string>(b, field);
  if (aText === undefined && bText === undefined)
    return compareByName(a, b, direction);
  if (aText === undefined) return 1;
  if (bText === undefined) return -1;
  const byText =
    direction === 'asc'
      ? aText.localeCompare(bText)
      : bText.localeCompare(aText);
  return byText === 0 ? compareByName(a, b, direction) : byText;
};

type FieldComparator<T extends BaseItem> = (
  a: T,
  b: T,
  field: string,
  direction?: ItemListSort['sortDirection']
) => number;

const ISO_DATE_HEAD = /^\d{4}-\d{2}-\d{2}/;

const comparatorForSample = <T extends BaseItem>(
  sample: unknown
): FieldComparator<T> => {
  if (typeof sample === 'number') return compareByOptionalNumber;
  if (typeof sample !== 'string')
    return (a, b, _field, direction) => compareByName(a, b, direction);
  return ISO_DATE_HEAD.test(sample)
    ? compareByOptionalDate
    : compareByOptionalText;
};

export const itemComparator = <T extends BaseItem>(sort?: ItemListSort) => {
  const field = sort?.sortBy;
  if (!field || field === 'name') {
    return (a: T, b: T): number => compareByName(a, b, sort?.sortDirection);
  }
  let compare: FieldComparator<T> | undefined;
  return (a: T, b: T): number => {
    if (compare) return compare(a, b, field, sort.sortDirection);
    const sample = optional<unknown>(a, field) ?? optional<unknown>(b, field);
    const chosen = comparatorForSample<T>(sample);
    if (sample !== undefined) compare = chosen;
    return chosen(a, b, field, sort.sortDirection);
  };
};

export const filterAndSortItemList = <
  T extends ListState<R>,
  R extends BaseItem,
>(
  state: T,
  result?: SearchResult<R>
): R[] => {
  return (result?.listItems ?? state.items)
    .filter(
      (item) => !state.filterBy || item.categoryIds?.includes(state.filterBy)
    )
    .sort(itemComparator<R>(state.sort));
};

export const filterListBySearchQuery = <
  T extends ListState<R>,
  R extends BaseItem,
>(
  listState: T
): SearchResult<R> | undefined => {
  const searchQuery = listState.searchQuery?.trim();
  if (!searchQuery || searchQuery.length === 0) return;
  const matches = matcherFor(searchQuery);
  const result: SearchResult<R> = {
    searchTerm: searchQuery,
    listItems: listState.items.filter((item) => matches(item)),
  };
  result.exactMatch = result.listItems.find((base) =>
    matchesSearchExactly(base, searchQuery)
  );
  return result;
};

export const itemCountByCategory = (
  items: readonly BaseItem[]
): Map<CategoryId, number> => {
  const counts = new Map<CategoryId, number>();
  for (const item of items) {
    for (const categoryId of item.categoryIds ?? []) {
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    }
  }
  return counts;
};
