import { createSelector } from '@ngrx/store';
import { IProduct, IProductsState } from '../../model/grocery-list.types';
import { selectGroceriesState } from '../groceries/groceries.selector';

export const selectProductsState = createSelector(
  selectGroceriesState,
  (state): IProductsState => state.products
);

/**
 * Every product the catalog holds, unfiltered — see {@link selectStorageItems}
 * for why the page's own filtered view is the wrong read for an aggregate. The
 * ingredient picker's `selectRecipeIngredientCatalog` makes the same point.
 */
export const selectProductItems = createSelector(
  selectProductsState,
  (state: IProductsState): IProduct[] => state?.items ?? []
);

// Count of catalog products for the deck's CATALOG tile.
export const selectProductCount = createSelector(
  selectProductsState,
  (state) => state?.items.length ?? 0
);
