/* ─── why ─────────────────────────────────────────────────────────
 * This is the cross-list half of household search: typing "milk" in the
 * pantry can also offer the catalog product and the shopping row, and
 * `listSettings` decides which of the six directions are open. It rode in
 * `household-list.selector.ts` and imports no `@ngrx` — which is the line
 * architecture.md draws for `data/`, so it belongs here beside
 * `stateByListId`, the sibling switch it already leans on.
 *
 * `alreadyShown` is the reason the two calls per branch are ordered rather
 * than independent: the second list must not re-offer a row the first one
 * already offered, so it is passed the first one's result.
 * ───────────────────────────────────────────────────────────────── */

import { BaseItem } from '../../@shared/model/base-item.types';
import { Category } from '../../@shared/model/category.types';
import { ListState } from '../../@shared/model/item-list.types';
import { matcherFor, matchingTxt } from '../../@shared/util/app.utils';
import {
  anyCategoryNameMatches,
  categoryNameLookup,
} from '../../@shared/util/categories/category.utils';
import { filterListBySearchQuery } from '../../@shared/util/item-lists/list.selector';
import { HouseholdState } from '../model/household.types';
import {
  HouseholdSearchResult,
  isHouseholdListId,
} from '../model/household-list.types';

const crossListMatchesFor = <R extends BaseItem, T extends BaseItem>(
  items: T[],
  result: HouseholdSearchResult<R>,
  searchQuery: string,
  catalog: readonly Category[],
  alreadyShown: BaseItem[] = []
) => {
  const excluded = new Set(
    [...alreadyShown, ...result.listItems].map((shown) => matchingTxt(shown))
  );
  const matches = matcherFor(searchQuery);
  const nameOf = categoryNameLookup(catalog);

  const matchedByName: T[] = [];
  const matchedByCategory: T[] = [];
  for (const item of items) {
    if (excluded.has(matchingTxt(item))) continue;
    if (matches(item)) {
      matchedByName.push(item);
    } else if (anyCategoryNameMatches(item, nameOf, matches)) {
      matchedByCategory.push(item);
    }
  }
  return [...matchedByName, ...matchedByCategory];
};

export const filterBySearchQuery = <T extends ListState<R>, R extends BaseItem>(
  state: HouseholdState,
  listState: T
): HouseholdSearchResult<R> | undefined => {
  const base = filterListBySearchQuery<T, R>(listState);
  if (!base) return undefined;
  const result: HouseholdSearchResult<R> = { ...base };
  const searchQuery = result.searchTerm;
  const catalog = state.categories.items;
  const listId = listState.id;
  if (!isHouseholdListId(listId)) return result;
  //prettier-ignore
  switch (listId) {
    case '_storage': {
      if (state.listSettings.showProductsInStorage)
        result.products = crossListMatchesFor(state.products.items, result, searchQuery, catalog);
      if (state.listSettings.showShoppingInStorage)
        result.shoppingItems = crossListMatchesFor(state.shopping.items, result, searchQuery, catalog, result.products);
      break;
    }
    case '_products': {
      if (state.listSettings.showStorageInProducts)
        result.storageItems = crossListMatchesFor(state.storage.items, result, searchQuery, catalog);
      if (state.listSettings.showShoppingInProducts)
        result.shoppingItems = crossListMatchesFor(state.shopping.items, result, searchQuery, catalog, result.storageItems);
      break;
    }
    case '_shopping': {
      if (state.listSettings.showProductsInShopping)
        result.products = crossListMatchesFor(state.products.items, result, searchQuery, catalog);
      if (state.listSettings.showStorageInShopping)
        result.storageItems = crossListMatchesFor(state.storage.items, result, searchQuery, catalog, result.products);
      break;
    }
  }
  return result;
};
