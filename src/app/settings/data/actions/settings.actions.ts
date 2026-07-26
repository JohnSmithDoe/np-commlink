import { createActionGroup, emptyProps } from '@ngrx/store';
import { TTheme } from '../../../@shared/model/app.types';
import {
  IAccentColors,
  ISettingsState,
} from '../../../@shared/model/settings.types';

// The app-global settings contract (eager kernel). Currently just the persisted
// schema `version` anchor for the migration framework (@shared/util/migrations):
// the grocery feature-flags that historically rode a shared "settings" slice
// moved into the groceries domain (IListSettings) and office-time owns its own
// OfficeTimeSettings, so `version` is the one genuinely app-wide setting left.
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
