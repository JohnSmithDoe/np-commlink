import { createSelector } from '@ngrx/store';
import { IProduct } from '../../model/grocery-list.types';
import { IRecipe, IRecipeMatch, IRecipesState } from '../../model/recipe.types';
import { rankRecipesByMissing } from '../../util/recipe-match.utils';
import { selectGroceriesState } from './groceries.selector';
import { selectProductsState } from './products.selector';
import { selectStorageState } from './storage.selector';

export const selectRecipesState = createSelector(
  selectGroceriesState,
  (state): IRecipesState => state.recipes
);

export const selectRecipes = createSelector(
  selectRecipesState,
  (state): IRecipe[] => state?.items ?? []
);

/**
 * The catalog the ingredient picker offers, alphabetical. Read straight off the
 * products slice rather than through `selectProductListItems`, which applies the
 * products PAGE's own search/sort/filter view-state — irrelevant here and a
 * surprise waiting to happen (a filter left on that page would shrink the
 * picker).
 */
export const selectRecipeIngredientCatalog = createSelector(
  selectProductsState,
  (products): IProduct[] =>
    (products?.items ?? []).toSorted((a, b) => a.name.localeCompare(b.name))
);

/**
 * The headline read: every recipe with the ingredients it lacks, cookable-first.
 * This is the cross-slice join that makes the recipe book a feature of the
 * grocery domain rather than a sealed one of its own — it reads `products` (to
 * resolve ingredient references) and `storage` (to answer "do I have it") as
 * siblings.
 */
export const selectRecipeMatches = createSelector(
  selectRecipes,
  selectProductsState,
  selectStorageState,
  (recipes, products, storage): IRecipeMatch[] =>
    rankRecipesByMissing(recipes, products?.items ?? [], storage?.items ?? [])
);

// Recipe count for the deck's SOYKAF tile — what flips it standby->online.
export const selectRecipeCount = createSelector(
  selectRecipesState,
  (state) => state?.items.length ?? 0
);
