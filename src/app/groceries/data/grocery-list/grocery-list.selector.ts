import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  IBaseItem,
  ICategory,
  IListState,
  TItemListId,
} from '../../../@shared/model/types';
import {
  IGroceryLists,
  IGrocerySearchResult,
  IProductsState,
  IShoppingState,
  IStorageState,
} from '../../model';
import {
  matchesNameExactly,
  matchesSearch,
} from '../../../@shared/util/app.utils';
import { categoryNames } from '../../../@shared/util/categories/category.utils';
import { selectRouteParams as selectRouteParameters } from '../../../@shared/data/router/router.selector';
import { selectListSettingsState } from '../list-settings/list-settings.selector';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
  listCategoriesWithCount,
  listStateFilter,
} from '../../../@shared/util/list/list.selector';
import { stateByListId } from './grocery-list.utils';

// Re-export the domain-blind selector helpers so existing grocery importers
// (shopping/storage/products selectors) keep resolving them from here. The
// generic implementations now live in `@shared/util/list/list.selector`.
export {
  filterAndSortItemList,
  sortCategoriesFn,
  sortItemListFn,
} from '../../../@shared/util/list/list.selector';

// Lives here rather than on the domain-blind router selector because groceries
// is the only multi-list domain — tracking/tasks name their own id.
export const selectListIdParam = createSelector(
  selectRouteParameters,
  (parameters): TItemListId | undefined =>
    parameters?.['listId'] as TItemListId | undefined
);

// The grocery slice bundle, recomposed from the per-slice feature selectors +
// the shared listSettings selector. There is no root-state type: the cross-list
// engine reads each slice through its own feature selector and composes them
// here. Defined via `createFeatureSelector` inline (not imported from the
// per-list selectors) to avoid a selector import cycle.
export const selectGroceryLists = createSelector(
  createFeatureSelector<IStorageState>('storage'),
  createFeatureSelector<IProductsState>('products'),
  createFeatureSelector<IShoppingState>('shopping'),
  selectListSettingsState,
  (storage, products, shopping, listSettings): IGroceryLists => ({
    storage,
    products,
    shopping,
    listSettings,
  })
);

export const selectListState = createSelector(
  selectListIdParam,
  selectGroceryLists,
  (listId, lists) => {
    if (!listId) return;
    return stateByListId(lists, listId);
  }
);

const additionalSearch = <R extends IBaseItem, T extends IBaseItem>(
  items: T[],
  result: IGrocerySearchResult<R>,
  searchQuery: string,
  catalog: readonly ICategory[],
  others?: IBaseItem[]
) => {
  others = others || [];
  const additionalItemsByName = items.filter(
    (item) =>
      !others?.some((litem) => matchesNameExactly(item, litem)) &&
      !result.listItems.some((litem) => matchesNameExactly(item, litem)) &&
      matchesSearch(item, searchQuery)
  );
  const additionalItemsByCat = items.filter(
    (item) =>
      !others?.some((litem) => matchesNameExactly(item, litem)) &&
      !result.listItems.some((litem) => matchesNameExactly(item, litem)) &&
      !additionalItemsByName.includes(item) &&
      categoryNames(item, catalog).some((name) =>
        matchesSearch(name, searchQuery)
      )
  );
  return [...additionalItemsByName, ...additionalItemsByCat];
};

// Grocery cross-list search: the domain-blind single-list result decorated with
// the product/storage/shopping buckets when the corresponding list-settings
// flag is on.
export const filterBySearchQuery = <
  T extends IListState<R>,
  R extends IBaseItem,
>(
  state: IGroceryLists,
  listState: T
): IGrocerySearchResult<R> | undefined => {
  const base = filterListBySearchQuery<T, R>(listState);
  if (!base) return undefined;
  const result: IGrocerySearchResult<R> = { ...base };
  const searchQuery = result.searchTerm;
  //prettier-ignore
  switch (listState.id) {
    case '_storage': {
      if (state.listSettings.showProductsInStorage)
        result.products = additionalSearch(state.products.items, result, searchQuery, state.products.categories);
      if (state.listSettings.showShoppingInStorage)
        result.shoppingItems = additionalSearch(state.shopping.items, result, searchQuery, state.shopping.categories, result.products);
      break;
    }
    case '_products': {
      if (state.listSettings.showStorageInProducts)
        result.storageItems = additionalSearch(state.storage.items, result, searchQuery, state.storage.categories);
      if (state.listSettings.showShoppingInProducts)
        result.shoppingItems = additionalSearch(state.shopping.items, result, searchQuery, state.shopping.categories, result.storageItems);
      break;
    }
    case '_shopping': {
      if (state.listSettings.showProductsInShopping)
        result.products = additionalSearch(state.products.items, result, searchQuery, state.products.categories);
      if (state.listSettings.showStorageInShopping)
        result.storageItems = additionalSearch(state.storage.items, result, searchQuery, state.storage.categories, result.products);
      break;
    }
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
  selectGroceryLists,
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
