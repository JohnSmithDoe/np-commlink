import {
  Game,
  GameType,
  Player,
  Round,
  TrackplayState,
} from '../model/trackplay.types';
import {
  DEFAULT_GAME_TYPES,
  initialTrackplayConfig,
} from '../util/trackplay.factory';

export const TEST_EPOCH = 1_704_110_400_000; // 2024-01-01T12:00:00.000Z

export function mockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    name: 'Alice',
    created: TEST_EPOCH,
    ...overrides,
  };
}

export function mockGameType(overrides: Partial<GameType> = {}): GameType {
  return { id: 'default', name: 'Standard', winHigh: true, ...overrides };
}

export function mockGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'game-1',
    name: 'Game',
    created: TEST_EPOCH,
    updated: TEST_EPOCH,
    type: 'default',
    players: [],
    rounds: [],
    ended: false,
    ...overrides,
  };
}

export function mockRound(overrides: Partial<Round> = {}): Round {
  return {
    id: 'round-1',
    name: 'round 0',
    created: TEST_EPOCH,
    idx: 0,
    values: {},
    ...overrides,
  };
}

export function mockTrackplayState(
  overrides: Partial<TrackplayState> = {}
): TrackplayState {
  return {
    players: {},
    games: {},
    gameTypes: structuredClone(DEFAULT_GAME_TYPES),
    rounds: {},
    config: structuredClone(initialTrackplayConfig),
    lastDeleted: null,
    ...overrides,
  };
}
