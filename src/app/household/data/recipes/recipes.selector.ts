import { createSelector } from '@ngrx/store';
import { Product } from '../../model/household-list.types';
import { Recipe, RecipeMatch, RecipesState } from '../../model/recipe.types';
import { rankRecipesByMissing } from '../../util/recipe-match.utils';
import { selectHouseholdState } from '../household.selector';
import { selectProductsState } from '../products/products.selector';
import { selectStorageState } from '../storage/storage.selector';

const selectRecipesState = createSelector(
  selectHouseholdState,
  (state): RecipesState => state.recipes
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

export const selectRecipeCount = createSelector(
  selectRecipesState,
  (state) => state?.items.length ?? 0
);
