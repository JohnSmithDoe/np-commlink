import { computed, inject, Injectable, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../../@shared/data/item-lists/list-page.facade.base';
import { ItemListSortOption } from '../../../@shared/model/item-list.types';
import {
  Recipe,
  RECIPE_RANK_SORT,
  RECIPES_LIST_ID,
} from '../../model/recipe.types';
import { createRecipe } from '../../util/household.factory';
import { RecipesActions } from './recipes.actions';
import {
  selectRecipeIngredientCatalog,
  selectRecipeMatches,
  selectRecipes,
  selectRecipesListItems,
  selectRecipesSearchResult,
  selectRecipesState,
} from './recipes.selector';

const SORT_OPTIONS: readonly ItemListSortOption[] = [
  {
    type: RECIPE_RANK_SORT,
    labelKey: marker('household.list-toolbar.cookable'),
  },
  { type: 'prepMinutes', labelKey: marker('household.list-toolbar.time') },
  { type: 'servings', labelKey: marker('household.list-toolbar.servings') },
];

@Injectable({ providedIn: 'root' })
export class RecipesFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectRecipesState);
  readonly items = this.#store.selectSignal(selectRecipesListItems);
  readonly searchResult = this.#store.selectSignal(selectRecipesSearchResult);
  readonly sortOptions = signal(SORT_OPTIONS);
  readonly undoScope = signal(RECIPES_LIST_ID);

  readonly matches = this.#store.selectSignal(selectRecipeMatches);
  readonly allItems = this.#store.selectSignal(selectRecipes);
  readonly ingredientCatalog = this.#store.selectSignal(
    selectRecipeIngredientCatalog
  );

  readonly cookableCount = computed(
    () => this.matches().filter((match) => match.missing.length === 0).length
  );

  protected readonly commands = itemListCommands(this.#store, {
    updateSearch: RecipesActions.updateSearch,
    updateSort: RecipesActions.updateSort,
  });

  showCreateDialog(): void {
    this.#dialogs.open({
      item: createRecipe(this.state()?.searchQuery ?? ''),
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
