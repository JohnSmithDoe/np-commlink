import { Action, combineReducers, createReducer, on } from '@ngrx/store';
import { VitalsState } from '../model/vitals.types';
import {
  deletePillCascade,
  deleteProfileCascade,
  restorePillCascade,
  restoreProfileCascade,
} from '../util/vitals.cascade';
import { intakesReducer } from './pills/intakes.reducer';
import { PillsActions } from './pills/pills.actions';
import { pillsReducer } from './pills/pills.reducer';
import { profilesReducer } from './profiles/profiles.reducer';
import { ProfilesActions } from './profiles/profiles.actions';
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

  on(ProfilesActions.removeItem, (state, { item }): VitalsState => deleteProfileCascade(state, item)),
  on(PillsActions.removeItem, (state, { item }): VitalsState => deletePillCascade(state, item)),
  on(VitalsActions.restorePill, (state, { pill, intakes }): VitalsState => restorePillCascade(state, pill, intakes)),
  on(VitalsActions.restoreProfile, (state, { profile, readings, pills, intakes }): VitalsState => restoreProfileCascade(state, profile, readings, pills, intakes))
);

export const vitalsReducer = (
  state: VitalsState | undefined,
  action: Action
): VitalsState => vitalsCascade(perAggregate(state, action), action);
