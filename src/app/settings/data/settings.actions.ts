import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  IAccentColors,
  TLanguage,
  TTheme,
} from '../../@shared/model/app.types';
import { ISettingsState } from '../model/settings.types';

// The app-global settings contract (eager kernel): the UI theme, its accent
// overrides and the UI language — the only genuinely app-wide settings left. The grocery
// feature-flags that historically rode a shared "settings" slice moved into the
// groceries domain (IListSettings), and office-time's own settings slice was
// deleted as dead code.
export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    // Own-data lazy load lifecycle. `settings` is eager kernel state, but still
    // loads its own key at boot like every other slice.
    load: emptyProps(),
    loaded: (settings: ISettingsState | null) => ({ settings }),

    // User picked a UI theme in the settings page. The reducer merges it, a
    // settings.effect applies it to <html data-theme> and persists the doc.
    setTheme: (theme: TTheme) => ({ theme }),

    // User picked a UI language. The reducer merges it, a settings.effect hands
    // it to LanguageService (translate bundle + dayjs + <html lang>) and
    // persists the doc.
    setLanguage: (language: TLanguage) => ({ language }),

    // User picked a custom accent pair for one theme (the settings page always
    // edits the currently-selected theme's override).
    setAccentColors: (theme: TTheme, colors: IAccentColors) => ({
      theme,
      colors,
    }),
    // Drops one theme's override, falling back to its built-in swatch.
    resetAccentColors: (theme: TTheme) => ({ theme }),
  },
});
