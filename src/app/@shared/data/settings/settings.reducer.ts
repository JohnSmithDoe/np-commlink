import { createReducer, on } from '@ngrx/store';
import { ISettings } from '../../types';
import { VERSION } from '../../util/migrations';
import { SettingsActions } from './settings.actions';

// The single source of the persisted schema version (was duplicated as a
// per-slice `version` on listSettings + office-time settings; both dropped it —
// only this global anchor remains).
export const initialSettings: ISettings = {
  version: VERSION,
  // Cyberpunk ships as the default look (the app's Shadowrun identity); a fresh
  // install (loaded(null)) keeps this.
  theme: 'cyberpunk',
};

export const settingsReducer = createReducer(
  initialSettings,
  on(
    SettingsActions.loaded,
    (_state, { settings }): ISettings => settings ?? _state
  ),
  on(SettingsActions.setTheme, (state, { theme }): ISettings => ({
    ...state,
    theme,
  }))
);
