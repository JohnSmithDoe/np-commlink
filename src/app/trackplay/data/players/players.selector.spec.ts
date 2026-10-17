import {
  mockKernelState,
  mockRouterState,
} from '../../../@shared/testing/test-data';
import {
  mockGame,
  mockGamesState,
  mockGameType,
  mockGameTypesState,
  mockRound,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import {
  selectPlayerStats,
  selectStatsForRoutePlayer,
} from './players.selector';

const stateWith = (
  trackplay: Parameters<typeof mockTrackplayState>[0],
  routePlayerId?: string
) => {
  return mockKernelState({
    trackplay: mockTrackplayState(trackplay),
    router: mockRouterState({
      parameters: routePlayerId ? { id: routePlayerId } : {},
    }),
  });
};

describe('players.selector — stats', () => {
  const stateInput = {
    gameTypes: mockGameTypesState([mockGameType({ id: 'default' })]),
    games: mockGamesState([
      mockGame({
        id: 'ended',
        playerIds: ['p1', 'p2'],
        ended: true,
        rounds: [mockRound({ id: 'r0', values: { p1: 10, p2: 3 } })],
      }),
      mockGame({ id: 'open', playerIds: ['p1'], ended: false }),
    ]),
  };
  const state = stateWith(stateInput);

  it('counts plays, the open ones, and the winner of each ended game', () => {
    expect(selectPlayerStats(state)).toEqual({
      p1: { play: 2, win: 1, loss: 0, open: 1 },
      p2: { play: 1, win: 0, loss: 1, open: 0 },
    });
  });

  it('credits neither a win nor a loss when the top score is shared', () => {
    const game = mockGame({
      id: 'drawn',
      playerIds: ['p1', 'p2'],
      ended: true,
      rounds: [mockRound({ id: 'r0', values: { p1: 10, p2: 10 } })],
    });
    const drawn = stateWith({
      ...stateInput,
      games: mockGamesState([game]),
    });

    expect(selectPlayerStats(drawn)).toEqual({
      p1: { play: 1, win: 0, loss: 0, open: 0 },
      p2: { play: 1, win: 0, loss: 0, open: 0 },
    });
  });

  it('crowns nobody in an ended game nobody scored in', () => {
    const scoreless = stateWith({
      ...stateInput,
      games: mockGamesState([
        mockGame({ id: 'blank', playerIds: ['p1', 'p2'], ended: true }),
      ]),
    });

    expect(selectPlayerStats(scoreless)).toEqual({
      p1: { play: 1, win: 0, loss: 0, open: 0 },
      p2: { play: 1, win: 0, loss: 0, open: 0 },
    });
  });

  it('falls back to empty stats for a player who never played', () => {
    expect(selectStatsForRoutePlayer(stateWith(stateInput, 'nope'))).toEqual({
      play: 0,
      win: 0,
      loss: 0,
      open: 0,
    });
  });
});
