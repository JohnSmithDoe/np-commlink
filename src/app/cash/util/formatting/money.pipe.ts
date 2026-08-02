import { inject, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../../@shared/util/theme/language.service';
import { formatEur } from '../../../@shared/util/formatting/money-format.utils';

@Pipe({ name: 'moneyEur' })
export class MoneyEurPipe implements PipeTransform {
  readonly #locale = inject(LanguageService).locale();

  transform(cents: number | null | undefined): string {
    return formatEur(cents ?? 0, this.#locale);
  }
}
