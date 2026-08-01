import { inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../@shared/util/item-lists/item-dialog.service';
import { IListPageFacade } from '../../@shared/util/item-lists/list-page.facade';
import { ITrackingItem, TRACKING_LIST_ID } from '../model/tracking.types';
import { createTrackingItem } from '../util/tracking.factory';
import { TrackingActions } from './tracking.actions';
import {
  selectTrackingItems,
  selectTrackingListItems,
  selectTrackingListSearchResult,
  selectTrackingState,
} from './tracking.selector';
import { ICategory } from '../../@shared/model/category.types';
import { TItemListSortType } from '../../@shared/model/item-list.types';

/**
 * Tracking's list of activities: the {@link IListPageFacade} implementation
 * bound to `LIST_FACADE` on the `/tracking` route, so the domain-blind
 * `ListPageComponent` can drive the list — exactly the way `TasksListPageFacade`
 * drives the sealed `_tasks` list — plus the row/dialog affordances that edit an
 * activity. What the timer does *with* those activities (and the session archive
 * it writes) is `TrackingFacade`.
 *
 * Tracking has **no categories**: `catalog` is always `[]`, the category-mode
 * operations are no-ops, and omitting `manageCategories` is what keeps the
 * shell's entry button to the catalog page off the page.
 */
@Injectable({ providedIn: 'root' })
export class TrackingListPageFacade implements IListPageFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  // ── IListPageFacade queries ──────────────────────────────────────────────
  readonly state = this.#store.selectSignal(selectTrackingState);
  readonly items = this.#store.selectSignal(selectTrackingListItems);
  readonly searchResult = this.#store.selectSignal(
    selectTrackingListSearchResult
  );

  // Tracking has no catalog at all — the contract's empty case.
  readonly catalog = signal<readonly ICategory[]>([]).asReadonly();

  // Edit-dialog read: the whole aggregate — NOT `items`, which is this page's
  // filtered view, so the duplicate-name rule would stop seeing a sibling the
  // moment a search term hid it.
  readonly allItems = this.#store.selectSignal(selectTrackingItems);

  // ── IListPageFacade commands ─────────────────────────────────────────────
  search(term?: string): void {
    this.#store.dispatch(TrackingActions.updateSearch(term));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(TrackingActions.addItemFromSearch());
  }

  // Tracking has no categories, so its one remaining category affordance is
  // inert. The param from the IListPageFacade signature is dropped (a narrower
  // method is still assignable) so there is no unused arg to lint.
  selectCategory(): void {}

  setSortMode(type: TItemListSortType): void {
    this.#store.dispatch(TrackingActions.updateSort(type, 'toggle'));
  }

  // Tracking has no categories, so there is no categories-mode branch here.
  showCreateDialog(): void {
    this.#dialogs.open({
      item: createTrackingItem(this.state()?.searchQuery ?? ''),
      listId: TRACKING_LIST_ID,
      editMode: 'create',
    });
  }

  // ── Activity row + dialog commands ───────────────────────────────────────
  showEditDialog(item: ITrackingItem): void {
    this.#dialogs.open({ item, listId: TRACKING_LIST_ID, editMode: 'update' });
  }

  removeItem(item: ITrackingItem): void {
    this.#store.dispatch(TrackingActions.removeItem(item));
  }

  createByTicket(): void {
    this.#dialogs.open({
      item: createTrackingItem('new ticket'),
      listId: TRACKING_LIST_ID,
      editMode: 'create',
    });
  }

  saveItem(item: ITrackingItem): void {
    this.#store.dispatch(TrackingActions.addOrUpdateItem(item));
  }
}
