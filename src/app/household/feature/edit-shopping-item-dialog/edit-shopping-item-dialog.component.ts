import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ShoppingFacade } from '../../data';
import { BaseHouseholdEditItemDialog } from '../base-household-edit-item-dialog';
import {
  SHOPPING_LIST_ID,
  HouseholdListId,
  ShoppingItem,
} from '../../model/household-list.types';
import { createShoppingItem } from '../../util/household.factory';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';

@Component({
  selector: 'app-edit-shopping-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-shopping-item-dialog.component.html',
})
export class EditShoppingItemDialogComponent extends BaseHouseholdEditItemDialog<ShoppingItem> {
  protected blank(): ShoppingItem {
    return createShoppingItem('');
  }

  readonly #shopping = inject(ShoppingFacade);

  protected readonly listId: HouseholdListId = SHOPPING_LIST_ID;
  readonly siblings = this.#shopping.allItems;

  protected save(item: ShoppingItem): void {
    this.#shopping.saveItem(item);
  }

  setQuantity(value: number) {
    this.patch({ quantity: value });
  }
}
