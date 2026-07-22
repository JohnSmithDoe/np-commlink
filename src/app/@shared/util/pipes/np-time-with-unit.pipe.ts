import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

marker('time.unit.days');
marker('time.unit.hours');
marker('time.unit.minutes');
marker('time.unit.seconds');

@Pipe({
  name: 'npTimeWithUnit',
  standalone: true,
})
export class NpTimeWithUnitPipe implements PipeTransform {
  #translate = inject(TranslateService);

  transform(timeInSeconds?: number): string {
    if (!timeInSeconds) return '';

    let days = (timeInSeconds / 86_400).toFixed(1);
    let hours = (timeInSeconds / 3600).toFixed(1);
    let minutes = (timeInSeconds / 60).toFixed(1);
    const seconds = timeInSeconds % 60;
    if (days.endsWith('.0')) {
      days = days.slice(0, -2);
    }
    if (hours.endsWith('.0')) {
      hours = hours.slice(0, -2);
    }
    if (minutes.endsWith('.0')) {
      minutes = minutes.slice(0, -2);
    }
    if (Number.parseFloat(days) >= 1) {
      return `${days} ` + this.#translate.instant('time.unit.days');
    } else if (Number.parseFloat(hours) >= 1) {
      return `${hours} ` + this.#translate.instant('time.unit.hours');
    } else if (Number.parseFloat(minutes) >= 1) {
      return `${minutes} ` + this.#translate.instant('time.unit.minutes');
    } else {
      return `${seconds} ` + this.#translate.instant('time.unit.seconds');
    }
  }
}
