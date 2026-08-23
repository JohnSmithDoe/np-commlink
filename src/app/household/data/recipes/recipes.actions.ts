import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { Recipe } from '../../model/recipe.types';

export const RecipesActions = createActionGroup({
  source: 'Recipes',
  events: createItemListActionEvents<Recipe>(),
});
