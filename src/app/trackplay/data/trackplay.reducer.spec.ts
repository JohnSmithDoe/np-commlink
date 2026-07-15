import { TrackplayActions } from './trackplay.actions';
import { initialState, trackplayReducer } from './trackplay.reducer';
import {
  mockGame,
  mockGameType,
  mockPlayer,
  mockRound,
  mockTrackplayState,
} from '../../@shared/testing/test-data';

describe('trackplayReducer', () => {
  it('returns the initial state for an unknown action and seeds default types', () => {
    const state = trackplayReducer(initialState, { type: 'noop' } as never);
    expect(state).toBe(initialState);
    expect(Object.keys(state.gameTypes)).toEqual(['default', 'rommee', 'skat']);
  });

  it('creates a player', () => {
    const state = trackplayReducer(
      initialState,
      TrackplayActions.createPlayer('Alice')
    );
    expect(Object.values(state.players).map((p) => p.name)).toEqual(['Alice']);
  });

  it('ignores blank player names', () => {
    const state = trackplayReducer(
      initialState,
      TrackplayActions.createPlayer('   ')
    );
    expect(Object.keys(state.players)).toHaveLength(0);
  });

  it('ensures a trailing blank round on entering a game', () => {
    const game = mockGame({ id: 'g', players: ['p1', 'p2'], rounds: [] });
    const start = mockTrackplayState({ games: { g: game } });
    const state = trackplayReducer(start, TrackplayActions.enterGamePage('g'));
    expect(state.games['g'].rounds).toHaveLength(1);
    const roundId = state.games['g'].rounds[0];
    expect(state.rounds[roundId].values).toEqual({ p1: 0, p2: 0 });
  });

  it('appends a new blank round when the trailing round gets a non-zero value', () => {
    const round = mockRound({ id: 'r0', idx: 0, values: { p1: 0, p2: 0 } });
    const game = mockGame({ id: 'g', players: ['p1', 'p2'], rounds: ['r0'] });
    const start = mockTrackplayState({
      games: { g: game },
      rounds: { r0: round },
    });
    const state = trackplayReducer(
      start,
      TrackplayActions.setRoundValue('g', 'r0', 'p1', 20)
    );
    expect(state.rounds['r0'].values['p1']).toBe(20);
    expect(state.games['g'].rounds).toHaveLength(2);
    expect(state.games['g'].updated).toBeGreaterThan(0);
    // participants' lastPlayed bumped
    expect(state.players).toEqual({});
  });

  it('cascades a player delete and supports single-level undo', () => {
    const round = mockRound({ id: 'r0', values: { p1: 5, p2: 3 } });
    const game = mockGame({ id: 'g', players: ['p1', 'p2'], rounds: ['r0'] });
    const start = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }), p2: mockPlayer({ id: 'p2' }) },
      games: { g: game },
      rounds: { r0: round },
    });
    const deleted = trackplayReducer(
      start,
      TrackplayActions.deletePlayer(mockPlayer({ id: 'p1' }))
    );
    expect(deleted.players['p1']).toBeUndefined();
    expect(deleted.games['g'].players).toEqual(['p2']);
    expect(deleted.rounds['r0'].values).toEqual({ p2: 3 });
    expect(deleted.lastDeleted).not.toBeNull();

    const restored = trackplayReducer(
      deleted,
      TrackplayActions.restoreLastDeleted()
    );
    expect(restored.players['p1']).toBeDefined();
    expect(restored.rounds['r0'].values).toEqual({ p1: 5, p2: 3 });
    expect(restored.lastDeleted).toBeNull();
  });

  it('deletes a game together with its rounds', () => {
    const game = mockGame({ id: 'g', rounds: ['r0'] });
    const start = mockTrackplayState({
      games: { g: game },
      rounds: { r0: mockRound({ id: 'r0' }) },
    });
    const state = trackplayReducer(start, TrackplayActions.deleteGame(game));
    expect(state.games['g']).toBeUndefined();
    expect(state.rounds['r0']).toBeUndefined();
  });

  it('reassigns games to default when their type is deleted, guarding default', () => {
    const custom = mockGameType({
      id: 'custom',
      name: 'Custom',
      winHigh: true,
    });
    const game = mockGame({ id: 'g', type: 'custom' });
    const start = mockTrackplayState({
      gameTypes: { ...mockTrackplayState().gameTypes, custom },
      games: { g: game },
    });
    const state = trackplayReducer(
      start,
      TrackplayActions.deleteGameType(custom)
    );
    expect(state.gameTypes['custom']).toBeUndefined();
    expect(state.games['g'].type).toBe('default');

    const guarded = trackplayReducer(
      start,
      TrackplayActions.deleteGameType(mockGameType({ id: 'default' }))
    );
    expect(guarded.gameTypes['default']).toBeDefined();
  });

  it('hydrates from a datastore and seeds default types when none exist', () => {
    const fresh = trackplayReducer(initialState, TrackplayActions.loaded(null));
    expect(Object.keys(fresh.gameTypes)).toEqual(['default', 'rommee', 'skat']);

    const persisted = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }) },
      lastDeleted: {
        name: 'x',
        snapshot: {
          players: {},
          games: {},
          gameTypes: {},
          rounds: {},
          config: mockTrackplayState().config,
        },
      },
    });
    const loaded = trackplayReducer(
      initialState,
      TrackplayActions.loaded(persisted)
    );
    expect(loaded.players['p1']).toBeDefined();
    expect(loaded.lastDeleted).toBeNull();
  });
});
