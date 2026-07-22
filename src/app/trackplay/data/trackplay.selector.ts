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
} from '../model';
import { DEFAULT_GAME_TYPE_ID } from '../util/trackplay.factory';

export const selectTrackplayState =
  createFeatureSelector<ITrackplayState>('trackplay');

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

const configureGames = (games: IGame[], config: IGameConfig): IGame[] => {
  const sorted = games.toSorted((a, b) => {
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
    return 0;
  });
  // Ended games always sink to the bottom, regardless of the sort above.
  sorted.sort((a, b) => (a.ended ? 1 : 0) - (b.ended ? 1 : 0));
  return sorted.filter((game) => {
    if (!matchesFilter(game.name, config.filter)) return false;
    if (config.typeId !== '' && game.type !== config.typeId) return false;
    if (!config.showEndedGames && game.ended) return false;
    return true;
  });
};

const configurePlayers = (
  players: IPlayer[],
  config: ITrackplayConfig['players']
): IPlayer[] => {
  const sorted = players.toSorted((a, b) => {
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
    return 0;
  });
  return sorted.filter((player) => matchesFilter(player.name, config.filter));
};

const rankByType = (
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
  for (const pid of game.players) {
    let sum = 0;
    for (const rId of game.rounds) {
      sum += rounds[rId]?.values[pid] ?? 0;
    }
    scores[pid] = sum;
  }
  return scores;
};

// ── list selectors ───────────────────────────────────────────────────────────
export const selectGameList = createSelector(
  selectGames,
  selectTrackplayConfig,
  (games, config): IGame[] => configureGames(Object.values(games), config.games)
);

export const selectPlayerList = createSelector(
  selectPlayers,
  selectTrackplayConfig,
  (players, config): IPlayer[] =>
    configurePlayers(Object.values(players), config.players)
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
      return rankByType(game.players, scores, winHigh)
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
    configureGames(Object.values(games), config.gamesForPlayer).filter((game) =>
      game.players.includes(playerId)
    )
  );

// playerStats -> { playerId: {play, win, loss, open} } (DERIVED from games+rounds).
export const selectPlayerStats = createSelector(
  selectPlayers,
  selectGames,
  selectGameTypes,
  selectRounds,
  (players, games, gameTypes, rounds): Record<TID, IPlayerStats> => {
    const stats: Record<TID, IPlayerStats> = {};
    for (const pid of Object.keys(players)) {
      stats[pid] = { play: 0, win: 0, loss: 0, open: 0 };
    }
    for (const game of Object.values(games)) {
      for (const pid of game.players) {
        const s = stats[pid];
        if (!s) continue;
        s.play++;
        if (!game.ended) s.open++;
      }
      if (!game.ended) continue;
      const scores = computeScores(game, rounds);
      const winHigh = gameTypes[game.type]?.winHigh ?? true;
      for (const [index, pid] of rankByType(
        game.players,
        scores,
        winHigh
      ).entries()) {
        const s = stats[pid];
        if (!s) continue;
        if (index === 0) s.win++;
        else s.loss++;
      }
    }
    return stats;
  }
);

export const selectStatsForPlayer = (playerId: TID) =>
  createSelector(
    selectPlayerStats,
    (stats): IPlayerStats =>
      stats[playerId] ?? { play: 0, win: 0, loss: 0, open: 0 }
  );
