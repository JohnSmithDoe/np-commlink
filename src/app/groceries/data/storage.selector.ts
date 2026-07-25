import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ICategory } from '../../@shared/model/types';
import { IGrocerySearchResult, IStorageItem, IStorageState } from '../model';
import {
  filterAndSortItemList,
  filterBySearchQuery,
  selectGroceryLists,
} from './grocery-list/grocery-list.selector';

export const selectStorageState =
  createFeatureSelector<IStorageState>('storage');

// The storage list's category catalog (dialog refactor: the edit dialog reads
// the catalog straight from the domain slice instead of the shared
// category working-copy).
export const selectStorageCategories = createSelector(
  selectStorageState,
  (state): ICategory[] => state.categories
);

export const selectStorageListSearchResult = createSelector(
  selectStorageState,
  selectGroceryLists,
  (listState, lists): IGrocerySearchResult<IStorageItem> | undefined =>
    filterBySearchQuery(lists, listState)
);

export const selectStorageListItems = createSelector(
  selectStorageState,
  selectStorageListSearchResult,
  (state: IStorageState, result): IStorageItem[] | undefined =>
    filterAndSortItemList(state, result)
);
