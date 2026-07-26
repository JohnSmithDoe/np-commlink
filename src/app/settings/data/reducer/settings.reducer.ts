import { createReducer, on } from '@ngrx/store';
import { SettingsActions } from '../actions/settings.actions';
import { ISettingsState } from '../../../@shared/model/settings.types';

export const initialSettings: ISettingsState = {
  // Cyberpunk ships as the default look (the app's Shadowrun identity); a fresh
  // install (loaded(null)) keeps this.
  theme: 'cyberpunk',
};

export const settingsReducer = createReducer(
  initialSettings,
  on(
    SettingsActions.loaded,
    (_state, { settings }): ISettingsState => settings ?? _state
  ),
  on(SettingsActions.setTheme, (state, { theme }): ISettingsState => ({
    ...state,
    theme,
  })),
  on(
    SettingsActions.setAccentColors,
    (state, { theme, colors }): ISettingsState => ({
      ...state,
      customAccents: { ...state.customAccents, [theme]: colors },
    })
  ),
  on(SettingsActions.resetAccentColors, (state, { theme }): ISettingsState => {
    const { [theme]: _removed, ...rest } = state.customAccents ?? {};
    return { ...state, customAccents: rest };
  })
);
