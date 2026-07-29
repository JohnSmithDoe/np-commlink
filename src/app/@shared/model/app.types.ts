import { PredefinedColors } from '@ionic/core/dist/types/interface';

export type TIonDragEvent = CustomEvent<{ amount: number; ratio: number }>;
export type TMarker = string;
export type TTimestamp = string;
export type TColor = PredefinedColors;
export type TTheme = 'cyberpunk' | 'boomer';
// The union as a value, so a picker can render every member instead of listing
// them again in a template — adding a theme then fails to compile until the
// literal list grows with it.
export const THEMES = [
  'cyberpunk',
  'boomer',
] as const satisfies readonly TTheme[];

// The UI language. A primitive for the same reason `TTheme` is: the `settings`
// domain drives it, but money parsing (`cash`), score formatting (`trackplay`)
// and every date field speak it too.
export type TLanguage = 'de' | 'en';
export const LANGUAGES = ['de', 'en'] as const satisfies readonly TLanguage[];

// The BCP-47 tag each language formats numbers and dates with — `de` alone is
// not enough for `Intl`, which needs the region to pick separators.
export const LOCALE_BY_LANGUAGE: Record<TLanguage, string> = {
  de: 'de-DE',
  en: 'en-US',
};

// The accent pair a theme can be overridden with. A primitive rather than a
// settings concept: `ThemeService` applies it and the deck reads a theme, so both
// live here for the same reason `TTheme` does — more than one domain speaks them.
export interface IAccentColors {
  primary: string;
  secondary: string;
}
