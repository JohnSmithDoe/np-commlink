import {
  mockKernelState,
  mockRouterState,
} from '../../../@shared/testing/test-data';
import {
  mockGame,
  mockGamesState,
  mockGameType,
  mockGameTypesState,
  mockGamesForPlayerView,
  mockPlayer,
  mockPlayersState,
  mockRound,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import {
  selectGameById,
  selectGamesForPlayerItems,
  selectGamesListItems,
  selectResultByGame,
  selectRoundsByGame,
  selectScoresByGame,
} from './games.selector';

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

const scored = [
  mockRound({ id: 'r0', values: { p1: 10, p2: 3 } }),
  mockRound({ id: 'r1', values: { p1: 5, p2: 20 } }),
];

describe('games.selector — scoring', () => {
  const state = stateWith({
    players: mockPlayersState([
      mockPlayer({ id: 'p1', name: 'Alice' }),
      mockPlayer({ id: 'p2', name: 'Bob' }),
    ]),
    gameTypes: mockGameTypesState([
      mockGameType({ id: 'default', winHigh: true }),
      mockGameType({ id: 'low', name: 'Low', winHigh: false }),
    ]),
    games: mockGamesState([
      mockGame({ id: 'gh', playerIds: ['p1', 'p2'], rounds: scored }),
      mockGame({
        id: 'gl',
        playerIds: ['p1', 'p2'],
        categoryIds: ['low'],
        rounds: scored,
      }),
    ]),
  });

  it('sums round values per player', () => {
    expect(selectScoresByGame('gh')(state)).toEqual({ p1: 15, p2: 23 });
  });

  it('picks the winner per the type winHigh rule', () => {
    expect(selectResultByGame('gh')(state).map((p) => p.id)).toEqual([
      'p2',
      'p1',
    ]);
    expect(selectResultByGame('gl')(state)[0]?.id).toBe('p1');
  });

  it('counts a player with no entry in a round as zero', () => {
    const sparse = stateWith({
      players: mockPlayersState([mockPlayer({ id: 'p1' })]),
      games: mockGamesState([
        mockGame({
          id: 'g',
          playerIds: ['p1', 'ghost'],
          rounds: [mockRound({ id: 'r0', values: { p1: 4 } })],
        }),
      ]),
    });

    expect(selectScoresByGame('g')(sparse)).toEqual({ p1: 4, ghost: 0 });
  });

  it('hands back the rounds the game holds, in play order', () => {
    expect(selectRoundsByGame('gh')(state).map((r) => r.id)).toEqual([
      'r0',
      'r1',
    ]);
  });

  it('has nothing for an unknown game', () => {
    expect(selectGameById('nope')(state)).toBeUndefined();
    expect(selectRoundsByGame('nope')(state)).toEqual([]);
    expect(selectScoresByGame('nope')(state)).toEqual({});
    expect(selectResultByGame('nope')(state)).toEqual([]);
  });
});

describe('games.selector — list', () => {
  const games = [
    mockGame({ id: 'b', name: 'Bravo', createdAt: LATER, updatedAt: EARLIER }),
    mockGame({ id: 'a', name: 'Alpha', createdAt: EARLIER, updatedAt: LATER }),
  ];

  it.each([
    ['name', 'asc', ['a', 'b']],
    ['name', 'desc', ['b', 'a']],
    ['createdAt', 'asc', ['a', 'b']],
    ['createdAt', 'desc', ['b', 'a']],
    ['updatedAt', 'asc', ['b', 'a']],
    ['updatedAt', 'desc', ['a', 'b']],
  ] as const)('sorts by %s %s', (sortBy, sortDirection, expected) => {
    const state = stateWith({
      games: mockGamesState(games, { sort: { sortBy, sortDirection } }),
    });

    expect(selectGamesListItems(state).map((g) => g.id)).toEqual(expected);
  });

  it('narrows by the search term, case-insensitively', () => {
    const state = stateWith({
      games: mockGamesState(games, { searchQuery: 'BRAV' }),
    });

    expect(selectGamesListItems(state).map((g) => g.id)).toEqual(['b']);
  });

  it('narrows by the game type through the shared category token', () => {
    const state = stateWith({
      games: mockGamesState(
        [
          mockGame({ id: 'a', categoryIds: ['default'] }),
          mockGame({ id: 'b', categoryIds: ['skat'] }),
        ],
        { filterBy: 'skat' }
      ),
    });

    expect(selectGamesListItems(state).map((g) => g.id)).toEqual(['b']);
  });

  it('hides ended games on their own axis, independent of the type filter', () => {
    const items = [
      mockGame({ id: 'open', ended: false, categoryIds: ['skat'] }),
      mockGame({ id: 'done', ended: true, categoryIds: ['skat'] }),
    ];

    expect(
      selectGamesListItems(
        stateWith({
          games: mockGamesState(items, {
            showEndedGames: false,
            filterBy: 'skat',
          }),
        })
      ).map((g) => g.id)
    ).toEqual(['open']);
  });

  it('sorts ended games last without disturbing the order inside each group', () => {
    const state = stateWith({
      games: mockGamesState(
        [
          mockGame({ id: 'done-a', name: 'A', ended: true }),
          mockGame({ id: 'open-b', name: 'B', ended: false }),
          mockGame({ id: 'open-a', name: 'AA', ended: false }),
        ],
        { sort: { sortBy: 'name', sortDirection: 'asc' } }
      ),
    });

    expect(selectGamesListItems(state).map((g) => g.id)).toEqual([
      'open-a',
      'open-b',
      'done-a',
    ]);
  });
});

describe('games.selector — the gamesForPlayer view', () => {
  const input = {
    games: mockGamesState([
      mockGame({ id: 'mine', playerIds: ['p1'] }),
      mockGame({ id: 'mine-done', playerIds: ['p1'], ended: true }),
      mockGame({ id: 'theirs', playerIds: ['p2'] }),
    ]),
    gamesForPlayer: mockGamesForPlayerView({ showEndedGames: false }),
  };
  const state = stateWith(input, 'p1');

  it('keeps only the games the route player joined, and honours its own config', () => {
    expect(selectGamesForPlayerItems(state).map((game) => game.id)).toEqual([
      'mine',
    ]);
  });

  it('is empty off a player route, where there is no id to narrow by', () => {
    expect(selectGamesForPlayerItems(stateWith(input))).toEqual([]);
  });

  it('is a view, not a second collection — the games list is unaffected', () => {
    expect(
      selectGamesListItems(state)
        .map((game) => game.id)
        .toSorted()
    ).toEqual(['mine', 'mine-done', 'theirs']);
  });
});
