import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  PRODUCTS_LIST_ID,
  STORAGE_LIST_ID,
} from '../../model/household-list.types';
import { BarcodeScannerService } from '../barcode-scanner.service';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../../@shared/data/item-lists/list-page.facade.base';
import {
  createHouseholdItem,
  createProduct,
} from '../../util/household.factory';
import { HouseholdListActions } from './household-list.actions';
import { selectHouseholdCategories } from '../categories/household-categories.selector';
import {
  selectActiveHouseholdListId,
  selectListItems,
  selectListSearchResult,
  selectListState,
} from './household-list.selector';
import { ItemListSortOption } from '../../../@shared/model/item-list.types';

const STORAGE_SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'bestBefore', labelKey: marker('household.list-toolbar.mhd') },
];

@Injectable({ providedIn: 'root' })
export class HouseholdListPageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);
  readonly #scanner = inject(BarcodeScannerService);

  readonly showScanButton = this.#scanner.isNativePlatform;

  readonly state = this.#store.selectSignal(selectListState);
  readonly items = this.#store.selectSignal(selectListItems);
  readonly searchResult = this.#store.selectSignal(selectListSearchResult);
  readonly catalog = this.#store.selectSignal(selectHouseholdCategories);

  readonly activeListId = this.#store.selectSignal(selectActiveHouseholdListId);

  readonly sortOptions = computed<readonly ItemListSortOption[]>(() =>
    this.activeListId() === STORAGE_LIST_ID ? STORAGE_SORT_OPTIONS : []
  );

  protected readonly commands = itemListCommands(this.#store, {
    updateSearch: (term) =>
      HouseholdListActions.updateSearch(this.activeListId(), term),
    updateSort: (type, direction) =>
      HouseholdListActions.updateSort(this.activeListId(), type, direction),
    addItemFromSearch: () =>
      HouseholdListActions.addItemFromSearch(this.activeListId()),
    updateFilter: (categoryId) =>
      HouseholdListActions.updateFilter(this.activeListId(), categoryId),
  });

  showCreateDialog(): void {
    const listId = this.activeListId();
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
    void this.#router.navigate(['/household/categories', this.activeListId()]);
  }

  showCreateProductDialog(): void {
    const state = this.state();
    this.#dialogs.open({
      item: createProduct(state?.searchQuery ?? '', state?.filterBy),
      listId: PRODUCTS_LIST_ID,
      addToAdditionalList: this.activeListId(),
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
