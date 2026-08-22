import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  AccentColors,
  Language,
  Mode,
  Skin,
} from '../../../@shared/model/app.types';
import { SettingsState } from '../../model/settings.types';

export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    load: emptyProps(),
    loaded: (settings: SettingsState | null) => ({ settings }),

    setSkin: (skin: Skin) => ({ skin }),
    setMode: (mode: Mode) => ({ mode }),

    setLanguage: (language: Language) => ({ language }),

    setAccentColors: (skin: Skin, colors: AccentColors) => ({
      skin,
      colors,
    }),
    resetAccentColors: (skin: Skin) => ({ skin }),
  },
});
