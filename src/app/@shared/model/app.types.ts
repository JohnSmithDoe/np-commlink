import type { PredefinedColors } from '@ionic/core';

export type IonDragEvent = CustomEvent<{ amount: number; ratio: number }>;
export type IonColor = PredefinedColors | 'accent';
export type Marker = string;
export type Timestamp = string;
export type Theme = 'cyberpunk' | 'boomer';
export type LanguageModelAvailability = Availability | 'probing';
export const THEMES = [
  'cyberpunk',
  'boomer',
] as const satisfies readonly Theme[];

export type Language = 'de' | 'en';
export const LANGUAGES = ['de', 'en'] as const satisfies readonly Language[];

export const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  de: 'de-DE',
  en: 'en-US',
};

export interface AccentColors {
  primary: string;
  secondary: string;
}
