import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  IonItem,
  IonSelect,
  IonSelectOption,
  IonText,
  IonToggle,
  SelectCustomEvent,
  ToggleCustomEvent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import {
  IProduct,
  TBestBeforeTimespan,
  TGroceryListId,
} from '../../model/grocery-list.types';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { BaseGroceryEditItemDialog } from '../base-grocery-edit-item-dialog';

/**
 * Product edit-dialog wrapper (type:feature). Adds the product-only best-before
 * defaults, and preserves the "create & add to another list" flow: when the
 * open-command carries `addToAdditionalList` (set by
 * showCreateAndAddProductDialog from the storage/shopping pages), saving also
 * pushes the product onto that sibling list.
 */
@Component({
  selector: 'app-edit-product-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonItem,
    TranslateModule,
    IonSelect,
    IonSelectOption,
    IonText,
    IonToggle,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-product-dialog.component.html',
  styleUrl: './edit-product-dialog.component.scss',
})
export class EditProductDialogComponent extends BaseGroceryEditItemDialog<IProduct> {
  protected readonly listId: TGroceryListId = '_products';
  readonly categories = this.facade.productsCategories;
  readonly listItems = this.facade.productListItems;

  protected save(item: IProduct): void {
    this.facade.saveProduct(item);
    // Create-and-add-to-another-list flow: also push onto the sibling list the
    // user was on when they opened the quick-create product dialog.
    const additional = this.addToAdditionalList();
    if (additional === '_storage') {
      this.facade.addProductToStorage(item);
    } else if (additional === '_shopping') {
      this.facade.addProductToShopping(item);
    }
  }

  setBestBeforeTimespan(event: SelectCustomEvent<TBestBeforeTimespan>) {
    this.patch({
      bestBeforeTimespan: event.detail.value,
      bestBeforeTimevalue: event.detail.value === 'forever' ? undefined : 1,
    });
  }

  setBestBeforeTimevalue(value: number) {
    this.patch({ bestBeforeTimevalue: value });
  }

  // Pantry staple: excluded from the recipe matcher's missing count, because
  // salt and oil are never tracked in storage the way milk is.
  setAlwaysOnHand(event: ToggleCustomEvent) {
    this.patch({ alwaysOnHand: event.detail.checked });
  }
}
