import { createSelector } from '@ngrx/store';
import {
  IAppState,
  IBaseItem,
  IListState,
  ISearchResult,
  IShoppingItem,
  TAllItemTypes,
} from '../../../@shared/types';
import {
  matchesCategory,
  matchesNameExactly,
  matchesSearch,
} from '../../../@shared/util/app.utils';
import { selectRouteParams } from '../../../@shared/data/router.selector';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
  listCategoriesWithCount,
  listStateFilter,
} from '../../../@shared/data/list/list.selector';
import { stateByListId } from './grocery-list.utils';

// Re-export the domain-blind selector helpers so existing grocery importers
// (shopping/storage/products selectors) keep resolving them from here. The
// generic implementations now live in `@shared/data/list/list.selector`.
export {
  filterAndSortItemList,
  sortCategoriesFn,
  sortItemListFn,
} from '../../../@shared/data/list/list.selector';

export const selectListState = createSelector(
  selectRouteParams,
  (state: IAppState) => state,
  ({ listId }, state) => {
    if (!listId) return undefined;
    return stateByListId(state, listId);
  }
);

const additionalSearch = <R extends TAllItemTypes, T extends TAllItemTypes>(
  items: T[],
  result: ISearchResult<R>,
  searchQuery: string,
  others?: IBaseItem[]
) => {
  others = others || [];
  const additionalItemsByName = items.filter(
    (item) =>
      !others?.find((litem) => matchesNameExactly(item, litem)) &&
      !result.listItems.find((litem) => matchesNameExactly(item, litem)) &&
      matchesSearch(item, searchQuery)
  );
  // then by category
  const additionalItemsByCat = items.filter(
    (item) =>
      !others?.find((litem) => matchesNameExactly(item, litem)) &&
      !result.listItems.find((litem) => matchesNameExactly(item, litem)) &&
      !additionalItemsByName.includes(item) &&
      matchesCategory(item, searchQuery)
  );
  return [...additionalItemsByName, ...additionalItemsByCat];
};

// Grocery cross-list search: the domain-blind single-list result decorated with
// the product/storage/shopping buckets when the corresponding list-settings
// flag is on.
export const filterBySearchQuery = <
  T extends IListState<R>,
  R extends TAllItemTypes,
>(
  state: IAppState,
  listState: T
): ISearchResult<R> | undefined => {
  const result = filterListBySearchQuery<T, R>(listState);
  if (!result) return undefined;
  const searchQuery = result.searchTerm;
  //prettier-ignore
  switch (listState.id) {
    case '_storage':
      if (state.listSettings.showProductsInStorage)
        result.products = additionalSearch(state.products.items, result, searchQuery);
      if (state.listSettings.showShoppingInStorage)
        result.shoppingItems = additionalSearch(state.shopping.items, result, searchQuery, result.products);
      break;
    case '_products':
      if (state.listSettings.showStorageInProducts)
        result.storageItems = additionalSearch(state.storage.items, result, searchQuery);
      if (state.listSettings.showShoppingInProducts)
        result.shoppingItems = additionalSearch(state.shopping.items, result, searchQuery, result.storageItems);
      break;
    case '_shopping':
      if (state.listSettings.showProductsInShopping)
        result.products = additionalSearch(state.products.items, result, searchQuery);
      if (state.listSettings.showStorageInShopping)
        result.storageItems = additionalSearch(state.storage.items, result, searchQuery, result.products);
      break;
  }
  return result;
};

export const selectListCategories = createSelector(
  selectListState,
  listCategoriesWithCount
);

export const selectListStateFilter = createSelector(
  selectListState,
  listStateFilter
);

export const selectListSearchResult = createSelector(
  selectListState,
  (state: IAppState) => state,
  (state, appState): ISearchResult<IShoppingItem> | undefined => {
    return !!state && state.mode !== 'categories'
      ? filterBySearchQuery(appState, state)
      : undefined;
  }
);

export const selectListItems = createSelector(
  selectListState,
  selectListSearchResult,
  (state, result): IShoppingItem[] | undefined =>
    state ? filterAndSortItemList(state, result) : undefined
);
