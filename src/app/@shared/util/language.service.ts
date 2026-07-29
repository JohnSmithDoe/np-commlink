import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LANGUAGES, LOCALE_BY_LANGUAGE, TLanguage } from '../model/app.types';
import { setDayjsLocale } from './date-format.utils';

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

// At module scope, not in `apply()`, because dayjs's locale is a *global* that
// module-level code already reads: a reducer's `initialState` builder formatting
// a date at import time would otherwise get dayjs's built-in English until the
// settings slice hydrates. This module is imported by the kernel composition
// before any reducer, so the global is set before the first such call.
setDayjsLocale(bootLanguage());

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
    document.documentElement.lang = language;
    globalThis.localStorage?.setItem(BOOT_LANGUAGE_KEY, language);
  }
}
