/* ─── why ─────────────────────────────────────────────────────────
 * `catalog` is the game-type list, because a `GameType` structurally IS a
 * `Category` — which buys the chip bar, the manage button and the
 * `?filter=` deep link with no trackplay code at all.
 *
 * The counts read `state().items`, not `items()`: `items()` is the list
 * AFTER filtering, so both halves of "n of m" would be one number.
 *
 * One sort option, not two. `createdAt` overflowed the toolbar by 17px at
 * 393px, and a game's `updatedAt` starts EQUAL to it and only moves when a
 * round is scored — so the two sorted identically until you played. The
 * players list keeps both, where they are genuinely different dates.
 * ───────────────────────────────────────────────────────────────── */

import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseListPageFacade } from '../../../@shared/data/item-lists/list-page.facade.base';
import { ItemListSortOption } from '../../../@shared/model/item-list.types';
import { GameTypesFacade } from '../game-types/game-types.facade';
import { GAMES_LIST_ID } from '../../model/trackplay.types';
import { GamesFacade } from './games.facade';

const SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'updatedAt', labelKey: marker('trackplay.list-toolbar.updated') },
];

@Injectable({ providedIn: 'root' })
export class GamesPageFacade extends BaseListPageFacade {
  readonly #games = inject(GamesFacade);
  readonly #router = inject(Router);

  protected readonly commands = this.#games;

  readonly state = this.#games.state;
  readonly undoScope = signal(GAMES_LIST_ID);
  readonly items = this.#games.items;
  readonly searchResult = this.#games.searchResult;
  readonly catalog = inject(GameTypesFacade).allItems;
  readonly sortOptions = signal(SORT_OPTIONS);

  readonly showEndedGames = computed(() => this.state().showEndedGames);
  readonly shownCount = computed(() => this.items().length);
  readonly totalCount = computed(() => this.state().items.length);

  showCreateDialog(): void {
    this.#games.showCreateDialog();
  }

  manageCategories(): void {
    void this.#router.navigate(['/trackplay/game-types']);
  }

  toggleShowEnded(): void {
    this.#games.setShowEnded(!this.showEndedGames());
  }
}
