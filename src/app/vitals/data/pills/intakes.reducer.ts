import { createReducer, on } from '@ngrx/store';
import { IntakesState } from '../../model/vitals.types';
import { isTakenOn } from '../../util/pill.utils';
import { initialIntakesState } from '../../util/vitals.factory';
import { VitalsActions } from '../vitals.actions';
import { PillsActions } from './pills.actions';

// prettier-ignore
export const intakesReducer = createReducer(
  initialIntakesState,

  on(PillsActions.setTaken, (state, { pillId, takenOn, taken }): IntakesState => {
    if (!taken) {
      return state.filter((intake) => !(intake.pillId === pillId && intake.takenOn === takenOn));
    }
    return isTakenOn(state, pillId, takenOn) ? state : [...state, { pillId, takenOn }];
  }),

  on(VitalsActions.loaded, (state, { vitals }): IntakesState => vitals?.intakes ?? state)
);
