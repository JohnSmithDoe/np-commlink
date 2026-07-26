import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonContent,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { restaurantOutline } from 'ionicons/icons';
import { IRecipe } from '../../model/recipe.types';
import { RecipesFacade } from '../../data';
import { ItemListEmptyComponent } from '../../../@shared/ui/base-item/item-list-empty/item-list-empty.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { EditRecipeDialogComponent } from '../edit-recipe-dialog/edit-recipe-dialog.component';

/**
 * SOYKAF — the recipe book. The page IS the matcher: rows come pre-ranked by how
 * many ingredients storage is missing (cookable first), which is why it does not
 * ride the shared `ListPageComponent` — its rows carry a match verdict, not a
 * name and a swipe.
 */
@Component({
  selector: 'app-page-recipes',
  templateUrl: './recipes.page.html',
  styleUrl: './recipes.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonNote,
    TranslateModule,
    ItemListEmptyComponent,
    PageHeaderComponent,
    EditRecipeDialogComponent,
  ],
})
export class RecipesPage {
  readonly facade = inject(RecipesFacade);

  constructor() {
    addIcons({ restaurantOutline });
  }

  edit(recipe: IRecipe) {
    this.facade.showEditDialog(recipe);
  }

  remove(recipe: IRecipe) {
    this.facade.removeRecipe(recipe);
  }
}
