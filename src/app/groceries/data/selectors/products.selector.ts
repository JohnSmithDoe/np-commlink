import { createSelector } from '@ngrx/store';
import {
  IGrocerySearchResult,
  IProduct,
  IProductsState,
} from '../../model/grocery-list.types';
import {
  filterAndSortItemList,
  filterBySearchQuery,
} from './grocery-list.selector';
import { selectGroceriesState } from './groceries.selector';

import { ICategory } from '../../../@shared/model/category.types';

export const selectProductsState = createSelector(
  selectGroceriesState,
  (state): IProductsState => state.products
);

// The products list's category catalog (dialog refactor: the edit dialog reads
// the catalog straight from the domain slice).
export const selectProductsCategories = createSelector(
  selectProductsState,
  (state): ICategory[] => state.categories
);

export const selectProductsListSearchResult = createSelector(
  selectProductsState,
  selectGroceriesState,
  (listState, lists): IGrocerySearchResult<IProduct> | undefined =>
    filterBySearchQuery(lists, listState)
);

export const selectProductListItems = createSelector(
  selectProductsState,
  selectProductsListSearchResult,
  (state: IProductsState, result): IProduct[] | undefined =>
    filterAndSortItemList(state, result)
);

// Count of catalog products for the deck's CATALOG tile.
export const selectProductCount = createSelector(
  selectProductsState,
  (state) => state?.items.length ?? 0
);
