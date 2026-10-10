import { createSelector } from '@ngrx/store';
import { selectRouteEntityId } from '../../../@shared/data/router/router.selector';
import { PlayerStats, TrackplayId } from '../../model/trackplay.types';
import { NO_PLAYER_STATS } from '../../util/trackplay.factory';
import { gameTypeIdOf } from '../../util/game-type.utils';
import { computeScores, leadersByScore } from '../games/games.selector';
import { selectGamesList, selectGameTypesList } from '../trackplay.selector';

const statsOf = (
  stats: Record<TrackplayId, PlayerStats>,
  playerId: TrackplayId
): PlayerStats => (stats[playerId] ??= { ...NO_PLAYER_STATS });

export const selectPlayerStats = createSelector(
  selectGamesList,
  selectGameTypesList,
  (games, gameTypes): Record<TrackplayId, PlayerStats> => {
    const stats: Record<TrackplayId, PlayerStats> = {};
    for (const game of games.items) {
      for (const playerId of game.playerIds) {
        const playerStats = statsOf(stats, playerId);
        playerStats.play++;
        if (!game.ended) playerStats.open++;
      }
      if (!game.ended) continue;
      const winHigh =
        gameTypes.items.find((type) => type.id === gameTypeIdOf(game))
          ?.winHigh ?? true;
      const leaders = leadersByScore(
        game.playerIds,
        computeScores(game),
        winHigh
      );
      const drawn = leaders.length > 1;

      for (const playerId of game.playerIds) {
        const playerStats = statsOf(stats, playerId);
        if (!leaders.includes(playerId)) playerStats.loss++;
        else if (!drawn) playerStats.win++;
      }
    }
    return stats;
  }
);

export const selectStatsForRoutePlayer = createSelector(
  selectPlayerStats,
  selectRouteEntityId,
  (stats, playerId): PlayerStats =>
    (playerId ? stats[playerId] : undefined) ?? { ...NO_PLAYER_STATS }
);
