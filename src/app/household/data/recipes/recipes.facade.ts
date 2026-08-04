import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { Recipe, RECIPES_LIST_ID } from '../../model/recipe.types';
import { createRecipe } from '../../util/household.factory';
import { RecipesActions } from './recipes.actions';
import {
  selectRecipeIngredientCatalog,
  selectRecipeMatches,
  selectRecipes,
} from './recipes.selector';

@Injectable({ providedIn: 'root' })
export class RecipesFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly matches = this.#store.selectSignal(selectRecipeMatches);
  readonly allItems = this.#store.selectSignal(selectRecipes);
  readonly ingredientCatalog = this.#store.selectSignal(
    selectRecipeIngredientCatalog
  );

  readonly cookableCount = computed(
    () => this.matches().filter((match) => match.missing.length === 0).length
  );

  showCreateDialog(): void {
    this.#dialogs.open({
      item: createRecipe(''),
      listId: RECIPES_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: Recipe): void {
    this.#dialogs.open({
      item,
      listId: RECIPES_LIST_ID,
      editMode: 'update',
    });
  }

  saveItem(item: Recipe): void {
    const isKnown = this.allItems().some(({ id }) => id === item.id);
    this.#store.dispatch(
      isKnown ? RecipesActions.updateItem(item) : RecipesActions.addItem(item)
    );
  }

  removeItem(item: Recipe): void {
    this.#store.dispatch(RecipesActions.removeItem(item));
  }
}
