import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Action, Store } from '@ngrx/store';
import {
  PRODUCTS_LIST_ID,
  HouseholdListId,
  Product,
  ShoppingItem,
  StorageItem,
} from '../../model/household-list.types';
import { BarcodeScannerService } from '../../util/barcode-scanner.service';
import { ItemDialogService } from '../../../@shared/util/item-lists/item-dialog.service';
import { ListPageFacade } from '../../../@shared/util/item-lists/list-page.facade';
import {
  createHouseholdItem,
  createProduct,
} from '../../util/household.factory';
import { HouseholdListActions } from './household-list.actions';
import { ShoppingActions } from '../shopping/shopping.actions';
import { StorageActions } from '../storage/storage.actions';
import { ProductsActions } from '../products/products.actions';
import { selectHouseholdCategories } from '../categories/household-categories.selector';
import {
  selectActiveHouseholdListId,
  selectListItems,
  selectListSearchResult,
  selectListState,
} from './household-list.selector';
import { CategoryId } from '../../../@shared/model/category.types';
import {
  ItemListId,
  ItemListSortType,
} from '../../../@shared/model/item-list.types';

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
export class HouseholdListPageFacade implements ListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);
  readonly #scanner = inject(BarcodeScannerService);

  readonly showScanButton = this.#scanner.isNativePlatform;

  readonly state = this.#store.selectSignal(selectListState);
  readonly items = this.#store.selectSignal(selectListItems);
  readonly searchResult = this.#store.selectSignal(selectListSearchResult);
  readonly catalog = this.#store.selectSignal(selectHouseholdCategories);

  readonly #activeListId = this.#store.selectSignal(
    selectActiveHouseholdListId
  );

  search(term?: string): void {
    this.#store.dispatch(
      HouseholdListActions.updateSearch(this.#activeListId(), term)
    );
  }

  addItemFromSearch(): void {
    this.#store.dispatch(
      HouseholdListActions.addItemFromSearch(this.#activeListId())
    );
  }

  setSortMode(type: ItemListSortType): void {
    this.#store.dispatch(
      HouseholdListActions.updateSort(this.#activeListId(), type, 'toggle')
    );
  }

  selectCategory(categoryId?: CategoryId): void {
    this.#store.dispatch(
      HouseholdListActions.updateFilter(this.#activeListId(), categoryId)
    );
  }

  showCreateDialog(): void {
    const listId = this.#activeListId();
    const state = this.state();
    this.#dialogs.open({
      item: createHouseholdItem(
        listId,
        state?.searchQuery ?? '',
        state?.filterBy
      ),
      listId,
      editMode: 'create',
    });
  }

  manageCategories(): void {
    void this.#router.navigate(['/household/categories', this.#activeListId()]);
  }

  addProduct(item: Product): void {
    this.#copyToActiveList(item, PRODUCT_COPY_TARGETS);
  }

  addStorageItem(item: StorageItem): void {
    this.#copyToActiveList(item, STORAGE_COPY_TARGETS);
  }

  addShoppingItem(item: ShoppingItem): void {
    this.#copyToActiveList(item, SHOPPING_COPY_TARGETS);
  }

  addProductToList(target: ItemListId, product: Product): void {
    this.#copyToList(target, product, PRODUCT_COPY_TARGETS);
  }

  #copyToActiveList<TItem>(
    item: TItem,
    targets: CopyTargetLookup<TItem>
  ): void {
    this.#copyToList(this.#activeListId(), item, targets);
  }

  #copyToList<TItem>(
    target: ItemListId,
    item: TItem,
    targets: CopyTargetLookup<TItem>
  ): void {
    const toAction = targets[target];
    if (toAction) this.#store.dispatch(toAction(item));
  }

  showCreateProductDialog(): void {
    const state = this.state();
    this.#dialogs.open({
      item: createProduct(state?.searchQuery ?? '', state?.filterBy),
      listId: PRODUCTS_LIST_ID,
      addToAdditionalList: this.#activeListId(),
      editMode: 'create',
    });
  }

  async scan(): Promise<void> {
    const outcome = await this.#scanner.scanEan();
    if (outcome.ok) {
      this.#showCreateProductFromScan(outcome.ean);
      return;
    }
    if (outcome.reason !== 'cancelled' && outcome.reason !== 'unsupported') {
      this.#reportScanFailure();
    }
  }

  #reportScanFailure(): void {
    this.#store.dispatch(
      NotificationsActions.toast({
        key: marker('household.scan.error'),
        color: 'danger',
      })
    );
  }

  #showCreateProductFromScan(scannedEan: string): void {
    this.#dialogs.open({
      item: createProduct(scannedEan),
      listId: PRODUCTS_LIST_ID,
      editMode: 'create',
    });
  }
}
