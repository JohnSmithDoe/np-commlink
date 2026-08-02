import { BaseItem } from '../../@shared/model/base-item.types';
import { ItemList } from '../../@shared/model/item-list.types';
import { ItemUnit } from './household-list.types';

export const RECIPES_LIST_ID = '_recipes';

export interface RecipeIngredient {
  id: string;
  productId: string;
  amount: number;
  unit: ItemUnit;
}

export interface Recipe extends BaseItem {
  ingredients: RecipeIngredient[];
  steps: string;
  servings: number;
  prepMinutes: number;
}

type RecipesList = ItemList<Recipe> & { id: typeof RECIPES_LIST_ID };

export type RecipesState = Readonly<RecipesList>;

export interface RecipeMatch {
  recipe: Recipe;
  missing: string[];
}
