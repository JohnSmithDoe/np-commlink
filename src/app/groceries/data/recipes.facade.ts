import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../@shared/util/item-dialog.service';
import { IRecipe, RECIPES_LIST_ID } from '../model/recipe.types';
import { createRecipe } from '../util/grocery.factory';
import { RecipesActions } from './actions/recipes.actions';
import {
  selectRecipeIngredientCatalog,
  selectRecipeMatches,
  selectRecipes,
} from './selectors/recipes.selector';

/**
 * The recipe book's consumption surface — the only place `Store` is injected for
 * SOYKAF. The page reads `matches` (the ranked matcher) and the dialog reads
 * `catalog`; both dispatch exclusively through the commands below.
 */
@Injectable({ providedIn: 'root' })
export class RecipesFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly matches = this.#store.selectSignal(selectRecipeMatches);
  readonly recipes = this.#store.selectSignal(selectRecipes);
  readonly catalog = this.#store.selectSignal(selectRecipeIngredientCatalog);

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

  showEditDialog(recipe: IRecipe): void {
    this.#dialogs.open({
      item: recipe,
      listId: RECIPES_LIST_ID,
      editMode: 'update',
    });
  }

  // Add-vs-update is resolved here, synchronously, off the list signal this
  // facade already holds — the round-trip through an `addOrUpdate` action plus a
  // resolving effect buys nothing when the caller is a dialog the facade opened.
  saveRecipe(recipe: IRecipe): void {
    const isKnown = this.recipes().some(({ id }) => id === recipe.id);
    this.#store.dispatch(
      isKnown
        ? RecipesActions.updateItem(recipe)
        : RecipesActions.addItem(recipe)
    );
  }

  removeRecipe(recipe: IRecipe): void {
    this.#store.dispatch(RecipesActions.removeItem(recipe));
  }
}
