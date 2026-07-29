import { createReducer, on } from '@ngrx/store';
import { IRecipesState, RECIPES_LIST_ID } from '../../model/recipe.types';
import {
  addListItem,
  removeListItem,
  updateListItem,
} from '../../../@shared/util/list/list.utils';
import { withoutProduct } from '../../util/recipe-match.utils';
import { GroceriesActions } from '../actions/groceries.actions';
import { ProductsActions } from '../actions/products.actions';
import { RecipesActions } from '../actions/recipes.actions';

export const initialState: IRecipesState = {
  id: RECIPES_LIST_ID,
  items: [],
  mode: 'alphabetical',
  categories: [],
};

// A product leaving the catalog strips itself from every recipe, so an
// ingredient reference can never dangle. Recipes reference products by id and
// the catalog is authoritative — the same cascade the category catalog runs.
const dropProductFromRecipes = (
  state: IRecipesState,
  productId: string
): IRecipesState => ({
  ...state,
  items: state.items.map((recipe) => withoutProduct(recipe, productId)),
});

// prettier-ignore
export const recipesReducer = createReducer(
  initialState,
  on(RecipesActions.addItem, (state, { item }): IRecipesState => addListItem(state, item)),
  on(RecipesActions.removeItem, (state, { item }): IRecipesState => removeListItem(state, item)),
  on(RecipesActions.updateItem, (state, { item }): IRecipesState => updateListItem(state, item)),
  on(ProductsActions.removeItem, (state, { item }): IRecipesState => dropProductFromRecipes(state, item.id)),

  on(GroceriesActions.loaded, (state, { data }): IRecipesState => data?.recipes ?? state)
);
