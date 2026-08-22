import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  ProfilesState,
  ReadingsState,
  VitalsState,
} from '../model/vitals.types';

export const VITALS_STATE_KEY = 'vitals';

export const selectVitalsState =
  createFeatureSelector<VitalsState>(VITALS_STATE_KEY);

export const selectProfilesList = createSelector(
  selectVitalsState,
  (state): ProfilesState => state.profiles
);

export const selectReadingsList = createSelector(
  selectVitalsState,
  (state): ReadingsState => state.readings
);
