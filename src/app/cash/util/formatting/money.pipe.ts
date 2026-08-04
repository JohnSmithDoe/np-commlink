import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { formatEur } from '../../../@shared/util/formatting/money-format.utils';

@Pipe({ name: 'moneyEur' })
export class MoneyEurPipe implements PipeTransform {
  readonly #locale = inject(LOCALE_ID);

  transform(cents: number | null | undefined): string {
    return formatEur(cents ?? 0, this.#locale);
  }
}
