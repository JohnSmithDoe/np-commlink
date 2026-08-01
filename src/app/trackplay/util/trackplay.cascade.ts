import {
  IGame,
  IGameType,
  IPlayer,
  IRound,
  ITrackplayDeleted,
  ITrackplayState,
  TID,
} from '../model/trackplay.types';
import { DEFAULT_GAME_TYPE_ID } from './trackplay.factory';

/**
 * What deleting a player, a game or a game type has to drag with it, plus the
 * single-level undo snapshot each one stashes.
 *
 * Pure state→state transforms, so they live here rather than in `data/`: they
 * import no `@ngrx`, and the reducer that calls them reads as its handler table
 * once they are out of it.
 */

// ── snapshot / undo ──────────────────────────────────────────────────────────

/**
 * The reducer never mutates a map in place — every change forks a new one — so
 * capturing the current references is a safe single-level undo snapshot.
 */
export const snapshotFor = (
  state: ITrackplayState,
  name: string
): ITrackplayDeleted => ({
  name,
  // `config` is deliberately absent: it is list-view settings, not deleted
  // data, and the settings popover is one tap away during the 8s toast — so
  // including it meant "undo delete" silently reverted a sort or filter too.
  snapshot: {
    players: state.players,
    games: state.games,
    gameTypes: state.gameTypes,
    rounds: state.rounds,
  },
});

// ── cascade deletes (mirror legacy data.service) ─────────────────────────────

// Games and rounds have to move in lockstep through a cascade, because a game
// owns its round ids — so the steps below rewrite one mutable pair.
type GamesAndRounds = {
  games: Record<TID, IGame>;
  rounds: Record<TID, IRound>;
};

const dropPlayerScoresFromRounds = (
  { games, rounds }: GamesAndRounds,
  game: IGame,
  playerId: TID
): void => {
  for (const roundId of game.rounds) {
    const round = rounds[roundId];
    if (!round) continue;
    const values = { ...round.values };
    delete values[playerId];
    rounds[roundId] = { ...round, values };
  }
  games[game.id] = {
    ...game,
    players: game.players.filter((id) => id !== playerId),
  };
};

const discardEndedEmptyGame = (
  { games, rounds }: GamesAndRounds,
  game: IGame
): void => {
  for (const roundId of game.rounds) delete rounds[roundId];
  delete games[game.id];
};

const emptyLiveGame = (
  { games, rounds }: GamesAndRounds,
  game: IGame
): void => {
  for (const roundId of game.rounds) delete rounds[roundId];
  games[game.id] = { ...game, players: [], rounds: [] };
};

// Losing your last player kills an already-ended game (nothing left to show) but
// only empties a live one, so it stays open for new players.
const detachPlayerFromGame = (
  target: GamesAndRounds,
  game: IGame,
  playerId: TID
): void => {
  const remaining = game.players.filter((id) => id !== playerId);
  if (remaining.length > 0) dropPlayerScoresFromRounds(target, game, playerId);
  else if (game.ended) discardEndedEmptyGame(target, game);
  else emptyLiveGame(target, game);
};

export const deletePlayerCascade = (
  state: ITrackplayState,
  player: IPlayer
): ITrackplayState => {
  const players = { ...state.players };
  delete players[player.id];
  const target: GamesAndRounds = {
    games: { ...state.games },
    rounds: { ...state.rounds },
  };
  for (const game of Object.values(state.games)) {
    if (!game.players.includes(player.id)) continue;
    detachPlayerFromGame(target, game, player.id);
  }
  return { ...state, players, ...target };
};

export const deleteGameCascade = (
  state: ITrackplayState,
  game: IGame
): ITrackplayState => {
  const games = { ...state.games };
  delete games[game.id];
  const rounds = { ...state.rounds };
  for (const roundId of game.rounds) delete rounds[roundId];
  return { ...state, games, rounds };
};

const reassignGamesToDefaultType = (
  games: Record<TID, IGame>,
  typeId: TID
): Record<TID, IGame> =>
  Object.fromEntries(
    Object.entries(games).map(([id, game]) => [
      id,
      game.type === typeId ? { ...game, type: DEFAULT_GAME_TYPE_ID } : game,
    ])
  );

// Both game lists can be filtered by type; a deleted type must not stay selected
// in either, or the list silently shows nothing.
const clearDeletedTypeFromFilters = (
  config: ITrackplayState['config'],
  typeId: TID
): ITrackplayState['config'] => {
  let next = config;
  for (const key of ['games', 'gamesForPlayer'] as const) {
    if (next[key].typeId !== typeId) continue;
    next = { ...next, [key]: { ...next[key], typeId: '' } };
  }
  return next;
};

export const deleteGameTypeCascade = (
  state: ITrackplayState,
  type: IGameType
): ITrackplayState => {
  const gameTypes = { ...state.gameTypes };
  delete gameTypes[type.id];
  return {
    ...state,
    gameTypes,
    games: reassignGamesToDefaultType(state.games, type.id),
    config: clearDeletedTypeFromFilters(state.config, type.id),
  };
};
