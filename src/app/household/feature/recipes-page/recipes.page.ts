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
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { restaurantOutline } from 'ionicons/icons';
import { Recipe } from '../../model/recipe.types';
import { RecipesFacade } from '../../data';
import { ItemListEmptyComponent } from '../../../@shared/ui/base-item/item-list-empty/item-list-empty.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { EditRecipeDialogComponent } from '../edit-recipe-dialog/edit-recipe-dialog.component';

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
    TranslatePipe,
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

  edit(recipe: Recipe) {
    this.facade.showEditDialog(recipe);
  }

  remove(recipe: Recipe) {
    this.facade.removeItem(recipe);
  }
}
