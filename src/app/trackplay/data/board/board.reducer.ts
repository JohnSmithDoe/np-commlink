import { createReducer, on } from '@ngrx/store';
import { BoardState } from '../../model/board.types';
import { buildBoard } from '../../util/board.factory';
import { planMove } from '../../util/board.moves';
import {
  placeFigure,
  placeNextAtHome,
  takeBack,
  validateSetting,
} from '../../util/board.setup';
import { initialBoardState } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { BoardActions } from './board.actions';

// prettier-ignore
export const boardReducer = createReducer(
  initialBoardState,

  on(BoardActions.seatPlayers, (state, { players }): BoardState =>
    players === state.players ? state : { ...state, players, figures: [] }),

  on(BoardActions.placeOn, (state, { fieldId }): BoardState => ({
    ...state,
    figures: placeFigure(buildBoard(state.players), state.figures, fieldId),
  })),

  on(BoardActions.placeNextAtHome, (state): BoardState => ({
    ...state,
    figures: placeNextAtHome(buildBoard(state.players), state.figures),
  })),

  on(BoardActions.moveFigure, (state, { from, pips }): BoardState => {
    const plan = planMove(buildBoard(state.players), state.rules, state.figures, from, pips);
    return plan.ok ? { ...state, figures: plan.figures } : state;
  }),

  on(BoardActions.loadSetting, (state, { players, figures }): BoardState =>
    validateSetting(buildBoard(players), figures).length > 0
      ? state
      : { ...state, players, figures }),

  on(BoardActions.takeBack, (state): BoardState => ({
    ...state,
    figures: takeBack(state.figures),
  })),

  on(BoardActions.clearBoard, (state): BoardState => ({
    ...state,
    figures: [],
  })),

  on(BoardActions.setRules, (state, { rules }): BoardState => ({
    ...state,
    rules: { ...state.rules, ...rules },
  })),

  on(TrackplayActions.loaded, (state, { trackplay }): BoardState =>
    trackplay?.board ?? state)
);
