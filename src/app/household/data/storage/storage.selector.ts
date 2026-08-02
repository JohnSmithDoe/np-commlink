import { createSelector } from '@ngrx/store';
import { StorageItem, StorageState } from '../../model/household-list.types';
import { selectHouseholdState } from '../household.selector';

export const selectStorageState = createSelector(
  selectHouseholdState,
  (state): StorageState => state.storage
);

export const selectStorageItems = createSelector(
  selectStorageState,
  (state: StorageState): StorageItem[] => state?.items ?? []
);

export const selectLowStockCount = createSelector(
  selectStorageState,
  (state) =>
    state?.items.filter(
      (item) => item.minAmount != undefined && item.quantity < item.minAmount
    ).length ?? 0
);
