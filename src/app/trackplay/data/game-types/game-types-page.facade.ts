/* ─── why ─────────────────────────────────────────────────────────
 * `ListPageComponent`, not `CategoryListPage`: `winHigh` has nowhere to
 * live in a shared category row or in `EditCategoryDialogComponent`, and
 * bending either would push a trackplay concept into `@shared`. A game
 * type is a category to everything that *reads* it, and its own entity to
 * everything that edits it — so it declares no `catalog` of its own and
 * `selectCategory` is inert: a game type is not itself filed under one.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable, signal } from '@angular/core';
import { BaseListPageFacade } from '../../../@shared/data/item-lists/list-page.facade.base';
import { GAME_TYPES_LIST_ID } from '../../model/trackplay.types';
import { GameTypesFacade } from './game-types.facade';

@Injectable({ providedIn: 'root' })
export class GameTypesPageFacade extends BaseListPageFacade {
  readonly #gameTypes = inject(GameTypesFacade);

  protected readonly commands = this.#gameTypes;

  readonly state = this.#gameTypes.state;
  readonly undoScope = signal(GAME_TYPES_LIST_ID);
  readonly items = this.#gameTypes.items;
  readonly searchResult = this.#gameTypes.searchResult;

  showCreateDialog(): void {
    this.#gameTypes.showCreateDialog();
  }
}
