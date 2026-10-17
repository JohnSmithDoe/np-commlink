import { inject, Pipe, PipeTransform } from '@angular/core';
import { APP_LANGUAGE } from '../../@shared/util/theme/language.boot';
import { formatKg } from './weight.utils';

@Pipe({ name: 'kg' })
export class WeightPipe implements PipeTransform {
  readonly #language = inject(APP_LANGUAGE);

  transform(grams: number | null | undefined, isSigned = false): string {
    return grams === null || grams === undefined || !Number.isFinite(grams)
      ? ''
      : `${formatKg(grams, this.#language, isSigned)} kg`;
  }
}
