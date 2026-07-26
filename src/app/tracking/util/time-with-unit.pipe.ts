import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

marker('time.unit.days');
marker('time.unit.hours');
marker('time.unit.minutes');
marker('time.unit.seconds');

const TIME_UNITS = [
  { key: 'time.unit.days', seconds: 86_400 },
  { key: 'time.unit.hours', seconds: 3600 },
  { key: 'time.unit.minutes', seconds: 60 },
] as const;

const SECONDS_KEY = 'time.unit.seconds';

// One decimal, but a whole value renders without the ".0".
const withoutTrailingZero = (value: number): string => {
  const fixed = value.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
};

// The largest unit that reaches 1 once rounded — it is the ROUNDED value that
// decides, so 59m36s reads "1 hour" rather than "0.99 hours". Under a minute the
// raw remainder is shown instead of a fraction.
const largestFittingUnit = (
  totalSeconds: number
): { key: string; value: string } => {
  for (const unit of TIME_UNITS) {
    const value = withoutTrailingZero(totalSeconds / unit.seconds);
    if (Number.parseFloat(value) >= 1) return { key: unit.key, value };
  }
  return { key: SECONDS_KEY, value: `${totalSeconds % 60}` };
};

@Pipe({
  name: 'timeWithUnit',
  standalone: true,
})
export class TimeWithUnitPipe implements PipeTransform {
  readonly #translate = inject(TranslateService);

  transform(timeInSeconds?: number): string {
    if (!timeInSeconds) return '';
    const { key, value } = largestFittingUnit(timeInSeconds);
    return `${value} ${this.#translate.instant(key)}`;
  }
}
