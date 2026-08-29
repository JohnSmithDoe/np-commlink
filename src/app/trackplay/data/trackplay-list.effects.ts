/* ─── why ─────────────────────────────────────────────────────────
 * `clearSearchAfter` is deliberately not registered: household's search is
 * a transient way to find a row, but here the same field is how you narrow
 * a long game list, and wiping it on every add undoes the user's filter.
 *
 * The route-filter pair is registered for GAMES alone — a player is filed
 * under nothing, a game type IS the category. Without the clear half,
 * tapping an armed chip strips `?filter=` and leaves `filterBy` set: a
 * list that narrows and never widens again.
 * ───────────────────────────────────────────────────────────────── */

import { categoryFilterFromRoute } from '../../@shared/data/item-lists/category-filter.effects';
import { createItemListEffects } from '../../@shared/data/item-lists/item-list.effects.factory';
import { selectRouteCategoryFilter } from '../../@shared/data/router/router.selector';
import {
  createGame,
  createGameType,
  createPlayer,
} from '../util/trackplay.factory';
import { GAMES_LIST_ID } from '../model/trackplay.types';
import { GameTypesActions } from './game-types/game-types.actions';
import { GamesActions } from './games/games.actions';
import { PlayersActions } from './players/players.actions';
import {
  selectGamesList,
  selectGameTypesList,
  selectPlayersList,
} from './trackplay.selector';

export const trackplayRouteFilterEffects = {
  drilledFilter$: categoryFilterFromRoute(selectRouteCategoryFilter, (id) =>
    id ? GamesActions.updateFilter(id) : undefined
  ),
};

export const playersListEffects = createItemListEffects({
  actions: PlayersActions,
  select: selectPlayersList,
  create: (name) => createPlayer(name),
});

export const gamesListEffects = createItemListEffects({
  actions: GamesActions,
  select: selectGamesList,
  create: (name, filterBy) => createGame(name, filterBy),
  undoableDelete: { scope: GAMES_LIST_ID, removeItem: GamesActions.removeItem },
});

export const gameTypesListEffects = createItemListEffects({
  actions: GameTypesActions,
  select: selectGameTypesList,
  create: (name) => createGameType(name, true),
});
