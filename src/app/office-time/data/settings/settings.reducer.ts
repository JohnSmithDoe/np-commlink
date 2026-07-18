import { createReducer, on } from '@ngrx/store';
import { ISettingsState } from '../../model';
import { SettingsActions } from './settings.actions';
import { VERSION } from '../../../@shared/util/migrations';

export const initialSettings: ISettingsState = {
  showTotalTime: false,
  version: VERSION,
};

export const settingsReducer = createReducer(
  initialSettings,
  on(
    SettingsActions.updateSettings,
    (_state, { settings }): ISettingsState => settings
  ),
  on(
    SettingsActions.loaded,
    (_state, { settings }): ISettingsState => settings ?? _state
  )
);
