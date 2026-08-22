import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { TodayService } from '../../../@shared/data/services/today.service';
import {
  ItemListSortDirection,
  ItemListSortType,
} from '../../../@shared/model/item-list.types';
import { Reading, READINGS_LIST_ID } from '../../model/vitals.types';
import { createReading } from '../../util/vitals.factory';
import { readingOn } from '../../util/vitals.utils';
import { selectRouteProfile } from '../profiles/profiles.selector';
import { selectReadingsList } from '../vitals.selector';
import { ReadingsActions } from './readings.actions';
import {
  selectReadingItems,
  selectReadingsListItems,
  selectReadingsSearchResult,
  selectRouteProfileReadings,
  selectRouteProfileSeries,
  selectRouteProfileSummary,
} from './readings.selector';

@Injectable({ providedIn: 'root' })
export class ReadingsFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);
  readonly #profile = this.#store.selectSignal(selectRouteProfile);
  readonly #today = inject(TodayService).today;

  readonly state = this.#store.selectSignal(selectReadingsList);
  readonly allItems = this.#store.selectSignal(selectReadingItems);
  readonly items = this.#store.selectSignal(selectReadingsListItems);
  readonly searchResult = this.#store.selectSignal(selectReadingsSearchResult);
  readonly profileReadings = this.#store.selectSignal(
    selectRouteProfileReadings
  );
  readonly series = this.#store.selectSignal(selectRouteProfileSeries);
  readonly summary = this.#store.selectSignal(selectRouteProfileSummary);

  showCreateDialog(): void {
    const profile = this.#profile();
    if (!profile) return;
    const today = this.#today();
    const logged = readingOn(this.profileReadings(), profile.id, today);
    if (logged) {
      this.showEditDialog(logged);
      return;
    }
    this.#dialogs.open({
      item: createReading(profile.id, 0, today),
      listId: READINGS_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: Reading): void {
    this.#dialogs.open({ item, listId: READINGS_LIST_ID, editMode: 'update' });
  }

  saveItem(reading: Reading): void {
    this.#store.dispatch(ReadingsActions.addOrUpdateItem(reading));
  }

  search(searchQuery?: string): void {
    this.#store.dispatch(ReadingsActions.updateSearch(searchQuery));
  }

  setSortMode(
    sortBy: ItemListSortType,
    direction: ItemListSortDirection | 'toggle' = 'toggle'
  ): void {
    this.#store.dispatch(ReadingsActions.updateSort(sortBy, direction));
  }

  removeItem(reading: Reading): void {
    this.#store.dispatch(ReadingsActions.removeItem(reading));
  }
}
