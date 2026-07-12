import { createReducer, on } from '@ngrx/store';
import { ISettingsState } from '../../../@shared/types';
import { ApplicationActions } from '../../../@shared/data/application.actions';
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
    ApplicationActions.loadedSuccessfully,
    (_state, { datastore }): ISettingsState => datastore.settings ?? _state
  )
);
