import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  IGame,
  IGameConfig,
  IGameType,
  IPlayer,
  IPlayerStats,
  IRound,
  ITrackplayConfig,
  ITrackplayDeleted,
  ITrackplayState,
  TID,
} from '../../model/trackplay.types';
import { DEFAULT_GAME_TYPE_ID } from '../../util/trackplay.factory';

export const selectTrackplayState =
  createFeatureSelector<ITrackplayState>('trackplay');

/**
 * What reaches disk. `lastDeleted` is a transient whole-slice undo snapshot that
 * only lives for the 8s of the toast, so persisting it duplicated players, games,
 * types and rounds inside the document from the first delete onward — and every
 * later write carried the copy again. The reducer already nulls it on hydration,
 * so dropping it changes nothing that survives a reload.
 */
export const selectTrackplayPersisted = createSelector(
  selectTrackplayState,
  (state): ITrackplayState => ({ ...state, lastDeleted: null })
);

// ── map slices ───────────────────────────────────────────────────────────────
export const selectPlayers = createSelector(
  selectTrackplayState,
  (state): Record<TID, IPlayer> => state.players
);
export const selectGames = createSelector(
  selectTrackplayState,
  (state): Record<TID, IGame> => state.games
);
export const selectGameTypes = createSelector(
  selectTrackplayState,
  (state): Record<TID, IGameType> => state.gameTypes
);
export const selectRounds = createSelector(
  selectTrackplayState,
  (state): Record<TID, IRound> => state.rounds
);
export const selectTrackplayConfig = createSelector(
  selectTrackplayState,
  (state): ITrackplayConfig => state.config
);
export const selectLastDeleted = createSelector(
  selectTrackplayState,
  (state): ITrackplayDeleted | null => state.lastDeleted
);

// ── sort / filter helpers (port of legacy data.service) ──────────────────────
const matchesFilter = (name: string, filter: string): boolean =>
  filter === '' || name.toLowerCase().includes(filter.toLowerCase());

const byGameSort =
  (config: IGameConfig) =>
  (a: IGame, b: IGame): number => {
    const [x, y] = config.dir === 'desc' ? [b, a] : [a, b];
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

// Ended games always sink to the bottom, regardless of the chosen sort.
const endedLast = (a: IGame, b: IGame): number =>
  (a.ended ? 1 : 0) - (b.ended ? 1 : 0);

const matchesGameConfig = (game: IGame, config: IGameConfig): boolean =>
  matchesFilter(game.name, config.filter) &&
  (config.typeId === '' || game.type === config.typeId) &&
  (config.showEndedGames || !game.ended);

const sortedAndFilteredGames = (games: IGame[], config: IGameConfig): IGame[] =>
  games
    .toSorted(byGameSort(config))
    .toSorted(endedLast) // stable, so the sort above survives inside each group
    .filter((game) => matchesGameConfig(game, config));

const byPlayerSort =
  (config: ITrackplayConfig['players']) =>
  (a: IPlayer, b: IPlayer): number => {
    const [x, y] = config.dir === 'desc' ? [b, a] : [a, b];
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
  players: IPlayer[],
  config: ITrackplayConfig['players']
): IPlayer[] =>
  players
    .toSorted(byPlayerSort(config))
    .filter((player) => matchesFilter(player.name, config.filter));

// Best first — which end that is depends on the game type's `winHigh`.
const rankPlayersByScore = (
  playerIds: TID[],
  scores: Record<TID, number>,
  winHigh: boolean
): TID[] =>
  playerIds.toSorted((a, b) =>
    winHigh
      ? (scores[b] ?? 0) - (scores[a] ?? 0)
      : (scores[a] ?? 0) - (scores[b] ?? 0)
  );

const computeScores = (
  game: IGame,
  rounds: Record<TID, IRound>
): Record<TID, number> => {
  const scores: Record<TID, number> = {};
  for (const playerId of game.players) {
    let sum = 0;
    for (const roundId of game.rounds) {
      sum += rounds[roundId]?.values[playerId] ?? 0;
    }
    scores[playerId] = sum;
  }
  return scores;
};

// ── list selectors ───────────────────────────────────────────────────────────
export const selectGameList = createSelector(
  selectGames,
  selectTrackplayConfig,
  (games, config): IGame[] =>
    sortedAndFilteredGames(Object.values(games), config.games)
);

export const selectPlayerList = createSelector(
  selectPlayers,
  selectTrackplayConfig,
  (players, config): IPlayer[] =>
    sortedAndFilteredPlayers(Object.values(players), config.players)
);

// Game types sorted with `default` first, then alphabetical.
export const selectGameTypeList = createSelector(
  selectGameTypes,
  (gameTypes): IGameType[] =>
    Object.values(gameTypes).toSorted((a, b) => {
      if (a.id === DEFAULT_GAME_TYPE_ID) return -1;
      if (b.id === DEFAULT_GAME_TYPE_ID) return 1;
      return a.name.localeCompare(b.name);
    })
);

// ── parameterized selectors ───────────────────────────────────────────────────
export const selectGameById = (gameId: TID) =>
  createSelector(selectGames, (games): IGame | undefined => games[gameId]);

export const selectPlayerById = (playerId: TID) =>
  createSelector(
    selectPlayers,
    (players): IPlayer | undefined => players[playerId]
  );

export const selectRoundsByGame = (gameId: TID) =>
  createSelector(selectGames, selectRounds, (games, rounds): IRound[] => {
    const game = games[gameId];
    if (!game) return [];
    return game.rounds
      .map((rId) => rounds[rId])
      .filter((r): r is IRound => !!r)
      .toSorted((a, b) => a.idx - b.idx);
  });

// selectScoresByGame(gameId) -> { playerId: totalPoints } (DERIVED, never stored).
export const selectScoresByGame = (gameId: TID) =>
  createSelector(
    selectGames,
    selectRounds,
    (games, rounds): Record<TID, number> => {
      const game = games[gameId];
      return game ? computeScores(game, rounds) : {};
    }
  );

// selectResultByGame(gameId) -> participants ranked by the game type's winHigh rule.
export const selectResultByGame = (gameId: TID) =>
  createSelector(
    selectGames,
    selectPlayers,
    selectGameTypes,
    selectRounds,
    (games, players, gameTypes, rounds): IPlayer[] => {
      const game = games[gameId];
      if (!game) return [];
      const scores = computeScores(game, rounds);
      const winHigh = gameTypes[game.type]?.winHigh ?? true;
      return rankPlayersByScore(game.players, scores, winHigh)
        .map((pid) => players[pid])
        .filter((p): p is IPlayer => !!p);
    }
  );

// selectWinnerByGame(gameId) -> rank-1 player (or undefined).
export const selectWinnerByGame = (gameId: TID) =>
  createSelector(
    selectResultByGame(gameId),
    (result): IPlayer | undefined => result[0]
  );

// selectGamesForPlayer(playerId) -> that player's games, per the gamesForPlayer config.
export const selectGamesForPlayer = (playerId: TID) =>
  createSelector(selectGames, selectTrackplayConfig, (games, config): IGame[] =>
    sortedAndFilteredGames(Object.values(games), config.gamesForPlayer).filter(
      (game) => game.players.includes(playerId)
    )
  );

const NO_PLAYER_STATS: IPlayerStats = { play: 0, win: 0, loss: 0, open: 0 };

const zeroedStatsPerPlayer = (
  players: Record<TID, IPlayer>
): Record<TID, IPlayerStats> =>
  Object.fromEntries(
    Object.keys(players).map((playerId) => [playerId, { ...NO_PLAYER_STATS }])
  );

const countParticipation = (
  stats: Record<TID, IPlayerStats>,
  game: IGame
): void => {
  for (const playerId of game.players) {
    const playerStats = stats[playerId];
    if (!playerStats) continue;
    playerStats.play++;
    if (!game.ended) playerStats.open++;
  }
};

// Only rank 1 counts as a win; everyone else in an ended game took a loss.
const awardWinAndLosses = (
  stats: Record<TID, IPlayerStats>,
  ranked: TID[]
): void => {
  for (const [rank, playerId] of ranked.entries()) {
    const playerStats = stats[playerId];
    if (!playerStats) continue;
    if (rank === 0) playerStats.win++;
    else playerStats.loss++;
  }
};

// playerStats -> { playerId: {play, win, loss, open} } (DERIVED from games+rounds).
export const selectPlayerStats = createSelector(
  selectPlayers,
  selectGames,
  selectGameTypes,
  selectRounds,
  (players, games, gameTypes, rounds): Record<TID, IPlayerStats> => {
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

export const selectStatsForPlayer = (playerId: TID) =>
  createSelector(
    selectPlayerStats,
    (stats): IPlayerStats => stats[playerId] ?? { ...NO_PLAYER_STATS }
  );

// Total number of games (all types, ended or not) on the deck's TRACKPLAY tile.
export const selectGameCount = createSelector(
  selectGames,
  (games) => Object.keys(games ?? {}).length
);
