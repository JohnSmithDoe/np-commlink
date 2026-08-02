import { createReducer, on } from '@ngrx/store';
import { EmojiActions } from '../../@shared/data/emoji/emoji.actions';
import { SettingsActions } from './settings.actions';
import { SettingsState } from '../model/settings.types';

const RECENT_EMOJI_LIMIT = 24;

export const initialSettings: SettingsState = {
  theme: 'cyberpunk',
  language: 'de',
};

export const settingsReducer = createReducer(
  initialSettings,
  on(SettingsActions.loaded, (state, { settings }): SettingsState =>
    settings ? { ...initialSettings, ...settings } : state
  ),
  on(SettingsActions.setTheme, (state, { theme }): SettingsState => ({
    ...state,
    theme,
  })),
  on(SettingsActions.setLanguage, (state, { language }): SettingsState => ({
    ...state,
    language,
  })),
  on(
    SettingsActions.setAccentColors,
    (state, { theme, colors }): SettingsState => ({
      ...state,
      customAccents: { ...state.customAccents, [theme]: colors },
    })
  ),
  on(SettingsActions.resetAccentColors, (state, { theme }): SettingsState => {
    const { [theme]: _removed, ...rest } = state.customAccents ?? {};
    return { ...state, customAccents: rest };
  }),
  on(EmojiActions.used, (state, { glyphs }): SettingsState => ({
    ...state,
    recentEmojis: [
      ...glyphs,
      ...(state.recentEmojis ?? []).filter((glyph) => !glyphs.includes(glyph)),
    ].slice(0, RECENT_EMOJI_LIMIT),
  }))
);
