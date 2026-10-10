/* ─── why ─────────────────────────────────────────────────────────
 * The two `removeItem`s and the restore live ONLY here: add one to
 * an aggregate and `combineReducers` starts handing the cascade POST-delete
 * state, which neither the compiler nor a per-aggregate spec notices
 * ([domains.md](../../../../docs/domains.md)).
 * ───────────────────────────────────────────────────────────────── */

import { Action, combineReducers, createReducer, on } from '@ngrx/store';
import { TrackplayState } from '../model/trackplay.types';
import {
  deleteGameCascade,
  deleteGameTypeCascade,
  restoreGameTypeCascade,
} from '../util/trackplay.cascade';
import { DEFAULT_GAME_TYPE_ID } from '../util/trackplay.factory';
import { boardReducer } from './board/board.reducer';
import { diceReducer } from './dice/dice.reducer';
import { gamesForPlayerReducer } from './games/games-for-player.reducer';
import { GamesActions } from './games/games.actions';
import { gamesReducer } from './games/games.reducer';
import { GameTypesActions } from './game-types/game-types.actions';
import { gameTypesReducer } from './game-types/game-types.reducer';
import { playersReducer } from './players/players.reducer';
import { TrackplayActions } from './trackplay.actions';

const perAggregate = combineReducers<TrackplayState>({
  players: playersReducer,
  games: gamesReducer,
  gamesForPlayer: gamesForPlayerReducer,
  gameTypes: gameTypesReducer,
  dice: diceReducer,
  board: boardReducer,
});

// prettier-ignore
const trackplayCascade = createReducer(
  {} as TrackplayState,

  on(GamesActions.removeItem, (state, { item }): TrackplayState =>
    deleteGameCascade(state, item)),
  on(GameTypesActions.removeItem, (state, { item }): TrackplayState =>
    item.id === DEFAULT_GAME_TYPE_ID ? state : deleteGameTypeCascade(state, item)),

  on(TrackplayActions.restoreGameType, (state, { gameType, games }): TrackplayState =>
    restoreGameTypeCascade(state, gameType, games))
);

export const initialState: TrackplayState = perAggregate(undefined, {
  type: '@@trackplay/init',
});

export const trackplayReducer = (
  state: TrackplayState | undefined,
  action: Action
): TrackplayState => trackplayCascade(perAggregate(state, action), action);
