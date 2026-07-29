import { createFeatureSelector, createSelector } from '@ngrx/store';

import { ISettingsState } from '../../model/settings.types';

export const selectSettingsState =
  createFeatureSelector<ISettingsState>('settings');

export const selectTheme = createSelector(
  selectSettingsState,
  (settings) => settings.theme
);

export const selectLanguage = createSelector(
  selectSettingsState,
  (settings) => settings.language
);

export const selectCustomAccents = createSelector(
  selectSettingsState,
  (settings) => settings.customAccents
);
