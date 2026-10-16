/* ─── why ─────────────────────────────────────────────────────────
 * A profile is a person from `PEOPLE` seen through BIOMON: the person
 * brings name, kind and birthday, this slice only the astro overrides and
 * the go-to star. Who exists is not BIOMON's to decide, so creating opens
 * the people program's own dialog and nothing here removes anyone.
 * ───────────────────────────────────────────────────────────────── */

import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { selectRouteEntityId } from '../../../@shared/data/router/router.selector';
import { PersonId } from '../../../@shared/model/person.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { PEOPLE } from '../../../@shared/util/people/people.token';
import { PERSON_EDITOR } from '../../../@shared/util/people/person-editor.token';
import {
  AstroOverride,
  Profile,
  PROFILES_LIST_ID,
} from '../../model/vitals.types';
import { favoriteAmong, profilesOf } from '../../util/vitals.utils';
import { selectProfilesList } from '../vitals.selector';
import { ProfilesActions } from './profiles.actions';
import {
  selectAstroOverrides,
  selectFavoriteId,
  selectProfileSummaries,
} from './profiles.selector';

@Injectable({ providedIn: 'root' })
export class ProfilesFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);
  readonly #people = inject(PEOPLE);
  readonly #personEditor = inject(PERSON_EDITOR);
  readonly #view = this.#store.selectSignal(selectProfilesList);
  readonly #astro = this.#store.selectSignal(selectAstroOverrides);
  readonly #favoriteId = this.#store.selectSignal(selectFavoriteId);
  readonly #routeId = this.#store.selectSignal(selectRouteEntityId);

  readonly allItems = computed(() => profilesOf(this.#people(), this.#astro()));
  readonly state = computed(() => ({
    ...this.#view(),
    items: this.allItems(),
  }));
  readonly searchResult = computed(() => filterListBySearchQuery(this.state()));
  readonly items = computed(() =>
    filterAndSortItemList(this.state(), this.searchResult())
  );
  readonly summaries = this.#store.selectSignal(selectProfileSummaries);
  readonly persons = computed(() =>
    this.allItems().filter((profile) => profile.kind === 'person')
  );
  readonly routeProfile = computed(() =>
    this.allItems().find((profile) => profile.id === this.#routeId())
  );
  readonly favoriteProfile = computed(() =>
    favoriteAmong(this.persons(), this.#favoriteId())
  );

  showCreateDialog(): void {
    this.#personEditor.create(this.state().searchQuery);
  }

  showEditDialog(item: Profile): void {
    this.#dialogs.open({ item, listId: PROFILES_LIST_ID, editMode: 'update' });
  }

  saveAstro(id: PersonId, astro: AstroOverride): void {
    this.#store.dispatch(ProfilesActions.setAstro(id, astro));
  }

  setFavorite(id: PersonId): void {
    this.#store.dispatch(ProfilesActions.setFavorite(id));
  }
}
