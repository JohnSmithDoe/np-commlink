import { createSelector } from '@ngrx/store';
import {
  IGrocerySearchResult,
  IShoppingItem,
  IShoppingState,
} from '../../model/grocery-list.types';
import { filterBySearchQuery } from './grocery-list.selector';
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

export const selectShoppingSearchResult = createSelector(
  selectShoppingState,
  selectGroceriesState,
  (listState, lists): IGrocerySearchResult<IShoppingItem> | undefined =>
    filterBySearchQuery(lists, listState)
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
