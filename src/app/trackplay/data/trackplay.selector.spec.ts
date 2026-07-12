import {
  selectGameList,
  selectGameTypeList,
  selectGamesForPlayer,
  selectPlayerStats,
  selectResultByGame,
  selectScoresByGame,
  selectWinnerByGame,
} from './trackplay.selector';
import {
  mockAppState,
  mockGame,
  mockGameType,
  mockPlayer,
  mockRound,
  mockTrackplayState,
} from '../../@shared/testing/test-data';

describe('trackplay.selector', () => {
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

  it('derives per-player scores by summing round values', () => {
    const { players, rounds, gameTypes } = buildState();
    const game = mockGame({
      id: 'g',
      type: 'default',
      players: ['p1', 'p2'],
      rounds: ['r0', 'r1'],
    });
    const state = mockAppState({
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
    const state = mockAppState({
      trackplay: mockTrackplayState({
        players,
        rounds,
        gameTypes,
        games: { gh: highGame, gl: lowGame },
      }),
    });
    // p1=15, p2=23 → high wins p2, low wins p1
    expect(selectWinnerByGame('gh')(state)?.id).toBe('p2');
    expect(selectWinnerByGame('gl')(state)?.id).toBe('p1');
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
    const state = mockAppState({
      trackplay: mockTrackplayState({
        players,
        rounds,
        gameTypes,
        games: { g1: endedGame, g2: openGame },
      }),
    });
    const stats = selectPlayerStats(state);
    // p1: plays 2, open 1 (g2), and in ended g1 loses (p2 higher) → loss 1
    expect(stats['p1']).toEqual({ play: 2, win: 0, loss: 1, open: 1 });
    // p2: plays 1 (g1 ended), wins it
    expect(stats['p2']).toEqual({ play: 1, win: 1, loss: 0, open: 0 });
  });

  it('sorts game types with default first', () => {
    const state = mockAppState({
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
    const state = mockAppState({
      trackplay: mockTrackplayState({ games: { ended, open } }),
    });
    expect(selectGameList(state).map((g) => g.id)).toEqual(['open', 'ended']);
  });

  it('filters games to those a player participates in', () => {
    const g1 = mockGame({ id: 'g1', players: ['p1'] });
    const g2 = mockGame({ id: 'g2', players: ['p2'] });
    const state = mockAppState({
      trackplay: mockTrackplayState({ games: { g1, g2 } }),
    });
    expect(selectGamesForPlayer('p1')(state).map((g) => g.id)).toEqual(['g1']);
  });
});
