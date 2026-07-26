import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BaseGroceryEditItemDialog } from '../base-grocery-edit-item-dialog';
import { IShoppingItem, TGroceryListId } from '../../model/grocery-list.types';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';

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
export class EditShoppingItemDialogComponent extends BaseGroceryEditItemDialog<IShoppingItem> {
  protected readonly listId: TGroceryListId = '_shopping';
  readonly categories = this.facade.shoppingCategories;
  readonly listItems = this.facade.shoppingListItems;

  protected save(item: IShoppingItem): void {
    this.facade.saveShoppingItem(item);
  }

  updateQuantity(value: number) {
    this.patch({ quantity: value });
  }
}
