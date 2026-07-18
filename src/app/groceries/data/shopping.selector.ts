import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IGrocerySearchResult, IShoppingItem, IShoppingState } from '../model';
import {
  filterBySearchQuery,
  selectGroceryLists,
} from './grocery-list/grocery-list.selector';

export const selectShoppingState =
  createFeatureSelector<IShoppingState>('shopping');

// The shopping list's category catalog (dialog refactor: the edit dialog reads
// the catalog straight from the domain slice).
export const selectShoppingCategories = createSelector(
  selectShoppingState,
  (state): string[] => state.categories
);

export const selectShoppingSearchResult = createSelector(
  selectShoppingState,
  selectGroceryLists,
  (listState, lists): IGrocerySearchResult<IShoppingItem> | undefined =>
    filterBySearchQuery(lists, listState)
);

export const selectShoppingListHasBoughtItems = createSelector(
  selectShoppingState,
  (state: IShoppingState): boolean =>
    !!state.items.find((item) => item.state === 'bought')
);
