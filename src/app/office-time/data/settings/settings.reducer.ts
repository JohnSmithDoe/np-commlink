import { createReducer, on } from '@ngrx/store';
import { IOfficeTimeSettingsState } from '../../model';
import { OfficeTimeSettingsActions } from './settings.actions';

// The persisted schema `version` moved to the app-global Settings slice, so the
// office-time settings initial state is just its own flags now.
export const initialOfficeTimeSettings: IOfficeTimeSettingsState = {
  showTotalTime: false,
};

export const officeTimeSettingsReducer = createReducer(
  initialOfficeTimeSettings,
  on(
    OfficeTimeSettingsActions.updateSettings,
    (_state, { settings }): IOfficeTimeSettingsState => settings
  ),
  on(
    OfficeTimeSettingsActions.loaded,
    (_state, { settings }): IOfficeTimeSettingsState => settings ?? _state
  )
);
