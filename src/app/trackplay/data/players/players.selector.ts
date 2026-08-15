import { createSelector } from '@ngrx/store';
import { SearchResult } from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { Player, PlayerStats, TrackplayId } from '../../model/trackplay.types';
import { NO_PLAYER_STATS } from '../../util/trackplay.factory';
import { gameTypeIdOf } from '../../util/game-type.utils';
import { computeScores, rankPlayersByScore } from '../games/games.selector';
import {
  selectGamesList,
  selectGameTypesList,
  selectPlayersList,
  selectRoutePlayerId,
} from '../trackplay.selector';

export const selectPlayerItems = createSelector(
  selectPlayersList,
  (list): Player[] => list.items
);

export const selectPlayersSearchResult = createSelector(
  selectPlayersList,
  (list): SearchResult<Player> | undefined => filterListBySearchQuery(list)
);

export const selectPlayersListItems = createSelector(
  selectPlayersList,
  selectPlayersSearchResult,
  (list, result): Player[] => filterAndSortItemList(list, result)
);

export const selectRoutePlayer = createSelector(
  selectPlayerItems,
  selectRoutePlayerId,
  (players, playerId): Player | undefined =>
    players.find((player) => player.id === playerId)
);

const zeroedStatsPerPlayer = (
  players: readonly Player[]
): Record<TrackplayId, PlayerStats> =>
  Object.fromEntries(
    players.map((player) => [player.id, { ...NO_PLAYER_STATS }])
  );

export const selectPlayerStats = createSelector(
  selectPlayerItems,
  selectGamesList,
  selectGameTypesList,
  (players, games, gameTypes): Record<TrackplayId, PlayerStats> => {
    const stats = zeroedStatsPerPlayer(players);
    for (const game of games.items) {
      for (const playerId of game.playerIds) {
        const playerStats = stats[playerId];
        if (!playerStats) continue;
        playerStats.play++;
        if (!game.ended) playerStats.open++;
      }
      if (!game.ended) continue;
      const winHigh =
        gameTypes.items.find((type) => type.id === gameTypeIdOf(game))
          ?.winHigh ?? true;
      const ranked = rankPlayersByScore(
        game.playerIds,
        computeScores(game),
        winHigh
      );
      for (const [rank, playerId] of ranked.entries()) {
        const playerStats = stats[playerId];
        if (!playerStats) continue;
        if (rank === 0) playerStats.win++;
        else playerStats.loss++;
      }
    }
    return stats;
  }
);

export const selectStatsForRoutePlayer = createSelector(
  selectPlayerStats,
  selectRoutePlayerId,
  (stats, playerId): PlayerStats =>
    (playerId ? stats[playerId] : undefined) ?? { ...NO_PLAYER_STATS }
);
