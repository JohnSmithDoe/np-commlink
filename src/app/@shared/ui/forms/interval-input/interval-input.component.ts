/* ─── why ─────────────────────────────────────────────────────────
 * The widget is shared; the MEANING is not. It emits a cadence and reads
 * one back, and says nothing about what the cadence is anchored to — a
 * task counts from the day it was last done, and the next thing to grow
 * one will count from somewhere else.
 *
 * The unit CHOOSES the second control rather than sitting beside it: a
 * cadence is a set of weekdays, a set of months, or a count, and offering
 * two at once invites a form that says "every 2 months on Tuesday" and
 * means nothing by it. Switching unit therefore rebuilds the value rather
 * than carrying a field across.
 *
 * The sentence under the control is NOT written here. A list row states
 * the same cadence for a repeating task with no date yet, so the wording
 * lives in `intervalSummary` where both read it.
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
import { IsoMonth, IsoWeekday, Marker } from '../../../model/app.types';
import {
  INTERVAL_UNITS,
  Interval,
  IntervalUnit,
  isCalendarInterval,
  PeriodUnit,
} from '../../../model/interval.types';
import { intervalSummary } from '../../../util/forms/interval-summary.utils';
import { MonthPickerComponent } from '../month-picker/month-picker.component';
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
  monthsOfYear: marker('interval.unit.monthsOfYear'),
};

const sorted = <T extends number>(values: readonly T[]): T[] =>
  [...values].toSorted((a, b) => a - b);

@Component({
  selector: 'app-interval-input',
  templateUrl: './interval-input.component.html',
  styleUrl: './interval-input.component.scss',
  imports: [
    IonSegment,
    IonSegmentButton,
    MonthPickerComponent,
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
  readonly monthLabel = input<string>();
  readonly valueChange = output<Interval | undefined>();

  protected readonly none = NONE;
  protected readonly units = INTERVAL_UNITS;
  protected readonly unitLabels = UNIT_LABELS;

  protected readonly selectedUnit = computed(() => this.value()?.unit ?? NONE);

  protected readonly daily = computed(() => {
    const current = this.value();
    return current?.unit === 'day' ? current : undefined;
  });

  protected readonly monthly = computed(() => {
    const current = this.value();
    return current?.unit === 'monthsOfYear' ? current : undefined;
  });

  protected readonly period = computed(() => {
    const current = this.value();
    return current && !isCalendarInterval(current) ? current : undefined;
  });

  protected readonly summary = computed(() => intervalSummary(this.value()));

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
    this.valueChange.emit({
      unit: 'day',
      weekdays: toggled(daily.weekdays, day),
    });
  }

  protected toggleMonth(month: IsoMonth): void {
    const monthly = this.monthly();
    if (!monthly) return;
    this.valueChange.emit({
      unit: 'monthsOfYear',
      months: toggled(monthly.months, month),
    });
  }
}

const toggled = <T extends number>(values: readonly T[], value: T): T[] =>
  values.includes(value)
    ? values.filter((existing) => existing !== value)
    : sorted([...values, value]);

const intervalForUnit = (unit: string): Interval | undefined => {
  if (unit === 'day') return { unit: 'day', weekdays: [] };
  if (unit === 'monthsOfYear') return { unit: 'monthsOfYear', months: [] };
  return unit === NONE || unit === undefined
    ? undefined
    : { unit: unit as PeriodUnit, every: 1 };
};
