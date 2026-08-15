/* ─── why ─────────────────────────────────────────────────────────
 * `filterBy`'s meaning used to live inline: falsy meant "show everything",
 * truthy meant "is a member of `categoryIds`". Those collide on the one
 * thing a list cannot express — "has no category at all" — because no
 * filter and no category are the same falsy value.
 *
 * So the token stays an opaque string and the meaning moves here: either a
 * registered pseudo-filter or a real `CategoryId`, with a fallback that
 * leaves every existing filter untouched. The shape never changes, which
 * is why `?filter=`, the persisted slices and all four reducers needed no
 * migration, and why a second pseudo-filter is one array entry.
 *
 * `isPseudoFilter` exists for one caller: `createBaseItem` seeds a new
 * item's categories from the active filter, so an unguarded pseudo token
 * would be written to disk as a category that does not exist.
 * ───────────────────────────────────────────────────────────────── */

import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseItem } from '../../model/base-item.types';

const UNCATEGORIZED_FILTER = '__uncategorized__';

export interface ItemFilter {
  readonly id: string;
  readonly labelKey: string;
  readonly matches: (item: BaseItem) => boolean;
  readonly isAvailable: (items: readonly BaseItem[]) => boolean;
}

const hasNoCategory = (item: BaseItem): boolean => !item.categoryIds?.length;

export const ITEM_FILTERS: readonly ItemFilter[] = [
  {
    id: UNCATEGORIZED_FILTER,
    labelKey: marker('item-list.filter.uncategorized'),
    matches: hasNoCategory,
    isAvailable: (items) => items.some((item) => hasNoCategory(item)),
  },
];

const FILTER_BY_ID = new Map(ITEM_FILTERS.map((filter) => [filter.id, filter]));

export const isPseudoFilter = (token?: string): boolean =>
  !!token && FILTER_BY_ID.has(token);

export const matcherForFilter = (
  token?: string
): ((item: BaseItem) => boolean) => {
  if (!token) return () => true;
  const pseudo = FILTER_BY_ID.get(token);
  if (pseudo) return pseudo.matches;
  return (item) => !!item.categoryIds?.includes(token);
};
