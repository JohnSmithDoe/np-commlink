import { createFeatureSelector } from '@ngrx/store';
import { IOfficeTimeSettingsState } from '../../model';

export const selectOfficeTimeSettingsState =
  createFeatureSelector<IOfficeTimeSettingsState>('officeTimeSettings');
