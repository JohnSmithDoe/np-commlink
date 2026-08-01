import { IGame, IRound, ITrackplayState, TID } from '../model/trackplay.types';
import { createRound } from './trackplay.factory';

/**
 * Writing a score, and the trailing blank round the scoring grid always shows.
 *
 * Pure state→state transforms, so they live here rather than in `data/`: they
 * import no `@ngrx`, and the reducer that calls them reads as its handler table
 * once they are out of it.
 */

const isRoundBlank = (round?: IRound): boolean =>
  !!round && Object.values(round.values).every((v) => !v);

const appendBlankRound = (
  state: ITrackplayState,
  game: IGame
): ITrackplayState => {
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

/** Guarantee the trailing blank round the scoring grid always shows. */
export const ensureTrailingBlankRound = (
  state: ITrackplayState,
  gameId: TID
): ITrackplayState => {
  const game = state.games[gameId];
  if (!game || game.ended) return state;
  const lastRoundId = game.rounds.at(-1);
  const lastRound = lastRoundId ? state.rounds[lastRoundId] : undefined;
  if (game.rounds.length > 0 && isRoundBlank(lastRound)) return state;
  return appendBlankRound(state, game);
};

const withRoundValue = (
  state: ITrackplayState,
  round: IRound,
  playerId: TID,
  value: number
): ITrackplayState => ({
  ...state,
  rounds: {
    ...state.rounds,
    [round.id]: { ...round, values: { ...round.values, [playerId]: value } },
  },
});

// Scoring the trailing round means the game continues, so a fresh blank row has
// to appear below it. A zero is not a score — it is the blank's own value.
const shouldAppendBlankRound = (
  game: IGame,
  roundId: TID,
  value: number
): boolean => game.rounds.at(-1) === roundId && value !== 0;

const touchGameAndPlayers = (
  state: ITrackplayState,
  gameId: TID,
  now: number
): ITrackplayState => {
  // Re-read rather than take the caller's `game`: `appendBlankRound` may have
  // replaced it in the state handed over, and stamping the stale copy would drop
  // the round it just added.
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
  state: ITrackplayState,
  gameId: TID,
  roundId: TID,
  playerId: TID,
  value: number,
  now: number
): ITrackplayState => {
  const game = state.games[gameId];
  const round = state.rounds[roundId];
  if (!game || !round) return state;
  // Every cell blur dispatches, changed or not. Without this the unchanged case
  // still bumped the game's `updated` and every participant's `lastPlayed` —
  // and returning `state` itself, rather than an equal copy, is what also keeps
  // the write off the disk: the save effect persists on a change of the slice
  // reference, not on the action.
  if (round.values[playerId] === value) return state;
  const scored = withRoundValue(state, round, playerId, value);
  const grown = shouldAppendBlankRound(game, roundId, value)
    ? appendBlankRound(scored, game)
    : scored;
  return touchGameAndPlayers(grown, gameId, now);
};
