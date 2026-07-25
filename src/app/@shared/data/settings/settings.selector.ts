import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ISettings } from '../../model/types';

export const selectSettingsState = createFeatureSelector<ISettings>('settings');

export const selectTheme = createSelector(
  selectSettingsState,
  (settings) => settings.theme
);
