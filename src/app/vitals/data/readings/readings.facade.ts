import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { TodayService } from '../../../@shared/data/services/today.service';
import { Reading, READINGS_LIST_ID } from '../../model/vitals.types';
import { createReading } from '../../util/vitals.factory';
import { readingOn } from '../../util/vitals.utils';
import { selectRouteEntityId } from '../../../@shared/data/router/router.selector';
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
  readonly #profileId = this.#store.selectSignal(selectRouteEntityId);
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
    const profileId = this.#profileId();
    if (!profileId) return;
    const today = this.#today();
    const logged = readingOn(this.profileReadings(), profileId, today);
    if (logged) {
      this.showEditDialog(logged);
      return;
    }
    this.#dialogs.open({
      item: createReading(profileId, 0, today),
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

  removeItem(reading: Reading): void {
    this.#store.dispatch(ReadingsActions.removeItem(reading));
  }
}
