import type { PredefinedColors } from '@ionic/core';

export type IonDragEvent = CustomEvent<{ amount: number; ratio: number }>;
export type IonColor = PredefinedColors | 'accent';
export type Marker = string;
export type Timestamp = string;
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Skin = 'cyberpunk' | 'boomer';
export type Mode = 'light' | 'dark';
export type LanguageModelAvailability = Availability | 'probing';
export const SKINS = ['cyberpunk', 'boomer'] as const satisfies readonly Skin[];
export const MODES = ['light', 'dark'] as const satisfies readonly Mode[];

export type Language = 'de' | 'en' | 'fr';
export const LANGUAGES = [
  'de',
  'en',
  'fr',
] as const satisfies readonly Language[];

export const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
};

export interface AccentColors {
  primary: string;
  secondary: string;
}
