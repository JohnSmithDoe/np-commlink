import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { EmojiActions } from '../../@shared/data/emoji/emoji.actions';
import { SettingsActions } from './settings.actions';
import { SettingsEffects } from './settings.effects';
import { settingsReducer } from './settings.reducer';
import { SETTINGS_STATE_KEY, selectSettingsState } from './settings.selector';

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
      EmojiActions.used,
    ],
  },
  hydrate: 'boot',
  effects: [SettingsEffects],
});
