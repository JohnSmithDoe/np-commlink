import { createFeatureSelector } from '@ngrx/store';
import { ISettingsState } from '../../model';

export const selectSettingsState =
  createFeatureSelector<ISettingsState>('settings');
