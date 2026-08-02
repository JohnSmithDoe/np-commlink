import { inject, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../@shared/util/theme/language.service';

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
