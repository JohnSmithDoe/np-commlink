import { inject, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../@shared/util/language.service';

/**
 * Formats a game score with the active language's thousands separators
 * (e.g. 12345 → "12.345" under `de`, "12,345" under `en`). Falsy / non-finite
 * values render as "0". Used in templates as `{{ score | score }}`.
 *
 * The formatter is built once: the language cannot change without restarting the
 * app, so a pure pipe caching its output is correct here.
 */
@Pipe({ name: 'score' })
export class ScorePipe implements PipeTransform {
  readonly #formatter = new Intl.NumberFormat(inject(LanguageService).locale());

  transform(value: number | null | undefined): string {
    if (!value || !Number.isFinite(value)) {
      return '0';
    }
    return this.#formatter.format(value);
  }
}
