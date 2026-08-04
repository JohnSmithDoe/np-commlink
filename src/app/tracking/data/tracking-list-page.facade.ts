import { inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import { ListPageFacade } from '../../@shared/util/item-lists/list-page.facade';
import { TRACKING_LIST_ID, TrackingItem } from '../model/tracking.types';
import { createTrackingItem } from '../util/tracking.factory';
import { TrackingActions } from './tracking.actions';
import {
  selectTrackingItems,
  selectTrackingListItems,
  selectTrackingListSearchResult,
  selectTrackingState,
} from './tracking.selector';
import { Category } from '../../@shared/model/category.types';
import { ItemListSortType } from '../../@shared/model/item-list.types';

@Injectable({ providedIn: 'root' })
export class TrackingListPageFacade implements ListPageFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectTrackingState);
  readonly items = this.#store.selectSignal(selectTrackingListItems);
  readonly searchResult = this.#store.selectSignal(
    selectTrackingListSearchResult
  );

  readonly catalog = signal<readonly Category[]>([]).asReadonly();

  readonly allItems = this.#store.selectSignal(selectTrackingItems);

  search(term?: string): void {
    this.#store.dispatch(TrackingActions.updateSearch(term));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(TrackingActions.addItemFromSearch());
  }

  selectCategory(): void {}

  setSortMode(type: ItemListSortType): void {
    this.#store.dispatch(TrackingActions.updateSort(type, 'toggle'));
  }

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
