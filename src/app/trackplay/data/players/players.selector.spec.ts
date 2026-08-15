import {
  mockKernelState,
  mockRouterState,
} from '../../../@shared/testing/test-data';
import {
  mockGame,
  mockGamesState,
  mockGameType,
  mockGameTypesState,
  mockPlayer,
  mockPlayersState,
  mockRound,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import {
  selectPlayersListItems,
  selectPlayerStats,
  selectRoutePlayer,
  selectStatsForRoutePlayer,
} from './players.selector';

const EARLIER = '2024-06-01T10:00:00.000Z';
const LATER = '2024-06-02T10:00:00.000Z';

const stateWith = (
  trackplay: Parameters<typeof mockTrackplayState>[0],
  routePlayerId?: string
) =>
  mockKernelState({
    trackplay: mockTrackplayState(trackplay),
    router: mockRouterState({
      parameters: routePlayerId ? { id: routePlayerId } : {},
    }),
  });

describe('players.selector — list', () => {
  const players = [
    mockPlayer({
      id: 'b',
      name: 'Bravo',
      createdAt: LATER,
      lastPlayedAt: EARLIER,
    }),
    mockPlayer({
      id: 'a',
      name: 'Alpha',
      createdAt: EARLIER,
      lastPlayedAt: LATER,
    }),
  ];

  it.each([
    ['name', 'asc', ['a', 'b']],
    ['name', 'desc', ['b', 'a']],
    ['createdAt', 'asc', ['a', 'b']],
    ['lastPlayedAt', 'asc', ['b', 'a']],
    ['lastPlayedAt', 'desc', ['a', 'b']],
  ] as const)('sorts by %s %s', (sortBy, sortDirection, expected) => {
    const state = stateWith({
      players: mockPlayersState(players, { sort: { sortBy, sortDirection } }),
    });

    expect(selectPlayersListItems(state).map((p) => p.id)).toEqual(expected);
  });

  it('sorts a player who never played last, whichever way the arrow points', () => {
    const items = [
      mockPlayer({ id: 'never', name: 'Never', lastPlayedAt: undefined }),
      mockPlayer({ id: 'played', name: 'Played', lastPlayedAt: LATER }),
    ];
    const idsWith = (sortDirection: 'asc' | 'desc') =>
      selectPlayersListItems(
        stateWith({
          players: mockPlayersState(items, {
            sort: { sortBy: 'lastPlayedAt', sortDirection },
          }),
        })
      ).map((p) => p.id);

    expect(idsWith('asc')).toEqual(['played', 'never']);
    expect(idsWith('desc')).toEqual(['played', 'never']);
  });

  it('narrows by the search term', () => {
    const state = stateWith({
      players: mockPlayersState(players, { searchQuery: 'brav' }),
    });

    expect(selectPlayersListItems(state).map((p) => p.id)).toEqual(['b']);
  });

  it('resolves the route player, or nothing for an unknown id', () => {
    const known = { players: mockPlayersState(players) };

    expect(selectRoutePlayer(stateWith(known, 'a'))?.name).toBe('Alpha');
    expect(selectRoutePlayer(stateWith(known, 'nope'))).toBeUndefined();
  });
});

describe('players.selector — stats', () => {
  const stateInput = {
    players: mockPlayersState([
      mockPlayer({ id: 'p1' }),
      mockPlayer({ id: 'p2' }),
    ]),
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

  it('falls back to empty stats for a player who is not in the list', () => {
    expect(selectStatsForRoutePlayer(stateWith(stateInput, 'nope'))).toEqual({
      play: 0,
      win: 0,
      loss: 0,
      open: 0,
    });
  });

  it('reads the unfiltered list, so a search does not change the stats', () => {
    const searched = stateWith({
      players: mockPlayersState(
        [mockPlayer({ id: 'p1' }), mockPlayer({ id: 'p2' })],
        { searchQuery: 'zzz' }
      ),
      games: mockGamesState([
        mockGame({ id: 'open', playerIds: ['p1', 'p2'] }),
      ]),
    });

    expect(selectPlayersListItems(searched)).toHaveLength(0);
    expect(Object.keys(selectPlayerStats(searched))).toEqual(['p1', 'p2']);
  });
});
