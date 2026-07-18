import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { TItemListCategory, TItemListSortType } from '../../@shared/types';
import { ItemDialogsActions } from '../../@shared/data/item-dialogs/item-dialogs.actions';
import { IListPageFacade } from '../../@shared/util/list/list-page.facade';
import { listStateFilter } from '../../@shared/util/list/list.selector';
import { TrackingActions } from './tracking.actions';
import {
  selectTrackingListItems,
  selectTrackingListSearchResult,
  selectTrackingState,
} from './tracking.selector';

/**
 * {@link IListPageFacade} implementation for the single tracking list. It reads
 * the tracking slice through the tracking-domain selectors and dispatches only
 * `TrackingActions` + the shared `ItemDialogsActions` — exactly the way
 * `TasksListPageFacade` drives the sealed `_tasks` list. This is what seals
 * `tracking` behind the shared, domain-blind `ListPageComponent`.
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

  readonly state = this.#store.selectSignal(selectTrackingState);
  readonly items = this.#store.selectSignal(selectTrackingListItems);
  readonly searchResult = this.#store.selectSignal(
    selectTrackingListSearchResult
  );
  readonly filter = computed(() => listStateFilter(this.state()));
  readonly categories = computed<
    { category: TItemListCategory; count: number }[]
  >(() => []);

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

  showCreateDialog(): void {
    this.#store.dispatch(
      ItemDialogsActions.showCreateDialogWithSearch('_tracking')
    );
  }
}
