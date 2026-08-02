import { createActionGroup } from '@ngrx/store';
import { Recipe } from '../../model/recipe.types';

import { UpdateDTO } from '../../../@shared/model/base-item.types';

export const RecipesActions = createActionGroup({
  source: 'Recipes',
  events: {
    addItem: (item: Recipe) => ({ item }),
    removeItem: (item: Recipe) => ({ item }),
    updateItem: (item: UpdateDTO<Recipe>) => ({ item }),
  },
});
