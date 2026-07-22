import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Action } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { ICategory, TCategoryId } from '../../../@shared/types';
import { BaseCategoryEditItemDialog } from '../../../@shared/feature/edit-item-dialog/base-edit-item-dialog';
import { IStorageItem } from '../../model';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import {
  GroceryCategoriesActions,
  selectEditStorageItem,
  selectStorageCategories,
  selectStorageListItems,
  StorageActions,
} from '../../data';

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
export class EditStorageItemDialogComponent extends BaseCategoryEditItemDialog<IStorageItem> {
  protected readonly listId = '_storage' as const;
  readonly seedItem = this.store.selectSignal(selectEditStorageItem);
  readonly categories = this.store.selectSignal(selectStorageCategories);
  readonly listItems = this.store.selectSignal(selectStorageListItems);

  protected save(item: IStorageItem): Action {
    return StorageActions.addOrUpdateItem(item);
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

  updateBestBefore(value: string | undefined) {
    this.patch({ bestBefore: value });
  }

  updateMinAmount(value: number) {
    this.patch({ minAmount: value });
  }
}
