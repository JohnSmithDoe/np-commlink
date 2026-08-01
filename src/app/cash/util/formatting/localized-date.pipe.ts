import { Pipe, PipeTransform } from '@angular/core';
import { localizedDate } from '../../../@shared/util/formatting/date-format.utils';

/**
 * An ISO date in the active locale's numeric shape (`27.07.2026` / `07/27/2026`).
 *
 * A pipe rather than a component method because the callers render it per row
 * inside `@for`: a method re-parses every visible date on every change-detection
 * pass, while a pure pipe caches on input identity and formats each row once.
 * Caching is safe for the same reason it is on `MoneyEurPipe` — the language
 * cannot change without restarting the app.
 */
@Pipe({ name: 'localizedDate' })
export class LocalizedDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? localizedDate(value) : '';
  }
}
