import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BaseGroceryEditItemDialog } from '../base-grocery-edit-item-dialog';
import { IStorageItem } from '../../model';
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
    TranslateModule,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    DateInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-storage-item-dialog.component.html',
  styleUrl: './edit-storage-item-dialog.component.scss',
})
export class EditStorageItemDialogComponent extends BaseGroceryEditItemDialog<IStorageItem> {
  protected readonly listId = '_storage' as const;
  readonly categories = this.facade.storageCategories;
  readonly listItems = this.facade.storageListItems;

  protected save(item: IStorageItem): void {
    this.facade.saveStorageItem(item);
  }

  updateBestBefore(value: string | undefined) {
    this.patch({ bestBefore: value });
  }

  updateMinAmount(value: number) {
    this.patch({ minAmount: value });
  }
}
