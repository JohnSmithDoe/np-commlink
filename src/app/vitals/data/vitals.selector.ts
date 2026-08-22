import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  IntakesState,
  PillsState,
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

export const selectPillsList = createSelector(
  selectVitalsState,
  (state): PillsState => state.pills
);

export const selectIntakes = createSelector(
  selectVitalsState,
  (state): IntakesState => state.intakes
);
