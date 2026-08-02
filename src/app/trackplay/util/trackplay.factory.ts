import {
  Game,
  GameType,
  Player,
  PlayerStats,
  Round,
  TrackplayConfig,
  TrackplayId,
} from '../model/trackplay.types';
import { uuidv4 } from '../../@shared/util/app.utils';

export const NO_PLAYER_STATS: PlayerStats = {
  play: 0,
  win: 0,
  loss: 0,
  open: 0,
};

export function createPlayer(name: string): Player {
  return {
    id: uuidv4(),
    name: name.trim(),
    created: Date.now(),
  };
}

export function createGame(
  name: string,
  type: TrackplayId = 'default',
  players: TrackplayId[] = []
): Game {
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

export function createGameType(name: string, winHigh: boolean): GameType {
  return {
    id: uuidv4(),
    name: name.trim(),
    winHigh,
  };
}

export function createRound(index: number, playerIds: TrackplayId[]): Round {
  const values: Record<TrackplayId, number> = {};
  for (const pid of playerIds) {
    values[pid] = 0;
  }
  return {
    id: uuidv4(),
    name: 'round ' + index,
    created: Date.now(),
    idx: index,
    values,
  };
}

export const DEFAULT_GAME_TYPE_ID: TrackplayId = 'default';

export const DEFAULT_GAME_TYPES: Record<TrackplayId, GameType> = {
  default: { id: 'default', name: 'Standard', winHigh: true },
  rommee: { id: 'rommee', name: 'Rommé', winHigh: false },
  skat: { id: 'skat', name: 'Skat', winHigh: true },
};

export const initialTrackplayConfig: TrackplayConfig = {
  games: {
    direction: 'desc',
    filter: '',
    sort: 'updated',
    typeId: '',
    showEndedGames: true,
  },
  gamesForPlayer: {
    direction: 'desc',
    filter: '',
    sort: 'updated',
    typeId: '',
    showEndedGames: false,
  },
  players: { direction: 'asc', filter: '', sort: 'name' },
};
