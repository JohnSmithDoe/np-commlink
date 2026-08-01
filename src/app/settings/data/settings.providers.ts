import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { EmojiActions } from '../../@shared/data/emoji/emoji.actions';
import { SettingsActions } from './settings.actions';
import { SettingsEffects } from './settings.effects';
import { settingsReducer } from './settings.reducer';
import { SETTINGS_STATE_KEY, selectSettingsState } from './settings.selector';

/**
 * The app-global settings slice — the selected UI theme with its accent
 * overrides, and the UI language.
 *
 * `hydrate: 'boot'` and `provideAppKernel()` composing it are what make it eager:
 * the theme must reach `<html data-theme>` under the boot splash before first
 * paint, while `/settings` is just the page that edits it.
 * `SettingsEffects.revealSplash$` lifts the splash on `loaded`, which is why the
 * boot dispatch does not block bootstrap.
 */
export const settingsContext = providePersistedContext({
  key: SETTINGS_STATE_KEY,
  reducer: settingsReducer,
  lifecycle: SettingsActions,
  select: selectSettingsState,
  save: {
    on: [
      SettingsActions.setTheme,
      SettingsActions.setLanguage,
      SettingsActions.setAccentColors,
      SettingsActions.resetAccentColors,
      // Published by @shared, folded by this slice's reducer — so the save
      // trigger has to name it too, or a remembered emoji would live only until
      // the next reload.
      EmojiActions.used,
    ],
  },
  hydrate: 'boot',
  effects: [SettingsEffects],
});
