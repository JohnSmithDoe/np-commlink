/* ─── why ─────────────────────────────────────────────────────────
 * A player is a person, and a person is created in `people` — so the add
 * button leaves for that program rather than opening a dialog here. The
 * list's search and sort stay trackplay's: the view is local, only the
 * roster is borrowed.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../../@shared/data/item-lists/list-page.facade.base';
import { ItemListSortOption } from '../../../@shared/model/item-list.types';
import { PEOPLE_ROUTE } from '../../../@shared/util/people/people.token';
import { PlayersActions } from './players.actions';
import { PlayersFacade } from './players.facade';

const SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'createdAt', labelKey: marker('trackplay.list-toolbar.created') },
  { type: 'lastPlayedAt', labelKey: marker('trackplay.list-toolbar.last') },
];

@Injectable({ providedIn: 'root' })
export class PlayersPageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #players = inject(PlayersFacade);

  protected readonly commands = itemListCommands(this.#store, PlayersActions);

  readonly state = this.#players.state;
  readonly items = this.#players.items;
  readonly searchResult = this.#players.searchResult;
  readonly sortOptions = signal(SORT_OPTIONS);

  showCreateDialog(): void {
    void this.#router.navigate([PEOPLE_ROUTE]);
  }
}
