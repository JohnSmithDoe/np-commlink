import { createSelector } from '@ngrx/store';
import { IGroceriesState } from '../model/groceries.types';
import {
  IGrocerySearchResult,
  isGroceryListId,
  TGroceryListId,
} from '../model/grocery-list.types';
import { matcherFor, matchingTxt } from '../../@shared/util/app.utils';
import {
  anyCategoryNameMatches,
  categoryNameLookup,
} from '../../@shared/util/categories/category.utils';
import { selectRouteParams as selectRouteParameters } from './router.selector';
import { selectGroceriesState } from './groceries/groceries.selector';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
  itemCountByCategory,
} from '../../@shared/util/item-lists/list.selector';
import { stateByListId } from '../util/grocery-list.utils';
import { IBaseItem } from '../../@shared/model/base-item.types';
import {
  ICategory,
  ICategoryList,
  TCategoryId,
} from '../../@shared/model/category.types';
import { IListState, ISearchResult } from '../../@shared/model/item-list.types';

// Lives here rather than on the domain-blind router selector because groceries
// is the only multi-list domain — tracking/tasks name their own id. Narrowed, not
// cast, because this root-singleton selector keeps reading the router from any
// route: an unrecognised value has to become `undefined` rather than be asserted
// into a `TGroceryListId` the rest of the engine then switches on.
export const selectListIdParameter = createSelector(
  selectRouteParameters,
  (parameters): TGroceryListId | undefined => {
    const listId = parameters?.['listId'];
    return isGroceryListId(listId) ? listId : undefined;
  }
);

export const selectListState = createSelector(
  selectListIdParameter,
  selectGroceriesState,
  (listId, lists) => {
    if (!listId) return;
    return stateByListId(lists, listId);
  }
);

// A cross-list suggestion is only worth showing if the shopper isn't already
// looking at that name — in the list they're on, or in a bucket shown above.
const crossListMatchesFor = <R extends IBaseItem, T extends IBaseItem>(
  items: T[],
  result: IGrocerySearchResult<R>,
  searchQuery: string,
  catalog: readonly ICategory[],
  alreadyShown: IBaseItem[] = []
) => {
  // Everything a candidate is compared against is built once, because this runs
  // on every keystroke, over every product, for two buckets at a time: the
  // excluded names hashed instead of re-scanned, the query normalized once
  // instead of twice per comparison, and the catalog indexed instead of scanned
  // per category id — which was the remaining N×K×|catalog| term.
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

// Grocery cross-list search: the domain-blind single-list result decorated with
// the product/storage/shopping buckets when the corresponding list-settings
// flag is on.
export const filterBySearchQuery = <
  T extends IListState<R>,
  R extends IBaseItem,
>(
  state: IGroceriesState,
  listState: T
): IGrocerySearchResult<R> | undefined => {
  const base = filterListBySearchQuery<T, R>(listState);
  if (!base) return undefined;
  const result: IGrocerySearchResult<R> = { ...base };
  const searchQuery = result.searchTerm;
  // One catalog for all three lists, so every bucket resolves names against it.
  const catalog = state.categories.items;
  const listId = listState.id;
  if (!isGroceryListId(listId)) return result;
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

export const selectListSearchResult = createSelector(
  selectListState,
  selectGroceriesState,
  (state, lists): IGrocerySearchResult<IBaseItem> | undefined =>
    state ? filterBySearchQuery(lists, state) : undefined
);

export const selectListItems = createSelector(
  selectListState,
  selectListSearchResult,
  (state, result): IBaseItem[] | undefined =>
    state ? filterAndSortItemList(state, result) : undefined
);

// ── the shared catalog, as its own list ───────────────────────────────────────
export const selectGroceryCategoryList = createSelector(
  selectGroceriesState,
  (state): ICategoryList => state.categories
);

export const selectGroceryCategories = createSelector(
  selectGroceryCategoryList,
  (catalog): ICategory[] => catalog.items
);

export const selectGroceryCategoriesSearchResult = createSelector(
  selectGroceryCategoryList,
  (catalog): ISearchResult<ICategory> | undefined =>
    filterListBySearchQuery(catalog)
);

export const selectGroceryCategoriesListItems = createSelector(
  selectGroceryCategoryList,
  selectGroceryCategoriesSearchResult,
  (catalog, result): ICategory[] | undefined =>
    filterAndSortItemList(catalog, result)
);

/**
 * How many rows reference each category, across ALL THREE lists.
 *
 * The counts are summed rather than per-list because the catalog is shared: a
 * category with no products but three pantry rows is in use, and a per-list count
 * would show it as empty on the products page and invite a delete that cascades
 * into storage.
 */
export const selectGroceryCountByCategory = createSelector(
  selectGroceriesState,
  (state): Map<TCategoryId, number> =>
    itemCountByCategory([
      ...state.products.items,
      ...state.shopping.items,
      ...state.storage.items,
    ])
);
