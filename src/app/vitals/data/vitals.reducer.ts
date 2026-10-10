import { Action, combineReducers, createReducer, on } from '@ngrx/store';
import { VitalsState } from '../model/vitals.types';
import { deletePillCascade, restorePillCascade } from '../util/vitals.cascade';
import { intakesReducer } from './pills/intakes.reducer';
import { PillsActions } from './pills/pills.actions';
import { pillsReducer } from './pills/pills.reducer';
import { profilesReducer } from './profiles/profiles.reducer';
import { readingsReducer } from './readings/readings.reducer';
import { VitalsActions } from './vitals.actions';

const perAggregate = combineReducers<VitalsState>({
  profiles: profilesReducer,
  readings: readingsReducer,
  pills: pillsReducer,
  intakes: intakesReducer,
});

// prettier-ignore
const vitalsCascade = createReducer(
  {} as VitalsState,

  on(PillsActions.removeItem, (state, { item }): VitalsState => deletePillCascade(state, item)),
  on(VitalsActions.restorePill, (state, { pill, intakes }): VitalsState => restorePillCascade(state, pill, intakes))
);

export const vitalsReducer = (
  state: VitalsState | undefined,
  action: Action
): VitalsState => vitalsCascade(perAggregate(state, action), action);
