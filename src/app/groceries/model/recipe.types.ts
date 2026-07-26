import { IBaseItem } from '../../@shared/model/base-item.types';
import { ICategory } from '../../@shared/model/category.types';
import { IItemList, TItemListMode } from '../../@shared/model/item-list.types';
import { TItemUnit } from './grocery-list.types';

// The recipe book (SOYKAF) — an aggregate of this context rather than a domain of
// its own: a recipe is expressed in the grocery vocabulary (its ingredients ARE
// catalog products, "do I have it" IS storage), so it reads its siblings via
// `sameTag`.

export const RECIPES_LIST_ID = '_recipes';

/**
 * One ingredient line: a REFERENCE to a catalog product plus the amount the
 * recipe consumes. The unit rides on the line, not on the product, because a
 * product is bought by package but cooked by measure — milk comes in bottles,
 * the recipe wants 250 ml.
 */
export interface IRecipeIngredient {
  id: string;
  productId: string;
  amount: number;
  unit: TItemUnit;
}

export interface IRecipe extends IBaseItem {
  ingredients: IRecipeIngredient[];
  steps: string;
  servings: number;
  prepMinutes: number;
}

export type TRecipesList = IItemList<IRecipe> & {
  id: typeof RECIPES_LIST_ID;
  title: 'Recipes';
  categories: ICategory[];
  mode: TItemListMode;
};

export type IRecipesState = Readonly<TRecipesList>;

/**
 * The matcher read-model — the headline surface: a recipe plus the ingredient
 * product names that are not in storage. Empty `missing` = cookable right now.
 */
export interface IRecipeMatch {
  recipe: IRecipe;
  missing: string[];
}
