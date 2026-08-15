/* ─── why ─────────────────────────────────────────────────────────
 * A second `ListPageFacade` over the SAME games collection, not a second
 * collection: everything it reads is the games slice narrowed to the route
 * player, and everything it writes lands in the `gamesForPlayer` view.
 *
 * It opens the create dialog itself rather than delegating, because the
 * seed has to come from THIS view's query and carry the route player on
 * the roster — the whole reason this page has its own facade.
 *
 * `catalog` is the game types, so this list filters by type as the
 * all-games list does. It was the missing piece of a filter already built
 * end to end — view, reducer, item projection, `selectCategory` and the
 * create seed all handled it, but without a catalog no chip could set it,
 * so all five were unreachable. Deliberately no `manageCategories`:
 * editing the type catalog from one player's history is a jump out of
 * context, and the chip bar no longer needs that button to exist.
 * ───────────────────────────────────────────────────────────────── */

import { computed, inject, Injectable, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { BaseListPageFacade } from '../../../@shared/data/item-lists/list-page.facade.base';
import { ItemListSortOption } from '../../../@shared/model/item-list.types';
import { Game, GAMES_LIST_ID } from '../../model/trackplay.types';
import { createGame } from '../../util/trackplay.factory';
import { GameTypesFacade } from '../game-types/game-types.facade';
import { PlayersFacade } from '../players/players.facade';
import { GamesForPlayerFacade } from './games-for-player.facade';
import { GamesFacade } from './games.facade';

const SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'updatedAt', labelKey: marker('trackplay.list-toolbar.updated') },
];

@Injectable({ providedIn: 'root' })
export class GamesForPlayerPageFacade extends BaseListPageFacade {
  readonly #view = inject(GamesForPlayerFacade);
  readonly #games = inject(GamesFacade);
  readonly #players = inject(PlayersFacade);
  readonly #dialogs = inject(ItemDialogService);

  protected readonly commands = this.#view;

  readonly state = this.#view.state;
  readonly items = this.#view.items;
  readonly searchResult = this.#view.searchResult;
  readonly catalog = inject(GameTypesFacade).allItems;
  readonly sortOptions = signal(SORT_OPTIONS);

  readonly player = this.#players.routePlayer;
  readonly stats = this.#players.routePlayerStats;
  readonly heading = computed(() => this.player()?.name ?? '');
  readonly showEndedGames = computed(() => this.state().showEndedGames);

  showCreateDialog(): void {
    const { searchQuery, filterBy } = this.state();
    const player = this.player();
    this.#dialogs.open({
      item: createGame(searchQuery ?? '', filterBy, player ? [player.id] : []),
      listId: GAMES_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: Game): void {
    this.#games.showEditDialog(item);
  }

  removeItem(item: Game): void {
    this.#games.removeItem(item);
  }

  showEditPlayerDialog(): void {
    const player = this.player();
    if (player) {
      this.#players.showEditDialog(player);
    }
  }

  toggleShowEnded(): void {
    this.#view.setShowEnded(!this.showEndedGames());
  }
}
