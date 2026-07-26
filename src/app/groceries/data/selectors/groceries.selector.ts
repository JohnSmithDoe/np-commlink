import { createFeatureSelector } from '@ngrx/store';
import { IGroceriesState } from '../../model/groceries.types';

// The context's single feature selector. Every aggregate selector derives its
// own base from here (`selectProductsState`, `selectShoppingState`, …), and the
// cross-list engine reads this whole state instead of recomposing the lists from
// separate feature selectors.
export const selectGroceriesState =
  createFeatureSelector<IGroceriesState>('groceries');
