import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { TodayService } from '../../../@shared/data/services/today.service';
import { UndoActions } from '../../../@shared/data/undo/undo.actions';
import {
  ItemListSortDirection,
  ItemListSortType,
} from '../../../@shared/model/item-list.types';
import { Pill, PILLS_LIST_ID } from '../../model/vitals.types';
import { isTakenOn } from '../../util/pill.utils';
import { createPill } from '../../util/vitals.factory';
import { selectRouteProfile } from '../profiles/profiles.selector';
import { VitalsActions } from '../vitals.actions';
import { selectIntakes, selectPillsList } from '../vitals.selector';
import { PillsActions } from './pills.actions';
import {
  selectPillItems,
  selectPillsListItems,
  selectPillsSearchResult,
  selectRouteProfilePills,
} from './pills.selector';

@Injectable({ providedIn: 'root' })
export class PillsFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);
  readonly #profile = this.#store.selectSignal(selectRouteProfile);
  readonly #intakes = this.#store.selectSignal(selectIntakes);
  readonly #today = inject(TodayService).today;

  readonly state = this.#store.selectSignal(selectPillsList);
  readonly allItems = this.#store.selectSignal(selectPillItems);
  readonly items = this.#store.selectSignal(selectPillsListItems);
  readonly searchResult = this.#store.selectSignal(selectPillsSearchResult);
  readonly profilePills = this.#store.selectSignal(selectRouteProfilePills);

  isTakenToday(pill: Pill): boolean {
    return isTakenOn(this.#intakes(), pill.id, this.#today());
  }

  setTakenToday(pill: Pill, taken: boolean): void {
    this.#store.dispatch(PillsActions.setTaken(pill.id, this.#today(), taken));
  }

  showCreateDialog(): void {
    const profile = this.#profile();
    if (!profile) return;
    this.#dialogs.open({
      item: createPill(profile.id, this.state().searchQuery ?? ''),
      listId: PILLS_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: Pill): void {
    this.#dialogs.open({ item, listId: PILLS_LIST_ID, editMode: 'update' });
  }

  saveItem(pill: Pill): void {
    this.#store.dispatch(PillsActions.addOrUpdateItem(pill));
  }

  search(searchQuery?: string): void {
    this.#store.dispatch(PillsActions.updateSearch(searchQuery));
  }

  setSortMode(
    sortBy: ItemListSortType,
    direction: ItemListSortDirection | 'toggle' = 'toggle'
  ): void {
    this.#store.dispatch(PillsActions.updateSort(sortBy, direction));
  }

  removeItem(pill: Pill): void {
    this.#store.dispatch(
      UndoActions.pushed({
        scope: PILLS_LIST_ID,
        name: pill.name,
        action: VitalsActions.restorePill(
          pill,
          this.#intakes().filter((intake) => intake.pillId === pill.id)
        ),
      })
    );
    this.#store.dispatch(PillsActions.removeItem(pill));
  }
}
