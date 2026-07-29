import { createSelector } from '@ngrx/store';
import { IShoppingItem, IShoppingState } from '../../model/grocery-list.types';
import { selectGroceriesState } from './groceries.selector';

import { ICategory } from '../../../@shared/model/category.types';

export const selectShoppingState = createSelector(
  selectGroceriesState,
  (state): IShoppingState => state.shopping
);

// The shopping list's category catalog (dialog refactor: the edit dialog reads
// the catalog straight from the domain slice).
export const selectShoppingCategories = createSelector(
  selectShoppingState,
  (state): ICategory[] => state.categories
);

/**
 * Every row the shopping list holds, bought ones included, unfiltered — see
 * {@link selectStorageItems} for why the page's filtered view is the wrong read
 * for an aggregate.
 */
export const selectShoppingItems = createSelector(
  selectShoppingState,
  (state: IShoppingState): IShoppingItem[] => state?.items ?? []
);

export const selectShoppingListHasBoughtItems = createSelector(
  selectShoppingState,
  (state: IShoppingState): boolean =>
    state.items.some((item) => item.state === 'bought')
);

// Count of active (not-yet-bought) shopping items for the deck's MARKET tile.
export const selectActiveShoppingCount = createSelector(
  selectShoppingState,
  (state) => state?.items.filter((item) => item.state === 'active').length ?? 0
);
