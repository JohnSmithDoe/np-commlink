import { createReducer, on } from '@ngrx/store';
import { EmojiActions } from '../../@shared/data/emoji/emoji.actions';
import { SettingsActions } from './settings.actions';
import { ISettingsState } from '../model/settings.types';

// Enough to fill the picker's recents row twice over without turning the
// persisted settings doc into a usage log.
const RECENT_EMOJI_LIMIT = 24;

export const initialSettings: ISettingsState = {
  // Cyberpunk ships as the default look (the app's Shadowrun identity); a fresh
  // install (loaded(null)) keeps this.
  theme: 'cyberpunk',
  // German is the default the app was written in, and the fallback bundle.
  language: 'de',
};

export const settingsReducer = createReducer(
  initialSettings,
  // A stored doc is merged over the defaults rather than replacing them: a
  // missing `theme` or `language` would otherwise leave it undefined, and these
  // are the values that reach `<html>` before anything can correct them. It is
  // also what lets a field be added here without a migration hop — an install
  // that predates `language` hydrates onto the default.
  on(SettingsActions.loaded, (state, { settings }): ISettingsState =>
    settings ? { ...initialSettings, ...settings } : state
  ),
  on(SettingsActions.setTheme, (state, { theme }): ISettingsState => ({
    ...state,
    theme,
  })),
  on(SettingsActions.setLanguage, (state, { language }): ISettingsState => ({
    ...state,
    language,
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
  }),
  // Most-recent-first, deduped, capped. The glyphs of one save arrive together
  // and all count as equally recent, so they keep the order the name spelled
  // them in rather than being folded one at a time.
  on(EmojiActions.used, (state, { glyphs }): ISettingsState => ({
    ...state,
    recentEmojis: [
      ...glyphs,
      ...(state.recentEmojis ?? []).filter((glyph) => !glyphs.includes(glyph)),
    ].slice(0, RECENT_EMOJI_LIMIT),
  }))
);
