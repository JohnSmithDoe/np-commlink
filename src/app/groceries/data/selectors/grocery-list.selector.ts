import { createSelector } from '@ngrx/store';
import { IGroceriesState } from '../../model/groceries.types';
import {
  IGrocerySearchResult,
  TGroceryListId,
  isGroceryListId,
} from '../../model/grocery-list.types';
import {
  matchesNameExactly,
  matchesSearch,
} from '../../../@shared/util/app.utils';
import { categoryNames } from '../../../@shared/util/categories/category.utils';
import { selectRouteParams as selectRouteParameters } from './router.selector';
import { selectGroceriesState } from './groceries.selector';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
  listCategoriesWithCount,
} from '../../../@shared/util/list/list.selector';
import { stateByListId } from '../../util/grocery-list.utils';
import { IBaseItem } from '../../../@shared/model/base-item.types';
import { ICategory } from '../../../@shared/model/category.types';
import { IListState } from '../../../@shared/model/item-list.types';

// Re-export the domain-blind selector helpers so existing grocery importers
// (shopping/storage/products selectors) keep resolving them from here. The
// generic implementations now live in `@shared/util/list/list.selector`.
export {
  filterAndSortItemList,
  categoryComparator,
  itemComparator,
} from '../../../@shared/util/list/list.selector';

// Lives here rather than on the domain-blind router selector because groceries
// is the only multi-list domain — tracking/tasks name their own id. Narrowed, not
// cast: `/data/:listId` shares the param name with a different vocabulary, and
// this root-singleton selector keeps reading the router from any route.
export const selectListIdParam = createSelector(
  selectRouteParameters,
  (parameters): TGroceryListId | undefined => {
    const listId = parameters?.['listId'];
    return isGroceryListId(listId) ? listId : undefined;
  }
);

export const selectListState = createSelector(
  selectListIdParam,
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
  const isNotAlreadyListed = (item: T) =>
    !alreadyShown.some((shown) => matchesNameExactly(item, shown)) &&
    !result.listItems.some((listed) => matchesNameExactly(item, listed));

  const matchedByName = items.filter(
    (item) => isNotAlreadyListed(item) && matchesSearch(item, searchQuery)
  );
  const matchedByCategory = items.filter(
    (item) =>
      isNotAlreadyListed(item) &&
      !matchedByName.includes(item) &&
      categoryNames(item, catalog).some((name) =>
        matchesSearch(name, searchQuery)
      )
  );
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
  const listId = listState.id;
  if (!isGroceryListId(listId)) return result;
  //prettier-ignore
  switch (listId) {
    case '_storage': {
      if (state.listSettings.showProductsInStorage)
        result.products = crossListMatchesFor(state.products.items, result, searchQuery, state.products.categories);
      if (state.listSettings.showShoppingInStorage)
        result.shoppingItems = crossListMatchesFor(state.shopping.items, result, searchQuery, state.shopping.categories, result.products);
      break;
    }
    case '_products': {
      if (state.listSettings.showStorageInProducts)
        result.storageItems = crossListMatchesFor(state.storage.items, result, searchQuery, state.storage.categories);
      if (state.listSettings.showShoppingInProducts)
        result.shoppingItems = crossListMatchesFor(state.shopping.items, result, searchQuery, state.shopping.categories, result.storageItems);
      break;
    }
    case '_shopping': {
      if (state.listSettings.showProductsInShopping)
        result.products = crossListMatchesFor(state.products.items, result, searchQuery, state.products.categories);
      if (state.listSettings.showStorageInShopping)
        result.storageItems = crossListMatchesFor(state.storage.items, result, searchQuery, state.storage.categories, result.products);
      break;
    }
  }
  return result;
};

export const selectListCategories = createSelector(
  selectListState,
  listCategoriesWithCount
);

export const selectListSearchResult = createSelector(
  selectListState,
  selectGroceriesState,
  (state, lists): IGrocerySearchResult<IBaseItem> | undefined => {
    return !!state && state.mode !== 'categories'
      ? filterBySearchQuery(lists, state)
      : undefined;
  }
);

export const selectListItems = createSelector(
  selectListState,
  selectListSearchResult,
  (state, result): IBaseItem[] | undefined =>
    state ? filterAndSortItemList(state, result) : undefined
);
