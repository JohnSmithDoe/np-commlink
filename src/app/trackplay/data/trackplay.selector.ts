import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  Game,
  GameConfig,
  GameType,
  Player,
  PlayerStats,
  Round,
  TrackplayConfig,
  TrackplayDeleted,
  TrackplayState,
  TrackplayId,
} from '../model/trackplay.types';
import {
  DEFAULT_GAME_TYPE_ID,
  NO_PLAYER_STATS,
} from '../util/trackplay.factory';
import { matchesSearch } from '../../@shared/util/app.utils';

export const TRACKPLAY_STATE_KEY = 'trackplay';

const selectTrackplayState =
  createFeatureSelector<TrackplayState>(TRACKPLAY_STATE_KEY);

export const selectTrackplayPersisted = createSelector(
  selectTrackplayState,
  (state): TrackplayState => ({ ...state, lastDeleted: null })
);

export const selectPlayers = createSelector(
  selectTrackplayState,
  (state): Record<TrackplayId, Player> => state.players
);
export const selectGames = createSelector(
  selectTrackplayState,
  (state): Record<TrackplayId, Game> => state.games
);
export const selectGameTypes = createSelector(
  selectTrackplayState,
  (state): Record<TrackplayId, GameType> => state.gameTypes
);
const selectRounds = createSelector(
  selectTrackplayState,
  (state): Record<TrackplayId, Round> => state.rounds
);
export const selectTrackplayConfig = createSelector(
  selectTrackplayState,
  (state): TrackplayConfig => state.config
);
export const selectLastDeleted = createSelector(
  selectTrackplayState,
  (state): TrackplayDeleted | null => state.lastDeleted
);

const byGameSort =
  (config: GameConfig) =>
  (a: Game, b: Game): number => {
    const [x, y] = config.direction === 'desc' ? [b, a] : [a, b];
    switch (config.sort) {
      case 'name': {
        return x.name.localeCompare(y.name);
      }
      case 'date': {
        return x.created - y.created;
      }
      case 'updated': {
        return x.updated - y.updated;
      }
    }
  };

const endedLast = (a: Game, b: Game): number =>
  (a.ended ? 1 : 0) - (b.ended ? 1 : 0);

const matchesGameConfig = (game: Game, config: GameConfig): boolean =>
  matchesSearch(game.name, config.filter) &&
  (config.typeId === '' || game.type === config.typeId) &&
  (config.showEndedGames || !game.ended);

const sortedAndFilteredGames = (
  games: Game[],
  config: GameConfig,
  extraFilter: (game: Game) => boolean = () => true
): Game[] =>
  games
    .filter((game) => matchesGameConfig(game, config) && extraFilter(game))
    .toSorted(byGameSort(config))
    .toSorted(endedLast); // stable, so the sort above survives inside each group

const byPlayerSort =
  (config: TrackplayConfig['players']) =>
  (a: Player, b: Player): number => {
    const [x, y] = config.direction === 'desc' ? [b, a] : [a, b];
    switch (config.sort) {
      case 'name': {
        return x.name.localeCompare(y.name);
      }
      case 'date': {
        return x.created - y.created;
      }
      case 'last': {
        return (x.lastPlayed ?? 0) - (y.lastPlayed ?? 0);
      }
    }
  };

const sortedAndFilteredPlayers = (
  players: Player[],
  config: TrackplayConfig['players']
): Player[] =>
  players
    .filter((player) => matchesSearch(player.name, config.filter))
    .toSorted(byPlayerSort(config));

const rankPlayersByScore = (
  playerIds: TrackplayId[],
  scores: Record<TrackplayId, number>,
  winHigh: boolean
): TrackplayId[] =>
  playerIds.toSorted((a, b) =>
    winHigh
      ? (scores[b] ?? 0) - (scores[a] ?? 0)
      : (scores[a] ?? 0) - (scores[b] ?? 0)
  );

const computeScores = (
  game: Game,
  rounds: Record<TrackplayId, Round>
): Record<TrackplayId, number> => {
  const scores: Record<TrackplayId, number> = {};
  for (const playerId of game.players) {
    let sum = 0;
    for (const roundId of game.rounds) {
      sum += rounds[roundId]?.values[playerId] ?? 0;
    }
    scores[playerId] = sum;
  }
  return scores;
};

export const selectGameList = createSelector(
  selectGames,
  selectTrackplayConfig,
  (games, config): Game[] =>
    sortedAndFilteredGames(Object.values(games), config.games)
);

export const selectPlayerList = createSelector(
  selectPlayers,
  selectTrackplayConfig,
  (players, config): Player[] =>
    sortedAndFilteredPlayers(Object.values(players), config.players)
);

export const selectGameTypeList = createSelector(
  selectGameTypes,
  (gameTypes): GameType[] =>
    Object.values(gameTypes).toSorted((a, b) => {
      if (a.id === DEFAULT_GAME_TYPE_ID) return -1;
      if (b.id === DEFAULT_GAME_TYPE_ID) return 1;
      return a.name.localeCompare(b.name);
    })
);

export const selectGameById = (gameId: TrackplayId) =>
  createSelector(selectGames, (games): Game | undefined => games[gameId]);

export const selectPlayerById = (playerId: TrackplayId) =>
  createSelector(
    selectPlayers,
    (players): Player | undefined => players[playerId]
  );

export const selectRoundsByGame = (gameId: TrackplayId) =>
  createSelector(selectGames, selectRounds, (games, rounds): Round[] => {
    const game = games[gameId];
    if (!game) return [];
    return game.rounds
      .map((rId) => rounds[rId])
      .filter((r): r is Round => !!r)
      .toSorted((a, b) => a.idx - b.idx);
  });

export const selectScoresByGame = (gameId: TrackplayId) =>
  createSelector(
    selectGames,
    selectRounds,
    (games, rounds): Record<TrackplayId, number> => {
      const game = games[gameId];
      return game ? computeScores(game, rounds) : {};
    }
  );

export const selectResultByGame = (gameId: TrackplayId) =>
  createSelector(
    selectGames,
    selectPlayers,
    selectGameTypes,
    selectRounds,
    (games, players, gameTypes, rounds): Player[] => {
      const game = games[gameId];
      if (!game) return [];
      const scores = computeScores(game, rounds);
      const winHigh = gameTypes[game.type]?.winHigh ?? true;
      return rankPlayersByScore(game.players, scores, winHigh)
        .map((pid) => players[pid])
        .filter((p): p is Player => !!p);
    }
  );

export const selectGamesForPlayer = (playerId: TrackplayId) =>
  createSelector(selectGames, selectTrackplayConfig, (games, config): Game[] =>
    sortedAndFilteredGames(
      Object.values(games),
      config.gamesForPlayer,
      (game) => game.players.includes(playerId)
    )
  );

const zeroedStatsPerPlayer = (
  players: Record<TrackplayId, Player>
): Record<TrackplayId, PlayerStats> =>
  Object.fromEntries(
    Object.keys(players).map((playerId) => [playerId, { ...NO_PLAYER_STATS }])
  );

const countParticipation = (
  stats: Record<TrackplayId, PlayerStats>,
  game: Game
): void => {
  for (const playerId of game.players) {
    const playerStats = stats[playerId];
    if (!playerStats) continue;
    playerStats.play++;
    if (!game.ended) playerStats.open++;
  }
};

const awardWinAndLosses = (
  stats: Record<TrackplayId, PlayerStats>,
  ranked: TrackplayId[]
): void => {
  for (const [rank, playerId] of ranked.entries()) {
    const playerStats = stats[playerId];
    if (!playerStats) continue;
    if (rank === 0) playerStats.win++;
    else playerStats.loss++;
  }
};

export const selectPlayerStats = createSelector(
  selectPlayers,
  selectGames,
  selectGameTypes,
  selectRounds,
  (players, games, gameTypes, rounds): Record<TrackplayId, PlayerStats> => {
    const stats = zeroedStatsPerPlayer(players);
    for (const game of Object.values(games)) {
      countParticipation(stats, game);
      if (!game.ended) continue;
      const winHigh = gameTypes[game.type]?.winHigh ?? true;
      const ranked = rankPlayersByScore(
        game.players,
        computeScores(game, rounds),
        winHigh
      );
      awardWinAndLosses(stats, ranked);
    }
    return stats;
  }
);

export const selectStatsForPlayer = (playerId: TrackplayId) =>
  createSelector(
    selectPlayerStats,
    (stats): PlayerStats => stats[playerId] ?? { ...NO_PLAYER_STATS }
  );

export const selectGameCount = createSelector(
  selectGames,
  (games) => Object.keys(games ?? {}).length
);
