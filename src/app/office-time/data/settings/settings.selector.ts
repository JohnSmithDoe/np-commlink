import { createFeatureSelector } from '@ngrx/store';
import { ISettingsState } from '../../../@shared/types';

export const selectSettingsState =
  createFeatureSelector<ISettingsState>('settings');
