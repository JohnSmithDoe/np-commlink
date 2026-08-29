import { pushUndoOnDelete } from '../../../@shared/data/item-lists/item-list.effects.factory';
import { RECIPES_LIST_ID } from '../../model/recipe.types';
import { RecipesActions } from './recipes.actions';

export const recipesListEffects = {
  undoDelete$: pushUndoOnDelete(
    RECIPES_LIST_ID,
    RecipesActions.removeItem,
    RecipesActions.addItem
  ),
};
