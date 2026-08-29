/* ─── why ─────────────────────────────────────────────────────────
 * These run as a post-pass over the state `combineReducers` already
 * produced, and they read the PRE-action slice — which only holds while no
 * per-aggregate reducer handles the same action, because `combineReducers`
 * returns the identical object when nothing changed. The three
 * `removeItem`s and the two restores therefore live here and nowhere else;
 * `trackplay.reducer.ts` says so again next to the wiring.
 *
 * `writtenBack` replaces a game by id and appends the ones that are gone,
 * because deleting a player strips them from games that survive but takes
 * a solo ENDED game with it — one restore has to answer both.
 * ───────────────────────────────────────────────────────────────── */

import {
  addListItem,
  removeListItem,
} from '../../@shared/util/item-lists/list.utils';
import {
  Game,
  GamesState,
  GameType,
  GameTypesState,
  Player,
  PlayersState,
  TrackplayState,
  TrackplayId,
} from '../model/trackplay.types';
import { DEFAULT_GAME_TYPE_ID } from './trackplay.factory';
import { gameTypeIdOf, withGameTypeId } from './game-type.utils';

export const gamesWithPlayer = (
  games: GamesState,
  playerId: TrackplayId
): Game[] => games.items.filter((game) => game.playerIds.includes(playerId));

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

const withoutPlayer = (game: Game, playerId: TrackplayId): Game => ({
  ...game,
  playerIds: game.playerIds.filter((id) => id !== playerId),
  rounds: game.rounds.map((round) => {
    const values = { ...round.values };
    delete values[playerId];
    return { ...round, values };
  }),
});

const detachPlayer = (game: Game, playerId: TrackplayId): Game | undefined => {
  const remaining = game.playerIds.filter((id) => id !== playerId);
  if (remaining.length > 0) return withoutPlayer(game, playerId);
  if (game.ended) return undefined;
  return { ...game, playerIds: [], rounds: [] };
};

const detachPlayerFromGames = (
  games: GamesState,
  playerId: TrackplayId
): GamesState => ({
  ...games,
  items: games.items
    .map((game) =>
      game.playerIds.includes(playerId) ? detachPlayer(game, playerId) : game
    )
    .filter((game): game is Game => !!game),
});

export const deletePlayerCascade = (
  state: TrackplayState,
  player: Player
): TrackplayState => ({
  ...state,
  players: removeListItem<PlayersState, Player>(state.players, player),
  games: detachPlayerFromGames(state.games, player.id),
});

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

export const restorePlayerCascade = (
  state: TrackplayState,
  player: Player,
  games: readonly Game[]
): TrackplayState => ({
  ...state,
  players: addListItem<PlayersState, Player>(state.players, player),
  games: writtenBack(state.games, games),
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
