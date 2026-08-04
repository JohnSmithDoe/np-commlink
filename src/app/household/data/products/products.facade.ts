import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { PRODUCTS_LIST_ID, Product } from '../../model/household-list.types';
import { ProductsActions } from './products.actions';
import { selectProductItems } from './products.selector';

@Injectable({ providedIn: 'root' })
export class ProductsFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly allItems = this.#store.selectSignal(selectProductItems);

  showEditDialog(item: Product): void {
    this.#dialogs.open({ item, listId: PRODUCTS_LIST_ID, editMode: 'update' });
  }

  removeItem(item: Product): void {
    this.#store.dispatch(ProductsActions.removeItem(item));
  }

  saveItem(item: Product): void {
    this.#store.dispatch(ProductsActions.addOrUpdateItem(item));
  }
}
