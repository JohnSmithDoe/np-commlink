import { combineReducers } from '@ngrx/store';
import { IGroceriesState } from '../../model/groceries.types';
import { listSettingsReducer } from './list-settings.reducer';
import { productsReducer } from './products.reducer';
import { recipesReducer } from './recipes.reducer';
import { shoppingReducer } from './shopping.reducer';
import { storageReducer } from './storage.reducer';

// The one `groceries` reducer, composed from one reducer per aggregate: each
// keeps its own action surface and its own `[Groceries] loaded` handler, so
// collapsing the four slices into one changed no aggregate's logic.
export const groceriesReducer = combineReducers<IGroceriesState>({
  storage: storageReducer,
  products: productsReducer,
  shopping: shoppingReducer,
  recipes: recipesReducer,
  listSettings: listSettingsReducer,
});
