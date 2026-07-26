import { createActionGroup } from '@ngrx/store';
import { IRecipe } from '../../model/recipe.types';

import { TUpdateDTO } from '../../../@shared/model/base-item.types';

/**
 * The recipe book's own action surface. Deliberately NOT
 * `createItemListActionEvents<IRecipe>()`:
 * the recipes page is the matcher, not a searchable/sortable item list, so the
 * search/filter/mode/sort setters would be dead surface. It carries no
 * `load`/`loaded` of its own either — recipes are an aggregate of the one
 * `groceries` slice, so they hydrate on `[Groceries] loaded` with their siblings.
 */
export const RecipesActions = createActionGroup({
  source: 'Recipes',
  events: {
    addItem: (item: IRecipe) => ({ item }),
    removeItem: (item: IRecipe) => ({ item }),
    updateItem: (item: TUpdateDTO<IRecipe>) => ({ item }),
  },
});
