import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IsoWeekday } from '../../@shared/model/app.types';
import { isEveryDay, sortedWeekdays, WEEKDAY_LABEL } from './pill.utils';

const EVERY_DAY_LABEL = marker('vitals.weekday.every-day');

@Pipe({ name: 'weekdays' })
export class WeekdaySummaryPipe implements PipeTransform {
  readonly #translate = inject(TranslateService);

  transform(weekdays: readonly IsoWeekday[]): string {
    if (isEveryDay(weekdays)) {
      return this.#translate.instant(EVERY_DAY_LABEL);
    }
    return sortedWeekdays(weekdays)
      .map((day) => this.#translate.instant(WEEKDAY_LABEL[day]))
      .join(' · ');
  }
}
