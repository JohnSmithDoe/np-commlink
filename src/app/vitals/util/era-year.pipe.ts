import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

const BCE = marker('vitals.astro.era.bce');
const CE = marker('vitals.astro.era.ce');

@Pipe({ name: 'eraYear' })
export class EraYearPipe implements PipeTransform {
  readonly #translate = inject(TranslateService);

  transform(year: number): string {
    return year < 0
      ? this.#translate.instant(BCE, { year: -year })
      : this.#translate.instant(CE, { year });
  }
}
