import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ICategory } from '../../@shared/types';
import { IGrocerySearchResult, IProduct, IProductsState } from '../model';
import {
  filterAndSortItemList,
  filterBySearchQuery,
  selectGroceryLists,
} from './grocery-list/grocery-list.selector';

export const selectProductsState =
  createFeatureSelector<IProductsState>('products');

// The products list's category catalog (dialog refactor: the edit dialog reads
// the catalog straight from the domain slice).
export const selectProductsCategories = createSelector(
  selectProductsState,
  (state): ICategory[] => state.categories
);

export const selectProductsListSearchResult = createSelector(
  selectProductsState,
  selectGroceryLists,
  (listState, lists): IGrocerySearchResult<IProduct> | undefined =>
    filterBySearchQuery(lists, listState)
);

export const selectProductListItems = createSelector(
  selectProductsState,
  selectProductsListSearchResult,
  (state: IProductsState, result): IProduct[] | undefined =>
    filterAndSortItemList(state, result)
);
