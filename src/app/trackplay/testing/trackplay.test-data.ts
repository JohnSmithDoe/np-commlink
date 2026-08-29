import {
  Game,
  GamesState,
  GamesView,
  GameType,
  GameTypesState,
  Player,
  PlayersState,
  Round,
  TrackplayState,
} from '../model/trackplay.types';
import {
  DEFAULT_GAME_TYPES,
  initialGamesForPlayerView,
  initialGamesState,
  initialGameTypesState,
  initialPlayersState,
} from '../util/trackplay.factory';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

export function mockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    name: 'Alice',
    createdAt: TEST_TIMESTAMP,
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
    createdAt: TEST_TIMESTAMP,
    updatedAt: TEST_TIMESTAMP,
    categoryIds: ['default'],
    playerIds: [],
    rounds: [],
    ended: false,
    ...overrides,
  };
}

export function mockRound(overrides: Partial<Round> = {}): Round {
  return { id: 'round-1', values: {}, ...overrides };
}

export function mockPlayersState(
  items: Player[] = [],
  overrides: Partial<PlayersState> = {}
): PlayersState {
  return { ...initialPlayersState, items, ...overrides };
}

export function mockGamesState(
  items: Game[] = [],
  overrides: Partial<GamesState> = {}
): GamesState {
  return { ...initialGamesState, items, ...overrides };
}

export function mockGameTypesState(items?: GameType[]): GameTypesState {
  return { ...initialGameTypesState, items: items ?? [...DEFAULT_GAME_TYPES] };
}

export function mockGamesForPlayerView(
  overrides: Partial<GamesView> = {}
): GamesView {
  return { ...initialGamesForPlayerView, ...overrides };
}

export function mockTrackplayState(
  overrides: Partial<TrackplayState> = {}
): TrackplayState {
  return {
    players: mockPlayersState(),
    games: mockGamesState(),
    gamesForPlayer: mockGamesForPlayerView(),
    gameTypes: mockGameTypesState(),
    ...overrides,
  };
}
