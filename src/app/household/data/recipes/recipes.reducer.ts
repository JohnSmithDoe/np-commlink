import { createReducer, on } from '@ngrx/store';
import { RECIPES_LIST_ID, RecipesState } from '../../model/recipe.types';
import {
  addListItem,
  removeListItem,
  updateListItem,
} from '../../../@shared/util/item-lists/list.utils';
import { withoutProduct } from '../../util/recipe-match.utils';
import { HouseholdActions } from '../household.actions';
import { ProductsActions } from '../products/products.actions';
import { RecipesActions } from './recipes.actions';

export const initialState: RecipesState = {
  id: RECIPES_LIST_ID,
  items: [],
};

const dropProductFromRecipes = (
  state: RecipesState,
  productId: string
): RecipesState => ({
  ...state,
  items: state.items.map((recipe) => withoutProduct(recipe, productId)),
});

// prettier-ignore
export const recipesReducer = createReducer(
  initialState,
  on(RecipesActions.addItem, (state, { item }): RecipesState => addListItem(state, item)),
  on(RecipesActions.removeItem, (state, { item }): RecipesState => removeListItem(state, item)),
  on(RecipesActions.updateItem, (state, { item }): RecipesState => updateListItem(state, item)),
  on(ProductsActions.removeItem, (state, { item }): RecipesState => dropProductFromRecipes(state, item.id)),

  on(HouseholdActions.loaded, (state, { data }): RecipesState => data?.recipes ?? state)
);
