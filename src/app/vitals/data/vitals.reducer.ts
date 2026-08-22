import { Action, combineReducers, createReducer, on } from '@ngrx/store';
import { VitalsState } from '../model/vitals.types';
import {
  deleteProfileCascade,
  restoreProfileCascade,
} from '../util/vitals.cascade';
import { profilesReducer } from './profiles/profiles.reducer';
import { ProfilesActions } from './profiles/profiles.actions';
import { readingsReducer } from './readings/readings.reducer';
import { VitalsActions } from './vitals.actions';

const perAggregate = combineReducers<VitalsState>({
  profiles: profilesReducer,
  readings: readingsReducer,
});

// prettier-ignore
const vitalsCascade = createReducer(
  {} as VitalsState,

  on(ProfilesActions.removeItem, (state, { item }): VitalsState => deleteProfileCascade(state, item)),
  on(VitalsActions.restoreProfile, (state, { profile, readings }): VitalsState => restoreProfileCascade(state, profile, readings))
);

export const vitalsReducer = (
  state: VitalsState | undefined,
  action: Action
): VitalsState => vitalsCascade(perAggregate(state, action), action);
