import { createSelector } from '@ngrx/store';
import { IShoppingItem, IShoppingState } from '../../model/grocery-list.types';
import { selectGroceriesState } from '../groceries/groceries.selector';

export const selectShoppingState = createSelector(
  selectGroceriesState,
  (state): IShoppingState => state.shopping
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
