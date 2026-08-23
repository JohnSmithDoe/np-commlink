import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { IonNote } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, remove, restaurantOutline } from 'ionicons/icons';
import { Recipe } from '../../model/recipe.types';
import { RecipesFacade } from '../../data';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { EditRecipeDialogComponent } from '../edit-recipe-dialog/edit-recipe-dialog.component';

@Component({
  selector: 'app-page-recipes',
  templateUrl: './recipes.page.html',
  styleUrl: './recipes.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonNote,
    TranslatePipe,
    ListPageComponent,
    ListItemComponent,
    EditRecipeDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: RecipesFacade }],
})
export class RecipesPage {
  readonly facade = inject(RecipesFacade);

  readonly #missingByRecipe = computed(
    () =>
      new Map(
        this.facade.matches().map((match) => [match.recipe.id, match.missing])
      )
  );

  constructor() {
    addIcons({ add, remove, restaurantOutline });
  }

  missing(recipe: Recipe): string[] {
    return this.#missingByRecipe().get(recipe.id) ?? [];
  }

  edit(recipe: Recipe) {
    this.facade.showEditDialog(recipe);
  }

  remove(recipe: Recipe) {
    this.facade.removeItem(recipe);
  }
}
