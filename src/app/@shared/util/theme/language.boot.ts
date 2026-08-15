/* ─── why ─────────────────────────────────────────────────────────
 * The language is settled before the store exists: `provideTranslateService`
 * and `LOCALE_ID` need a value at injector creation, while the settings slice
 * hydrates asynchronously — so `localStorage` is the boot truth and the slice
 * mirrors it. Every `setLanguage` reloads the app, which is what makes
 * `APP_LANGUAGE` safe as a session constant for a `ui` component or a pipe.
 *
 * Apart from `LanguageService` because these are pure functions plus one
 * runtime registration, and `util/` may hold no injectable.
 * ───────────────────────────────────────────────────────────────── */
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import { InjectionToken } from '@angular/core';
import { Language, LANGUAGES, LOCALE_BY_LANGUAGE } from '../../model/app.types';
import { setDayjsLocale } from '../formatting/date-format.utils';

const BOOT_LANGUAGE_KEY = 'npc-language';

const isLanguage = (value: string | null): value is Language =>
  LANGUAGES.includes(value as Language);

export function bootLanguage(): Language {
  const stored = globalThis.localStorage?.getItem(BOOT_LANGUAGE_KEY) ?? null;
  return isLanguage(stored) ? stored : 'de';
}

export const bootLocale = (): string => LOCALE_BY_LANGUAGE[bootLanguage()];

export const rememberBootLanguage = (language: Language): void => {
  globalThis.localStorage?.setItem(BOOT_LANGUAGE_KEY, language);
};

export const applyDocumentLanguage = (language: Language): void => {
  document.documentElement.lang = language;
};

const ANGULAR_LOCALE_DATA: Record<Language, unknown> = {
  de: localeDe,
  en: localeEn,
};

for (const data of Object.values(ANGULAR_LOCALE_DATA)) registerLocaleData(data);
setDayjsLocale(bootLanguage());
applyDocumentLanguage(bootLanguage());

export const APP_LANGUAGE = new InjectionToken<Language>('APP_LANGUAGE', {
  factory: bootLanguage,
});
