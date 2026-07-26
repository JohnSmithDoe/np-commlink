// App-global settings (eager kernel). The grocery feature-flags that
// historically rode a shared "settings" slice moved into the groceries domain
// (IListSettings) and office-time owns its own OfficeTimeSettings; the selected
// UI theme is the only genuinely app-wide setting. (The persisted schema version
// is app-wide but lives in @shared/model/app.consts APP_VERSION, not here.)
import { TTheme } from './app.types';

export interface IAccentColors {
  primary: string;
  secondary: string;
}

export interface ISettingsState {
  // The selected UI theme (default 'cyberpunk'); drives <html data-theme>.
  theme: TTheme;
  // User-picked accent override, keyed by theme — unset falls back to that
  // theme's built-in swatch. Additive/optional: no persistence migration.
  customAccents?: Partial<Record<TTheme, IAccentColors>>;
}
