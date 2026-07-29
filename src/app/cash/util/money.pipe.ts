import { inject, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../@shared/util/language.service';
import { formatEur } from '../../@shared/util/money.utils';

/**
 * Displays signed integer cents as a localized EUR string (`1234` → `"12,34 €"`
 * under `de`, `"€12.34"` under `en`). The single seam for money display.
 * A nullish amount renders as zero.
 *
 * The locale is read once: the language cannot change without restarting the
 * app, so a pure pipe caching its output is correct here.
 */
@Pipe({ name: 'moneyEur' })
export class MoneyEurPipe implements PipeTransform {
  readonly #locale = inject(LanguageService).locale();

  transform(cents: number | null | undefined): string {
    return formatEur(cents ?? 0, this.#locale);
  }
}
