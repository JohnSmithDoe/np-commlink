import { providePersistedContext } from '../../@shared/data/persisted-context.provider';
import { SettingsActions } from './actions/settings.actions';
import { SettingsEffects } from './effects/settings.effects';
import { settingsReducer } from './reducer/settings.reducer';
import { selectSettingsState } from './selectors/settings.selector';

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
  key: 'settings',
  reducer: settingsReducer,
  lifecycle: SettingsActions,
  select: selectSettingsState,
  save: {
    on: [
      SettingsActions.setTheme,
      SettingsActions.setLanguage,
      SettingsActions.setAccentColors,
      SettingsActions.resetAccentColors,
    ],
  },
  hydrate: 'boot',
  effects: [SettingsEffects],
});
