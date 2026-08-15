/* ─── why ─────────────────────────────────────────────────────────
 * Neither `catalog` nor `manageCategories` is declared, which is how
 * `ListPageComponent` learns this list has no category axis: no chip bar,
 * no manage button. A player is not filed under anything — which is also
 * why `PlayersFacade` serves as the command port unchanged: it has no
 * `selectCategory` to offer, and the base reads that absence as the
 * third statement of the same fact.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseListPageFacade } from '../../../@shared/data/item-lists/list-page.facade.base';
import { ItemListSortOption } from '../../../@shared/model/item-list.types';
import { PlayersFacade } from './players.facade';

const SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'createdAt', labelKey: marker('trackplay.list-toolbar.created') },
  { type: 'lastPlayedAt', labelKey: marker('trackplay.list-toolbar.last') },
];

@Injectable({ providedIn: 'root' })
export class PlayersPageFacade extends BaseListPageFacade {
  readonly #players = inject(PlayersFacade);

  protected readonly commands = this.#players;

  readonly state = this.#players.state;
  readonly items = this.#players.items;
  readonly searchResult = this.#players.searchResult;
  readonly sortOptions = signal(SORT_OPTIONS);

  showCreateDialog(): void {
    this.#players.showCreateDialog();
  }
}
