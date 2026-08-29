/* ─── why ─────────────────────────────────────────────────────────
 * `combineReducers` returns the IDENTICAL state when no sub-reducer
 * changed anything, so `trackplayCascade` sees the pre-action slice if and
 * only if no per-aggregate reducer handles that action.
 *
 * Hence the three `removeItem`s and the two restores live ONLY here. Add
 * one to an aggregate and the cascade silently starts reading the
 * POST-delete state; neither the compiler nor a per-aggregate spec notices.
 *
 * `setRoundValue` is the deliberate opposite: the aggregate writes the
 * round, and the cascade then stamps `lastPlayedAt` on the roster — which
 * wants the post-write game.
 * ───────────────────────────────────────────────────────────────── */

import { Action, combineReducers, createReducer, on } from '@ngrx/store';
import { TrackplayState } from '../model/trackplay.types';
import {
  deleteGameCascade,
  deleteGameTypeCascade,
  deletePlayerCascade,
  restoreGameTypeCascade,
  restorePlayerCascade,
} from '../util/trackplay.cascade';
import { DEFAULT_GAME_TYPE_ID } from '../util/trackplay.factory';
import { stampParticipants } from '../util/trackplay.scoring';
import { gamesForPlayerReducer } from './games/games-for-player.reducer';
import { GamesActions } from './games/games.actions';
import { gamesReducer } from './games/games.reducer';
import { GameTypesActions } from './game-types/game-types.actions';
import { gameTypesReducer } from './game-types/game-types.reducer';
import { PlayersActions } from './players/players.actions';
import { playersReducer } from './players/players.reducer';
import { TrackplayActions } from './trackplay.actions';

const perAggregate = combineReducers<TrackplayState>({
  players: playersReducer,
  games: gamesReducer,
  gamesForPlayer: gamesForPlayerReducer,
  gameTypes: gameTypesReducer,
});

// prettier-ignore
const trackplayCascade = createReducer(
  {} as TrackplayState,

  on(PlayersActions.removeItem, (state, { item }): TrackplayState =>
    deletePlayerCascade(state, item)),
  on(GamesActions.removeItem, (state, { item }): TrackplayState =>
    deleteGameCascade(state, item)),
  on(GameTypesActions.removeItem, (state, { item }): TrackplayState =>
    item.id === DEFAULT_GAME_TYPE_ID ? state : deleteGameTypeCascade(state, item)),

  on(TrackplayActions.restorePlayer, (state, { player, games }): TrackplayState =>
    restorePlayerCascade(state, player, games)),
  on(TrackplayActions.restoreGameType, (state, { gameType, games }): TrackplayState =>
    restoreGameTypeCascade(state, gameType, games)),

  on(GamesActions.setRoundValue, (state, { gameId, at }): TrackplayState => ({
    ...state,
    players: stampParticipants(state.players, state.games, gameId, at),
  }))
);

export const initialState: TrackplayState = perAggregate(undefined, {
  type: '@@trackplay/init',
});

export const trackplayReducer = (
  state: TrackplayState | undefined,
  action: Action
): TrackplayState => trackplayCascade(perAggregate(state, action), action);
