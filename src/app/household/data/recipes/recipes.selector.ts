/* ─── why ─────────────────────────────────────────────────────────
 * A recipe book is RANKED before it is sorted: `rankRecipesByMissing`
 * answers "what can I cook right now", which no field on a `Recipe` can.
 * So the ranking is a sort MODE rather than a pinned order — it is the
 * default and it is reachable again from the toolbar, where a pinned
 * order would have been a one-way door out of the page's whole point.
 * ───────────────────────────────────────────────────────────────── */

import { createSelector } from '@ngrx/store';
import { SearchResult } from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { Product } from '../../model/household-list.types';
import {
  Recipe,
  RECIPE_RANK_SORT,
  RecipeMatch,
  RecipesState,
} from '../../model/recipe.types';
import { rankRecipesByMissing } from '../../util/recipe-match.utils';
import { selectHouseholdState } from '../household.selector';
import { selectProductsState } from '../products/products.selector';
import { selectStorageState } from '../storage/storage.selector';

export const selectRecipesState = createSelector(
  selectHouseholdState,
  (state): RecipesState | undefined => state?.recipes
);

export const selectRecipes = createSelector(
  selectRecipesState,
  (state): Recipe[] => state?.items ?? []
);

export const selectRecipeIngredientCatalog = createSelector(
  selectProductsState,
  (products): Product[] =>
    (products?.items ?? []).toSorted((a, b) => a.name.localeCompare(b.name))
);

export const selectRecipeMatches = createSelector(
  selectRecipes,
  selectProductsState,
  selectStorageState,
  (recipes, products, storage): RecipeMatch[] =>
    rankRecipesByMissing(recipes, products?.items ?? [], storage?.items ?? [])
);

export const selectRecipesSearchResult = createSelector(
  selectRecipesState,
  (state): SearchResult<Recipe> | undefined =>
    state ? filterListBySearchQuery(state) : undefined
);

const ranked = (
  matches: readonly RecipeMatch[],
  result: SearchResult<Recipe> | undefined,
  descending: boolean
): Recipe[] => {
  const visible = result && new Set(result.listItems.map((item) => item.id));
  const recipes = matches
    .filter((match) => !visible || visible.has(match.recipe.id))
    .map((match) => match.recipe);
  return descending ? recipes.toReversed() : recipes;
};

export const selectRecipesListItems = createSelector(
  selectRecipesState,
  selectRecipesSearchResult,
  selectRecipeMatches,
  (state, result, matches): Recipe[] => {
    const sort = state?.sort;
    return state && sort && sort.sortBy !== RECIPE_RANK_SORT
      ? filterAndSortItemList(state, result)
      : ranked(matches, result, sort?.sortDirection === 'desc');
  }
);

export const selectRecipeCount = createSelector(
  selectRecipesState,
  (state) => state?.items.length ?? 0
);
