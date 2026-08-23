import { pushUndoOnDelete } from '../../../@shared/data/item-lists/item-list.effects.factory';
import { RecipesActions } from './recipes.actions';

export const recipesListEffects = {
  undoDelete$: pushUndoOnDelete(
    RecipesActions.removeItem,
    RecipesActions.addItem
  ),
};
