/* ─── why ─────────────────────────────────────────────────────────
 * `setMode` DROPS the custom accents. A picked hue is keyed by skin, but no
 * hue survives crossing the other ground — cyberpunk's amber falls to 2.3:1
 * on paper, boomer's blue to 2.6:1 on ink — and an override is an inline
 * style on <html>, so it outranks the compound block that exists to prevent
 * exactly that. Both skins go, not only the active one: the other one's pick
 * was made on the old ground too.
 * ───────────────────────────────────────────────────────────────── */
import { createReducer, on } from '@ngrx/store';
import { EmojiActions } from '../../../@shared/data/emoji/emoji.actions';
import { SettingsActions } from './settings.actions';
import { SettingsState } from '../../model/settings.types';

const RECENT_EMOJI_LIMIT = 24;

export const initialSettings: SettingsState = {
  skin: 'cyberpunk',
  mode: 'dark',
  language: 'de',
};

export const settingsReducer = createReducer(
  initialSettings,
  on(SettingsActions.loaded, (state, { settings }): SettingsState =>
    settings ? { ...initialSettings, ...settings } : state
  ),
  on(SettingsActions.setSkin, (state, { skin }): SettingsState => ({
    ...state,
    skin,
  })),
  on(SettingsActions.setMode, (state, { mode }): SettingsState => ({
    ...state,
    mode,
    customAccents: undefined,
  })),
  on(SettingsActions.setLanguage, (state, { language }): SettingsState => ({
    ...state,
    language,
  })),
  on(
    SettingsActions.setAccentColors,
    (state, { skin, colors }): SettingsState => ({
      ...state,
      customAccents: { ...state.customAccents, [skin]: colors },
    })
  ),
  on(SettingsActions.resetAccentColors, (state, { skin }): SettingsState => {
    const { [skin]: _removed, ...rest } = state.customAccents ?? {};
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
