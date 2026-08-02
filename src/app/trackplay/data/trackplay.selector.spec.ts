import {
  selectGameCount,
  selectGameList,
  selectGamesForPlayer,
  selectGameTypeList,
  selectPlayerById,
  selectPlayerList,
  selectPlayerStats,
  selectResultByGame,
  selectRoundsByGame,
  selectScoresByGame,
  selectStatsForPlayer,
  selectTrackplayPersisted,
} from './trackplay.selector';
import { mockKernelState } from '../../@shared/testing/test-data';
import {
  mockGame,
  mockGameType,
  mockPlayer,
  mockRound,
  mockTrackplayState,
} from '../testing/trackplay.test-data';
import {
  GameConfig,
  TrackplayConfig,
  TrackplayState,
} from '../model/trackplay.types';
import { initialTrackplayConfig } from '../util/trackplay.factory';

const withConfig = (
  state: Partial<TrackplayState>,
  config: Partial<TrackplayConfig>
) =>
  mockKernelState({
    trackplay: mockTrackplayState({
      ...state,
      config: { ...initialTrackplayConfig, ...config },
    }),
  });

const gamesConfig = (overrides: Partial<GameConfig>): GameConfig => ({
  ...initialTrackplayConfig.games,
  ...overrides,
});

const playersConfig = (
  overrides: Partial<TrackplayConfig['players']>
): TrackplayConfig['players'] => ({
  ...initialTrackplayConfig.players,
  ...overrides,
});

const buildState = () => {
  const players = {
    p1: mockPlayer({ id: 'p1', name: 'Alice' }),
    p2: mockPlayer({ id: 'p2', name: 'Bob' }),
  };
  const rounds = {
    r0: mockRound({ id: 'r0', idx: 0, values: { p1: 10, p2: 3 } }),
    r1: mockRound({ id: 'r1', idx: 1, values: { p1: 5, p2: 20 } }),
  };
  const gameTypes = {
    ...mockTrackplayState().gameTypes,
    low: mockGameType({ id: 'low', name: 'Low', winHigh: false }),
  };
  return { players, rounds, gameTypes };
};

describe('trackplay.selector', () => {
  it('derives per-player scores by summing round values', () => {
    const { players, rounds, gameTypes } = buildState();
    const game = mockGame({
      id: 'g',
      type: 'default',
      players: ['p1', 'p2'],
      rounds: ['r0', 'r1'],
    });
    const state = mockKernelState({
      trackplay: mockTrackplayState({
        players,
        rounds,
        gameTypes,
        games: { g: game },
      }),
    });
    expect(selectScoresByGame('g')(state)).toEqual({ p1: 15, p2: 23 });
  });

  it('picks the winner per the game type winHigh rule', () => {
    const { players, rounds, gameTypes } = buildState();
    const highGame = mockGame({
      id: 'gh',
      type: 'default',
      players: ['p1', 'p2'],
      rounds: ['r0', 'r1'],
    });
    const lowGame = mockGame({
      id: 'gl',
      type: 'low',
      players: ['p1', 'p2'],
      rounds: ['r0', 'r1'],
    });
    const state = mockKernelState({
      trackplay: mockTrackplayState({
        players,
        rounds,
        gameTypes,
        games: { gh: highGame, gl: lowGame },
      }),
    });
    expect(selectResultByGame('gh')(state)[0]?.id).toBe('p2');
    expect(selectResultByGame('gl')(state)[0]?.id).toBe('p1');
    expect(selectResultByGame('gh')(state).map((p) => p.id)).toEqual([
      'p2',
      'p1',
    ]);
  });

  it('derives player stats (play/win/loss/open) from games + rounds', () => {
    const { players, rounds, gameTypes } = buildState();
    const endedGame = mockGame({
      id: 'g1',
      type: 'default',
      players: ['p1', 'p2'],
      rounds: ['r0', 'r1'],
      ended: true,
    });
    const openGame = mockGame({
      id: 'g2',
      type: 'default',
      players: ['p1'],
      rounds: [],
      ended: false,
    });
    const state = mockKernelState({
      trackplay: mockTrackplayState({
        players,
        rounds,
        gameTypes,
        games: { g1: endedGame, g2: openGame },
      }),
    });
    const stats = selectPlayerStats(state);
    expect(stats['p1']).toEqual({ play: 2, win: 0, loss: 1, open: 1 });
    expect(stats['p2']).toEqual({ play: 1, win: 1, loss: 0, open: 0 });
  });

  it('sorts game types with default first', () => {
    const state = mockKernelState({
      trackplay: mockTrackplayState({
        gameTypes: {
          ...mockTrackplayState().gameTypes,
          alpha: mockGameType({ id: 'alpha', name: 'Alpha', winHigh: true }),
        },
      }),
    });
    expect(selectGameTypeList(state)[0].id).toBe('default');
  });

  it('sinks ended games to the bottom of the list', () => {
    const open = mockGame({ id: 'open', name: 'Open', ended: false });
    const ended = mockGame({ id: 'ended', name: 'Ended', ended: true });
    const state = mockKernelState({
      trackplay: mockTrackplayState({ games: { ended, open } }),
    });
    expect(selectGameList(state).map((g) => g.id)).toEqual(['open', 'ended']);
  });

  it('filters games to those a player participates in', () => {
    const g1 = mockGame({ id: 'g1', players: ['p1'] });
    const g2 = mockGame({ id: 'g2', players: ['p2'] });
    const state = mockKernelState({
      trackplay: mockTrackplayState({ games: { g1, g2 } }),
    });
    expect(selectGamesForPlayer('p1')(state).map((g) => g.id)).toEqual(['g1']);
  });

  it('puts the default game type first even when it was stored last', () => {
    const state = mockKernelState({
      trackplay: mockTrackplayState({
        gameTypes: {
          alpha: mockGameType({ id: 'alpha', name: 'Alpha' }),
          default: mockGameType({ id: 'default', name: 'Standard' }),
        },
      }),
    });
    expect(selectGameTypeList(state).map((t) => t.id)).toEqual([
      'default',
      'alpha',
    ]);
  });
});

describe('selectGameList — sort and filter', () => {
  const games = {
    b: mockGame({ id: 'b', name: 'Bravo', created: 200, updated: 100 }),
    a: mockGame({ id: 'a', name: 'Alpha', created: 100, updated: 200 }),
  };

  it.each([
    ['name', 'asc', ['a', 'b']],
    ['name', 'desc', ['b', 'a']],
    ['date', 'asc', ['a', 'b']],
    ['date', 'desc', ['b', 'a']],
    ['updated', 'asc', ['b', 'a']],
    ['updated', 'desc', ['a', 'b']],
  ] as const)('sorts by %s %s', (sort, direction, expected) => {
    const state = withConfig(
      { games },
      { games: gamesConfig({ sort, direction, showEndedGames: true }) }
    );
    expect(selectGameList(state).map((g) => g.id)).toEqual(expected);
  });

  it('narrows by the name filter, case-insensitively', () => {
    const state = withConfig(
      { games },
      { games: gamesConfig({ filter: 'AL' }) }
    );
    expect(selectGameList(state).map((g) => g.id)).toEqual(['a']);
  });

  it('narrows to a single game type', () => {
    const state = withConfig(
      {
        games: {
          a: mockGame({ id: 'a', type: 'default' }),
          b: mockGame({ id: 'b', type: 'skat' }),
        },
      },
      { games: gamesConfig({ typeId: 'skat' }) }
    );
    expect(selectGameList(state).map((g) => g.id)).toEqual(['b']);
  });

  it('hides ended games unless they are asked for', () => {
    const both = {
      open: mockGame({ id: 'open', ended: false }),
      done: mockGame({ id: 'done', ended: true }),
    };
    expect(
      selectGameList(
        withConfig(
          { games: both },
          { games: gamesConfig({ showEndedGames: false }) }
        )
      ).map((g) => g.id)
    ).toEqual(['open']);
    expect(
      selectGameList(
        withConfig(
          { games: both },
          { games: gamesConfig({ showEndedGames: true }) }
        )
      ).map((g) => g.id)
    ).toHaveLength(2);
  });
});

describe('selectPlayerList — sort and filter', () => {
  const players = {
    b: mockPlayer({ id: 'b', name: 'Bravo', created: 200, lastPlayed: 100 }),
    a: mockPlayer({ id: 'a', name: 'Alpha', created: 100, lastPlayed: 200 }),
  };
  it.each([
    ['name', 'asc', ['a', 'b']],
    ['name', 'desc', ['b', 'a']],
    ['date', 'asc', ['a', 'b']],
    ['last', 'asc', ['b', 'a']],
    ['last', 'desc', ['a', 'b']],
  ] as const)('sorts by %s %s', (sort, direction, expected) => {
    const state = withConfig(
      { players },
      { players: playersConfig({ sort, direction }) }
    );
    expect(selectPlayerList(state).map((p) => p.id)).toEqual(expected);
  });

  it('treats a player who never played as least-recent', () => {
    const state = withConfig(
      {
        players: {
          never: mockPlayer({ id: 'never', lastPlayed: undefined }),
          played: mockPlayer({ id: 'played', lastPlayed: 500 }),
        },
      },
      { players: playersConfig({ sort: 'last', direction: 'asc' }) }
    );
    expect(selectPlayerList(state).map((p) => p.id)).toEqual([
      'never',
      'played',
    ]);
  });

  it('narrows by the name filter', () => {
    const state = withConfig(
      { players },
      { players: playersConfig({ filter: 'brav' }) }
    );
    expect(selectPlayerList(state).map((p) => p.id)).toEqual(['b']);
  });
});

describe('trackplay.selector — lookups by id', () => {
  const state = mockKernelState({
    trackplay: mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1', name: 'Alice' }) },
      games: { g: mockGame({ id: 'g', rounds: ['r1', 'gone', 'r0'] }) },
      rounds: {
        r0: mockRound({ id: 'r0', idx: 0 }),
        r1: mockRound({ id: 'r1', idx: 1 }),
      },
    }),
  });

  it('resolves a player, or nothing for an unknown id', () => {
    expect(selectPlayerById('p1')(state)?.name).toBe('Alice');
    expect(selectPlayerById('nope')(state)).toBeUndefined();
  });

  it('orders a game rounds by index and skips dangling ids', () => {
    expect(selectRoundsByGame('g')(state).map((r) => r.id)).toEqual([
      'r0',
      'r1',
    ]);
  });

  it('has no rounds, scores or result for an unknown game', () => {
    expect(selectRoundsByGame('nope')(state)).toEqual([]);
    expect(selectScoresByGame('nope')(state)).toEqual({});
    expect(selectResultByGame('nope')(state)).toEqual([]);
    expect(selectResultByGame('nope')(state)[0]).toBeUndefined();
  });
});

describe('trackplay.selector — scoring gaps', () => {
  it('counts a missing round or a player with no entry as zero', () => {
    const state = mockKernelState({
      trackplay: mockTrackplayState({
        players: {
          p1: mockPlayer({ id: 'p1' }),
          p2: mockPlayer({ id: 'p2' }),
        },
        rounds: { r0: mockRound({ id: 'r0', values: { p1: 7 } }) },
        games: {
          g: mockGame({
            id: 'g',
            players: ['p1', 'p2'],
            rounds: ['r0', 'gone'],
          }),
        },
      }),
    });
    expect(selectScoresByGame('g')(state)).toEqual({ p1: 7, p2: 0 });
  });

  it('ranks high-wins when the game type no longer exists', () => {
    const state = mockKernelState({
      trackplay: mockTrackplayState({
        players: {
          p1: mockPlayer({ id: 'p1' }),
          p2: mockPlayer({ id: 'p2' }),
        },
        rounds: { r0: mockRound({ id: 'r0', values: { p1: 1, p2: 9 } }) },
        games: {
          g: mockGame({
            id: 'g',
            type: 'deleted-type',
            players: ['p1', 'p2'],
            rounds: ['r0'],
            ended: true,
          }),
        },
      }),
    });
    expect(selectResultByGame('g')(state).map((p) => p.id)).toEqual([
      'p2',
      'p1',
    ]);
    expect(selectPlayerStats(state)['p2']).toEqual({
      play: 1,
      win: 1,
      loss: 0,
      open: 0,
    });
  });

  it('ignores game participants who are no longer on the roster', () => {
    const state = mockKernelState({
      trackplay: mockTrackplayState({
        players: { p1: mockPlayer({ id: 'p1' }) },
        rounds: { r0: mockRound({ id: 'r0', values: { p1: 1, ghost: 9 } }) },
        games: {
          open: mockGame({ id: 'open', players: ['p1', 'ghost'] }),
          done: mockGame({
            id: 'done',
            players: ['p1', 'ghost'],
            rounds: ['r0'],
            ended: true,
          }),
        },
      }),
    });
    const stats = selectPlayerStats(state);
    expect(Object.keys(stats)).toEqual(['p1']);
    expect(stats['p1']).toEqual({ play: 2, win: 0, loss: 1, open: 1 });
  });

  it('reports zeroed stats for a player with no games', () => {
    const state = mockKernelState({
      trackplay: mockTrackplayState({ players: {} }),
    });
    expect(selectStatsForPlayer('nobody')(state)).toEqual({
      play: 0,
      win: 0,
      loss: 0,
      open: 0,
    });
  });
});

describe('selectGameCount', () => {
  it('counts every game regardless of type or ended state', () => {
    expect(
      selectGameCount.projector({
        g1: mockGame({ id: 'g1', ended: true }),
        g2: mockGame({ id: 'g2' }),
        g3: mockGame({ id: 'g3' }),
      })
    ).toBe(3);
  });

  it('is 0 with no games', () => {
    expect(selectGameCount.projector({})).toBe(0);
  });
});

describe('selectTrackplayPersisted', () => {
  it('drops the transient undo snapshot on the way to disk', () => {
    const state = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }) },
      lastDeleted: {
        name: 'Alice',
        snapshot: { players: {}, games: {}, gameTypes: {}, rounds: {} },
      },
    });

    const persisted = selectTrackplayPersisted.projector(state);

    expect(persisted.lastDeleted).toBeNull();
    expect(persisted.players).toBe(state.players);
  });
});
