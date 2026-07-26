import { createSelector } from '@ngrx/store';
import {
  IGrocerySearchResult,
  IStorageItem,
  IStorageState,
} from '../../model/grocery-list.types';
import {
  filterAndSortItemList,
  filterBySearchQuery,
} from './grocery-list.selector';
import { selectGroceriesState } from './groceries.selector';

import { ICategory } from '../../../@shared/model/category.types';

export const selectStorageState = createSelector(
  selectGroceriesState,
  (state): IStorageState => state.storage
);

// The storage list's category catalog (dialog refactor: the edit dialog reads
// the catalog straight from the domain slice instead of the shared
// category working-copy).
export const selectStorageCategories = createSelector(
  selectStorageState,
  (state): ICategory[] => state.categories
);

export const selectStorageListSearchResult = createSelector(
  selectStorageState,
  selectGroceriesState,
  (listState, lists): IGrocerySearchResult<IStorageItem> | undefined =>
    filterBySearchQuery(lists, listState)
);

export const selectStorageListItems = createSelector(
  selectStorageState,
  selectStorageListSearchResult,
  (state: IStorageState, result): IStorageItem[] | undefined =>
    filterAndSortItemList(state, result)
);

// Count of low-stock items (below their minimum) for the deck's STASH tile.
// Mirrors the storage page's danger threshold: strictly below minAmount (equal
// is a warning, not counted).
export const selectLowStockCount = createSelector(
  selectStorageState,
  (state) =>
    state?.items.filter(
      (item) => item.minAmount != undefined && item.quantity < item.minAmount
    ).length ?? 0
);
