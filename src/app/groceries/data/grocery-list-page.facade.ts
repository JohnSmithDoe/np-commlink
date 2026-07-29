import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IProduct,
  IShoppingItem,
  IStorageItem,
  TGroceryListId,
} from '../model/grocery-list.types';
import { uuidv4 } from '../../@shared/util/app.utils';
import { ItemDialogService } from '../../@shared/util/item-dialog.service';
import { IListPageFacade } from '../../@shared/util/list/list-page.facade';
import {
  createGroceryItem,
  createProduct,
  withQuantityChangedBy,
} from '../util/grocery.factory';
import { GroceryListActions } from './actions/grocery-list.actions';
import { GroceryCategoriesActions } from './actions/grocery-categories.actions';
import { ShoppingActions } from './actions/shopping.actions';
import { StorageActions } from './actions/storage.actions';
import { ProductsActions } from './actions/products.actions';
import {
  selectListCategories,
  selectListIdParam,
  selectListItems,
  selectListSearchResult,
  selectListState,
} from './selectors/grocery-list.selector';
import {
  selectShoppingCategories,
  selectShoppingItems,
  selectShoppingListHasBoughtItems,
  selectShoppingState,
} from './selectors/shopping.selector';
import {
  selectStorageCategories,
  selectStorageItems,
} from './selectors/storage.selector';
import {
  selectProductItems,
  selectProductsCategories,
} from './selectors/products.selector';
import {
  selectQuickAddCanAddCategory,
  selectQuickAddCanAddLocal,
  selectQuickAddCanAddProduct,
  selectQuickAddState,
} from './selectors/quick-add.selector';
import { ICategory, TCategoryId } from '../../@shared/model/category.types';
import {
  TItemListMode,
  TItemListSortType,
} from '../../@shared/model/item-list.types';

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
  readonly #listId = this.#store.selectSignal(selectListIdParam);

  readonly state = this.#store.selectSignal(selectListState);
  readonly items = this.#store.selectSignal(selectListItems);
  readonly searchResult = this.#store.selectSignal(selectListSearchResult);
  readonly categories = this.#store.selectSignal(selectListCategories);

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
  readonly quickAddCanAddCategory = this.#store.selectSignal(
    selectQuickAddCanAddCategory
  );

  // Edit-dialog reads (the shopping/storage/product edit-dialog wrappers): the
  // per-list category catalog and the list's items. The open item itself comes off
  // the ItemDialogService command, which the shared base reads directly.
  readonly shoppingCategories = this.#store.selectSignal(
    selectShoppingCategories
  );
  readonly storageCategories = this.#store.selectSignal(
    selectStorageCategories
  );
  readonly productsCategories = this.#store.selectSignal(
    selectProductsCategories
  );
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

  addCategoryFromSearch(): void {
    this.#store.dispatch(
      GroceryListActions.addCategoryFromSearch(this.#activeListId())
    );
  }

  setDisplayMode(mode: TItemListMode): void {
    this.#store.dispatch(
      GroceryListActions.updateMode(this.#activeListId(), mode)
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

  deleteCategory(categoryId: TCategoryId): void {
    this.#store.dispatch(GroceryCategoriesActions.remove(categoryId));
  }

  // Create seeded from whatever is in the searchbar. (The categories-mode variant
  // is the shell's own `saveCategory` path — it never reaches here.)
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

  saveCategory(name: string): void {
    this.addGroceryCategory({ id: uuidv4(), name });
  }

  manageCategories(): void {
    void this.#router.navigate(['/groceries/categories', this.#activeListId()]);
  }

  // ── grocery-only operations (not on IListPageFacade) ──────────────────────
  // Wired only from the grocery pages' projected `[searchExtras]` buckets and
  // the create-product quick-add button.

  addProduct(item: IProduct): void {
    this.#store.dispatch(
      GroceryListActions.addProduct(this.#activeListId(), item)
    );
  }

  addStorageItem(item: IStorageItem): void {
    this.#store.dispatch(
      GroceryListActions.addStorageItem(this.#activeListId(), item)
    );
  }

  addShoppingItem(item: IShoppingItem): void {
    this.#store.dispatch(
      GroceryListActions.addShoppingItem(this.#activeListId(), item)
    );
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
  // the storage/shopping pages' native scan button.
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
  enterShopping(): void {
    this.#store.dispatch(ShoppingActions.enterPage());
  }

  filterShoppingByCategory(categoryId: string): void {
    this.#store.dispatch(ShoppingActions.updateFilter(categoryId));
  }

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
  enterStorage(): void {
    this.#store.dispatch(StorageActions.enterPage());
  }

  filterStorageByCategory(categoryId: string): void {
    this.#store.dispatch(StorageActions.updateFilter(categoryId));
  }

  removeStorageItem(item: IStorageItem): void {
    this.#store.dispatch(StorageActions.removeItem(item));
  }

  showEditStorageItem(item: IStorageItem): void {
    this.#dialogs.open({ item, listId: '_storage', editMode: 'update' });
  }

  setStorageSort(type: TItemListSortType): void {
    this.#store.dispatch(StorageActions.updateSort(type, 'toggle'));
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
  enterProducts(): void {
    this.#store.dispatch(ProductsActions.enterPage());
  }

  filterProductsByCategory(categoryId: string): void {
    this.#store.dispatch(ProductsActions.updateFilter(categoryId));
  }

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

  // Shared grocery catalog (one across all three lists). Catalog delete reuses
  // `deleteCategory` above (both dispatch GroceryCategoriesActions.remove).
  addGroceryCategory(category: ICategory): void {
    this.#store.dispatch(GroceryCategoriesActions.add(category));
  }

  renameGroceryCategory(id: TCategoryId, to: string): void {
    this.#store.dispatch(GroceryCategoriesActions.rename(id, to));
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
