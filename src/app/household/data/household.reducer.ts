/* ─── why ─────────────────────────────────────────────────────────
 * `removeItem`/`updateItem` live only in `catalogCascade`: deleting or
 * renaming a category is not a categories-slice operation, because the
 * refs live on three other slices and all four move together. One writer
 * per action, and it is the half that can see every slice.
 *
 * Unlike cash's and trackplay's, this cascade is order-TOLERANT, so a
 * duplicated handler would corrupt nothing today — it would only give the
 * catalog two writers, and make the next change to `renameInCatalog`'s
 * merge detection the one that breaks.
 *
 * `withEveryItemList` skips `recipes` on purpose: nothing assigns them a
 * category and their ingredients are filed by `productId`, so a catalog
 * delete leaves no dangling ref. Give recipes a category axis and this
 * gains a fourth line.
 * ───────────────────────────────────────────────────────────────── */
import { Action, combineReducers, createReducer, on } from '@ngrx/store';
import { BaseItem } from '../../@shared/model/base-item.types';
import { HouseholdState } from '../model/household.types';
import { HouseholdActions } from './household.actions';
import {
  addToCatalog,
  dropCategoryRef,
  restoreCategoryRef,
  remapCategoryRef,
  removeFromCatalog,
  renameInCatalog,
} from '../../@shared/util/categories/category-list.utils';
import { HouseholdCategoriesActions } from './categories/household-categories.actions';
import { householdCategoriesReducer } from './categories/household-categories.reducer';
import { listSettingsReducer } from './list-settings/list-settings.reducer';
import { productsReducer } from './products/products.reducer';
import { recipesReducer } from './recipes/recipes.reducer';
import { shoppingReducer } from './shopping/shopping.reducer';
import { storageReducer } from './storage/storage.reducer';

const perAggregate = combineReducers<HouseholdState>({
  storage: storageReducer,
  products: productsReducer,
  shopping: shoppingReducer,
  recipes: recipesReducer,
  listSettings: listSettingsReducer,
  categories: householdCategoriesReducer,
});

const withEveryItemList = (
  state: HouseholdState,
  fix: <T extends BaseItem>(items: readonly T[]) => T[]
): HouseholdState => ({
  ...state,
  storage: { ...state.storage, items: fix(state.storage.items) },
  products: { ...state.products, items: fix(state.products.items) },
  shopping: { ...state.shopping, items: fix(state.shopping.items) },
});

// prettier-ignore
const catalogCascade = createReducer(
  {} as HouseholdState,

  on(HouseholdCategoriesActions.removeItem, (state, { item }): HouseholdState => ({
    ...withEveryItemList(state, (items) => dropCategoryRef(items, item.id)),
    categories: removeFromCatalog(state.categories, item.id),
  })),

  on(HouseholdActions.restoreCategory, (state, { category, tagged }): HouseholdState => {
    const ids = new Set(tagged);
    return {
      ...withEveryItemList(state, (items) => restoreCategoryRef(items, category.id, ids)),
      categories: addToCatalog(state.categories, category),
    };
  }),

  on(HouseholdCategoriesActions.updateItem, (state, { item }): HouseholdState => {
    const { catalog, mergedInto } = renameInCatalog(state.categories, item.id, item.name ?? '');
    const next = mergedInto
      ? withEveryItemList(state, (items) => remapCategoryRef(items, item.id, mergedInto))
      : state;
    return { ...next, categories: catalog };
  })
);

export const householdReducer = (
  state: HouseholdState | undefined,
  action: Action
): HouseholdState => catalogCascade(perAggregate(state, action), action);
