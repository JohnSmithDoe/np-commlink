import {
  IAccentColors,
  TLanguage,
  TTheme,
} from '../../@shared/model/app.types';

export interface ISettingsState {
  // The selected UI theme (default 'cyberpunk'); drives <html data-theme>.
  theme: TTheme;
  // The selected UI language (default 'de'); drives the translate bundle, dayjs,
  // and every locale-sensitive format. Optional in a *stored* doc — an install
  // that predates it hydrates onto the default, so no migration hop.
  language: TLanguage;
  // User-picked accent override, keyed by theme — unset falls back to that
  // theme's built-in swatch. Additive/optional: no persistence migration.
  customAccents?: Partial<Record<TTheme, IAccentColors>>;
}
