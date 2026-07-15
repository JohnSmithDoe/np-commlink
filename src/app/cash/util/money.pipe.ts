import { Pipe, PipeTransform } from '@angular/core';
import { formatEur } from './money';

/**
 * Displays signed integer cents as a localized EUR string (`1234` → `"12,34 €"`).
 * The single seam for money display: locale is de-DE today (delegated to
 * `formatEur`) and becomes bilingual here when i18n is wired — see
 * docs/cash-plan.md. A nullish amount renders as zero.
 */
@Pipe({ name: 'moneyEur' })
export class MoneyEurPipe implements PipeTransform {
  transform(cents: number | null | undefined): string {
    return formatEur(cents ?? 0);
  }
}
