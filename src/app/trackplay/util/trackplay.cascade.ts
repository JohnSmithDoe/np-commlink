/* ─── why ─────────────────────────────────────────────────────────
 * These run as a post-pass over the state `combineReducers` already
 * produced, and they read the PRE-action slice — which only holds while no
 * per-aggregate reducer handles the same action, because `combineReducers`
 * returns the identical object when nothing changed. The two
 * `removeItem`s and the restore therefore live here and nowhere else;
 * `trackplay.reducer.ts` says so again next to the wiring.
 *
 * No cascade follows a player at delete time: a player is a person the
 * kernel publishes, so an undo in `people` brings their seat back with no
 * write here. A game holding a seat nobody resolves to is swept on the
 * next load, co-players' results with it — deleting a person is final.
 * ───────────────────────────────────────────────────────────────── */

import {
  addListItem,
  removeListItem,
} from '../../@shared/util/item-lists/list.utils';
import { PersonId } from '../../@shared/model/person.types';
import {
  Game,
  GamesState,
  GameType,
  GameTypesState,
  TrackplayState,
  TrackplayId,
} from '../model/trackplay.types';
import { DEFAULT_GAME_TYPE_ID } from './trackplay.factory';
import { gameTypeIdOf, withGameTypeId } from './game-type.utils';

export const gamesWithType = (games: GamesState, typeId: TrackplayId): Game[] =>
  games.items.filter((game) => gameTypeIdOf(game) === typeId);

const writtenBack = (
  games: GamesState,
  restored: readonly Game[]
): GamesState => {
  const byId = new Map(restored.map((game) => [game.id, game]));
  const kept = games.items.map((game) => byId.get(game.id) ?? game);
  const keptIds = new Set(kept.map((game) => game.id));
  return {
    ...games,
    items: [...kept, ...restored.filter((game) => !keptIds.has(game.id))],
  };
};

export const deleteGameCascade = (
  state: TrackplayState,
  game: Game
): TrackplayState => ({
  ...state,
  games: removeListItem<GamesState, Game>(state.games, game),
});

const reassignGamesToDefaultType = (
  games: GamesState,
  typeId: TrackplayId
): GamesState => ({
  ...games,
  items: games.items.map((game) =>
    gameTypeIdOf(game) === typeId
      ? withGameTypeId(game, DEFAULT_GAME_TYPE_ID)
      : game
  ),
});

const clearDeletedTypeFromFilter = <T extends { filterBy?: string }>(
  view: T,
  typeId: TrackplayId
): T => (view.filterBy === typeId ? { ...view, filterBy: undefined } : view);

export const deleteGameTypeCascade = (
  state: TrackplayState,
  type: GameType
): TrackplayState => ({
  ...state,
  gameTypes: removeListItem<GameTypesState, GameType>(state.gameTypes, type),
  games: clearDeletedTypeFromFilter(
    reassignGamesToDefaultType(state.games, type.id),
    type.id
  ),
  gamesForPlayer: clearDeletedTypeFromFilter(state.gamesForPlayer, type.id),
});

export const restoreGameTypeCascade = (
  state: TrackplayState,
  gameType: GameType,
  games: readonly Game[]
): TrackplayState => ({
  ...state,
  gameTypes: addListItem<GameTypesState, GameType>(state.gameTypes, gameType),
  games: writtenBack(state.games, games),
});

const seatsResolve =
  (people: ReadonlySet<PersonId>) =>
  (game: Game): boolean =>
    game.playerIds.every((id) => people.has(id));

export const hasOrphanGames = (
  state: TrackplayState,
  people: ReadonlySet<PersonId>
): boolean => !state.games.items.every(seatsResolve(people));

export const sweepOrphanGames = (
  state: TrackplayState,
  people: ReadonlySet<PersonId>
): TrackplayState => ({
  ...state,
  games: {
    ...state.games,
    items: state.games.items.filter(seatsResolve(people)),
  },
});
