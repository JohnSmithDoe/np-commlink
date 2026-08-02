import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/util/item-lists/item-dialog.service';
import { STORAGE_LIST_ID, StorageItem } from '../../model/household-list.types';
import { withQuantityChangedBy } from '../../util/household.factory';
import { StorageActions } from './storage.actions';
import { selectStorageItems } from './storage.selector';

@Injectable({ providedIn: 'root' })
export class StorageFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly allItems = this.#store.selectSignal(selectStorageItems);

  showEditDialog(item: StorageItem): void {
    this.#dialogs.open({ item, listId: STORAGE_LIST_ID, editMode: 'update' });
  }

  removeItem(item: StorageItem): void {
    this.#store.dispatch(StorageActions.removeItem(item));
  }

  changeQuantity(item: StorageItem, diff: number): void {
    this.#store.dispatch(
      StorageActions.updateItem(withQuantityChangedBy(item, diff))
    );
  }

  copyToShoppingList(item: StorageItem): void {
    this.#store.dispatch(StorageActions.copyToShoppinglist(item));
  }

  saveItem(item: StorageItem): void {
    this.#store.dispatch(StorageActions.addOrUpdateItem(item));
  }
}
