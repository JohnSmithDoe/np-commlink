/* ─── why ─────────────────────────────────────────────────────────
 * `gameItems` composes rather than duplicates: `filterAndSortItemList` does
 * the search, the type token (a real `categoryIds` match) and the sort, and
 * the two lines after it are the parts the shared helper has no concept of
 * — endedness as a second filter axis, and ended-last as a grouping pass.
 * `toSorted` is stable, so the sort the helper applied survives inside each
 * group.
 * ───────────────────────────────────────────────────────────────── */

import { createSelector } from '@ngrx/store';
import { selectRouteEntityId } from '../../../@shared/data/router/router.selector';
import { ItemList, SearchResult } from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import {
  Game,
  GAMES_LIST_ID,
  Round,
  TrackplayId,
} from '../../model/trackplay.types';
import { gameTypeIdOf } from '../../util/game-type.utils';
import {
  selectGamesForPlayerView,
  selectGamesList,
  selectGameTypesList,
} from '../trackplay.selector';

const endedLast = (a: Game, b: Game): number =>
  (a.ended ? 1 : 0) - (b.ended ? 1 : 0);

const gameItems = (
  list: ItemList<Game> & { showEndedGames: boolean },
  result?: SearchResult<Game>
): Game[] => {
  return filterAndSortItemList(list, result)
    .filter((game) => list.showEndedGames || !game.ended)
    .toSorted(endedLast);
};

export const computeScores = (game: Game): Record<TrackplayId, number> => {
  const scores: Record<TrackplayId, number> = {};
  for (const playerId of game.playerIds) {
    let sum = 0;
    for (const round of game.rounds) {
      sum += round.values[playerId] ?? 0;
    }
    scores[playerId] = sum;
  }
  return scores;
};

const rankPlayersByScore = (
  playerIds: TrackplayId[],
  scores: Record<TrackplayId, number>,
  isWinHigh: boolean
): TrackplayId[] => {
  return playerIds.toSorted((a, b) => {
    return isWinHigh
      ? (scores[b] ?? 0) - (scores[a] ?? 0)
      : (scores[a] ?? 0) - (scores[b] ?? 0);
  });
};

export const leadersByScore = (
  playerIds: TrackplayId[],
  scores: Record<TrackplayId, number>,
  isWinHigh: boolean
): TrackplayId[] => {
  const [best, ...rest] = rankPlayersByScore(playerIds, scores, isWinHigh);
  if (best === undefined) return [];

  const top = scores[best] ?? 0;
  return [best, ...rest.filter((id) => (scores[id] ?? 0) === top)];
};

export const selectGameItems = createSelector(
  selectGamesList,
  (list): Game[] => list.items
);

export const selectGamesSearchResult = createSelector(
  selectGamesList,
  (list): SearchResult<Game> | undefined => filterListBySearchQuery(list)
);

export const selectGamesListItems = createSelector(
  selectGamesList,
  selectGamesSearchResult,
  (list, result): Game[] => gameItems(list, result)
);

export const selectGameCount = createSelector(
  selectGameItems,
  (games): number => games.length
);

export const selectGameById = (gameId: TrackplayId) => {
  return createSelector(selectGameItems, (games): Game | undefined =>
    games.find((game) => game.id === gameId)
  );
};

export const selectRoundsByGame = (gameId: TrackplayId) =>
  createSelector(selectGameById(gameId), (game): Round[] => game?.rounds ?? []);

export const selectScoresByGame = (gameId: TrackplayId) => {
  return createSelector(
    selectGameById(gameId),
    (game): Record<TrackplayId, number> => (game ? computeScores(game) : {})
  );
};

export const selectRankingByGame = (gameId: TrackplayId) => {
  return createSelector(
    selectGameById(gameId),
    selectGameTypesList,
    (game, gameTypes): TrackplayId[] => {
      if (!game) return [];
      const isWinHigh =
        gameTypes.items.find((type) => type.id === gameTypeIdOf(game))
          ?.winHigh ?? true;
      return rankPlayersByScore(game.playerIds, computeScores(game), isWinHigh);
    }
  );
};

export const selectLeadersByGame = (gameId: TrackplayId) => {
  return createSelector(
    selectGameById(gameId),
    selectGameTypesList,
    (game, gameTypes): TrackplayId[] => {
      if (!game) return [];
      const isWinHigh =
        gameTypes.items.find((type) => type.id === gameTypeIdOf(game))
          ?.winHigh ?? true;
      return leadersByScore(game.playerIds, computeScores(game), isWinHigh);
    }
  );
};

export const selectGamesForPlayerList = createSelector(
  selectGamesList,
  selectGamesForPlayerView,
  selectRouteEntityId,
  (list, view, playerId): ItemList<Game> & { showEndedGames: boolean } => {
    return {
      ...view,
      id: GAMES_LIST_ID,
      items: playerId
        ? list.items.filter((game) => game.playerIds.includes(playerId))
        : [],
    };
  }
);

export const selectGamesForPlayerSearchResult = createSelector(
  selectGamesForPlayerList,
  (list): SearchResult<Game> | undefined => filterListBySearchQuery(list)
);

export const selectGamesForPlayerItems = createSelector(
  selectGamesForPlayerList,
  selectGamesForPlayerSearchResult,
  (list, result): Game[] => gameItems(list, result)
);
