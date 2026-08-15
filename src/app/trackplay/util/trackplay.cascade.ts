/* ─── why ─────────────────────────────────────────────────────────
 * These run as a post-pass over the state `combineReducers` already
 * produced, and they read the PRE-action slice — `snapshotFor` is what
 * undo restores. That only holds while no per-aggregate reducer handles
 * the same action, because `combineReducers` returns the identical object
 * when nothing changed. The three `removeItem`s and `restoreLastDeleted`
 * therefore live here and nowhere else; `trackplay.reducer.ts` says so
 * again next to the wiring.
 * ───────────────────────────────────────────────────────────────── */

import { removeListItem } from '../../@shared/util/item-lists/list.utils';
import {
  Game,
  GamesState,
  GameType,
  GameTypesState,
  Player,
  PlayersState,
  TrackplayDeleted,
  TrackplayState,
  TrackplayId,
} from '../model/trackplay.types';
import { DEFAULT_GAME_TYPE_ID } from './trackplay.factory';
import { gameTypeIdOf, withGameTypeId } from './game-type.utils';

export const snapshotFor = (
  state: TrackplayState,
  name: string
): TrackplayDeleted => ({
  name,
  snapshot: {
    players: state.players.items,
    games: state.games.items,
    gameTypes: state.gameTypes.items,
  },
});

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

export const restoreSnapshot = (
  state: TrackplayState,
  { snapshot }: TrackplayDeleted
): TrackplayState => ({
  ...state,
  players: { ...state.players, items: snapshot.players },
  games: { ...state.games, items: snapshot.games },
  gameTypes: { ...state.gameTypes, items: snapshot.gameTypes },
  lastDeleted: null,
});
