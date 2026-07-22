import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Action } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { ICategory, TCategoryId } from '../../../@shared/types';
import { BaseCategoryEditItemDialog } from '../../../@shared/feature/edit-item-dialog/base-edit-item-dialog';
import { IShoppingItem } from '../../model';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import {
  GroceryCategoriesActions,
  selectEditShoppingItem,
  selectShoppingCategories,
  selectShoppingState,
  ShoppingActions,
} from '../../data';

/**
 * Shopping edit-dialog wrapper (type:feature). Supplies the shopping list's
 * selectors + save/category actions to the shared `BaseCategoryEditItemDialog`
 * and adds the one shopping-specific field (quantity).
 */
@Component({
  selector: 'app-edit-shopping-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-shopping-item-dialog.component.html',
  styleUrl: './edit-shopping-item-dialog.component.scss',
})
export class EditShoppingItemDialogComponent extends BaseCategoryEditItemDialog<IShoppingItem> {
  protected readonly listId = '_shopping' as const;
  readonly seedItem = this.store.selectSignal(selectEditShoppingItem);
  readonly categories = this.store.selectSignal(selectShoppingCategories);
  readonly #shopping = this.store.selectSignal(selectShoppingState);
  readonly listItems = computed(() => this.#shopping()?.items ?? null);

  protected save(item: IShoppingItem): Action {
    return ShoppingActions.addOrUpdateItem(item);
  }
  protected addCategoryAction(category: ICategory): Action {
    return GroceryCategoriesActions.add(category);
  }
  protected removeCategoryAction(categoryId: TCategoryId): Action {
    return GroceryCategoriesActions.remove(categoryId);
  }
  protected renameCategoryAction(id: TCategoryId, to: string): Action {
    return GroceryCategoriesActions.rename(id, to);
  }

  updateQuantity(value: number) {
    this.patch({ quantity: value });
  }
}
