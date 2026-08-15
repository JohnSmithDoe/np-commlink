/* ─── why ─────────────────────────────────────────────────────────
 * Moving an item between the three lists is not the list page's job, and
 * the callers proved it: a product dialog injected the page facade purely
 * to reach one method, and had no business depending on a search box and
 * a sort toolbar.
 *
 * Read the method names as SOURCE, not target: `addProduct` is "the user
 * picked a Product, put it in the list they are on". Each map is keyed by
 * destination, and `Exclude<HouseholdListId, TOwnList>` is what makes a
 * list's own id absent — storage into storage is not a missing case, it
 * is a key that cannot be written. `addProductToList` names its target
 * because the dialog can add to a list the user is not on.
 *
 * `#toList` no-ops on an unknown target rather than throwing: the lookup
 * is `Partial` by construction, so a same-list copy is silently correct.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { ItemListId } from '../../../@shared/model/item-list.types';
import {
  HouseholdListId,
  Product,
  ShoppingItem,
  StorageItem,
} from '../../model/household-list.types';
import { ProductsActions } from '../products/products.actions';
import { ShoppingActions } from '../shopping/shopping.actions';
import { StorageActions } from '../storage/storage.actions';
import { selectActiveHouseholdListId } from './household-list.selector';

type CopyTargets<TOwnList extends HouseholdListId, TItem> = Record<
  Exclude<HouseholdListId, TOwnList>,
  (item: TItem) => Action
>;

type CopyTargetLookup<TItem> = Partial<
  Record<ItemListId, (item: TItem) => Action>
>;

const PRODUCT_COPY_TARGETS: CopyTargets<'_products', Product> = {
  _storage: StorageActions.addProduct,
  _shopping: ShoppingActions.addProduct,
};

const STORAGE_COPY_TARGETS: CopyTargets<'_storage', StorageItem> = {
  _products: ProductsActions.addStorageItem,
  _shopping: ShoppingActions.addStorageItem,
};

const SHOPPING_COPY_TARGETS: CopyTargets<'_shopping', ShoppingItem> = {
  _storage: StorageActions.addShoppingItem,
  _products: ProductsActions.addShoppingItem,
};

@Injectable({ providedIn: 'root' })
export class HouseholdCopyService {
  readonly #store = inject(Store);
  readonly #activeListId = this.#store.selectSignal(
    selectActiveHouseholdListId
  );

  addProduct(item: Product): void {
    this.#toActiveList(item, PRODUCT_COPY_TARGETS);
  }

  addStorageItem(item: StorageItem): void {
    this.#toActiveList(item, STORAGE_COPY_TARGETS);
  }

  addShoppingItem(item: ShoppingItem): void {
    this.#toActiveList(item, SHOPPING_COPY_TARGETS);
  }

  addProductToList(target: ItemListId, product: Product): void {
    this.#toList(target, product, PRODUCT_COPY_TARGETS);
  }

  #toActiveList<TItem>(item: TItem, targets: CopyTargetLookup<TItem>): void {
    this.#toList(this.#activeListId(), item, targets);
  }

  #toList<TItem>(
    target: ItemListId,
    item: TItem,
    targets: CopyTargetLookup<TItem>
  ): void {
    const toAction = targets[target];
    if (toAction) this.#store.dispatch(toAction(item));
  }
}
