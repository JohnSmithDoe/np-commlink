import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  IAppState,
  TItemListCategory,
  TItemListId,
  TItemListMode,
  TItemListSortType,
} from '../../../@shared/types';
import { IProduct, IShoppingItem, IStorageItem } from '../../model';
import { selectRouteParams } from '../../../@shared/data/router.selector';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { IListPageFacade } from '../../../@shared/util/list/list-page.facade';
import { GroceryListActions } from './grocery-list.actions';
import {
  selectListCategories,
  selectListItems,
  selectListSearchResult,
  selectListState,
  selectListStateFilter,
} from './grocery-list.selector';

/**
 * {@link IListPageFacade} implementation for the grocery multi-list engine. The
 * active list is derived from the `:listId` route param, so a single (root)
 * instance serves the shopping/storage/products pages. Beyond the generic
 * contract it exposes the grocery-only operations the pages wire into the
 * `[searchExtras]` cross-list buckets.
 */
@Injectable({ providedIn: 'root' })
export class GroceryListPageFacade implements IListPageFacade {
  readonly #store = inject(Store<IAppState>);
  readonly #listId = this.#store.selectSignal(
    (state) => selectRouteParams(state)?.['listId'] as TItemListId | undefined
  );

  readonly state = this.#store.selectSignal(selectListState);
  readonly filter = this.#store.selectSignal(selectListStateFilter);
  readonly items = this.#store.selectSignal(selectListItems);
  readonly searchResult = this.#store.selectSignal(selectListSearchResult);
  readonly categories = this.#store.selectSignal(selectListCategories);

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

  selectCategory(category: TItemListCategory): void {
    this.#store.dispatch(
      GroceryListActions.updateFilter(this.#activeListId(), category)
    );
  }

  deleteCategory(category: TItemListCategory): void {
    this.#store.dispatch(
      GroceryListActions.removeCategory(this.#activeListId(), category)
    );
  }

  showCreateDialog(): void {
    this.#store.dispatch(
      ItemDialogsActions.showCreateDialogWithSearch(this.#activeListId())
    );
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

  showCreateProductDialog(): void {
    this.#store.dispatch(
      ItemDialogsActions.showCreateAndAddProductDialog(this.#activeListId())
    );
  }

  // Barcode scan → open the product edit dialog seeded with the EAN. Dispatches
  // the grocery-owned engine action (kept off IListPageFacade); wired from the
  // storage/shopping pages' native scan button.
  openEditProduct(scannedEan: string): void {
    this.#store.dispatch(GroceryListActions.openEditProduct(scannedEan));
  }
}
