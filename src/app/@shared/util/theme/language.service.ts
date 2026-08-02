import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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

const applyDocumentLanguage = (language: Language): void => {
  document.documentElement.lang = language;
};

const ANGULAR_LOCALE_DATA: Record<Language, unknown> = {
  de: localeDe,
  en: localeEn,
};

for (const data of Object.values(ANGULAR_LOCALE_DATA)) registerLocaleData(data);
setDayjsLocale(bootLanguage());
applyDocumentLanguage(bootLanguage());

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly #translate = inject(TranslateService);

  readonly #language = signal<Language>(bootLanguage());
  readonly language: Signal<Language> = this.#language.asReadonly();
  readonly locale = computed(() => LOCALE_BY_LANGUAGE[this.#language()]);

  apply(language: Language): void {
    this.#language.set(language);
    this.#translate.use(language);
    setDayjsLocale(language);
    applyDocumentLanguage(language);
    globalThis.localStorage?.setItem(BOOT_LANGUAGE_KEY, language);
  }
}
