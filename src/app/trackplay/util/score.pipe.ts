import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'score' })
export class ScorePipe implements PipeTransform {
  readonly #formatter = new Intl.NumberFormat(inject(LOCALE_ID));

  transform(value: number | null | undefined): string {
    return value && Number.isFinite(value)
      ? this.#formatter.format(value)
      : '0';
  }
}
