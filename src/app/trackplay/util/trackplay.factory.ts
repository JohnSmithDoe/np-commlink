import {
  IGame,
  IGameType,
  IPlayer,
  IRound,
  ITrackplayConfig,
  TID,
} from '../model';
import { uuidv4 } from '../../@shared/util/app.utils';

/**
 * Production factories + seed data for the trackplay domain.
 *
 * Reuses the shared `uuidv4` id helper. Trackplay timestamps are epoch-ms
 * numbers (`Date.now()`), not the ISO strings the timetracker/grocery items
 * use, so there is no shared timestamp helper to reuse here.
 */

export function createPlayer(name: string): IPlayer {
  return {
    id: uuidv4(),
    name: name.trim(),
    created: Date.now(),
  };
}

export function createGame(
  name: string,
  type: TID = 'default',
  players: TID[] = []
): IGame {
  const now = Date.now();
  return {
    id: uuidv4(),
    name: name.trim(),
    created: now,
    updated: now,
    type,
    players,
    rounds: [],
    ended: false,
  };
}

export function createGameType(name: string, winHigh: boolean): IGameType {
  return {
    id: uuidv4(),
    name: name.trim(),
    winHigh,
  };
}

// A blank round: every current participant starts at 0 points.
export function createRound(idx: number, playerIds: TID[]): IRound {
  const values: Record<TID, number> = {};
  for (const pid of playerIds) {
    values[pid] = 0;
  }
  return {
    id: uuidv4(),
    name: 'round ' + idx,
    created: Date.now(),
    idx,
    values,
  };
}

// The `default` type is UNDELETABLE (reducer/effects guard against it) and is
// the fallback a game is reassigned to when its type is removed.
export const DEFAULT_GAME_TYPE_ID: TID = 'default';

// Seeded when a fresh datastore has no game types (see reducer hydration).
export const DEFAULT_GAME_TYPES: Record<TID, IGameType> = {
  default: { id: 'default', name: 'Standard', winHigh: true },
  rommee: { id: 'rommee', name: 'Rommé', winHigh: false },
  skat: { id: 'skat', name: 'Skat', winHigh: true },
};

export const initialTrackplayConfig: ITrackplayConfig = {
  games: {
    dir: 'desc',
    filter: '',
    sort: 'updated',
    typeId: '',
    showEndedGames: true,
  },
  gamesForPlayer: {
    dir: 'desc',
    filter: '',
    sort: 'updated',
    typeId: '',
    showEndedGames: false,
  },
  players: { dir: 'asc', filter: '', sort: 'name' },
};
