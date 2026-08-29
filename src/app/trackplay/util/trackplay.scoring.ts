import { Timestamp } from '../../@shared/model/app.types';
import {
  Game,
  GamesState,
  PlayersState,
  Round,
  TrackplayId,
} from '../model/trackplay.types';
import { createRound } from './trackplay.factory';

const isRoundBlank = (round?: Round): boolean =>
  !!round && Object.values(round.values).every((v) => !v);

const gameById = (games: GamesState, gameId: TrackplayId): Game | undefined =>
  games.items.find((game) => game.id === gameId);

const withGame = (games: GamesState, next: Game): GamesState => ({
  ...games,
  items: games.items.map((game) => (game.id === next.id ? next : game)),
});

const withBlankRound = (game: Game, roundId: TrackplayId): Game => ({
  ...game,
  rounds: [...game.rounds, createRound(roundId)],
});

export const ensureTrailingBlankRound = (
  games: GamesState,
  gameId: TrackplayId,
  roundId: TrackplayId
): GamesState => {
  const game = gameById(games, gameId);
  if (!game || game.ended) return games;
  if (game.rounds.length > 0 && isRoundBlank(game.rounds.at(-1))) return games;
  return withGame(games, withBlankRound(game, roundId));
};

const withRoundValue = (
  game: Game,
  roundId: TrackplayId,
  playerId: TrackplayId,
  value: number
): Game => ({
  ...game,
  rounds: game.rounds.map((round) =>
    round.id === roundId
      ? { ...round, values: { ...round.values, [playerId]: value } }
      : round
  ),
});

const shouldAppendBlankRound = (
  game: Game,
  roundId: TrackplayId,
  value: number
): boolean => game.rounds.at(-1)?.id === roundId && value !== 0;

export const setRoundValue = (
  games: GamesState,
  gameId: TrackplayId,
  roundId: TrackplayId,
  playerId: TrackplayId,
  value: number,
  at: Timestamp,
  nextRoundId: TrackplayId
): GamesState => {
  const game = gameById(games, gameId);
  const round = game?.rounds.find((r) => r.id === roundId);
  if (!game || !round) return games;
  if (round.values[playerId] === value) return games;
  const scored = withRoundValue(game, roundId, playerId, value);
  const grown = shouldAppendBlankRound(game, roundId, value)
    ? withBlankRound(scored, nextRoundId)
    : scored;
  return withGame(games, { ...grown, updatedAt: at });
};

export const stampParticipants = (
  players: PlayersState,
  games: GamesState,
  gameId: TrackplayId,
  at: Timestamp
): PlayersState => {
  const game = gameById(games, gameId);
  if (!game) return players;
  const roster = new Set(game.playerIds);
  return {
    ...players,
    items: players.items.map((player) =>
      roster.has(player.id) ? { ...player, lastPlayedAt: at } : player
    ),
  };
};
