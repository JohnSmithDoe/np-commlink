import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Action, Store } from '@ngrx/store';
import {
  IProduct,
  IShoppingItem,
  IStorageItem,
  TGroceryListId,
} from '../model/grocery-list.types';
import { BarcodeScannerService } from '../util/barcode-scanner.service';
import { categoryById } from '../../@shared/util/categories/category.utils';
import { ItemDialogService } from '../../@shared/util/item-lists/item-dialog.service';
import { IListPageFacade } from '../../@shared/util/item-lists/list-page.facade';
import {
  createGroceryItem,
  createProduct,
  withQuantityChangedBy,
} from '../util/grocery.factory';
import { GroceryListActions } from './grocery-list.actions';
import { GroceryCategoriesActions } from './categories/grocery-categories.actions';
import { ShoppingActions } from './shopping/shopping.actions';
import { StorageActions } from './storage/storage.actions';
import { ProductsActions } from './products/products.actions';
import {
  selectGroceryCategories,
  selectListIdParameter,
  selectListItems,
  selectListSearchResult,
  selectListState,
} from './grocery-list.selector';
import {
  selectShoppingItems,
  selectShoppingListHasBoughtItems,
  selectShoppingState,
} from './shopping/shopping.selector';
import { selectStorageItems } from './storage/storage.selector';
import { selectProductItems } from './products/products.selector';
import {
  selectQuickAddCanAddLocal,
  selectQuickAddCanAddProduct,
  selectQuickAddState,
} from './quick-add/quick-add.selector';
import { ICategory, TCategoryId } from '../../@shared/model/category.types';
import { TItemListSortType } from '../../@shared/model/item-list.types';

/**
 * Where each cross-list suggestion lands, keyed by the list the shopper is
 * standing on. `Exclude` drops the item's OWN list: copying a product into the
 * product catalogue is not a command, and expressing that in the type is what
 * replaces the `default:` arm these three used to fall through — it returned a
 * `configurationError` action that no reducer and no effect ever handled, so the
 * invalid diagonal was a silent no-op reachable from all three pages.
 */
type TCopyTargets<TOwnList extends TGroceryListId, TItem> = Record<
  Exclude<TGroceryListId, TOwnList>,
  (item: TItem) => Action
>;

const PRODUCT_COPY_TARGETS: TCopyTargets<'_products', IProduct> = {
  _storage: StorageActions.addProduct,
  _shopping: ShoppingActions.addProduct,
};

const STORAGE_COPY_TARGETS: TCopyTargets<'_storage', IStorageItem> = {
  _products: ProductsActions.addStorageItem,
  _shopping: ShoppingActions.addStorageItem,
};

const SHOPPING_COPY_TARGETS: TCopyTargets<'_shopping', IShoppingItem> = {
  _storage: StorageActions.addShoppingItem,
  _products: ProductsActions.addShoppingItem,
};

/**
 * {@link IListPageFacade} implementation for the grocery multi-list engine. The
 * active list is derived from the `:listId` route param, so a single (root)
 * instance serves the shopping/storage/products pages. Beyond the generic
 * contract it exposes the grocery-only operations the pages wire into the
 * `[searchExtras]` cross-list buckets.
 */
@Injectable({ providedIn: 'root' })
export class GroceryListPageFacade implements IListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);
  readonly #scanner = inject(BarcodeScannerService);

  /** The camera only exists on the APK target, so the button is native-only. */
  readonly showScanButton = this.#scanner.isNativePlatform;
  readonly #listId = this.#store.selectSignal(selectListIdParameter);

  readonly state = this.#store.selectSignal(selectListState);
  readonly items = this.#store.selectSignal(selectListItems);
  readonly searchResult = this.#store.selectSignal(selectListSearchResult);
  readonly catalog = this.#store.selectSignal(selectGroceryCategories);

  // Per-list reads the grocery pages + the shopping action-sheet render.
  readonly shoppingState = this.#store.selectSignal(selectShoppingState);
  readonly shoppingHasBoughtItems = this.#store.selectSignal(
    selectShoppingListHasBoughtItems
  );
  // Quick-add derived UI state (the grocery quick-add smart-ui row).
  readonly quickAddState = this.#store.selectSignal(selectQuickAddState);
  readonly quickAddCanAddLocal = this.#store.selectSignal(
    selectQuickAddCanAddLocal
  );
  readonly quickAddCanAddProduct = this.#store.selectSignal(
    selectQuickAddCanAddProduct
  );

  // Edit-dialog reads (the shopping/storage/product edit-dialog wrappers): the
  // list's items. There used to be three catalog signals here, one per list —
  // three reads of what is now literally one list, so `catalog` above serves all
  // three wrappers. The open item itself comes off the ItemDialogService command,
  // which the shared base reads directly.
  // The whole aggregate per list, NOT `items` (the route-keyed page view): the
  // dialogs' duplicate-name rule has to see every sibling, including the ones a
  // search term or category filter is currently hiding.
  readonly storageItems = this.#store.selectSignal(selectStorageItems);
  readonly productItems = this.#store.selectSignal(selectProductItems);
  readonly shoppingItems = this.#store.selectSignal(selectShoppingItems);

  readonly #activeListId = computed<TGroceryListId>(
    () => this.#listId() ?? '_shopping'
  );

  search(term?: string): void {
    this.#store.dispatch(
      GroceryListActions.updateSearch(this.#activeListId(), term)
    );
  }

  addItemFromSearch(): void {
    this.#store.dispatch(
      GroceryListActions.addItemFromSearch(this.#activeListId())
    );
  }

  setSortMode(type: TItemListSortType): void {
    this.#store.dispatch(
      GroceryListActions.updateSort(this.#activeListId(), type, 'toggle')
    );
  }

  selectCategory(categoryId: TCategoryId): void {
    this.#store.dispatch(
      GroceryListActions.updateFilter(this.#activeListId(), categoryId)
    );
  }

  // Create seeded from whatever is in the searchbar.
  showCreateDialog(): void {
    const listId = this.#activeListId();
    const state = this.state();
    this.#dialogs.open({
      item: createGroceryItem(
        listId,
        state?.searchQuery ?? '',
        state?.filterBy
      ),
      listId,
      editMode: 'create',
    });
  }

  manageCategories(): void {
    void this.#router.navigate(['/groceries/categories', this.#activeListId()]);
  }

  // ── grocery-only operations (not on IListPageFacade) ──────────────────────
  // Wired only from the grocery pages' projected `[searchExtras]` buckets and
  // the create-product quick-add button.

  addProduct(item: IProduct): void {
    this.#copyToActiveList(item, PRODUCT_COPY_TARGETS);
  }

  addStorageItem(item: IStorageItem): void {
    this.#copyToActiveList(item, STORAGE_COPY_TARGETS);
  }

  addShoppingItem(item: IShoppingItem): void {
    this.#copyToActiveList(item, SHOPPING_COPY_TARGETS);
  }

  // No target for the list being viewed means the item already lives here — a
  // list never shows its own suggestion bucket, so there is nothing to copy.
  #copyToActiveList<TItem>(
    item: TItem,
    targets: Partial<Record<TGroceryListId, (item: TItem) => Action>>
  ): void {
    const toAction = targets[this.#activeListId()];
    if (toAction) this.#store.dispatch(toAction(item));
  }

  // Quick-create a product from the searchbar while standing on storage/shopping,
  // and add it to that list too once saved (`addToAdditionalList`).
  showCreateProductDialog(): void {
    const state = this.state();
    this.#dialogs.open({
      item: createProduct(state?.searchQuery ?? '', state?.filterBy),
      listId: '_products',
      addToAdditionalList: this.#activeListId(),
      editMode: 'create',
    });
  }

  // Barcode scan → CREATE a product seeded with the EAN as its name; wired from
  // the storage/shopping pages' native scan button. The outcome triage lives here
  // rather than in each page: it was byte-identical in both, so a fourth
  // `outcome.reason` would have kept the old behaviour on whichever page nobody
  // remembered to edit.
  async scan(): Promise<void> {
    const outcome = await this.#scanner.scanEan();
    if (outcome.ok) {
      this.showCreateProductFromScan(outcome.ean);
      return;
    }
    // `cancelled`/`unsupported` are the user's own doing or a known platform
    // limit; only a denied permission or a rejecting plugin needs saying.
    if (outcome.reason !== 'cancelled' && outcome.reason !== 'unsupported') {
      this.reportScanFailure();
    }
  }

  reportScanFailure(): void {
    this.#store.dispatch(
      NotificationsActions.toast({
        key: marker('grocery.scan.error'),
        color: 'danger',
      })
    );
  }

  showCreateProductFromScan(scannedEan: string): void {
    this.#dialogs.open({
      item: createProduct(scannedEan),
      listId: '_products',
      editMode: 'create',
    });
  }

  // ── Shopping list page/action-sheet commands ─────────────────────────────
  removeShoppingItem(item: IShoppingItem): void {
    this.#store.dispatch(ShoppingActions.removeItem(item));
  }

  showEditShoppingItem(item: IShoppingItem): void {
    this.#dialogs.open({ item, listId: '_shopping', editMode: 'update' });
  }

  changeShoppingQuantity(item: IShoppingItem, diff: number): void {
    this.#store.dispatch(
      ShoppingActions.updateItem(withQuantityChangedBy(item, diff))
    );
  }

  buyShoppingItem(item: IShoppingItem): void {
    this.#store.dispatch(ShoppingActions.buyItem(item));
  }

  openShoppingActionSheet(): void {
    this.#store.dispatch(ShoppingActions.showActionSheet());
  }

  shareShoppingList(): void {
    this.#store.dispatch(ShoppingActions.shareShoppinglist());
  }

  moveShoppingToStorage(): void {
    this.#store.dispatch(ShoppingActions.moveToStorage());
  }

  hideShoppingActionSheet(): void {
    this.#store.dispatch(ShoppingActions.hideActionSheet());
  }

  // ── Storage list page commands ───────────────────────────────────────────
  removeStorageItem(item: IStorageItem): void {
    this.#store.dispatch(StorageActions.removeItem(item));
  }

  showEditStorageItem(item: IStorageItem): void {
    this.#dialogs.open({ item, listId: '_storage', editMode: 'update' });
  }

  changeStorageQuantity(item: IStorageItem, diff: number): void {
    this.#store.dispatch(
      StorageActions.updateItem(withQuantityChangedBy(item, diff))
    );
  }

  copyStorageToShopping(item: IStorageItem): void {
    this.#store.dispatch(StorageActions.copyToShoppinglist(item));
  }

  // ── Products (catalog) page commands ─────────────────────────────────────
  removeProduct(item: IProduct): void {
    this.#store.dispatch(ProductsActions.removeItem(item));
  }

  showEditProductItem(item: IProduct): void {
    this.#dialogs.open({ item, listId: '_products', editMode: 'update' });
  }

  // ── Edit-dialog commands ─────────────────────────────────────────────────
  saveShoppingItem(item: IShoppingItem): void {
    this.#store.dispatch(ShoppingActions.addOrUpdateItem(item));
  }

  saveStorageItem(item: IStorageItem): void {
    this.#store.dispatch(StorageActions.addOrUpdateItem(item));
  }

  saveProduct(item: IProduct): void {
    this.#store.dispatch(ProductsActions.addOrUpdateItem(item));
  }

  // Shared grocery catalog (one across all three lists).
  addGroceryCategory(category: ICategory): void {
    this.#store.dispatch(GroceryCategoriesActions.addItem(category));
  }

  renameGroceryCategory(id: TCategoryId, to: string): void {
    this.#store.dispatch(GroceryCategoriesActions.updateItem({ id, name: to }));
  }

  removeGroceryCategory(id: TCategoryId): void {
    const category = categoryById(this.catalog(), id);
    if (!category) return;
    this.#store.dispatch(GroceryCategoriesActions.removeItem(category));
  }

  // "Create & add to another list" flow from the product dialog: push the new
  // product onto the sibling list the user was on. Per-list actions (not the
  // route-keyed engine adds above).
  addProductToStorage(product: IProduct): void {
    this.#store.dispatch(StorageActions.addProduct(product));
  }

  addProductToShopping(product: IProduct): void {
    this.#store.dispatch(ShoppingActions.addProduct(product));
  }
}
