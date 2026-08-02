import { createSelector } from '@ngrx/store';
import { ShoppingItem, ShoppingState } from '../../model/household-list.types';
import { selectHouseholdState } from '../household.selector';

export const selectShoppingState = createSelector(
  selectHouseholdState,
  (state): ShoppingState => state.shopping
);

export const selectShoppingItems = createSelector(
  selectShoppingState,
  (state: ShoppingState): ShoppingItem[] => state?.items ?? []
);

export const selectShoppingListHasBoughtItems = createSelector(
  selectShoppingState,
  (state: ShoppingState): boolean =>
    state.items.some((item) => item.state === 'bought')
);

export const selectActiveShoppingCount = createSelector(
  selectShoppingState,
  (state) => state?.items.filter((item) => item.state === 'active').length ?? 0
);
