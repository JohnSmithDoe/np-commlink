import { Action, combineReducers, createReducer, on } from '@ngrx/store';
import { HouseholdState } from '../model/household.types';
import {
  dropCategoryRef,
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
  fix: <T extends { id: string; name: string; categoryIds?: string[] }>(
    items: readonly T[]
  ) => T[]
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
