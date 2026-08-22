import { inject, Pipe, PipeTransform } from '@angular/core';
import { APP_LANGUAGE } from '../../@shared/util/theme/language.boot';
import { formatKg } from './weight.utils';

@Pipe({ name: 'kg' })
export class WeightPipe implements PipeTransform {
  readonly #language = inject(APP_LANGUAGE);

  transform(grams: number | null | undefined, signed = false): string {
    if (grams === null || grams === undefined || !Number.isFinite(grams)) {
      return '';
    }
    return `${formatKg(grams, this.#language, signed)} kg`;
  }
}
