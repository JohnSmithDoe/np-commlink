import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/util/item-lists/item-dialog.service';
import {
  SHOPPING_LIST_ID,
  ShoppingItem,
} from '../../model/household-list.types';
import { withQuantityChangedBy } from '../../util/household.factory';
import { ShoppingActions } from './shopping.actions';
import {
  selectShoppingItems,
  selectShoppingListHasBoughtItems,
  selectShoppingState,
} from './shopping.selector';

@Injectable({ providedIn: 'root' })
export class ShoppingFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectShoppingState);
  readonly hasBoughtItems = this.#store.selectSignal(
    selectShoppingListHasBoughtItems
  );
  readonly allItems = this.#store.selectSignal(selectShoppingItems);

  showEditDialog(item: ShoppingItem): void {
    this.#dialogs.open({ item, listId: SHOPPING_LIST_ID, editMode: 'update' });
  }

  removeItem(item: ShoppingItem): void {
    this.#store.dispatch(ShoppingActions.removeItem(item));
  }

  changeQuantity(item: ShoppingItem, diff: number): void {
    this.#store.dispatch(
      ShoppingActions.updateItem(withQuantityChangedBy(item, diff))
    );
  }

  buyItem(item: ShoppingItem): void {
    this.#store.dispatch(ShoppingActions.buyItem(item));
  }

  saveItem(item: ShoppingItem): void {
    this.#store.dispatch(ShoppingActions.addOrUpdateItem(item));
  }

  openActionSheet(): void {
    this.#store.dispatch(ShoppingActions.showActionSheet());
  }

  hideActionSheet(): void {
    this.#store.dispatch(ShoppingActions.hideActionSheet());
  }

  shareList(): void {
    this.#store.dispatch(ShoppingActions.shareShoppinglist());
  }

  moveToStorage(): void {
    this.#store.dispatch(ShoppingActions.moveToStorage());
  }
}
