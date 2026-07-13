import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  IAppState,
  IProduct,
  IProductsState,
  ISearchResult,
} from '../../@shared/types';
import {
  filterAndSortItemList,
  filterBySearchQuery,
} from './grocery-list/grocery-list.selector';

export const selectProductsState =
  createFeatureSelector<IProductsState>('products');

export const selectProductsListSearchResult = createSelector(
  selectProductsState,
  (state: IAppState) => state,
  (listState, state): ISearchResult<IProduct> | undefined =>
    filterBySearchQuery(state, listState)
);

export const selectProductListItems = createSelector(
  selectProductsState,
  selectProductsListSearchResult,
  (state: IProductsState, result): IProduct[] | undefined =>
    filterAndSortItemList(state, result)
);
