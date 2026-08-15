/* ─── why ─────────────────────────────────────────────────────────
 * The cascades and undo live here rather than in a per-aggregate spec
 * because that is where they live in the code, and for the reason the
 * reducer's own banner gives: they must see the PRE-action slice, which
 * only holds while no aggregate reducer handles the same action. "restores
 * a player the games reducer never saw removed" is the case that goes red
 * the moment someone adds `removeItem` to `playersReducer`.
 * ───────────────────────────────────────────────────────────────── */

import dayjs from 'dayjs';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';
import { TrackplayState } from '../model/trackplay.types';
import { gameTypeIdOf } from '../util/game-type.utils';
import {
  mockGame,
  mockGamesState,
  mockGameType,
  mockGameTypesState,
  mockPlayer,
  mockPlayersState,
  mockRound,
  mockTrackplayState,
} from '../testing/trackplay.test-data';
import { GamesActions } from './games/games.actions';
import { GameTypesActions } from './game-types/game-types.actions';
import { PlayersActions } from './players/players.actions';
import { TrackplayActions } from './trackplay.actions';
import { initialState, trackplayReducer } from './trackplay.reducer';

const AT = '2026-05-01T08:00:00.000Z';

const gameOf = (state: TrackplayState, id: string) =>
  state.games.items.find((game) => game.id === id);

const playerOf = (state: TrackplayState, id: string) =>
  state.players.items.find((player) => player.id === id);

describe('trackplayReducer — composition', () => {
  it('returns the same state for an unknown action', () => {
    expect(trackplayReducer(initialState, { type: 'noop' })).toBe(initialState);
  });

  it('starts with the three default game types and nothing else', () => {
    expect(initialState.gameTypes.items).toHaveLength(3);
    expect(initialState.players.items).toEqual([]);
    expect(initialState.games.items).toEqual([]);
    expect(initialState.lastDeleted).toBeNull();
  });
});

describe('trackplayReducer — deleting a player', () => {
  const start = mockTrackplayState({
    players: mockPlayersState([
      mockPlayer({ id: 'p1', name: 'Alice' }),
      mockPlayer({ id: 'p2', name: 'Bob' }),
    ]),
    games: mockGamesState([
      mockGame({
        id: 'shared',
        playerIds: ['p1', 'p2'],
        rounds: [mockRound({ id: 'r0', values: { p1: 5, p2: 3 } })],
      }),
      mockGame({ id: 'solo-live', playerIds: ['p1'], ended: false }),
      mockGame({ id: 'solo-done', playerIds: ['p1'], ended: true }),
      mockGame({ id: 'other', playerIds: ['p2'] }),
    ]),
  });

  const deleted = trackplayReducer(
    start,
    PlayersActions.removeItem(mockPlayer({ id: 'p1', name: 'Alice' }))
  );

  it('drops the player and their scores from a game that survives', () => {
    expect(playerOf(deleted, 'p1')).toBeUndefined();
    expect(gameOf(deleted, 'shared')?.playerIds).toEqual(['p2']);
    expect(gameOf(deleted, 'shared')?.rounds[0].values).toEqual({ p2: 3 });
  });

  it('empties a running game that loses its last player, and discards an ended one', () => {
    expect(gameOf(deleted, 'solo-live')).toEqual(
      expect.objectContaining({ playerIds: [], rounds: [] })
    );
    expect(gameOf(deleted, 'solo-done')).toBeUndefined();
  });

  it('leaves games the player never joined untouched', () => {
    expect(gameOf(deleted, 'other')).toBe(gameOf(start, 'other'));
  });

  it('restores a player the games reducer never saw removed', () => {
    const restored = trackplayReducer(
      deleted,
      TrackplayActions.restoreLastDeleted()
    );

    expect(deleted.lastDeleted?.name).toBe('Alice');
    expect(playerOf(restored, 'p1')).toBeDefined();
    expect(gameOf(restored, 'solo-done')).toBeDefined();
    expect(gameOf(restored, 'shared')?.rounds[0].values).toEqual({
      p1: 5,
      p2: 3,
    });
    expect(restored.lastDeleted).toBeNull();
  });
});

describe('trackplayReducer — deleting a game and a type', () => {
  it('stashes a deleted game and gives it back on undo', () => {
    const game = mockGame({ id: 'g', name: 'Skat' });
    const start = mockTrackplayState({ games: mockGamesState([game]) });

    const deleted = trackplayReducer(start, GamesActions.removeItem(game));
    const restored = trackplayReducer(
      deleted,
      TrackplayActions.restoreLastDeleted()
    );

    expect(gameOf(deleted, 'g')).toBeUndefined();
    expect(deleted.lastDeleted?.name).toBe('Skat');
    expect(gameOf(restored, 'g')).toBeDefined();
  });

  it('refuses to delete the built-in default type', () => {
    const state = trackplayReducer(
      initialState,
      GameTypesActions.removeItem(mockGameType({ id: 'default' }))
    );

    expect(state.gameTypes.items).toHaveLength(3);
    expect(state.lastDeleted).toBeNull();
  });

  it('retypes its games to the default and clears the armed chip', () => {
    const custom = mockGameType({ id: 'custom', name: 'Custom' });
    const start = mockTrackplayState({
      gameTypes: mockGameTypesState([mockGameType({ id: 'default' }), custom]),
      games: mockGamesState([mockGame({ id: 'g', categoryIds: ['custom'] })], {
        filterBy: 'custom',
      }),
    });

    const state = trackplayReducer(start, GameTypesActions.removeItem(custom));

    expect(gameTypeIdOf(gameOf(state, 'g')!)).toBe('default');
    expect(state.games.filterBy).toBeUndefined();
    expect(state.gamesForPlayer.filterBy).toBeUndefined();
  });

  it('leaves the list settings alone when undoing', () => {
    const game = mockGame({ id: 'g', name: 'Skat' });
    const start = mockTrackplayState({
      games: mockGamesState([game], { showEndedGames: false }),
    });

    const restored = trackplayReducer(
      trackplayReducer(start, GamesActions.removeItem(game)),
      TrackplayActions.restoreLastDeleted()
    );

    expect(restored.games.showEndedGames).toBe(false);
  });

  it('does nothing when there is no stash to restore', () => {
    expect(
      trackplayReducer(initialState, TrackplayActions.restoreLastDeleted())
    ).toBe(initialState);
  });
});

describe('trackplayReducer — scoring stamps both aggregates', () => {
  const start = mockTrackplayState({
    players: mockPlayersState([
      mockPlayer({ id: 'p1', lastPlayedAt: undefined }),
      mockPlayer({ id: 'p2', lastPlayedAt: undefined }),
      mockPlayer({ id: 'outsider', lastPlayedAt: undefined }),
    ]),
    games: mockGamesState([
      mockGame({
        id: 'g',
        playerIds: ['p1', 'p2'],
        rounds: [mockRound({ id: 'r0', values: { p1: 0, p2: 0 } })],
      }),
    ]),
  });

  const state = trackplayReducer(
    start,
    GamesActions.setRoundValue('g', 'r0', 'p1', 20, AT, 'r1')
  );

  it('stamps the game and only its participants, with the action clock', () => {
    expect(gameOf(state, 'g')?.updatedAt).toBe(AT);
    expect(playerOf(state, 'p1')?.lastPlayedAt).toBe(AT);
    expect(playerOf(state, 'p2')?.lastPlayedAt).toBe(AT);
    expect(playerOf(state, 'outsider')?.lastPlayedAt).toBeUndefined();
  });

  it('reads the clock at dispatch time, not while reducing', () => {
    const defaulted = trackplayReducer(
      start,
      GamesActions.setRoundValue('g', 'r0', 'p1', 20)
    );

    expect(
      dayjs(gameOf(defaulted, 'g')?.updatedAt).isAfter(TEST_TIMESTAMP)
    ).toBe(true);
  });

  it('is a pure function of the action — replayed, it lands the same state', () => {
    const action = GamesActions.setRoundValue('g', 'r0', 'p1', 20, AT, 'r1');

    expect(trackplayReducer(start, action)).toEqual(
      trackplayReducer(start, action)
    );
  });
});

describe('trackplayReducer — hydration', () => {
  it('clears the stash and re-seeds the types from an empty document', () => {
    const state = trackplayReducer(initialState, TrackplayActions.loaded(null));

    expect(state.gameTypes.items).toHaveLength(3);
    expect(state.lastDeleted).toBeNull();
  });

  it('never restores a stash that reached the disk', () => {
    const persisted = mockTrackplayState({
      players: mockPlayersState([mockPlayer({ id: 'p1' })]),
      lastDeleted: {
        name: 'x',
        snapshot: { players: [], games: [], gameTypes: [] },
      },
    });

    const state = trackplayReducer(
      initialState,
      TrackplayActions.loaded(persisted)
    );

    expect(playerOf(state, 'p1')).toBeDefined();
    expect(state.lastDeleted).toBeNull();
  });
});
