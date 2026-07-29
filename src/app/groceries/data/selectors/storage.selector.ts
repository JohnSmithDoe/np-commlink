import { createSelector } from '@ngrx/store';
import { IStorageItem, IStorageState } from '../../model/grocery-list.types';
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

/**
 * Every row the storage list holds, unfiltered.
 *
 * Deliberately NOT the page's view: `selectListItems` applies the storage PAGE's
 * search query and category filter, so reading that where the whole aggregate is
 * meant makes the answer depend on what the user last typed. The edit dialog's
 * duplicate-name rule is exactly such a reader — a search term left in the box
 * would shrink the sibling set and let a duplicate through.
 */
export const selectStorageItems = createSelector(
  selectStorageState,
  (state: IStorageState): IStorageItem[] => state?.items ?? []
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
