import { createFeatureSelector } from '@ngrx/store';
import { IListSettings } from '../../types';

export const selectListSettingsState =
  createFeatureSelector<IListSettings>('listSettings');
