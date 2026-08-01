import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BaseGroceryEditItemDialog } from '../base-grocery-edit-item-dialog';
import { IStorageItem, TGroceryListId } from '../../model/grocery-list.types';
import { createStorageItem } from '../../util/grocery.factory';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';

/**
 * Storage edit-dialog wrapper (type:feature). Supplies the storage list's
 * selectors + save/category actions to the shared `BaseCategoryEditItemDialog`
 * and adds the storage-specific fields (min amount + best-before date).
 */
@Component({
  selector: 'app-edit-storage-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    DateInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-storage-item-dialog.component.html',
})
export class EditStorageItemDialogComponent extends BaseGroceryEditItemDialog<IStorageItem> {
  protected blank(): IStorageItem {
    return createStorageItem('');
  }

  protected readonly listId: TGroceryListId = '_storage';
  readonly categories = this.facade.catalog;
  readonly siblings = this.facade.storageItems;

  protected save(item: IStorageItem): void {
    this.facade.saveStorageItem(item);
  }

  updateBestBefore(value: string | null) {
    this.patch({ bestBefore: value ?? undefined });
  }

  updateMinAmount(value: number) {
    this.patch({ minAmount: value });
  }
}
