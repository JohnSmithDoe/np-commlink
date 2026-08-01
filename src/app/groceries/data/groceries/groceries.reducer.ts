import { Action, combineReducers, createReducer, on } from '@ngrx/store';
import { IGroceriesState } from '../../model/groceries.types';
import {
  dropCategoryRef,
  remapCategoryRef,
  removeFromCatalog,
  renameInCatalog,
} from '../../../@shared/util/categories/category-list.utils';
import { GroceryCategoriesActions } from '../categories/grocery-categories.actions';
import { groceryCategoriesReducer } from '../categories/grocery-categories.reducer';
import { listSettingsReducer } from '../list-settings/list-settings.reducer';
import { productsReducer } from '../products/products.reducer';
import { recipesReducer } from '../recipes/recipes.reducer';
import { shoppingReducer } from '../shopping/shopping.reducer';
import { storageReducer } from '../storage/storage.reducer';

// One reducer per aggregate: each keeps its own action surface and its own
// `[Groceries] loaded` handler, so collapsing the four slices into one changed no
// aggregate's logic.
const perAggregate = combineReducers<IGroceriesState>({
  storage: storageReducer,
  products: productsReducer,
  shopping: shoppingReducer,
  recipes: recipesReducer,
  listSettings: listSettingsReducer,
  categories: groceryCategoriesReducer,
});

/**
 * The two catalog edits that reach past the catalog.
 *
 * They live here rather than in `groceryCategoriesReducer` because
 * `combineReducers` shows each aggregate only its own slice, and a SHARED
 * catalog's delete and merge are by definition cross-aggregate: the ids live in
 * the three item lists. One catalog is what makes this the only code that has to
 * know there are three of them — before, each list reducer fixed up its own copy.
 */
const withEveryItemList = (
  state: IGroceriesState,
  fix: <T extends { id: string; name: string; categoryIds?: string[] }>(
    items: readonly T[]
  ) => T[]
): IGroceriesState => ({
  ...state,
  storage: { ...state.storage, items: fix(state.storage.items) },
  products: { ...state.products, items: fix(state.products.items) },
  shopping: { ...state.shopping, items: fix(state.shopping.items) },
});

// prettier-ignore
const catalogCascade = createReducer(
  {} as IGroceriesState,

  // Deleting a category leaves every row that referenced it uncategorized.
  on(GroceryCategoriesActions.removeItem, (state, { item }): IGroceriesState => ({
    ...withEveryItemList(state, (items) => dropCategoryRef(items, item.id)),
    categories: removeFromCatalog(state.categories, item.id),
  })),

  // A plain rename touches no row — they reference by id. Only a merge does, and
  // `renameInCatalog` is what reports one, so nothing has to be inferred.
  on(GroceryCategoriesActions.updateItem, (state, { item }): IGroceriesState => {
    const { catalog, mergedInto } = renameInCatalog(state.categories, item.id, item.name ?? '');
    const next = mergedInto
      ? withEveryItemList(state, (items) => remapCategoryRef(items, item.id, mergedInto))
      : state;
    return { ...next, categories: catalog };
  })
);

export const groceriesReducer = (
  state: IGroceriesState | undefined,
  action: Action
): IGroceriesState => catalogCascade(perAggregate(state, action), action);
