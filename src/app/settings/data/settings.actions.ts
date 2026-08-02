import { createActionGroup, emptyProps } from '@ngrx/store';
import { AccentColors, Language, Theme } from '../../@shared/model/app.types';
import { SettingsState } from '../model/settings.types';

export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    load: emptyProps(),
    loaded: (settings: SettingsState | null) => ({ settings }),

    setTheme: (theme: Theme) => ({ theme }),

    setLanguage: (language: Language) => ({ language }),

    setAccentColors: (theme: Theme, colors: AccentColors) => ({
      theme,
      colors,
    }),
    resetAccentColors: (theme: Theme) => ({ theme }),
  },
});
