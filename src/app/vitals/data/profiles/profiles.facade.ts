/* ─── why ─────────────────────────────────────────────────────────
 * `removeItem` builds the undo entry here rather than in an effect,
 * because deleting a profile takes its readings with it and an effect runs
 * AFTER the reducer — it would snapshot a profile whose history is already
 * gone. The command is the last place that can still see both.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { UndoActions } from '../../../@shared/data/undo/undo.actions';
import {
  ItemListSortDirection,
  ItemListSortType,
} from '../../../@shared/model/item-list.types';
import { Profile, PROFILES_LIST_ID } from '../../model/vitals.types';
import { createProfile } from '../../util/vitals.factory';
import { readingsOf } from '../../util/vitals.utils';
import { selectReadingItems } from '../readings/readings.selector';
import { selectProfilesList } from '../vitals.selector';
import { VitalsActions } from '../vitals.actions';
import { ProfilesActions } from './profiles.actions';
import {
  selectPersonProfiles,
  selectProfileItems,
  selectProfileSummaries,
  selectProfilesListItems,
  selectProfilesSearchResult,
  selectRouteProfile,
} from './profiles.selector';

@Injectable({ providedIn: 'root' })
export class ProfilesFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);
  readonly #readings = this.#store.selectSignal(selectReadingItems);

  readonly state = this.#store.selectSignal(selectProfilesList);
  readonly allItems = this.#store.selectSignal(selectProfileItems);
  readonly items = this.#store.selectSignal(selectProfilesListItems);
  readonly searchResult = this.#store.selectSignal(selectProfilesSearchResult);
  readonly summaries = this.#store.selectSignal(selectProfileSummaries);
  readonly persons = this.#store.selectSignal(selectPersonProfiles);
  readonly routeProfile = this.#store.selectSignal(selectRouteProfile);

  showCreateDialog(): void {
    this.#dialogs.open({
      item: createProfile(this.state().searchQuery ?? ''),
      listId: PROFILES_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: Profile): void {
    this.#dialogs.open({ item, listId: PROFILES_LIST_ID, editMode: 'update' });
  }

  saveItem(profile: Profile): void {
    this.#store.dispatch(ProfilesActions.addOrUpdateItem(profile));
  }

  search(searchQuery?: string): void {
    this.#store.dispatch(ProfilesActions.updateSearch(searchQuery));
  }

  addItemFromSearch(): void {
    this.#store.dispatch(ProfilesActions.addItemFromSearch());
  }

  setSortMode(
    sortBy: ItemListSortType,
    direction: ItemListSortDirection | 'toggle' = 'toggle'
  ): void {
    this.#store.dispatch(ProfilesActions.updateSort(sortBy, direction));
  }

  removeItem(profile: Profile): void {
    this.#store.dispatch(
      UndoActions.pushed({
        name: profile.name,
        action: VitalsActions.restoreProfile(
          profile,
          readingsOf(this.#readings(), profile.id)
        ),
      })
    );
    this.#store.dispatch(ProfilesActions.removeItem(profile));
  }
}
