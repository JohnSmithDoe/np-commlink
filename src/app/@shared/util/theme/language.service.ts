import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  LANGUAGES,
  LOCALE_BY_LANGUAGE,
  TLanguage,
} from '../../model/app.types';
import { setDayjsLocale } from '../formatting/date-format.utils';

/**
 * Where the applied language is mirrored for the *next* boot to read.
 *
 * `LOCALE_ID` is a provider: it is resolved synchronously while the app is being
 * composed, long before `npc-settings` can be read out of IndexedDB. So the one
 * fact bootstrap needs early is also kept somewhere synchronous. The settings
 * doc stays the source of truth — this is written by `apply()` alone, and since
 * a language change restarts the app, the two can never be observed disagreeing.
 */
const BOOT_LANGUAGE_KEY = 'npc-language';

const isLanguage = (value: string | null): value is TLanguage =>
  LANGUAGES.includes(value as TLanguage);

/** The language this boot should format in — the default until one was picked. */
export function bootLanguage(): TLanguage {
  const stored = globalThis.localStorage?.getItem(BOOT_LANGUAGE_KEY) ?? null;
  return isLanguage(stored) ? stored : 'de';
}

export const bootLocale = (): string => LOCALE_BY_LANGUAGE[bootLanguage()];

/**
 * The one writer of `<html lang>` — the browser's hyphenation dictionary and a
 * screen reader's voice. `index.html` can only ship a static guess (German, the
 * `bootLanguage()` default), so this corrects it for an English user too.
 */
const applyDocumentLanguage = (language: TLanguage): void => {
  document.documentElement.lang = language;
};

/**
 * Angular's own locale data — what the `date`, `number` and `currency` pipes read
 * through `LOCALE_ID`. Keyed by the union so a new language cannot ship without
 * it: this used to be a bare `registerLocaleData(de)` in the shell component,
 * which happened to work only because `@angular/common` bundles `en` as its
 * built-in. A third `TLanguage` would have satisfied `LANGUAGES` and
 * `LOCALE_BY_LANGUAGE` and still formatted every date and number as `en-US`.
 *
 * All of them are registered, not just this boot's: `LOCALE_ID` decides which one
 * is used, the packs are small, and registering the set removes any ordering
 * dependency on which language booted.
 */
const ANGULAR_LOCALE_DATA: Record<TLanguage, unknown> = {
  de: localeDe,
  en: localeEn,
};

// At module scope, not in `apply()`, because both of these are *globals* that
// module-level code already reads: a reducer's `initialState` builder formatting
// a date at import time would otherwise get dayjs's built-in English until the
// settings slice hydrates, and a pipe would find no locale data at all. This
// module is imported by the kernel composition before any reducer or component,
// so both are set before the first such call — earlier than a component
// constructor could manage.
for (const data of Object.values(ANGULAR_LOCALE_DATA)) registerLocaleData(data);
setDayjsLocale(bootLanguage());
// `<html lang>` is here for a different reason: no code of ours reads it, the
// *browser* does, at first paint — which this module beats, because the kernel
// composition imports it before `bootstrapApplication`. Left to `apply()` alone
// it would not be corrected until `npc-settings` came out of IndexedDB.
applyDocumentLanguage(bootLanguage());

/**
 * Applies a language everywhere a language is a global: the `@ngx-translate`
 * bundle, dayjs's locale (relative dates and `format('dddd')` read it), and
 * `<html lang>` for the browser's own hyphenation and screen-reader voice.
 *
 * The exact sibling of `ThemeService`, for the exact same reason: `settings`
 * drives the language, a reader in another domain may not import
 * `SettingsFacade` (Sheriff seals the domain axis), and locale-sensitive output
 * — money separators, score grouping, date fields — is read from more than one
 * domain. So the applied value is published as a signal here, in the one layer
 * every domain may reach. It does not *change* within a session: switching the
 * language restarts the app, because pure pipes cache their formatted output
 * (see `SettingsEffects.restartOnLanguageChange$`).
 *
 * `locale` is what callers actually want: `Intl` and Angular's `date` pipe need
 * the region (`de-DE`), not the bare language.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly #translate = inject(TranslateService);

  // Seeded from the boot mirror rather than from the default, so a reader that
  // runs before hydration (the money pipe on a first paint) already formats in
  // the language this boot resolved `LOCALE_ID` for.
  readonly #language = signal<TLanguage>(bootLanguage());
  readonly language: Signal<TLanguage> = this.#language.asReadonly();
  readonly locale = computed(() => LOCALE_BY_LANGUAGE[this.#language()]);

  apply(language: TLanguage): void {
    this.#language.set(language);
    this.#translate.use(language);
    setDayjsLocale(language);
    applyDocumentLanguage(language);
    globalThis.localStorage?.setItem(BOOT_LANGUAGE_KEY, language);
  }
}
