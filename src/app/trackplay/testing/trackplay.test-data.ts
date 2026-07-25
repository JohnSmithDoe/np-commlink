import { IGame, IGameType, IPlayer, IRound, ITrackplayState } from '../model';
import {
  DEFAULT_GAME_TYPES,
  initialTrackplayConfig,
} from '../util/trackplay.factory';

// Deterministic trackplay fixtures. Owned by the trackplay context (DDD review
// #1): they live here, not in the shared @shared/testing kit, because the shared
// kit is domain:shared and may not reference domain:trackplay types.
export const TEST_EPOCH = 1_704_110_400_000; // 2024-01-01T12:00:00.000Z

export function mockPlayer(overrides: Partial<IPlayer> = {}): IPlayer {
  return {
    id: 'player-1',
    name: 'Alice',
    created: TEST_EPOCH,
    ...overrides,
  };
}

export function mockGameType(overrides: Partial<IGameType> = {}): IGameType {
  return { id: 'default', name: 'Standard', winHigh: true, ...overrides };
}

export function mockGame(overrides: Partial<IGame> = {}): IGame {
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

export function mockRound(overrides: Partial<IRound> = {}): IRound {
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
  overrides: Partial<ITrackplayState> = {}
): ITrackplayState {
  // Reuse the production seed constants so the fixtures can't drift from them;
  // deep-clone so a test mutating the fixture can't leak into another (the
  // runner is isolate:false — module-level state is shared across spec files).
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
