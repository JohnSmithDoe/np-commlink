import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  IAppState,
  ISearchResult,
  IStorageItem,
  IStorageState,
} from '../../@shared/types';
import {
  filterAndSortItemList,
  filterBySearchQuery,
} from './grocery-list/grocery-list.selector';

export const selectStorageState =
  createFeatureSelector<IStorageState>('storage');

export const selectStorageListSearchResult = createSelector(
  selectStorageState,
  (state: IAppState) => state,
  (listState: IStorageState, state): ISearchResult<IStorageItem> | undefined =>
    filterBySearchQuery(state, listState)
);

export const selectStorageListItems = createSelector(
  selectStorageState,
  selectStorageListSearchResult,
  (state: IStorageState, result): IStorageItem[] | undefined =>
    filterAndSortItemList(state, result)
);
