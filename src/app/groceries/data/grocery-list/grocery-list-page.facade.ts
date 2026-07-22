import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  IAppState,
  TCategoryId,
  TItemListId,
  TItemListMode,
  TItemListSortType,
} from '../../../@shared/types';
import { IProduct, IShoppingItem, IStorageItem } from '../../model';
import { selectRouteParams as selectRouteParameters } from '../../../@shared/data/router.selector';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { IListPageFacade } from '../../../@shared/util/list/list-page.facade';
import { GroceryListActions } from './grocery-list.actions';
import { GroceryCategoriesActions } from './grocery-categories.actions';
import {
  selectListCategories,
  selectListItems,
  selectListSearchResult,
  selectListState,
  selectListStateFilter,
} from './grocery-list.selector';

// Active list id from the `:listId` route param (the multi-list engine keys off
// it). Module-scoped so the projector isn't re-created per facade instance.
const selectListIdParam = (state: IAppState): TItemListId | undefined =>
  selectRouteParameters(state)?.['listId'] as TItemListId | undefined;

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
  readonly #router = inject(Router);
  readonly #listId = this.#store.selectSignal(selectListIdParam);

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

  selectCategory(categoryId: TCategoryId): void {
    this.#store.dispatch(
      GroceryListActions.updateFilter(this.#activeListId(), categoryId)
    );
  }

  deleteCategory(categoryId: TCategoryId): void {
    this.#store.dispatch(GroceryCategoriesActions.remove(categoryId));
  }

  showCreateDialog(): void {
    this.#store.dispatch(
      ItemDialogsActions.showCreateDialogWithSearch(this.#activeListId())
    );
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
