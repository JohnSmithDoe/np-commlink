import {
  Game,
  GameType,
  Player,
  Round,
  TrackplayDeleted,
  TrackplayState,
  TrackplayId,
} from '../model/trackplay.types';
import { DEFAULT_GAME_TYPE_ID } from './trackplay.factory';

export const snapshotFor = (
  state: TrackplayState,
  name: string
): TrackplayDeleted => ({
  name,
  snapshot: {
    players: state.players,
    games: state.games,
    gameTypes: state.gameTypes,
    rounds: state.rounds,
  },
});

type GamesAndRounds = {
  games: Record<TrackplayId, Game>;
  rounds: Record<TrackplayId, Round>;
};

const dropPlayerScoresFromRounds = (
  { games, rounds }: GamesAndRounds,
  game: Game,
  playerId: TrackplayId
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
  game: Game
): void => {
  for (const roundId of game.rounds) delete rounds[roundId];
  delete games[game.id];
};

const emptyLiveGame = ({ games, rounds }: GamesAndRounds, game: Game): void => {
  for (const roundId of game.rounds) delete rounds[roundId];
  games[game.id] = { ...game, players: [], rounds: [] };
};

const detachPlayerFromGame = (
  target: GamesAndRounds,
  game: Game,
  playerId: TrackplayId
): void => {
  const remaining = game.players.filter((id) => id !== playerId);
  if (remaining.length > 0) dropPlayerScoresFromRounds(target, game, playerId);
  else if (game.ended) discardEndedEmptyGame(target, game);
  else emptyLiveGame(target, game);
};

export const deletePlayerCascade = (
  state: TrackplayState,
  player: Player
): TrackplayState => {
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
  state: TrackplayState,
  game: Game
): TrackplayState => {
  const games = { ...state.games };
  delete games[game.id];
  const rounds = { ...state.rounds };
  for (const roundId of game.rounds) delete rounds[roundId];
  return { ...state, games, rounds };
};

const reassignGamesToDefaultType = (
  games: Record<TrackplayId, Game>,
  typeId: TrackplayId
): Record<TrackplayId, Game> =>
  Object.fromEntries(
    Object.entries(games).map(([id, game]) => [
      id,
      game.type === typeId ? { ...game, type: DEFAULT_GAME_TYPE_ID } : game,
    ])
  );

const clearDeletedTypeFromFilters = (
  config: TrackplayState['config'],
  typeId: TrackplayId
): TrackplayState['config'] => {
  let next = config;
  for (const key of ['games', 'gamesForPlayer'] as const) {
    if (next[key].typeId !== typeId) continue;
    next = { ...next, [key]: { ...next[key], typeId: '' } };
  }
  return next;
};

export const deleteGameTypeCascade = (
  state: TrackplayState,
  type: GameType
): TrackplayState => {
  const gameTypes = { ...state.gameTypes };
  delete gameTypes[type.id];
  return {
    ...state,
    gameTypes,
    games: reassignGamesToDefaultType(state.games, type.id),
    config: clearDeletedTypeFromFilters(state.config, type.id),
  };
};
