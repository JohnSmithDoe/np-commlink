import { createFeatureSelector } from '@ngrx/store';
import { IListSettings } from '../../model';

export const selectListSettingsState =
  createFeatureSelector<IListSettings>('listSettings');
