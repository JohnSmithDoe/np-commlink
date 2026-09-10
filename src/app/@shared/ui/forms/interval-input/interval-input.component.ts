/* ─── why ─────────────────────────────────────────────────────────
 * The widget is shared; the MEANING is not. It emits a cadence and reads
 * one back, and says nothing about what the cadence is anchored to — a
 * task counts from the day it was last done, and the next thing to grow
 * one will count from somewhere else.
 *
 * The unit CHOOSES the second control rather than sitting beside it: a
 * daily cadence is a set of weekdays and everything else is a count, and
 * offering both at once invites a form that says "every 2 months on
 * Tuesday" and means nothing by it. Switching unit therefore rebuilds the
 * value rather than carrying a field across.
 *
 * German spells the singular four ways ("Jeden Tag", "Jede Woche",
 * "Jedes Jahr"), so a count of one reads from its own key family rather
 * than a plural rule. The sentence under the control is the only place
 * the cadence is stated in words, which is why it also has to answer the
 * empty cases — no repeat at all, and a daily cadence with no day picked.
 *
 * Each unit caps its own count so the grid never runs past two rows:
 * past eight weeks people say "two months", and ten years is a smoke
 * detector — the longest cadence anybody actually keeps.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  IonSegment,
  IonSegmentButton,
  SegmentCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { IsoWeekday, Marker } from '../../../model/app.types';
import {
  INTERVAL_UNITS,
  Interval,
  IntervalUnit,
  PeriodUnit,
} from '../../../model/interval.types';
import { localizedWeekday } from '../../../util/formatting/date-format.utils';
import { NumberSelectComponent } from '../number-select/number-select.component';
import { WeekdayPickerComponent } from '../weekday-picker/weekday-picker.component';

const NONE = 'none';

const MAX_COUNT: Readonly<Record<PeriodUnit, number>> = {
  week: 8,
  month: 12,
  year: 10,
};

const UNIT_LABELS: Readonly<Record<IntervalUnit | typeof NONE, Marker>> = {
  none: marker('interval.unit.none'),
  day: marker('interval.unit.day'),
  week: marker('interval.unit.week'),
  month: marker('interval.unit.month'),
  year: marker('interval.unit.year'),
};

const SUMMARY_ONE: Readonly<Record<PeriodUnit, Marker>> = {
  week: marker('interval.summary.one.week'),
  month: marker('interval.summary.one.month'),
  year: marker('interval.summary.one.year'),
};

const SUMMARY_MANY: Readonly<Record<PeriodUnit, Marker>> = {
  week: marker('interval.summary.many.week'),
  month: marker('interval.summary.many.month'),
  year: marker('interval.summary.many.year'),
};

const NO_REPEAT = marker('interval.summary.none');
const EVERY_DAY = marker('interval.summary.everyday');
const NO_DAY = marker('interval.summary.noday');
const ON_DAYS = marker('interval.summary.days');

const sorted = (weekdays: readonly IsoWeekday[]): IsoWeekday[] =>
  [...weekdays].toSorted((a, b) => a - b);

@Component({
  selector: 'app-interval-input',
  templateUrl: './interval-input.component.html',
  styleUrl: './interval-input.component.scss',
  imports: [
    IonSegment,
    IonSegmentButton,
    NumberSelectComponent,
    TranslatePipe,
    WeekdayPickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntervalInputComponent {
  readonly value = input<Interval | undefined>();
  readonly label = input<string>();
  readonly weekdayLabel = input<string>();
  readonly valueChange = output<Interval | undefined>();

  protected readonly none = NONE;
  protected readonly units = INTERVAL_UNITS;
  protected readonly unitLabels = UNIT_LABELS;

  protected readonly selectedUnit = computed(() => this.value()?.unit ?? NONE);

  protected readonly daily = computed(() => {
    const current = this.value();
    return current?.unit === 'day' ? current : undefined;
  });

  protected readonly period = computed(() => {
    const current = this.value();
    return current && current.unit !== 'day' ? current : undefined;
  });

  protected readonly summary = computed<{ key: Marker; params: object }>(() => {
    const current = this.value();
    if (!current) return { key: NO_REPEAT, params: {} };

    if (current.unit === 'day') {
      if (current.weekdays.length === 0) return { key: NO_DAY, params: {} };
      if (current.weekdays.length === ISO_WEEKDAY_COUNT) {
        return { key: EVERY_DAY, params: {} };
      }
      const days = sorted(current.weekdays)
        .map((day) => localizedWeekday(day, 'long'))
        .join(', ');
      return { key: ON_DAYS, params: { days } };
    }

    const { every, unit } = current;
    return every === 1
      ? { key: SUMMARY_ONE[unit], params: {} }
      : { key: SUMMARY_MANY[unit], params: { count: every } };
  });

  protected pickUnit(event: SegmentCustomEvent): void {
    this.valueChange.emit(intervalForUnit(String(event.detail.value)));
  }

  protected readonly maxCount = computed(() => {
    const period = this.period();
    return period ? MAX_COUNT[period.unit] : 1;
  });

  protected pickCount(every: number | undefined): void {
    const period = this.period();
    if (period && every) this.valueChange.emit({ ...period, every });
  }

  protected toggleWeekday(day: IsoWeekday): void {
    const daily = this.daily();
    if (!daily) return;
    const weekdays = daily.weekdays.includes(day)
      ? daily.weekdays.filter((existing) => existing !== day)
      : sorted([...daily.weekdays, day]);
    this.valueChange.emit({ unit: 'day', weekdays });
  }
}

const ISO_WEEKDAY_COUNT = 7;

const intervalForUnit = (unit: string): Interval | undefined => {
  if (unit === 'day') return { unit: 'day', weekdays: [] };
  return unit === NONE || unit === undefined
    ? undefined
    : { unit: unit as PeriodUnit, every: 1 };
};
