/* ─── why ─────────────────────────────────────────────────────────
 * Said in one place because it is read in two: the picker states the
 * cadence under its own control, and a list row states it for a repeating
 * task that has no date yet. Two spellings of "every 2 weeks" would drift
 * the moment a unit is added.
 *
 * German spells the singular four ways ("Jeden Tag", "Jede Woche", "Jedes
 * Jahr"), so a count of one reads from its own key family rather than a
 * plural rule. The empty cases are answered here too — no cadence at all,
 * and a cadence whose day or month set is still empty — because they are
 * what the picker shows while it is being filled in.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../model/app.types';
import { Interval, PeriodUnit } from '../../model/interval.types';
import { sortedAscending } from '../app.utils';
import {
  localizedMonth,
  localizedWeekday,
} from '../formatting/date-format.utils';

const NO_REPEAT = marker('interval.summary.none');
const EVERY_DAY = marker('interval.summary.everyday');
const NO_DAY = marker('interval.summary.noday');
const ON_DAYS = marker('interval.summary.days');
const NO_MONTH = marker('interval.summary.nomonth');
const IN_MONTHS = marker('interval.summary.months');

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

const ISO_WEEKDAY_COUNT = 7;

export interface IntervalSummary {
  key: Marker;
  params: Record<string, string | number>;
}

export const intervalSummary = (
  interval: Interval | undefined
): IntervalSummary => {
  if (!interval) return { key: NO_REPEAT, params: {} };

  if (interval.unit === 'day') {
    if (interval.weekdays.length === 0) return { key: NO_DAY, params: {} };
    if (interval.weekdays.length === ISO_WEEKDAY_COUNT) {
      return { key: EVERY_DAY, params: {} };
    }
    const days = sortedAscending(interval.weekdays)
      .map((day) => localizedWeekday(day, 'long'))
      .join(', ');
    return { key: ON_DAYS, params: { days } };
  }

  if (interval.unit === 'monthsOfYear') {
    if (interval.months.length === 0) return { key: NO_MONTH, params: {} };
    const months = sortedAscending(interval.months)
      .map((month) => localizedMonth(month, 'long'))
      .join(', ');
    return { key: IN_MONTHS, params: { months } };
  }

  const { every, unit } = interval;
  return every === 1
    ? { key: SUMMARY_ONE[unit], params: {} }
    : { key: SUMMARY_MANY[unit], params: { count: every } };
};
