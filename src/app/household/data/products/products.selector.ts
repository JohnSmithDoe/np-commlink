import { createSelector } from '@ngrx/store';
import { Product, ProductsState } from '../../model/household-list.types';
import { selectHouseholdState } from '../household.selector';

export const selectProductsState = createSelector(
  selectHouseholdState,
  (state): ProductsState => state.products
);

export const selectProductItems = createSelector(
  selectProductsState,
  (state: ProductsState): Product[] => state?.items ?? []
);

export const selectProductCount = createSelector(
  selectProductsState,
  (state) => state?.items.length ?? 0
);
