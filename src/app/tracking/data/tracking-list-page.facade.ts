/* ─── why ─────────────────────────────────────────────────────────
 * A tracked ticket is not filed under a category, and tracking means it at
 * every layer: no `catalog` here, and no `updateFilter` handler in the
 * reducer either. So this is one of the two facades that hand-picks its
 * commands instead of handing `itemListCommands` the whole action group —
 * `createItemListActionEvents` mints an `updateFilter` for every list, and
 * passing it would point `selectCategory` at an action nothing reduces.
 * Withholding it keeps the port's promises equal to the reducer's.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../@shared/data/item-lists/list-page.facade.base';
import { TRACKING_LIST_ID, TrackingItem } from '../model/tracking.types';
import { createTrackingItem } from '../util/tracking.factory';
import { TrackingActions } from './tracking.actions';
import {
  selectTrackingItems,
  selectTrackingListItems,
  selectTrackingListSearchResult,
  selectTrackingState,
} from './tracking.selector';

@Injectable({ providedIn: 'root' })
export class TrackingListPageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  protected readonly commands = itemListCommands(this.#store, {
    updateSearch: TrackingActions.updateSearch,
    updateSort: TrackingActions.updateSort,
    addItemFromSearch: TrackingActions.addItemFromSearch,
  });

  readonly state = this.#store.selectSignal(selectTrackingState);
  readonly items = this.#store.selectSignal(selectTrackingListItems);
  readonly searchResult = this.#store.selectSignal(
    selectTrackingListSearchResult
  );

  readonly allItems = this.#store.selectSignal(selectTrackingItems);

  showCreateDialog(): void {
    this.#dialogs.open({
      item: createTrackingItem(this.state()?.searchQuery ?? ''),
      listId: TRACKING_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: TrackingItem): void {
    this.#dialogs.open({ item, listId: TRACKING_LIST_ID, editMode: 'update' });
  }

  removeItem(item: TrackingItem): void {
    this.#store.dispatch(TrackingActions.removeItem(item));
  }

  createByTicket(): void {
    this.#dialogs.open({
      item: createTrackingItem('new ticket'),
      listId: TRACKING_LIST_ID,
      editMode: 'create',
    });
  }

  saveItem(item: TrackingItem): void {
    this.#store.dispatch(TrackingActions.addOrUpdateItem(item));
  }
}
