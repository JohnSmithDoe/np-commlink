/* ─── why ─────────────────────────────────────────────────────────
 * This covers the trailing-blank-round machine, which is the only real
 * logic in the games slice: a game always ends in one blank round so there
 * is somewhere to type, and typing into that row grows the next one.
 * ───────────────────────────────────────────────────────────────── */

import {
  mockGame,
  mockGamesState,
  mockRound,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { initialGamesState } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { GamesActions } from './games.actions';
import { gamesReducer } from './games.reducer';

const AT = '2026-05-01T08:00:00.000Z';

const roundsOf = (state: ReturnType<typeof gamesReducer>, gameId: string) =>
  state.items.find((game) => game.id === gameId)?.rounds ?? [];

const valuesOf = (
  state: ReturnType<typeof gamesReducer>,
  gameId: string,
  roundId: string
) =>
  roundsOf(state, gameId).find((round) => round.id === roundId)?.values ?? {};

describe('gamesReducer', () => {
  it('appends a trailing blank round on entering a game', () => {
    const start = mockGamesState([
      mockGame({ id: 'g', playerIds: ['p1', 'p2'], rounds: [] }),
    ]);

    const state = gamesReducer(start, GamesActions.enterGamePage('g', 'r0'));

    expect(roundsOf(state, 'g').map((round) => round.id)).toEqual(['r0']);
    expect(valuesOf(state, 'g', 'r0')).toEqual({});
  });

  it('adds no second blank round when the game already ends in one', () => {
    const start = mockGamesState([
      mockGame({
        id: 'g',
        playerIds: ['p1'],
        rounds: [mockRound({ id: 'r0', values: { p1: 0 } })],
      }),
    ]);

    expect(gamesReducer(start, GamesActions.enterGamePage('g'))).toBe(start);
  });

  it('leaves an unknown or already-ended game alone on entry', () => {
    const start = mockGamesState([mockGame({ id: 'done', ended: true })]);

    expect(gamesReducer(start, GamesActions.enterGamePage('nope'))).toBe(start);
    expect(gamesReducer(start, GamesActions.enterGamePage('done'))).toBe(start);
  });

  it('grows a new blank round when the trailing one is scored', () => {
    const start = mockGamesState([
      mockGame({
        id: 'g',
        playerIds: ['p1', 'p2'],
        rounds: [mockRound({ id: 'r0', values: { p1: 0, p2: 0 } })],
      }),
    ]);

    const state = gamesReducer(
      start,
      GamesActions.setRoundValue('g', 'r0', 'p1', 20, AT, 'r1')
    );

    expect(valuesOf(state, 'g', 'r0')['p1']).toBe(20);
    expect(roundsOf(state, 'g').map((round) => round.id)).toEqual(['r0', 'r1']);
    expect(state.items[0].updatedAt).toBe(AT);
  });

  it('grows nothing when the trailing round is scored zero', () => {
    const start = mockGamesState([
      mockGame({
        id: 'g',
        playerIds: ['p1'],
        rounds: [mockRound({ id: 'r0', values: { p1: 0 } })],
      }),
    ]);

    const state = gamesReducer(
      start,
      GamesActions.setRoundValue('g', 'r0', 'p1', 0, AT, 'r1')
    );

    expect(state).toBe(start);
  });

  it('grows nothing when a round above the trailing one is corrected', () => {
    const start = mockGamesState([
      mockGame({
        id: 'g',
        playerIds: ['p1'],
        rounds: [
          mockRound({ id: 'r0', values: { p1: 5 } }),
          mockRound({ id: 'r1', values: { p1: 0 } }),
        ],
      }),
    ]);

    const state = gamesReducer(
      start,
      GamesActions.setRoundValue('g', 'r0', 'p1', 7, AT, 'r2')
    );

    expect(roundsOf(state, 'g').map((round) => round.id)).toEqual(['r0', 'r1']);
    expect(valuesOf(state, 'g', 'r0')['p1']).toBe(7);
  });

  it('returns the same state for an unchanged cell or an unknown target', () => {
    const start = mockGamesState([
      mockGame({
        id: 'g',
        playerIds: ['p1'],
        rounds: [mockRound({ id: 'r0', values: { p1: 20 } })],
      }),
    ]);

    for (const action of [
      GamesActions.setRoundValue('g', 'r0', 'p1', 20, AT, 'x'),
      GamesActions.setRoundValue('nope', 'r0', 'p1', 1, AT, 'x'),
      GamesActions.setRoundValue('g', 'nope', 'p1', 1, AT, 'x'),
    ]) {
      expect(gamesReducer(start, action)).toBe(start);
    }
  });

  it('carries showEndedGames as its own axis', () => {
    const state = gamesReducer(
      initialGamesState,
      GamesActions.setShowEnded(false)
    );

    expect(state.showEndedGames).toBe(false);
    expect(state.filterBy).toBeUndefined();
  });

  it('drops the transient search and filter on hydration', () => {
    const persisted = mockTrackplayState({
      games: mockGamesState([mockGame({ id: 'g' })], {
        searchQuery: 'sk',
        filterBy: 'skat',
        showEndedGames: false,
      }),
    });

    const state = gamesReducer(
      initialGamesState,
      TrackplayActions.loaded(persisted)
    );

    expect(state.items).toHaveLength(1);
    expect(state.searchQuery).toBeUndefined();
    expect(state.filterBy).toBeUndefined();
    expect(state.showEndedGames).toBe(false);
  });
});
