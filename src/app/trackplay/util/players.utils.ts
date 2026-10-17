import { Timestamp } from '../../@shared/model/app.types';
import { PersonRef } from '../../@shared/model/person.types';
import { Game, Player, TrackplayId } from '../model/trackplay.types';

const lastPlayedAtById = (
  games: readonly Game[]
): Map<TrackplayId, Timestamp> => {
  const latest = new Map<TrackplayId, Timestamp>();
  for (const game of games) {
    for (const playerId of game.playerIds) {
      const seen = latest.get(playerId);
      if (!seen || game.updatedAt > seen) latest.set(playerId, game.updatedAt);
    }
  }
  return latest;
};

export const playersFrom = (
  people: readonly PersonRef[],
  games: readonly Game[]
): Player[] => {
  const lastPlayedAt = lastPlayedAtById(games);
  return people
    .filter((person) => person.kind === 'person')
    .map((person) => {
      return {
        ...person,
        lastPlayedAt: lastPlayedAt.get(person.id),
      };
    });
};
