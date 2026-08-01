import { ITrackplayState } from '../model/trackplay.types';
import { TrackplayActions } from './trackplay.actions';
import { initialState, trackplayReducer } from './trackplay.reducer';
import {
  mockGame,
  mockGameType,
  mockPlayer,
  mockRound,
  mockTrackplayState,
  TEST_EPOCH,
} from '../testing/trackplay.test-data';

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
      TrackplayActions.createPlayer(' '.repeat(3))
    );
    expect(Object.keys(state.players)).toHaveLength(0);
  });

  it('renames a player, trimmed, and ignores an unknown id', () => {
    const start = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1', name: 'Alice' }) },
    });

    const renamed = trackplayReducer(
      start,
      TrackplayActions.renamePlayer('p1', '  Alicia  ')
    );

    expect(renamed.players['p1'].name).toBe('Alicia');
    expect(
      trackplayReducer(start, TrackplayActions.renamePlayer('nope', 'X'))
    ).toBe(start);
  });

  it('ensures a trailing blank round on entering a game', () => {
    const game = mockGame({ id: 'g', players: ['p1', 'p2'], rounds: [] });
    const start = mockTrackplayState({ games: { g: game } });
    const state = trackplayReducer(start, TrackplayActions.enterGamePage('g'));
    expect(state.games['g'].rounds).toHaveLength(1);
    const roundId = state.games['g'].rounds[0];
    expect(state.rounds[roundId].values).toEqual({ p1: 0, p2: 0 });
  });

  it('adds no second blank round when the game already ends in one', () => {
    const game = mockGame({ id: 'g', players: ['p1'], rounds: ['r0'] });
    const start = mockTrackplayState({
      games: { g: game },
      rounds: { r0: mockRound({ id: 'r0', values: { p1: 0 } }) },
    });

    expect(trackplayReducer(start, TrackplayActions.enterGamePage('g'))).toBe(
      start
    );
  });

  it('leaves an unknown or already-ended game alone on page entry', () => {
    const start = mockTrackplayState({
      games: { done: mockGame({ id: 'done', ended: true, rounds: [] }) },
    });

    expect(
      trackplayReducer(start, TrackplayActions.enterGamePage('nope'))
    ).toBe(start);
    expect(
      trackplayReducer(start, TrackplayActions.enterGamePage('done'))
    ).toBe(start);
  });

  it('appends a blank round when the trailing round id resolves to nothing', () => {
    const game = mockGame({ id: 'g', players: ['p1'], rounds: ['gone'] });
    const start = mockTrackplayState({ games: { g: game } });

    const state = trackplayReducer(start, TrackplayActions.enterGamePage('g'));

    expect(state.games['g'].rounds).toHaveLength(2);
  });

  it('appends a fresh blank round when the trailing round already carries scores', () => {
    const game = mockGame({ id: 'g', players: ['p1', 'p2'], rounds: ['r0'] });
    const start = mockTrackplayState({
      games: { g: game },
      rounds: { r0: mockRound({ id: 'r0', values: { p1: 5, p2: 0 } }) },
    });

    const state = trackplayReducer(start, TrackplayActions.enterGamePage('g'));

    const appended = state.games['g'].rounds[1];
    expect(state.games['g'].rounds).toHaveLength(2);
    expect(state.rounds[appended].values).toEqual({ p1: 0, p2: 0 });
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
  });

  it('returns the same state when a cell is blurred without changing', () => {
    // Every blur dispatches. Without the guard the unchanged case still bumped
    // `updated`/`lastPlayed` and re-persisted the whole slice.
    const round = mockRound({ id: 'r0', idx: 0, values: { p1: 20, p2: 0 } });
    const game = mockGame({ id: 'g', players: ['p1', 'p2'], rounds: ['r0'] });
    const start = mockTrackplayState({
      games: { g: game },
      rounds: { r0: round },
    });

    expect(
      trackplayReducer(
        start,
        TrackplayActions.setRoundValue('g', 'r0', 'p1', 20)
      )
    ).toBe(start);
  });

  it('does not append a blank round when the trailing round gets a zero', () => {
    const round = mockRound({ id: 'r0', idx: 0, values: { p1: 0, p2: 0 } });
    const game = mockGame({ id: 'g', players: ['p1', 'p2'], rounds: ['r0'] });
    const start = mockTrackplayState({
      games: { g: game },
      rounds: { r0: round },
    });
    const state = trackplayReducer(
      start,
      TrackplayActions.setRoundValue('g', 'r0', 'p1', 0)
    );
    expect(state.games['g'].rounds).toEqual(['r0']);
  });

  it('appends nothing when a round above the trailing one is corrected', () => {
    const start = mockTrackplayState({
      games: {
        g: mockGame({ id: 'g', players: ['p1'], rounds: ['r0', 'r1'] }),
      },
      rounds: {
        r0: mockRound({ id: 'r0', idx: 0, values: { p1: 5 } }),
        r1: mockRound({ id: 'r1', idx: 1, values: { p1: 0 } }),
      },
    });

    const state = trackplayReducer(
      start,
      TrackplayActions.setRoundValue('g', 'r0', 'p1', 7)
    );

    expect(state.games['g'].rounds).toEqual(['r0', 'r1']);
    expect(state.rounds['r0'].values['p1']).toBe(7);
    expect(state.games['g'].updated).toBeGreaterThan(TEST_EPOCH);
  });

  // `now` rides on the action, so the reducer is a function of (state, action)
  // alone — the same action replays to the same state, and the stamp is an exact
  // assertion rather than a `toBeGreaterThan`.
  it('stamps the time the action carries, not the time it runs', () => {
    const now = 1_777_000_000_000;
    const start = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1', lastPlayed: undefined }) },
      games: { g: mockGame({ id: 'g', players: ['p1'], rounds: ['r0'] }) },
      rounds: { r0: mockRound({ id: 'r0', idx: 0, values: { p1: 0 } }) },
    });

    const state = trackplayReducer(
      start,
      TrackplayActions.setRoundValue('g', 'r0', 'p1', 20, now)
    );

    expect(state.games['g'].updated).toBe(now);
    expect(state.players['p1'].lastPlayed).toBe(now);
  });

  it('stamps lastPlayed on the scored game participants only', () => {
    const round = mockRound({ id: 'r0', idx: 0, values: { p1: 0, p2: 0 } });
    const game = mockGame({ id: 'g', players: ['p1', 'p2'], rounds: ['r0'] });
    const start = mockTrackplayState({
      players: {
        p1: mockPlayer({ id: 'p1', lastPlayed: undefined }),
        p2: mockPlayer({ id: 'p2', lastPlayed: undefined }),
        outsider: mockPlayer({ id: 'outsider', lastPlayed: undefined }),
      },
      games: { g: game },
      rounds: { r0: round },
    });
    const state = trackplayReducer(
      start,
      TrackplayActions.setRoundValue('g', 'r0', 'p1', 20)
    );
    expect(state.players['p1'].lastPlayed).toBeGreaterThan(TEST_EPOCH);
    expect(state.players['p2'].lastPlayed).toBeGreaterThan(TEST_EPOCH);
    expect(state.players['outsider'].lastPlayed).toBeUndefined();
    expect(state.players['p1'].lastPlayed).toBe(state.games['g'].updated);
  });

  it('ignores a round value for an unknown game or round', () => {
    const start = mockTrackplayState({
      games: { g: mockGame({ id: 'g', rounds: ['r0'] }) },
      rounds: { r0: mockRound({ id: 'r0' }) },
    });
    expect(
      trackplayReducer(
        start,
        TrackplayActions.setRoundValue('nope', 'r0', 'p1', 1)
      )
    ).toBe(start);
    expect(
      trackplayReducer(
        start,
        TrackplayActions.setRoundValue('g', 'nope', 'p1', 1)
      )
    ).toBe(start);
  });

  it('inserts the game it is handed, id and all', () => {
    const game = mockGame({
      id: 'g-new',
      name: 'Doppelkopf',
      type: 'skat',
      players: ['p1'],
    });

    const state = trackplayReducer(
      initialState,
      TrackplayActions.createGame(game)
    );

    expect(state.games['g-new']).toBe(game);
  });

  it('renames a game, trimmed, and retypes and re-rosters it', () => {
    const start = mockTrackplayState({
      games: { g: mockGame({ id: 'g', name: 'Skat', players: ['p1'] }) },
    });

    const renamed = trackplayReducer(
      start,
      TrackplayActions.renameGame('g', '  Doppelkopf  ')
    );
    const retyped = trackplayReducer(
      renamed,
      TrackplayActions.changeGameType('g', 'skat')
    );
    const rerostered = trackplayReducer(
      retyped,
      TrackplayActions.setGamePlayers('g', ['p2', 'p3'])
    );

    expect(rerostered.games['g'].name).toBe('Doppelkopf');
    expect(rerostered.games['g'].type).toBe('skat');
    expect(rerostered.games['g'].players).toEqual(['p2', 'p3']);
  });

  it('toggles a game between running and ended', () => {
    const start = mockTrackplayState({
      games: { g: mockGame({ id: 'g', ended: false }) },
    });

    const ended = trackplayReducer(
      start,
      TrackplayActions.toggleGameEnded('g')
    );
    const reopened = trackplayReducer(
      ended,
      TrackplayActions.toggleGameEnded('g')
    );

    expect(ended.games['g'].ended).toBe(true);
    expect(reopened.games['g'].ended).toBe(false);
  });

  it('ignores every game mutation aimed at an unknown id', () => {
    const start = mockTrackplayState({ games: { g: mockGame({ id: 'g' }) } });

    for (const action of [
      TrackplayActions.renameGame('nope', 'X'),
      TrackplayActions.changeGameType('nope', 'skat'),
      TrackplayActions.setGamePlayers('nope', ['p1']),
      TrackplayActions.toggleGameEnded('nope'),
    ]) {
      expect(trackplayReducer(start, action)).toBe(start);
    }
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

  // Losing your last player kills an already-ended game — there is nothing left
  // to show — but only empties a running one, so it stays open for new players.
  it('drops an ended game that loses its last player', () => {
    const start = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }) },
      games: {
        g: mockGame({ id: 'g', players: ['p1'], rounds: ['r0'], ended: true }),
      },
      rounds: { r0: mockRound({ id: 'r0', values: { p1: 5 } }) },
    });

    const state = trackplayReducer(
      start,
      TrackplayActions.deletePlayer(mockPlayer({ id: 'p1' }))
    );

    expect(state.games['g']).toBeUndefined();
    expect(state.rounds['r0']).toBeUndefined();
  });

  it('empties a running game that loses its last player', () => {
    const start = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }) },
      games: { g: mockGame({ id: 'g', players: ['p1'], rounds: ['r0'] }) },
      rounds: { r0: mockRound({ id: 'r0', values: { p1: 5 } }) },
    });

    const state = trackplayReducer(
      start,
      TrackplayActions.deletePlayer(mockPlayer({ id: 'p1' }))
    );

    expect(state.games['g'].players).toEqual([]);
    expect(state.games['g'].rounds).toEqual([]);
    expect(state.rounds['r0']).toBeUndefined();
  });

  it('leaves games the deleted player never joined untouched', () => {
    const other = mockGame({ id: 'other', players: ['p2'], rounds: [] });
    const start = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }), p2: mockPlayer({ id: 'p2' }) },
      games: { other },
    });

    const state = trackplayReducer(
      start,
      TrackplayActions.deletePlayer(mockPlayer({ id: 'p1' }))
    );

    expect(state.games['other']).toBe(other);
    expect(state.players['p2']).toBeDefined();
  });

  it('skips a round id a game points at that no longer resolves', () => {
    const start = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }), p2: mockPlayer({ id: 'p2' }) },
      games: {
        g: mockGame({ id: 'g', players: ['p1', 'p2'], rounds: ['r0', 'gone'] }),
      },
      rounds: { r0: mockRound({ id: 'r0', values: { p1: 5, p2: 3 } }) },
    });

    const state = trackplayReducer(
      start,
      TrackplayActions.deletePlayer(mockPlayer({ id: 'p1' }))
    );

    expect(state.rounds['r0'].values).toEqual({ p2: 3 });
    expect(state.rounds['gone']).toBeUndefined();
  });

  it('leaves list settings alone when undoing a delete', () => {
    // The settings popover is one tap away during the 8s undo toast, so a
    // whole-slice snapshot silently reverted a sort or filter change too.
    const start = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }) },
    });
    const deleted = trackplayReducer(
      start,
      TrackplayActions.deletePlayer(mockPlayer({ id: 'p1' }))
    );
    const resorted = trackplayReducer(
      deleted,
      TrackplayActions.updatePlayersConfig({ sort: 'name' })
    );

    const restored = trackplayReducer(
      resorted,
      TrackplayActions.restoreLastDeleted()
    );

    expect(restored.players['p1']).toBeDefined();
    expect(restored.config.players.sort).toBe('name');
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

  it('restores a deleted game together with its rounds on undo', () => {
    const game = mockGame({ id: 'g', name: 'Skat', rounds: ['r0'] });
    const start = mockTrackplayState({
      games: { g: game },
      rounds: { r0: mockRound({ id: 'r0', values: { p1: 5 } }) },
    });

    const deleted = trackplayReducer(start, TrackplayActions.deleteGame(game));
    const restored = trackplayReducer(
      deleted,
      TrackplayActions.restoreLastDeleted()
    );

    expect(deleted.lastDeleted?.name).toBe('Skat');
    expect(restored.games['g']).toEqual(game);
    expect(restored.rounds['r0'].values).toEqual({ p1: 5 });
    expect(restored.lastDeleted).toBeNull();
  });

  it('keeps only the most recent deletion undoable', () => {
    const game = mockGame({ id: 'g', name: 'Skat' });
    const start = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }) },
      games: { g: game },
    });

    const withoutPlayer = trackplayReducer(
      start,
      TrackplayActions.deletePlayer(mockPlayer({ id: 'p1' }))
    );
    const withoutGame = trackplayReducer(
      withoutPlayer,
      TrackplayActions.deleteGame(game)
    );
    const restored = trackplayReducer(
      withoutGame,
      TrackplayActions.restoreLastDeleted()
    );

    expect(restored.games['g']).toEqual(game);
    expect(restored.players['p1']).toBeUndefined();
  });

  it('reassigns only the games that used the deleted type', () => {
    const custom = mockGameType({
      id: 'custom',
      name: 'Custom',
      winHigh: true,
    });
    const skatGame = mockGame({ id: 'skat-game', type: 'skat' });
    const start = mockTrackplayState({
      gameTypes: { ...mockTrackplayState().gameTypes, custom },
      games: {
        'custom-game': mockGame({ id: 'custom-game', type: 'custom' }),
        'skat-game': skatGame,
      },
    });

    const state = trackplayReducer(
      start,
      TrackplayActions.deleteGameType(custom)
    );

    expect(state.gameTypes['custom']).toBeUndefined();
    expect(state.games['custom-game'].type).toBe('default');
    expect(state.games['skat-game']).toBe(skatGame);
  });

  it('refuses to delete the built-in type and leaves an earlier stash intact', () => {
    // The undo toast re-presents on every new `lastDeleted` reference, so a
    // refused delete must not mint one — it would offer to undo the *previous*
    // deletion (pinned from the effect side in trackplay.effects.spec.ts).
    const stashed = trackplayReducer(
      mockTrackplayState({ players: { p1: mockPlayer({ id: 'p1' }) } }),
      TrackplayActions.deletePlayer(mockPlayer({ id: 'p1' }))
    );

    const refused = trackplayReducer(
      stashed,
      TrackplayActions.deleteGameType(mockGameType({ id: 'default' }))
    );

    expect(refused).toBe(stashed);
    expect(refused.lastDeleted).toBe(stashed.lastDeleted);
  });

  it('restores a deleted type and the games it was reassigned off', () => {
    const custom = mockGameType({ id: 'custom', name: 'Canasta' });
    const start = mockTrackplayState({
      gameTypes: { ...mockTrackplayState().gameTypes, custom },
      games: { g: mockGame({ id: 'g', type: 'custom' }) },
    });

    const deleted = trackplayReducer(
      start,
      TrackplayActions.deleteGameType(custom)
    );
    const restored = trackplayReducer(
      deleted,
      TrackplayActions.restoreLastDeleted()
    );

    expect(deleted.lastDeleted?.name).toBe('Canasta');
    expect(restored.gameTypes['custom']).toEqual(custom);
    expect(restored.games['g'].type).toBe('custom');
    expect(restored.lastDeleted).toBeNull();
  });

  it('creates a game type, trimmed, and ignores a blank name', () => {
    const created = trackplayReducer(
      initialState,
      TrackplayActions.createGameType('  Canasta  ', false)
    );

    expect(
      Object.values(created.gameTypes).find((type) => type.name === 'Canasta')
        ?.winHigh
    ).toBe(false);
    expect(
      trackplayReducer(
        initialState,
        TrackplayActions.createGameType(' '.repeat(3), true)
      )
    ).toBe(initialState);
  });

  it('updates a game type in place', () => {
    const state = trackplayReducer(
      mockTrackplayState(),
      TrackplayActions.updateGameType({
        id: 'skat',
        name: 'Skat (Ramsch)',
        winHigh: false,
      })
    );

    expect(state.gameTypes['skat']).toEqual({
      id: 'skat',
      name: 'Skat (Ramsch)',
      winHigh: false,
    });
  });

  // Both game lists can be filtered by type; a deleted type left selected would
  // silently show an empty list.
  it('clears a deleted type off the filters that had it selected', () => {
    const custom = mockGameType({ id: 'custom', name: 'Custom' });
    const withType = mockTrackplayState({
      gameTypes: { ...mockTrackplayState().gameTypes, custom },
    });
    const gamesFiltered = trackplayReducer(
      withType,
      TrackplayActions.updateGamesConfig({ typeId: 'custom' })
    );
    const bothFiltered = trackplayReducer(
      gamesFiltered,
      TrackplayActions.updateGamesForPlayerConfig({ typeId: 'custom' })
    );

    const state = trackplayReducer(
      bothFiltered,
      TrackplayActions.deleteGameType(custom)
    );

    expect(state.config.games.typeId).toBe('');
    expect(state.config.gamesForPlayer.typeId).toBe('');
  });

  it('merges each list config over the current one, leaving its siblings', () => {
    const games = trackplayReducer(
      initialState,
      TrackplayActions.updateGamesConfig({ sort: 'name' })
    );
    const players = trackplayReducer(
      games,
      TrackplayActions.updatePlayersConfig({ direction: 'desc' })
    );
    const state = trackplayReducer(
      players,
      TrackplayActions.updateGamesForPlayerConfig({ showEndedGames: true })
    );

    expect(state.config.games).toEqual({
      ...initialState.config.games,
      sort: 'name',
    });
    expect(state.config.players).toEqual({
      ...initialState.config.players,
      direction: 'desc',
    });
    expect(state.config.gamesForPlayer).toEqual({
      ...initialState.config.gamesForPlayer,
      showEndedGames: true,
    });
  });

  it('ignores an undo with nothing stashed', () => {
    expect(
      trackplayReducer(initialState, TrackplayActions.restoreLastDeleted())
    ).toBe(initialState);
  });

  it('hydrates from a datastore and seeds default types when none exist', () => {
    const fresh = trackplayReducer(initialState, TrackplayActions.loaded(null));
    expect(Object.keys(fresh.gameTypes)).toEqual(['default', 'rommee', 'skat']);

    const persisted = mockTrackplayState({
      players: { p1: mockPlayer({ id: 'p1' }) },
      lastDeleted: {
        name: 'x',
        snapshot: { players: {}, games: {}, gameTypes: {}, rounds: {} },
      },
    });
    const loaded = trackplayReducer(
      initialState,
      TrackplayActions.loaded(persisted)
    );
    expect(loaded.players['p1']).toBeDefined();
    expect(loaded.lastDeleted).toBeNull();
  });

  it('fills in what an older document never carried', () => {
    // A doc from before the list config existed, and with an empty type catalog:
    // both fall back to the seeds instead of hydrating undefined into the slice.
    const legacy = {
      players: { p1: mockPlayer({ id: 'p1' }) },
      games: {},
      rounds: {},
      gameTypes: {},
    } as unknown as ITrackplayState;

    const state = trackplayReducer(
      initialState,
      TrackplayActions.loaded(legacy)
    );

    expect(state.config).toEqual(initialState.config);
    expect(Object.keys(state.gameTypes)).toEqual(['default', 'rommee', 'skat']);
    expect(state.players['p1']).toBeDefined();
  });

  it('seeds the default types when a loaded document carries no type catalog', () => {
    const withoutCatalog = {
      players: {},
      games: {},
      rounds: {},
      config: initialState.config,
    } as unknown as ITrackplayState;

    const state = trackplayReducer(
      initialState,
      TrackplayActions.loaded(withoutCatalog)
    );

    expect(Object.keys(state.gameTypes)).toEqual(['default', 'rommee', 'skat']);
  });
});
