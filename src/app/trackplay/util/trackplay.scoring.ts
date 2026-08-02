import {
  Game,
  Round,
  TrackplayState,
  TrackplayId,
} from '../model/trackplay.types';
import { createRound } from './trackplay.factory';

const isRoundBlank = (round?: Round): boolean =>
  !!round && Object.values(round.values).every((v) => !v);

const appendBlankRound = (
  state: TrackplayState,
  game: Game
): TrackplayState => {
  const blank = createRound(game.rounds.length, game.players);
  return {
    ...state,
    rounds: { ...state.rounds, [blank.id]: blank },
    games: {
      ...state.games,
      [game.id]: { ...game, rounds: [...game.rounds, blank.id] },
    },
  };
};

export const ensureTrailingBlankRound = (
  state: TrackplayState,
  gameId: TrackplayId
): TrackplayState => {
  const game = state.games[gameId];
  if (!game || game.ended) return state;
  const lastRoundId = game.rounds.at(-1);
  const lastRound = lastRoundId ? state.rounds[lastRoundId] : undefined;
  if (game.rounds.length > 0 && isRoundBlank(lastRound)) return state;
  return appendBlankRound(state, game);
};

const withRoundValue = (
  state: TrackplayState,
  round: Round,
  playerId: TrackplayId,
  value: number
): TrackplayState => ({
  ...state,
  rounds: {
    ...state.rounds,
    [round.id]: { ...round, values: { ...round.values, [playerId]: value } },
  },
});

const shouldAppendBlankRound = (
  game: Game,
  roundId: TrackplayId,
  value: number
): boolean => game.rounds.at(-1) === roundId && value !== 0;

const touchGameAndPlayers = (
  state: TrackplayState,
  gameId: TrackplayId,
  now: number
): TrackplayState => {
  const game = state.games[gameId];
  if (!game) return state;
  const players = { ...state.players };
  for (const playerId of game.players) {
    const player = players[playerId];
    if (player) players[playerId] = { ...player, lastPlayed: now };
  }
  return {
    ...state,
    games: { ...state.games, [gameId]: { ...game, updated: now } },
    players,
  };
};

export const setRoundValue = (
  state: TrackplayState,
  gameId: TrackplayId,
  roundId: TrackplayId,
  playerId: TrackplayId,
  value: number,
  now: number
): TrackplayState => {
  const game = state.games[gameId];
  const round = state.rounds[roundId];
  if (!game || !round) return state;
  if (round.values[playerId] === value) return state;
  const scored = withRoundValue(state, round, playerId, value);
  const grown = shouldAppendBlankRound(game, roundId, value)
    ? appendBlankRound(scored, game)
    : scored;
  return touchGameAndPlayers(grown, gameId, now);
};
