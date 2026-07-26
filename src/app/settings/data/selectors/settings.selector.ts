import { createFeatureSelector, createSelector } from '@ngrx/store';

import { ISettingsState } from '../../../@shared/model/settings.types';

export const selectSettingsState =
  createFeatureSelector<ISettingsState>('settings');

export const selectTheme = createSelector(
  selectSettingsState,
  (settings) => settings.theme
);

export const selectCustomAccents = createSelector(
  selectSettingsState,
  (settings) => settings.customAccents
);
