import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  ICategory,
  TCategoryId,
  TItemListId,
  TItemListMode,
  TItemListSortType,
} from '../../@shared/model/types';
import { IProduct, IShoppingItem, IStorageItem } from '../model';
import { uuidv4 } from '../../@shared/util/app.utils';
import { ItemDialogHost } from '../../@shared/data/item-dialogs/item-dialog-host';
import { IListPageFacade } from '../../@shared/util/list/list-page.facade';
import { createGroceryItem, createProduct } from '../util/grocery.factory';
import { GroceryListActions } from './grocery-list/grocery-list.actions';
import { GroceryCategoriesActions } from './grocery-list/grocery-categories.actions';
import { ShoppingActions } from './shopping.actions';
import { StorageActions } from './storage.actions';
import { ProductsActions } from './products.actions';
import {
  selectListCategories,
  selectListIdParam,
  selectListItems,
  selectListSearchResult,
  selectListState,
  selectListStateFilter,
} from './grocery-list/grocery-list.selector';
import {
  selectShoppingCategories,
  selectShoppingListHasBoughtItems,
  selectShoppingState,
} from './shopping.selector';
import {
  selectStorageCategories,
  selectStorageListItems,
} from './storage.selector';
import {
  selectProductListItems,
  selectProductsCategories,
} from './products.selector';
import {
  selectQuickAddCanAddCategory,
  selectQuickAddCanAddLocal,
  selectQuickAddCanAddProduct,
  selectQuickAddState,
} from './quick-add/quick-add.selector';

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
  readonly #dialogs = inject(ItemDialogHost);
  readonly #listId = this.#store.selectSignal(selectListIdParam);

  readonly state = this.#store.selectSignal(selectListState);
  readonly filter = this.#store.selectSignal(selectListStateFilter);
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
  // per-list category catalog and the list items. The open item itself comes off
  // the ItemDialogHost command, which the shared base reads directly.
  readonly shoppingCategories = this.#store.selectSignal(
    selectShoppingCategories
  );
  readonly storageCategories = this.#store.selectSignal(
    selectStorageCategories
  );
  readonly productsCategories = this.#store.selectSignal(
    selectProductsCategories
  );
  readonly storageListItems = this.#store.selectSignal(selectStorageListItems);
  readonly productListItems = this.#store.selectSignal(selectProductListItems);
  readonly shoppingListItems = computed(
    () => this.shoppingState()?.items ?? null
  );

  readonly #activeListId = computed<TItemListId>(
    () => this.state()?.id ?? this.#listId() ?? '_shopping'
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
    void this.#router.navigate(['/categories', this.#activeListId()]);
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

  // Barcode scan → open the product edit dialog seeded with the EAN as the name;
  // wired from the storage/shopping pages' native scan button.
  openEditProduct(scannedEan: string): void {
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

  filterShopping(categoryId: string): void {
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
      ShoppingActions.updateItem({
        ...item,
        quantity: Math.max(0, item.quantity + diff),
      })
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

  filterStorage(categoryId: string): void {
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
      StorageActions.updateItem({
        ...item,
        quantity: Math.max(0, item.quantity + diff),
      })
    );
  }

  copyStorageToShopping(item: IStorageItem): void {
    this.#store.dispatch(StorageActions.copyToShoppinglist(item));
  }

  // ── Products (catalog) page commands ─────────────────────────────────────
  enterProducts(): void {
    this.#store.dispatch(ProductsActions.enterPage());
  }

  filterProducts(categoryId: string): void {
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
