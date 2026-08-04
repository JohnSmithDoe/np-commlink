import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Language, LOCALE_BY_LANGUAGE } from '../../model/app.types';
import { setDayjsLocale } from '../../util/formatting/date-format.utils';
import {
  applyDocumentLanguage,
  bootLanguage,
  rememberBootLanguage,
} from '../../util/theme/language.boot';

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
    rememberBootLanguage(language);
  }
}
