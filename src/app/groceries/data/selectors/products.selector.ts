import { createSelector } from '@ngrx/store';
import { IProduct, IProductsState } from '../../model/grocery-list.types';
import { selectGroceriesState } from './groceries.selector';

import { ICategory } from '../../../@shared/model/category.types';

export const selectProductsState = createSelector(
  selectGroceriesState,
  (state): IProductsState => state.products
);

// The products list's category catalog (dialog refactor: the edit dialog reads
// the catalog straight from the domain slice).
export const selectProductsCategories = createSelector(
  selectProductsState,
  (state): ICategory[] => state.categories
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
