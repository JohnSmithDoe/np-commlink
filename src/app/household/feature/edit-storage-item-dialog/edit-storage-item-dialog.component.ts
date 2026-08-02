import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StorageFacade } from '../../data';
import { BaseHouseholdEditItemDialog } from '../base-household-edit-item-dialog';
import {
  STORAGE_LIST_ID,
  HouseholdListId,
  StorageItem,
} from '../../model/household-list.types';
import { createStorageItem } from '../../util/household.factory';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';

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
export class EditStorageItemDialogComponent extends BaseHouseholdEditItemDialog<StorageItem> {
  protected blank(): StorageItem {
    return createStorageItem('');
  }

  protected readonly listId: HouseholdListId = STORAGE_LIST_ID;
  readonly #storage = inject(StorageFacade);

  readonly siblings = this.#storage.allItems;

  protected save(item: StorageItem): void {
    this.#storage.saveItem(item);
  }

  setBestBefore(value: string | null) {
    this.patch({ bestBefore: value ?? undefined });
  }

  setMinAmount(value: number) {
    this.patch({ minAmount: value });
  }
}
