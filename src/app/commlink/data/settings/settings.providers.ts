import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { providePersistedContext } from '../../../@shared/data/persisted-states/persisted-context.provider';
import { EmojiActions } from '../../../@shared/data/emoji/emoji.actions';
import { RECENT_EMOJIS } from '../../../@shared/util/emoji/recent-emojis.token';
import { SettingsActions } from './settings.actions';
import { SettingsEffects } from './settings.effects';
import { settingsReducer } from './settings.reducer';
import {
  SETTINGS_STATE_KEY,
  selectRecentEmojis,
  selectSettingsState,
} from './settings.selector';

export const recentEmojisProvider = {
  provide: RECENT_EMOJIS,
  useFactory: () => inject(Store).selectSignal(selectRecentEmojis),
};

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
  publishes: [recentEmojisProvider],
});
