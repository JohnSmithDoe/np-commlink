import { createFeatureSelector, createSelector } from '@ngrx/store';

import { SettingsState } from '../../model/settings.types';

export const SETTINGS_STATE_KEY = 'settings';

export const selectSettingsState =
  createFeatureSelector<SettingsState>(SETTINGS_STATE_KEY);

export const selectSkin = createSelector(
  selectSettingsState,
  (settings) => settings.skin
);

export const selectMode = createSelector(
  selectSettingsState,
  (settings) => settings.mode
);

export const selectRecentEmojis = createSelector(
  selectSettingsState,
  (settings): readonly string[] => settings.recentEmojis ?? []
);

export const selectLanguage = createSelector(
  selectSettingsState,
  (settings) => settings.language
);

export const selectCustomAccents = createSelector(
  selectSettingsState,
  (settings) => settings.customAccents
);
