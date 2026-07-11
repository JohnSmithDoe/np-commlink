import { createReducer, on } from '@ngrx/store';
import { ISettingsState } from '../../../@shared/types';
import { applicationActions } from '../../../@shared/data/application.actions';
import { settingsActions } from './settings.actions';
import { VERSION } from '../../../@shared/util/migrations';

export const initialSettings: ISettingsState = {
  showTotalTime: false,
  version: VERSION,
};

export const settingsReducer = createReducer(
  initialSettings,
  on(
    settingsActions.updateSettings,
    (_state, { settings }): ISettingsState => settings
  ),
  on(
    applicationActions.loadedSuccessfully,
    (_state, { datastore }): ISettingsState => datastore.settings ?? _state
  )
);
