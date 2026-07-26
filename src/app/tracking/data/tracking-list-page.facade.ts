import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { ItemDialogService } from '../../@shared/util/item-dialog.service';
import { IListPageFacade } from '../../@shared/util/list/list-page.facade';
import { listStateFilter } from '../../@shared/util/list/list.selector';
import {
  IDataItem,
  ITrackingItem,
  TRACKING_LIST_ID,
} from '../model/tracking.types';
import { createTrackingItem } from '../util/tracking.factory';
import { TrackingActions } from './actions/tracking.actions';
import {
  selectAllTrackingSessions,
  selectSessionsByDayAndName,
  selectTrackingData,
  selectTrackingDataViewId,
  selectTrackingListItems,
  selectTrackingListSearchResult,
  selectTrackingState,
  selectTrackingTime,
} from './selectors/tracking.selector';
import { ICategory } from '../../@shared/model/category.types';
import { TItemListSortType } from '../../@shared/model/item-list.types';

// Tracking has no categories; the shared list contract still wants a signal.
const noTrackingCategories = (): {
  category: ICategory;
  count: number;
}[] => [];

/**
 * The `tracking` domain facade — the single NgRx surface for every tracking
 * component (the tracker page, the stats page, and the daily-sessions /
 * sessions-chart smart-ui). It injects `Store` so the components never do, and
 * exposes tracking state as signals plus command methods that dispatch
 * `TrackingActions` (the edit dialog opens straight onto `ItemDialogService`).
 *
 * It also implements {@link IListPageFacade} (provided as `LIST_FACADE` on the
 * `/tracking` route) so the domain-blind `ListPageComponent` can drive the list
 * — exactly the way `TasksListPageFacade` drives the sealed `_tasks` list. This
 * is what seals `tracking` behind the shared, domain-blind `ListPageComponent`.
 *
 * Tracking has **no categories** (the tracking list carries an empty categories
 * array and 'alphabetical' mode). The category-mode operations are therefore
 * no-ops and `categories` is always `[]`; the page also passes
 * `[hasCategories]="false"` so the category UI (quick-add, display-mode toggle,
 * edit-category dialog) is suppressed and it renders a plain list.
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
  readonly filterState = computed(() => listStateFilter(this.state()));
  readonly categories = computed(noTrackingCategories);

  // ── Tracking-domain queries ──────────────────────────────────────────────
  readonly total = this.#store.selectSignal(selectTrackingTime);
  readonly sessionsByView = this.#store.selectSignal(selectTrackingData);
  readonly viewMode = this.#store.selectSignal(selectTrackingDataViewId);
  readonly allSessions = this.#store.selectSignal(selectAllTrackingSessions);
  readonly sessionsByDayAndName = this.#store.selectSignal(
    selectSessionsByDayAndName
  );

  // ── IListPageFacade commands ─────────────────────────────────────────────
  search(term?: string): void {
    this.#store.dispatch(TrackingActions.updateSearch(term));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(TrackingActions.addItemFromSearch());
  }

  // Tracking has no categories — the category affordances are inert. The
  // params from the IListPageFacade signatures are dropped (a narrower method
  // is still assignable) so there are no unused args to lint.
  addCategoryFromSearch(): void {}
  setDisplayMode(): void {}
  selectCategory(): void {}
  deleteCategory(): void {}

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

  // ── Tracking-domain commands ─────────────────────────────────────────────
  applyNotificationCommand(command: string, targetId: string): void {
    this.#store.dispatch(
      TrackingActions.applyNotificationCommand(command, targetId)
    );
  }

  showEditDialog(item: ITrackingItem): void {
    this.#dialogs.open({ item, listId: TRACKING_LIST_ID, editMode: 'update' });
  }

  removeItem(item: ITrackingItem): void {
    this.#store.dispatch(TrackingActions.removeItem(item));
  }

  toggleTracking(item: ITrackingItem): void {
    this.#store.dispatch(
      TrackingActions.toggleTrackingItem(item, dayjs().format())
    );
  }

  resetItem(item: ITrackingItem): void {
    this.#store.dispatch(TrackingActions.resetTracking(item));
  }

  resetAll(): void {
    this.#store.dispatch(TrackingActions.resetAllTracking());
  }

  saveAndReset(): void {
    this.#store.dispatch(TrackingActions.saveAndResetTracking());
  }

  seedDemoSessions(): void {
    this.#store.dispatch(TrackingActions.seedDemoSessions());
  }

  createByTicket(): void {
    this.#dialogs.open({
      item: createTrackingItem('new ticket'),
      listId: TRACKING_LIST_ID,
      editMode: 'create',
    });
  }

  // ── Stats-page commands ──────────────────────────────────────────────────
  shareCsv(): void {
    this.#store.dispatch(TrackingActions.shareData());
  }

  removeDataItem(item: IDataItem): void {
    this.#store.dispatch(TrackingActions.removeDataItem(item));
  }

  changeDataView(viewId: string): void {
    this.#store.dispatch(TrackingActions.changeDataView(viewId));
  }

  // ── Edit-dialog command ──────────────────────────────────────────────────
  saveItem(item: ITrackingItem): void {
    this.#store.dispatch(TrackingActions.addOrUpdateItem(item));
  }
}
